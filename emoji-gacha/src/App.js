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
import GachaScreen from './GachaScreen';
import BottomNavBar from './BottomNavBar'; // BottomNavBar 임포트
import { UserProvider, useUser } from './context/UserContext'; // UserProvider 임포트
import LoadingSpinner from './components/LoadingSpinner'; // LoadingSpinner 임포트
import ErrorMessage from './components/ErrorMessage'; // ErrorMessage 임포트

function AppBase() {
  const location = useLocation();
  const { user, isLoading, error } = useUser(); // useUser 훅에서 user, isLoading, error 가져오기
  const [isGachaMode, setIsGachaMode] = useState(false);

  useEffect(() => {
    console.log("isGachaMode:", isGachaMode); // 디버깅 로그
    initGA();
  }, [isGachaMode]);

  useEffect(() => {
    logPageView(location.pathname);
  }, [location]);

  if (isLoading) {
    return <LoadingSpinner />; // 로딩 중일 때 LoadingSpinner 표시
  }

  if (error) {
    return <ErrorMessage message={error.message} />; // 에러 발생 시 ErrorMessage 표시
  }

  return (
    <div className="App-container">
      {!isGachaMode && <Header />}
      <main className={`main-content ${location.pathname === '/dex' ? 'scrollable' : ''}`}>
        <div className="content-body">
          <Routes>
            <Route path="/" element={<GachaScreen setIsGachaMode={setIsGachaMode} />} />
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
      <UserProvider>
        <AppBase />
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
