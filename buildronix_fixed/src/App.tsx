import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import ProjectDetails from './pages/ProjectDetails';
import DebugAssistant from './pages/DebugAssistant';
import WebIDE from './pages/WebIDE';
import Settings from './pages/Settings';
import InfoPage from './pages/InfoPage';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="relative flex h-screen bg-black text-zinc-100 overflow-hidden">
        {/* Global Background Video */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
          </video>
          {/* Enhanced atmospheric gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-black/60 to-purple-900/10" />
        </div>

        <div className="relative z-10 flex w-full h-full">
          {user && <Sidebar />}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
                <Route path="/platform" element={<InfoPage />} />
                <Route path="/solutions" element={<InfoPage />} />
                <Route path="/documentation" element={<InfoPage />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/generate" element={user ? <Generate /> : <Navigate to="/" />} />
                <Route path="/project/:id" element={user ? <ProjectDetails /> : <Navigate to="/" />} />
                <Route path="/ide" element={user ? <WebIDE /> : <Navigate to="/" />} />
                <Route path="/debug" element={user ? <DebugAssistant /> : <Navigate to="/" />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
