import { useState } from 'react';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
}
