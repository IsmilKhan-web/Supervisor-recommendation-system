import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FacultySlot from '../models/FacultySlot.js';
import FacultyResearchArea from '../models/FacultyResearchArea.js';
import AuthorizedUser from '../models/AuthorizedUser.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, isAdmin);

const facultyFields = 'full_name email department designation research_keywords bio office_hours courses publications createdAt';

router.get('/overview', async (_req, res) => {
  try {
    const [students, faculty] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
    ]);
    res.json({ students, faculty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/faculty', async (_req, res) => {
  try {
    res.json(await User.find({ role: 'faculty' }).select(facultyFields).sort({ full_name: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/faculty', async (req, res) => {
  try {
    const { name, email, temporaryPassword, department, designation, researchInterests } = req.body;
    if (!name || !email || !temporaryPassword || !department || !designation) {
      return res.status(400).json({ error: 'Name, email, temporary password, department, and designation are required.' });
    }
    if (temporaryPassword.length < 6) return res.status(400).json({ error: 'Temporary password must be at least 6 characters.' });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({
      full_name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(temporaryPassword, 10),
      role: 'faculty',
      department,
      designation,
      research_keywords: Array.isArray(researchInterests)
        ? researchInterests
        : String(researchInterests || '').split(',').map((item) => item.trim()).filter(Boolean),
    });
    await Promise.all([
      FacultySlot.create({ faculty_id: user._id, total_slots: 0, taken_slots: 0 }),
      AuthorizedUser.create({ email: normalizedEmail, role: 'faculty' }),
    ]);
    res.status(201).json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/faculty/:id', async (req, res) => {
  try {
    const allowed = ['full_name', 'email', 'department', 'designation', 'research_keywords'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.email) updates.email = updates.email.toLowerCase().trim();
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'faculty' }, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Faculty member not found.' });
    if (updates.email) await AuthorizedUser.findOneAndUpdate({ email: user.email }, { email: user.email }, { upsert: true });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/faculty/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'faculty' });
    if (!user) return res.status(404).json({ error: 'Faculty member not found.' });
    await Promise.all([
      FacultySlot.deleteMany({ faculty_id: user._id }),
      FacultyResearchArea.deleteMany({ faculty_id: user._id }),
      AuthorizedUser.deleteOne({ email: user.email }),
    ]);
    res.json({ message: 'Faculty member deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
