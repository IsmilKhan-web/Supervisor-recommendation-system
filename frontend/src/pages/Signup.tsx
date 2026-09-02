import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Building2, GraduationCap as Cap, Users, ShieldCheck, Check } from 'lucide-react';
import { AuthShell, ErrorBanner } from './Login';
import { Role } from '../types';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role,
      department: department.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join as a student or faculty member to get started.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <span className="label">I am a…</span>
          <div className="grid grid-cols-3 gap-3">
            <RoleCard active={role === 'student'} onClick={() => setRole('student')}
              icon={<Users className="h-5 w-5" />} title="Student" subtitle="Find a supervisor" />
            <RoleCard active={role === 'faculty'} onClick={() => setRole('faculty')}
              icon={<Cap className="h-5 w-5" />} title="Faculty" subtitle="Manage slots & areas" />
            <RoleCard active={role === 'admin'} onClick={() => setRole('admin')}
              icon={<ShieldCheck className="h-5 w-5" />} title="Admin" subtitle="Manage faculty" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input id="fullName" type="text" required value={fullName}
              onChange={(e) => setFullName(e.target.value)} className="input pl-10" placeholder="Jane Doe" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@university.edu" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="department">Department</label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <select id="department" value={department}
              onChange={(e) => setDepartment(e.target.value)} className="input-select pl-10">
              <option value="">Select your department (optional)</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="IT">IT</option>
              <option value="Data Science">Data Science</option>
              <option value="AI">AI</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input id="password" type="password" autoComplete="new-password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="At least 6 characters" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}

function RoleCard({ active, onClick, icon, title, subtitle }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
        active
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
      }`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all ${
        active ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
      }`}>{icon}</div>
      <div>
        <p className={`text-sm font-bold ${active ? 'text-primary-700' : 'text-neutral-800'}`}>{title}</p>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
      {active && (
        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-white">
          <Check className="h-2.5 w-2.5" />
        </div>
      )}
    </button>
  );
}
