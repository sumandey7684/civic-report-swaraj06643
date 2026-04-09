require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const vision = require('@google-cloud/vision');
const notifications = require('./notifications');
const contact = require('./contact');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'key.json'
});

// Auth API
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password, phone, address, aadhaar, role } = req.body;
  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO profiles (name, email, password, phone, address, aadhaar, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role',
      [fullName, email, hashedPassword, phone, address, aadhaar, role || 'citizen']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database Health Check
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/vision', async (req, res) => {
  const { imageBase64 } = req.body;
  try {
    const [result] = await client.labelDetection({
      image: { content: imageBase64 }
    });
    res.json(result.labelAnnotations || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Issues API
app.get('/api/issues', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM issues ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/issues', async (req, res) => {
  const { title, description, category, location, priority, user_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO issues (title, description, category, location, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, category, location, priority, user_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications API
app.use('/api/notifications', notifications);
app.use('/api/contact', contact);

app.listen(5000, () => console.log('Server running on port 5000'));