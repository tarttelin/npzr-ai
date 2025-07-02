import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            &copy; 2024 NPZR Game Engine. Built with TypeScript and tactical precision.
          </p>
          <p className="footer-credit">
            Original game concept by Zen Zombie Games (2010)
          </p>
        </div>
      </div>
    </footer>
  );
};