 import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'faculty', 'admin'], 
    required: true,
    lowercase: true,
    trim: true 
  },
  designation: { type: String, default: '', trim: true },
  department: {
    type: String,
    trim: true, // Auto-removes leading/trailing spaces (' IT' -> 'IT')
    enum: [
      'Computer Science',
      'Software Engineering',
      'Information Technology',
      'IT',
      'Data Science',
      'Artificial Intelligence',
      'AI',
      'Administration',
      'Other',
      ''
    ],
    default: '',
  },
  bio: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  office_hours: { type: String, default: '' },
  courses: { type: [String], default: [] },
  publications: { type: [String], default: [] },
  research_keywords: { type: [String], default: [] },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);