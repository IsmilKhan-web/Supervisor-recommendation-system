import { Router } from 'express';
import SupervisionRequest from '../models/SupervisionRequest.js';
import FacultySlot from '../models/FacultySlot.js';
import User from '../models/User.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/requests/mine — student's own requests (with faculty details)
router.get('/mine', authRequired, requireRole('student'), async (req, res) => {
  try {
    const requests = await SupervisionRequest
      .find({ student_id: req.user._id })
      .populate('faculty_id', 'full_name email department bio office_hours')
      .sort({ createdAt: -1 });
    res.json(requests.map((r) => ({
      ...r.toJSON(),
      faculty: r.faculty_id ? r.faculty_id.toJSON() : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/incoming — faculty's incoming requests (with student details)
router.get('/incoming', authRequired, requireRole('faculty'), async (req, res) => {
  try {
    const requests = await SupervisionRequest
      .find({ faculty_id: req.user._id })
      .populate('student_id', 'full_name email department')
      .sort({ createdAt: -1 });
    res.json(requests.map((r) => ({
      ...r.toJSON(),
      student: r.student_id ? r.student_id.toJSON() : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests — student creates a supervision request
router.post('/', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { faculty_id, project_mode, group_members, project_title, project_proposal } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ error: 'Faculty ID is required' });
    }

    const faculty = await User.findOne({ _id: faculty_id, role: 'faculty' });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Check for existing pending/approved request to same faculty
    const existing = await SupervisionRequest.findOne({
      student_id: req.user._id,
      faculty_id,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have an active request to this faculty member' });
    }

    const newRequest = await SupervisionRequest.create({
      student_id: req.user._id,
      faculty_id,
      status: 'pending',
      project_mode: project_mode || 'solo',
      group_members: group_members || [],
      project_title: project_title || '',
      project_proposal: project_proposal || '',
      term: 'Fall 2026',
    });

    const populated = await SupervisionRequest
      .findById(newRequest._id)
      .populate('faculty_id', 'full_name email department bio');

    return res.status(201).json({
      ...populated.toJSON(),
      faculty: populated.faculty_id ? populated.faculty_id.toJSON() : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/status — faculty approves or denies a request
router.put('/:id/status', authRequired, requireRole('faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "denied"' });
    }

    const request = await SupervisionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (String(request.faculty_id) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only manage requests sent to you' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    request.status = status;
    await request.save();

    // If approved, increment taken_slots
    if (status === 'approved') {
      const slot = await FacultySlot.findOne({ faculty_id: req.user._id });
      if (slot) {
        slot.taken_slots = Math.max(0, slot.taken_slots + 1);
        await slot.save();
      }
    }

    const populated = await SupervisionRequest
      .findById(id)
      .populate('student_id', 'full_name email department');

    return res.json({
      ...populated.toJSON(),
      student: populated.student_id ? populated.student_id.toJSON() : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/requests/:id — student withdraws their own request
router.delete('/:id', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await SupervisionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (String(request.student_id) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only withdraw your own requests' });
    }
    await SupervisionRequest.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
