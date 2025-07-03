import React from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import './Login.css'; // Login 전용 CSS 파일 임포트

const Login = () => {
  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // The signed-in user info.
        const user = result.user;
        console.log('User logged in:', user);
        // ...
      }).catch((error) => {
        // Handle Errors here.
        console.error('Google login error:', error.message);
      });
  };

  return (
    <div className="login-container">
      <p>로그인하여 이모지 뽑기를 시작하세요!</p>
      <button onClick={handleGoogleLogin}>
        구글 로그인
      </button>
    </div>
  );
};

export default Login;
