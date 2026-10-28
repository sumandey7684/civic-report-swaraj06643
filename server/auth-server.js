import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import vision from "@google-cloud/vision";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pool from "./db.js";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env"), override: true });

const app = express();
const PORT = process.env.AUTH_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "civic-report-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";
const serviceAccountPath = join(dirname(fileURLToPath(import.meta.url)), "key.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: serviceAccountPath,
});
const civicVisionModel = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT || "shaped-terrain-471918-d8",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

const CIVIC_CLASSES = {
  pothole: { primary: ["pothole", "road damage", "crater", "hole", "pit", "rut", "uneven road"], context: ["road surface", "asphalt", "pavement", "street"] },
  waterLeak: { primary: ["water leak", "leak", "burst pipe", "flood", "waterlogging", "overflow"], context: ["pipe", "water", "puddle", "wetness"] },
  drainage: { primary: ["drain", "storm drain", "sewer", "gutter", "manhole", "sewage"], context: ["ditch", "water", "blockage"] },
  garbage: { primary: ["garbage", "trash", "waste", "litter", "dump", "rubbish"], context: ["debris", "filth", "junk"] },
  brokenLight: { primary: ["street light", "lamp", "light fixture", "broken light"], context: ["utility pole", "electricity", "power line", "wire"] },
  roadDamage: { primary: ["crack", "broken road", "damaged road", "sidewalk damage"], context: ["sidewalk", "pavement", "construction", "barrier"] },
};

const civicLabel = (value) => value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

async function detectPotholeFallback(content) {
  const { data, info } = await sharp(Buffer.from(content, "base64"))
    .resize({ width: 256, height: 256, fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const grayRoad = new Uint8Array(pixelCount);
  const dark = new Uint8Array(pixelCount);
  let grayRoadCount = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 3;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const brightness = (red + green + blue) / 3;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (brightness >= 75 && brightness <= 220 && saturation <= 45) {
      grayRoad[index] = 1;
      grayRoadCount += 1;
    }
    if (brightness < 92 && saturation <= 55 && index / info.width > 0.2) dark[index] = 1;
  }

  const visited = new Uint8Array(pixelCount);
  const components = [];
  for (let start = 0; start < pixelCount; start += 1) {
    if (!dark[start] || visited[start]) continue;
    const queue = [start];
    visited[start] = 1;
    let size = 0;
    let touchesRoad = false;
    while (queue.length) {
      const current = queue.pop();
      size += 1;
      if (grayRoad[current]) touchesRoad = true;
      const x = current % info.width;
      const y = Math.floor(current / info.width);
      for (let row = -1; row <= 1; row += 1) {
        for (let column = -1; column <= 1; column += 1) {
          const nextX = x + column;
          const nextY = y + row;
          if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) continue;
          const next = nextY * info.width + nextX;
          if (dark[next] && !visited[next]) {
            visited[next] = 1;
            queue.push(next);
          }
        }
      }
    }
    if (size >= 35 && size <= pixelCount * 0.35 && touchesRoad) components.push(size);
  }

  const roadRatio = grayRoadCount / pixelCount;
  const hasMultipleDepressions = components.length >= 2;
  const hasLargeDepression = components.some((size) => size >= 90);
  if (roadRatio >= 0.38 && hasMultipleDepressions && hasLargeDepression) {
    return {
      valid: true,
      category: "pothole",
      matches: [{ category: "pothole", confidence: 0.8, labels: ["visual road depressions", "damaged asphalt"] }],
      reason: "Visual analysis found multiple dark depressions in a damaged asphalt road surface.",
      classifier: "local-pothole-fallback",
    };
  }
  return null;
}

async function classifyWithCivicVision(content, mimeType) {
  const prompt = `You are a strict civic infrastructure image classifier. Inspect the image itself, not just generic objects.
Return ONLY valid JSON in this exact shape: {"valid":boolean,"category":"pothole|waterLeak|drainage|garbage|brokenLight|roadDamage|invalid","confidence":number,"reason":"string"}.
Accept only visible public infrastructure defects: potholes or road craters, road cracks/damage, leaking or burst water pipes, flooding/waterlogging caused by infrastructure, blocked/broken drains or sewers, dumped garbage, or broken street lights/electrical infrastructure.
A normal road, bridge, asphalt surface, landscape, vehicle, building, person, animal, or ordinary water scene is invalid. A pothole must be a visible depression/void/broken road surface, even when no label says pothole. Do not infer a defect from text or filename. Use confidence from 0 to 1 and valid=true only at confidence >= 0.60.`;
  const result = await civicVisionModel.models.generateContent({
    model: process.env.GOOGLE_VISION_MODEL || "gemini-2.0-flash-001",
    config: { temperature: 0, maxOutputTokens: 300 },
    contents: [{ role: "user", parts: [
      { text: prompt },
      { inlineData: { mimeType, data: content } },
    ] }],
  });
  const text = result.text || "";
  const json = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const classification = JSON.parse(json);
  if (!classification || typeof classification.valid !== "boolean" || typeof classification.confidence !== "number") {
    throw new Error("Invalid classifier response");
  }
  return classification;
}

async function analyzeCivicImage(imageBase64) {
  const content = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
  const mimeType = imageBase64.match(/^data:(image\/[^;]+);base64,/)?.[1] || "image/jpeg";
  let modelClassification;
  try {
    modelClassification = await classifyWithCivicVision(content, mimeType);
  } catch (error) {
    console.error("Vertex civic classifier unavailable; using Cloud Vision fallback:", error.message);
  }

  if (modelClassification?.valid && modelClassification.confidence >= 0.6) {
    return {
      valid: true,
      category: modelClassification.category,
      matches: [{ category: modelClassification.category, confidence: modelClassification.confidence, labels: [modelClassification.reason] }],
      reason: modelClassification.reason,
      classifier: "vertex-gemini-vision",
    };
  }

  try {
    const localPothole = await detectPotholeFallback(content);
    if (localPothole) return localPothole;
  } catch (error) {
    console.error("Local pothole fallback unavailable:", error.message);
  }

  const [result] = await visionClient.annotateImage({
    image: { content },
    features: [
      { type: "LABEL_DETECTION", maxResults: 30 },
      { type: "OBJECT_LOCALIZATION", maxResults: 30 },
      { type: "SAFE_SEARCH_DETECTION" },
      { type: "FACE_DETECTION", maxResults: 10 },
    ],
  });

  const safety = result.safeSearchAnnotation || {};
  const unsafe = ["adult", "violence", "racy"].some((field) =>
    ["LIKELY", "VERY_LIKELY"].includes(safety[field])
  );
  if (unsafe) return { valid: false, reason: "This image is not suitable for a civic report." };
  if ((result.faceAnnotations || []).length > 0) return { valid: false, reason: "Please upload a photo without human faces." };

  const evidence = [
    ...(result.labelAnnotations || []).map((item) => ({ label: civicLabel(item.description || ""), score: item.score || 0 })),
    ...(result.localizedObjectAnnotations || []).map((item) => ({ label: civicLabel(item.name || ""), score: item.score || 0 })),
  ];
  const matches = Object.entries(CIVIC_CLASSES).map(([category, keywords]) => {
    const primaryEvidence = evidence.filter(({ label }) => keywords.primary.some((keyword) => label.includes(keyword)));
    const contextEvidence = evidence.filter(({ label }) => keywords.context.some((keyword) => label.includes(keyword)));
    const categoryEvidence = [...primaryEvidence, ...contextEvidence.filter((item) => !primaryEvidence.includes(item))];
    const hasEnoughEvidence = primaryEvidence.length > 0 || contextEvidence.length >= 2;
    const contextBoost = primaryEvidence.length === 0 && contextEvidence.length >= 2 ? 0.12 : 0;
    const confidence = hasEnoughEvidence && categoryEvidence.length
      ? Math.min(0.99, Math.max(...categoryEvidence.map((item) => item.score)) + contextBoost)
      : 0;
    return { category, confidence, labels: categoryEvidence.map((item) => item.label) };
  }).filter((item) => item.confidence >= 0.45).sort((a, b) => b.confidence - a.confidence);

  if (!matches.length) {
    return { valid: false, reason: modelClassification?.reason || "No civic defect was confirmed. Upload a closer, clearer photo showing the pothole, leak, drain, garbage, road damage, or street-light problem.", labels: evidence.slice(0, 10), classifier: "cloud-vision-fallback" };
  }
  return { valid: true, category: matches[0].category, matches, labels: evidence.slice(0, 10), classifier: "cloud-vision-fallback" };
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.post("/api/vision/civic-issue", async (req, res) => {
  try {
    if (!req.body.imageBase64 || typeof req.body.imageBase64 !== "string") {
      return res.status(400).json({ valid: false, reason: "An image is required." });
    }
    const result = await analyzeCivicImage(req.body.imageBase64);
    res.status(result.valid ? 200 : 422).json(result);
  } catch (err) {
    console.error("Civic image analysis error:", err);
    res.status(502).json({ valid: false, reason: "Image analysis is temporarily unavailable. Please try again." });
  }
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user still exists in DB
    const result = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// ============================================
// AUTH ENDPOINTS
// ============================================

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, fullName, phone, address, aadhaar, role } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (role && role !== "citizen") {
      return res.status(403).json({ error: "Public registration is available for citizen accounts only" });
    }

    await client.query("BEGIN");
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Hash aadhaar if provided
    let aadhaarHash = null;
    if (aadhaar) {
      aadhaarHash = await bcrypt.hash(aadhaar, salt);
    }

    const userRole = role || "citizen";

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      [normalizedEmail, passwordHash, userRole]
    );

    const user = userResult.rows[0];

    // Create profile
    await client.query(
      `INSERT INTO profiles (id, name, email, phone, address, aadhaar_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, fullName?.trim() || null, normalizedEmail, phone || null, address?.trim() || null, aadhaarHash, userRole]
    );
    await client.query("COMMIT");

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Signup error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (role && user.role !== role) {
      return res.status(403).json({ error: "This account is not registered for the selected portal" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Fetch profile
    const profileResult = await pool.query(
      "SELECT id, name, email, phone, profile_photo, bio, role FROM profiles WHERE id = $1",
      [user.id]
    );
    const profile = profileResult.rows[0] || null;

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      profile,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/auth/me — get current user from JWT
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const profileResult = await pool.query(
      "SELECT id, name, email, phone, profile_photo, bio, notifications, role FROM profiles WHERE id = $1",
      [req.user.id]
    );
    const profile = profileResult.rows[0] || null;

    res.json({
      user: { id: req.user.id, email: req.user.email, role: req.user.role },
      profile,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// ============================================
// PROFILES ENDPOINTS
// ============================================

// GET /api/profiles/:userId
app.get("/api/profiles/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT id, name, email, phone, profile_photo, bio, notifications, role FROM profiles WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/profiles/:userId
app.put("/api/profiles/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const { name, bio, notifications, profile_photo } = req.body;

    const result = await pool.query(
      `UPDATE profiles
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           notifications = COALESCE($3, notifications),
           profile_photo = COALESCE($4, profile_photo)
       WHERE id = $5
       RETURNING id, name, email, phone, profile_photo, bio, notifications, role`,
      [name, bio, notifications, profile_photo, userId]
    );

    if (result.rows.length === 0) {
      // Profile doesn't exist — create it
      const insertResult = await pool.query(
        `INSERT INTO profiles (id, name, email, bio, notifications, profile_photo, role)
         VALUES ($1, $2, $3, $4, $5, $6, 'citizen')
         RETURNING id, name, email, phone, profile_photo, bio, notifications, role`,
        [userId, name, req.user.email, bio, notifications ?? true, profile_photo]
      );
      return res.json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ============================================
// ISSUES ENDPOINTS
// ============================================

const AUTHORITY_ROUTING = Object.freeze({
  roads: { code: "public-works", name: "Public Works Department" },
  water: { code: "water-supply", name: "Water Supply and Sewerage Department" },
  electricity: { code: "electricity", name: "Electricity Distribution Authority" },
  waste: { code: "waste-management", name: "Municipal Waste Management Department" },
  streetlights: { code: "street-lighting", name: "Municipal Street Lighting Department" },
  drainage: { code: "drainage", name: "Drainage and Sewerage Department" },
  other: { code: "municipal-grievance", name: "Municipal Civic Grievance Cell" },
});

function authorityForCategory(category) {
  return AUTHORITY_ROUTING[category] || AUTHORITY_ROUTING.other;
}

async function forwardIssueToAuthority(issue) {
  const webhookKey = `AUTHORITY_WEBHOOK_${issue.authority_code.toUpperCase().replace(/-/g, "_")}`;
  const webhookUrl = process.env[webhookKey];
  if (!webhookUrl) return { status: "queued", forwardedAt: null, error: null };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUTHORITY_WEBHOOK_SECRET
          ? { "x-civic-report-secret": process.env.AUTHORITY_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        source: "CivicReport",
        issue,
      }),
    });

    if (!response.ok) throw new Error(`Authority endpoint returned ${response.status}`);
    return { status: "forwarded", forwardedAt: new Date(), error: null };
  } catch (error) {
    console.error(`Authority forwarding failed for ${issue.authority_code}:`, error.message);
    return { status: "failed", forwardedAt: null, error: error.message };
  }
}

// GET /api/issues
app.get("/api/issues", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM issues ORDER BY created_at DESC LIMIT 100"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get issues error:", err);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// GET /api/issues/mine
app.get("/api/issues/mine", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, category, location, priority, status,
              authority_code, authority_name, forwarding_status, forwarded_at,
              forwarding_error, created_at, updated_at
       FROM issues
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get user issues error:", err);
    res.status(500).json({ error: "Failed to fetch your issue history" });
  }
});

// POST /api/issues
app.post("/api/issues", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, location, priority } = req.body;

    if (!title || !category || !location) {
      return res.status(400).json({ error: "Title, category, and location are required" });
    }

    const authority = authorityForCategory(category);

    const result = await pool.query(
      `INSERT INTO issues (user_id, title, description, category, location, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description || null, category, location, priority || "medium"]
    );

    const issue = { ...result.rows[0], authority_code: authority.code, authority_name: authority.name };
    const forwarding = await forwardIssueToAuthority(issue);
    const updated = await pool.query(
      `UPDATE issues
       SET authority_code = $1, authority_name = $2, forwarding_status = $3,
           forwarded_at = $4, forwarding_error = $5
       WHERE id = $6
       RETURNING *`,
      [authority.code, authority.name, forwarding.status, forwarding.forwardedAt, forwarding.error, issue.id]
    );

    // Update user_issue_rewards
    const month = new Date().toISOString().slice(0, 7);
    await pool.query(
      `INSERT INTO user_issue_rewards (user_id, month, issue_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, month) DO UPDATE SET issue_count = user_issue_rewards.issue_count + 1`,
      [req.user.id, month]
    );

    res.status(201).json(updated.rows[0]);
  } catch (err) {
    console.error("Create issue error:", err);
    res.status(500).json({ error: "Failed to create issue" });
  }
});

// GET /api/issues/leaderboard
app.get("/api/issues/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, p.name, COUNT(i.id)::int AS count
       FROM users u
       JOIN profiles p ON p.id = u.id
       JOIN issues i ON i.user_id = u.id
       GROUP BY u.id, p.name
       ORDER BY count DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ============================================
// REWARDS ENDPOINTS
// ============================================

// GET /api/rewards/:userId
app.get("/api/rewards/:userId", authenticateToken, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const result = await pool.query(
      "SELECT issue_count, tokens_claimed FROM user_issue_rewards WHERE user_id = $1 AND month = $2",
      [req.params.userId, month]
    );
    if (result.rows.length === 0) {
      return res.json({ issue_count: 0, tokens_claimed: false });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get rewards error:", err);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

// POST /api/rewards/:userId/claim
app.post("/api/rewards/:userId/claim", authenticateToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const month = new Date().toISOString().slice(0, 7);

    await pool.query(
      "UPDATE user_issue_rewards SET tokens_claimed = true, wallet_address = $1 WHERE user_id = $2 AND month = $3",
      [walletAddress, req.params.userId, month]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Claim rewards error:", err);
    res.status(500).json({ error: "Failed to claim rewards" });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Auth server running on http://localhost:${PORT}`);
});
