import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import MatchResultsPage from './pages/MatchResultsPage';
import Footer from './components/Footer';

export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/matches" element={<MatchResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
