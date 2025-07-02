import React from 'react';
import { Link, useLocation } from 'wouter';
import './Header.css';

export const Header: React.FC = () => {
  const [location] = useLocation();

  return (
    <header className="header" role="banner">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <h1 className="logo-text">
              <span className="logo-ninja">NINJA</span>
              <span className="logo-pirate">PIRATE</span>
              <span className="logo-zombie">ZOMBIE</span>
              <span className="logo-robot">ROBOT</span>
            </h1>
          </Link>
          
          <nav className="main-nav" role="navigation" aria-label="Main navigation">
            <Link 
              href="/" 
              className={`nav-link ${location === '/' ? 'nav-link--active' : ''}`}
              aria-current={location === '/' ? 'page' : undefined}
            >
              Home
            </Link>
            <Link 
              href="/game" 
              className={`nav-link ${location === '/game' ? 'nav-link--active' : ''}`}
              aria-current={location === '/game' ? 'page' : undefined}
            >
              Play Game
            </Link>
            <Link 
              href="/rules" 
              className={`nav-link ${location === '/rules' ? 'nav-link--active' : ''}`}
              aria-current={location === '/rules' ? 'page' : undefined}
            >
              Rules
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};