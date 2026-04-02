import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { supabase } from './api/supabaseClient.js';

// Load env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(cookieParser());

// Helpers
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const checkPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Prices
app.get('/prices', async (req, res) => {
  try {
    const { data, error } = await supabase.from('prices').select('*').order('id', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    const { gender } = req.query;
    if (gender) return res.json(data.filter(p => p.gender === gender));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/prices', async (req, res) => {
  try {
    const { clothType, ironingPrice, washingPrice, gender } = req.body;
    const payload = {
      cloth_type: clothType,
      ironing_price: ironingPrice || 0,
      washing_price: washingPrice || 0,
      gender
    };
    const { data, error } = await supabase.from('prices').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/prices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, error } = await supabase.from('prices').delete().eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/prices', async (req, res) => {
  try {
    const { gender } = req.query;
    if (!gender) return res.status(400).json({ error: 'Gender parameter is required for clearing prices.' });
    const { data, error } = await supabase.from('prices').delete().eq('gender', gender).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages
app.get('/messages', async (req, res) => {
  try {
    const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const { data, error } = await supabase.from('messages').insert({ name, email, message }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/messages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, error } = await supabase.from('messages').delete().eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all messages (used by admin "Clear" button)
app.delete('/messages', async (req, res) => {
  try {
    const { data, error } = await supabase.from('messages').delete().neq('id', 0).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users / auth
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const hashedPassword = await hashPassword(password);
    const { data, error } = await supabase.from('users').insert({ username, password_hash: hashedPassword }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'User registered successfully', user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const { data, error } = await supabase.from('users').select('id, username, password_hash, role').eq('username', username).limit(1).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    const user = data;
    if (user && await checkPassword(password, user.password_hash)) {
      // Sign JWT and set HttpOnly cookie
      const payload = { id: user.id, username: user.username, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Check auth via HttpOnly cookie
app.get('/auth/check', (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin signup endpoint
app.post('/admin-signup', async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    if (!username || !email || !password || !adminCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check admin code from environment
    const expectedCode = process.env.ADMIN_SIGNUP_CODE;
    if (!expectedCode || adminCode !== expectedCode) {
      return res.status(403).json({ error: 'Invalid admin code' });
    }

    // Check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: lookupError.message });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Create Supabase auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return res.status(500).json({ error: signUpError.message });
    }

    // Insert into users table
    const { error: profileError } = await supabase.from('users').insert({
      username,
      email,
      password_hash: '',
      role: 'admin',
    });

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    res.status(201).json({
      message: signUpData.user?.identities?.length
        ? 'Admin account created successfully. You can now log in.'
        : 'Account created. Check email if Supabase requires confirmation.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log('=================================');
  console.log(`Server running on http://localhost:${port}`);
  console.log('Open http://localhost:${port} in your browser');
  console.log('=================================');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
