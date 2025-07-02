import React from 'react';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Header />
      <main id="main-content" className="main-content" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};