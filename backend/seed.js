 import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import ResearchArea from './models/ResearchArea.js';
import FacultyResearchArea from './models/FacultyResearchArea.js';
import FacultySlot from './models/FacultySlot.js';
import AuthorizedUser from './models/AuthorizedUser.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supervisor_match';

const RESEARCH_AREAS = [
 
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB — seeding...');

  // 1. Clear Research Areas
  await ResearchArea.deleteMany({});
  const areaDocs = await ResearchArea.insertMany(RESEARCH_AREAS);
  const areaMap = new Map(areaDocs.map((a) => [a.name, a._id]));
  console.log(`Seeded ${areaDocs.length} research areas`);

  // 2. Clear Collections
  await User.deleteMany({ role: { $in: ['faculty', 'admin'] } });
  await User.deleteMany({ role: { $nin: ['student', 'faculty', 'admin'] } });
  await AuthorizedUser.deleteMany({});
  await FacultyResearchArea.deleteMany({});
  await FacultySlot.deleteMany({});

  // 3. CREATE MASTER ADMIN ACCOUNT
  const adminHashedPassword = await bcrypt.hash('bkuc123', 10);
  const adminEmail = 'admin@bkuc.edu.pk';

  await User.create({
    full_name: 'System Master Admin',
    email: adminEmail,
    password: adminHashedPassword,
    role: 'admin',
    department: 'Administration',
  });

  await AuthorizedUser.create({ 
    email: adminEmail, 
    role: 'admin' 
  });
  console.log(` Created Master Admin: ${adminEmail}`);

  // 4. CREATE FACULTY MEMBERS
  const hashed = await bcrypt.hash('DemoFaculty2026!', 10);

  for (const f of FACULTY) {
    const user = await User.create({
      full_name: f.name,
      email: f.email,
      password: hashed,
      role: 'faculty',
      department: f.dept,
      bio: f.bio,
      office_hours: f.officeHours,
      courses: f.courses,
      publications: f.publications,
      research_keywords: f.keywords,
    });

    const fraDocs = f.areas.map((a) => ({
      faculty_id: user._id,
      research_area_id: areaMap.get(a.name),
      weight: a.w,
    }));
    await FacultyResearchArea.insertMany(fraDocs);

    await FacultySlot.create({
      faculty_id: user._id,
      total_slots: f.total,
      taken_slots: f.taken,
      term: 'Fall 2026',
    });
    console.log(` Created faculty: ${f.name}`);
    await AuthorizedUser.create({ email: f.email, role: 'faculty' });
  }

  // 5. CREATE DEMO STUDENT
  const studentHashed = await bcrypt.hash('DemoStudent2026!', 10);
  const existingStudent = await User.findOne({ email: 'student@university.edu' });
  if (!existingStudent) {
    await User.create({
      full_name: 'Demo Student',
      email: 'student@university.edu',
      password: studentHashed,
      role: 'student',
      department: 'Computer Science',
    });
    console.log(' Created student: student@university.edu');
  }

  console.log('\n=============================================');
  console.log('SEED PROCESS COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
  console.log('Admin Sign-In:   admin@university.edu / AdminPassword123!');
  console.log('Faculty Sign-In: sarah.chen@university.edu / DemoFaculty2026!');
  console.log('Student Sign-In: student@university.edu / DemoStudent2026!');
  console.log('=============================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});