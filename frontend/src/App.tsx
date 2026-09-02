import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyList from './pages/FacultyList';
import Recommendations from './pages/Recommendations';
import TopicSearch from './pages/TopicSearch';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'student' | 'faculty' | 'admin' }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600" />
          <p className="text-sm text-neutral-400">Loading…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile && profile.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { profile, loading } = useAuth();

  const dashboardRoute = () => {
    if (profile?.role === 'admin') return <AdminDashboard />;
    if (profile?.role === 'faculty') return <FacultyDashboard />;
    return <StudentDashboard />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {profile && !loading && <Navbar />}
      <Routes>
        <Route path="/" element={profile ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute>{dashboardRoute()}</ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute><FacultyList /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute role="student"><Recommendations /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute role="student"><TopicSearch /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
