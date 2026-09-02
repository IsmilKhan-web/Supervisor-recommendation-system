import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FacultySlot from '../models/FacultySlot.js';
import { signToken, authRequired } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role, department } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name: fullName,
      email,
      password: hashed,
      role,
      department: department || '',
    });

    if (role === 'faculty') {
      await FacultySlot.create({ faculty_id: user._id, total_slots: 0, taken_slots: 0 });
    }
    // Admins don't need a slot record

    const token = signToken(user);
    const profile = user.toJSON();
    return res.status(201).json({ token, profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user);
    const profile = user.toJSON();
    return res.json({ token, profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  res.json({ profile: req.user.toJSON() });
});

// PUT /api/auth/me
router.put('/me', authRequired, async (req, res) => {
  try {
    const { bio, department, office_hours, courses, publications, research_keywords } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (department !== undefined) updates.department = department;
    if (office_hours !== undefined) updates.office_hours = office_hours;
    if (courses !== undefined) updates.courses = courses;
    if (publications !== undefined) updates.publications = publications;
    if (research_keywords !== undefined) updates.research_keywords = research_keywords;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return res.json({ profile: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
