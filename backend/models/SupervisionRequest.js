import mongoose from 'mongoose';

const supervisionRequestSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  project_mode: {
    type: String,
    enum: ['solo', 'group'],
    default: 'solo',
  },
  group_members: [{
    name: { type: String, default: '' },
    email: { type: String, default: '' },
  }],
  project_title: { type: String, default: '' },
  project_proposal: { type: String, default: '' },
  term: { type: String, default: 'Fall 2026' },
}, { timestamps: true });

supervisionRequestSchema.index({ student_id: 1, faculty_id: 1 }, { unique: true });

supervisionRequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

export default mongoose.model('SupervisionRequest', supervisionRequestSchema);
