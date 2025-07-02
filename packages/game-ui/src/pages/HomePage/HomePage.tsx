import React from 'react';
import { HeroSection } from './components/HeroSection/HeroSection';
import { GameIntro } from './components/GameIntro/GameIntro';
import { CharacterShowcase } from './components/CharacterShowcase/CharacterShowcase';
import { GameFeatures } from './components/GameFeatures/GameFeatures';
import { CallToAction } from './components/CallToAction/CallToAction';
import './HomePage.css';

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <HeroSection />
      <GameIntro />
      <CharacterShowcase />
      <GameFeatures />
      <CallToAction />
    </div>
  );
};