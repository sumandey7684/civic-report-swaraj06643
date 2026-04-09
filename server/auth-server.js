import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const app = express();
const PORT = process.env.AUTH_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "civic-report-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

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
  try {
    const { email, password, fullName, phone, address, aadhaar, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
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
    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      [email.toLowerCase(), passwordHash, userRole]
    );

    const user = userResult.rows[0];

    // Create profile
    await pool.query(
      `INSERT INTO profiles (id, name, email, phone, address, aadhaar_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, fullName || null, email.toLowerCase(), phone || null, address || null, aadhaarHash, userRole]
    );

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

// POST /api/issues
app.post("/api/issues", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, location, priority } = req.body;

    if (!title || !category || !location) {
      return res.status(400).json({ error: "Title, category, and location are required" });
    }

    const result = await pool.query(
      `INSERT INTO issues (user_id, title, description, category, location, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description || null, category, location, priority || "medium"]
    );

    // Update user_issue_rewards
    const month = new Date().toISOString().slice(0, 7);
    await pool.query(
      `INSERT INTO user_issue_rewards (user_id, month, issue_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, month) DO UPDATE SET issue_count = user_issue_rewards.issue_count + 1`,
      [req.user.id, month]
    );

    res.status(201).json(result.rows[0]);
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
