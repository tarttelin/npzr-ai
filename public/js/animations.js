/**
 * NPZR Homepage Animations
 * Handles page load animations and visual effects
 */

class NPZRAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.initializePageAnimations();
    this.setupReducedMotionSupport();
  }

  /**
   * Set up Intersection Observer for scroll-triggered animations
   */
  setupIntersectionObserver() {
    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements for animation
    this.observeElements();
  }

  /**
   * Add elements to intersection observer
   */
  observeElements() {
    const elementsToAnimate = [
      '.game-intro',
      '.character-card',
      '.feature',
      '.cta-section'
    ];

    elementsToAnimate.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('animate-on-scroll');
        this.observer.observe(el);
      });
    });
  }

  /**
   * Animate individual elements when they come into view
   */
  animateElement(element) {
    element.classList.add('animate-in');
    
    // Special handling for character cards
    if (element.classList.contains('character-card')) {
      this.animateCharacterCard(element);
    }
    
    // Special handling for features
    if (element.classList.contains('feature')) {
      this.animateFeature(element);
    }
  }

  /**
   * Character card specific animations
   */
  animateCharacterCard(card) {
    const icon = card.querySelector('.character-icon');
    if (icon) {
      setTimeout(() => {
        icon.classList.add('icon-bounce');
      }, 200);
    }
  }

  /**
   * Feature card specific animations
   */
  animateFeature(feature) {
    const icon = feature.querySelector('.feature-icon');
    if (icon) {
      setTimeout(() => {
        icon.classList.add('icon-pulse');
      }, 300);
    }
  }

  /**
   * Initialize page load animations
   */
  initializePageAnimations() {
    // Logo entrance animation
    const logo = document.querySelector('.game-logo');
    if (logo) {
      logo.classList.add('logo-animate');
    }

    // Staggered character hero animations
    const characterHeroes = document.querySelectorAll('.character-hero');
    characterHeroes.forEach((hero, index) => {
      setTimeout(() => {
        hero.classList.add('hero-entrance');
      }, 500 + (index * 200));
    });

    // Tagline glow effect
    const tagline = document.querySelector('.tagline');
    if (tagline) {
      setTimeout(() => {
        tagline.classList.add('tagline-glow');
      }, 1500);
    }
  }

  /**
   * Handle reduced motion preferences
   */
  setupReducedMotionSupport() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      this.disableAnimations();
    }

    // Listen for changes in motion preference
    prefersReducedMotion.addEventListener('change', () => {
      if (prefersReducedMotion.matches) {
        this.disableAnimations();
      } else {
        this.enableAnimations();
      }
    });
  }

  /**
   * Disable animations for users who prefer reduced motion
   */
  disableAnimations() {
    document.body.classList.add('reduce-motion');
    
    // Remove animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
      el.classList.add('animate-in');
    });
  }

  /**
   * Enable animations
   */
  enableAnimations() {
    document.body.classList.remove('reduce-motion');
  }

  /**
   * Animate button clicks
   */
  animateButtonClick(button) {
    button.classList.add('button-clicked');
    
    setTimeout(() => {
      button.classList.remove('button-clicked');
    }, 300);
  }

  /**
   * Create particle effect for character interactions
   */
  createParticleEffect(element, character) {
    if (this.prefersReducedMotion()) return;

    const particles = [];
    const colors = this.getCharacterColors(character);
    
    for (let i = 0; i < 6; i++) {
      const particle = this.createParticle(colors[i % colors.length]);
      element.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    particles.forEach((particle, index) => {
      setTimeout(() => {
        this.animateParticle(particle);
      }, index * 100);
    });

    // Clean up particles
    setTimeout(() => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }, 2000);
  }

  /**
   * Create individual particle element
   */
  createParticle(color) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 10;
    `;
    return particle;
  }

  /**
   * Animate individual particle
   */
  animateParticle(particle) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    const duration = 1000 + Math.random() * 1000;

    particle.animate([
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1
      },
      {
        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
        opacity: 0
      }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }

  /**
   * Get character-specific colors for particles
   */
  getCharacterColors(character) {
    const colorMap = {
      ninja: ['#2C2C2C', '#1A1A1A', '#444444'],
      pirate: ['#8B4513', '#DC143C', '#CD853F'],
      zombie: ['#9370DB', '#32CD32', '#BA55D3'],
      robot: ['#FFD700', '#FFA500', '#FF8C00']
    };
    
    return colorMap[character] || ['#FF6B35'];
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// CSS for animations (injected dynamically)
const animationStyles = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .logo-animate {
    animation: logoEntrance 1s ease-out;
  }

  .hero-entrance {
    animation: heroEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .tagline-glow {
    animation: taglineGlow 2s ease-in-out infinite alternate;
  }

  .icon-bounce {
    animation: iconBounce 0.6s ease-out;
  }

  .icon-pulse {
    animation: iconPulse 1s ease-in-out;
  }

  .button-clicked {
    animation: buttonClick 0.3s ease-out;
  }

  @keyframes heroEntrance {
    0% {
      opacity: 0;
      transform: translateY(50px) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes iconBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  @keyframes iconPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  @keyframes buttonClick {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  /* Reduced motion styles */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .reduce-motion .animate-on-scroll {
    opacity: 1;
    transform: none;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NPZRAnimations();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NPZRAnimations;
}