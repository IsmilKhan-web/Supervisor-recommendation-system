import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  department: {
    type: String,
    enum: ['Computer Science', 'Software Engineering', 'IT', 'Data Science', 'AI', ''],
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
