import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="error-message-container">
      <p className="error-text">오류: {message}</p>
    </div>
  );
};

export default ErrorMessage;
