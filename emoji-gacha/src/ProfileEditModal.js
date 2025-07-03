import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import './ProfileEditModal.css';

const ProfileEditModal = ({ isOpen, onClose, currentUser }) => {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentUser) {
      setError('로그인된 사용자가 없습니다.');
      return;
    }

    try {
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: photoURL,
      });
      setSuccess(true);
      // Optionally, refresh user state in parent component if needed
      // For now, Firebase's onAuthStateChanged will handle updates
      setTimeout(() => {
        onClose();
      }, 1500); // Close after 1.5 seconds
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError('프로필 업데이트에 실패했습니다: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-edit-modal">
        <h2>프로필 편집</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">닉네임:</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="photoURL">프로필 사진 URL:</label>
            <input
              type="url"
              id="photoURL"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="프로필 사진 URL을 입력하세요"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">프로필이 성공적으로 업데이트되었습니다!</p>}
          <div className="modal-actions">
            <button type="submit" className="save-button">저장</button>
            <button type="button" onClick={onClose} className="cancel-button">취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;