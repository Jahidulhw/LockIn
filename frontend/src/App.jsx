import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import NavBar from './components/NavBar';
import Header from './components/Header';
import Home from './pages/Home';
import DailyChecklist from './pages/DailyChecklist';
import Challenges from './pages/Challenges';
import Analytics from './pages/Analytics';
import CreateChallenge from './pages/CreateChallenge';
import Focus from './pages/Focus';
import AddHabit from './pages/AddHabit';
import AuthPage from './pages/AuthPage';

function ProtectedApp() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <AppProvider>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/checklist"      element={<DailyChecklist />} />
          <Route path="/checklist/:day" element={<DailyChecklist />} />
          <Route path="/challenges"     element={<Challenges />} />
          <Route path="/analytics"      element={<Analytics />} />
          <Route path="/focus"          element={<Focus />} />
          <Route path="/add-habit"      element={<AddHabit />} />
          <Route path="/create"         element={<CreateChallenge />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
        <NavBar />
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPageGuard />} />
          <Route path="/*"     element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AuthPageGuard() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/" replace />;
  return <AuthPage />;
}
