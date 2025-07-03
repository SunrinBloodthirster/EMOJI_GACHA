import React from 'react';
import './CompletionGauge.css';

const CompletionGauge = ({ completionRate }) => {
  return (
    <div className="completion-gauge-section">
      <div className="gauge-text">
        <span>완성도: </span>
        <span className="gauge-value">{completionRate}%</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CompletionGauge;
