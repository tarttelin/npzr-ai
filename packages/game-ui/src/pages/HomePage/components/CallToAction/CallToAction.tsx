import React from 'react';
import { Link } from 'wouter';
import './CallToAction.css';

export const CallToAction: React.FC = () => {
  return (
    <section className="cta-section section" aria-labelledby="cta-heading">
      <div className="container">
        <h2 id="cta-heading">Ready for Battle?</h2>
        <p>Experience the thrill of NPZR - where strategy meets chaos!</p>
        <div className="cta-buttons">
          <Link href="/game" className="btn-primary">
            Play Now
          </Link>
          <Link href="/rules" className="btn-secondary">
            Learn Rules
          </Link>
        </div>
        <p id="play-description" className="sr-only">Start playing the NPZR tactical card game</p>
        <p id="rules-description" className="sr-only">Read the complete game rules and strategies</p>
      </div>
    </section>
  );
};