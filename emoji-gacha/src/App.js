import './App.css';
import EmojiDex from './EmojiDex';
import ProfilePage from './ProfilePage';
import Header from './Header';
import Footer from './Footer';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { initGA, logPageView } from './analytics';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import GachaScreen from './GachaScreen';
import BottomNavBar from './BottomNavBar'; // BottomNavBar 임포트

function AppBase() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isGachaMode, setIsGachaMode] = useState(false);

  useEffect(() => {
    console.log("isGachaMode:", isGachaMode); // 디버깅 로그
    initGA();
  }, [isGachaMode]);

  useEffect(() => {
    logPageView(location.pathname);
  }, [location]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="App-container">
      {!isGachaMode && <Header />}
      <main className={`main-content ${location.pathname === '/dex' ? 'scrollable' : ''}`}>
        <div className="content-body">
          <Routes>
            <Route path="/" element={<GachaScreen user={user} setIsGachaMode={setIsGachaMode} />} />
            <Route path="/dex" element={<EmojiDex />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </div>
        {location.pathname !== '/' && !isGachaMode && <Footer />}
      </main>
      {!isGachaMode && <BottomNavBar />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppBase />
    </BrowserRouter>
  );
}

export default App;
