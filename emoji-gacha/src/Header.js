import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, provider } from './firebase';
import { signOut, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import ProfileEditModal from './ProfileEditModal'; // ProfileEditModal 임포트

const Header = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false); // 모달 상태
  const [isVisible, setIsVisible] = useState(true); // 헤더 가시성 상태
  const lastScrollY = useRef(0); // Use useRef for lastScrollY
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY.current) { // Use .current for ref
        setIsVisible(false);
      } else { // 위로 스크롤
        setIsVisible(true);
      }
      lastScrollY.current = window.scrollY; // Update ref .current
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []); // Empty dependency array because handleScroll is now stable

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      setIsDropdownOpen(false); // Close dropdown after login
    } catch (error) {
      console.error('Google login error:', error);
      alert('구글 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false); // Close dropdown after logout
      navigate('/'); // 로그아웃 후 홈으로 이동
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => {
      return !prev;
    });
  };

  const handleOpenProfileEditModal = () => {
    setIsProfileEditModalOpen(true);
    setIsDropdownOpen(false); // 드롭다운 닫기
  };

  const handleCloseProfileEditModal = () => {
    setIsProfileEditModalOpen(false);
  };

  return (
    <header className={`app-header ${isVisible ? '' : 'hidden'}`}> {/* isVisible 상태에 따라 클래스 추가 */}
      <div className="header-left">
        <Link to="/" className="app-title-link">
          <h1>EMOJI GACHA</h1>
        </Link>
      </div>
      <div className="header-right">
        <Link to="/" className="nav-link desktop-only-nav">뽑기</Link>
        <Link to="/dex" className="nav-link desktop-only-nav">내 도감</Link>
        <div className="profile-container">
          <button className="profile-icon-button" onClick={toggleDropdown}>
            {currentUser ? (
              <img src={currentUser.photoURL} alt="Profile" className="profile-picture" />
            ) : (
              <span className="material-icons">account_circle</span> // Placeholder icon
            )}
          </button>
          {isDropdownOpen && (
            <div className="profile-dropdown">
              {currentUser ? (
                <>
                  <button onClick={handleOpenProfileEditModal}>프로필 편집</button>
                  <button onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <button onClick={handleGoogleLogin}>구글 로그인</button>
              )}
            </div>
          )}
        </div>
      </div>
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={handleCloseProfileEditModal}
        currentUser={currentUser}
      />
    </header>
  );
};

export default Header;