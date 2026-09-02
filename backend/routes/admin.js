import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FacultyResearchArea from '../models/FacultyResearchArea.js';
import FacultySlot from '../models/FacultySlot.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/faculty — list all faculty with full details
router.get('/faculty', authRequired, requireRole('admin'), async (_req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).sort({ full_name: 1 });
    const fraList = await FacultyResearchArea.find().populate('research_area_id');
    const slotList = await FacultySlot.find();

    const slotMap = new Map(slotList.map((s) => [String(s.faculty_id), s]));
    const fraMap = new Map();
    for (const fra of fraList) {
      const fid = String(fra.faculty_id);
      if (!fraMap.has(fid)) fraMap.set(fid, []);
      fraMap.get(fid).push({
        ...fra.toJSON(),
        research_area: fra.research_area_id ? fra.research_area_id.toJSON() : null,
      });
    }

    const result = faculty.map((f) => ({
      ...f.toJSON(),
      research_areas: fraMap.get(String(f._id)) ?? [],
      slot: slotMap.get(String(f._id))?.toJSON() ?? null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/faculty — create a new faculty member
router.post('/faculty', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { full_name, email, department, bio, office_hours, courses, publications, research_keywords, total_slots, taken_slots, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
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
      full_name,
      email,
      password: hashed,
      role: 'faculty',
      department: department || '',
      bio: bio || '',
      office_hours: office_hours || '',
      courses: courses || [],
      publications: publications || [],
      research_keywords: research_keywords || [],
    });

    await FacultySlot.create({
      faculty_id: user._id,
      total_slots: total_slots ?? 0,
      taken_slots: taken_slots ?? 0,
      term: 'Fall 2026',
    });

    return res.status(201).json({ profile: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/faculty/:id — update faculty profile + slots
router.put('/faculty/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, department, bio, office_hours, courses, publications, research_keywords, total_slots, taken_slots } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (department !== undefined) updates.department = department;
    if (bio !== undefined) updates.bio = bio;
    if (office_hours !== undefined) updates.office_hours = office_hours;
    if (courses !== undefined) updates.courses = courses;
    if (publications !== undefined) updates.publications = publications;
    if (research_keywords !== undefined) updates.research_keywords = research_keywords;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'Faculty not found' });

    if (total_slots !== undefined || taken_slots !== undefined) {
      const existingSlot = await FacultySlot.findOne({ faculty_id: id });
      if (existingSlot) {
        if (total_slots !== undefined) existingSlot.total_slots = total_slots;
        if (taken_slots !== undefined) existingSlot.taken_slots = taken_slots;
        await existingSlot.save();
      } else {
        await FacultySlot.create({
          faculty_id: id,
          total_slots: total_slots ?? 0,
          taken_slots: taken_slots ?? 0,
          term: 'Fall 2026',
        });
      }
    }

    return res.json({ profile: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/faculty/:id — remove faculty and associated data
router.delete('/faculty/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'Faculty not found' });

    await FacultyResearchArea.deleteMany({ faculty_id: id });
    await FacultySlot.deleteMany({ faculty_id: id });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
