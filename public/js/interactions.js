/**
 * NPZR Homepage Interactions
 * Handles user interactions, accessibility, and enhanced UX
 */

class NPZRInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupAccessibilityFeatures();
    this.setupCharacterInteractions();
    this.setupButtonInteractions();
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Character card interactions
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
      card.addEventListener('click', (e) => this.handleCharacterClick(e));
      card.addEventListener('mouseenter', (e) => this.handleCharacterHover(e));
      card.addEventListener('mouseleave', (e) => this.handleCharacterLeave(e));
    });

    // Character hero interactions
    const characterHeroes = document.querySelectorAll('.character-hero');
    characterHeroes.forEach(hero => {
      hero.addEventListener('click', (e) => this.handleHeroClick(e));
    });

    // Button interactions
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => this.handleButtonClick(e));
    });

    // Logo interaction
    const logo = document.querySelector('.game-logo');
    if (logo) {
      logo.addEventListener('click', (e) => this.handleLogoClick(e));
    }

    // Window resize for responsive adjustments
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    // Scroll events for additional effects
    window.addEventListener('scroll', this.throttle(() => {
      this.handleScroll();
    }, 16));
  }

  /**
   * Handle character card clicks
   */
  handleCharacterClick(event) {
    const card = event.currentTarget;
    const characterType = this.getCharacterType(card);
    
    // Add click animation
    card.classList.add('card-clicked');
    setTimeout(() => {
      card.classList.remove('card-clicked');
    }, 300);

    // Create particle effect
    if (window.npzrAnimations && !this.prefersReducedMotion()) {
      window.npzrAnimations.createParticleEffect(card, characterType);
    }

    // Announce to screen readers
    this.announceToScreenReader(`${characterType} character selected`);

    // Track interaction (placeholder for analytics)
    this.trackInteraction('character_card_click', { character: characterType });
  }

  /**
   * Handle character card hover
   */
  handleCharacterHover(event) {
    const card = event.currentTarget;
    const characterType = this.getCharacterType(card);
    
    // Add hover sound effect (if audio is enabled)
    this.playHoverSound(characterType);
    
    // Update cursor
    card.style.cursor = 'pointer';
  }

  /**
   * Handle character card leave
   */
  handleCharacterLeave(event) {
    const card = event.currentTarget;
    // Reset any temporary states
  }

  /**
   * Handle character hero clicks
   */
  handleHeroClick(event) {
    const hero = event.currentTarget;
    const characterType = this.getCharacterType(hero);
    
    // Scroll to character section
    const characterSection = document.querySelector('.characters');
    if (characterSection) {
      characterSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }

    // Highlight corresponding character card
    setTimeout(() => {
      const correspondingCard = document.querySelector(`.character-card.${characterType}`);
      if (correspondingCard) {
        this.highlightElement(correspondingCard);
      }
    }, 500);

    this.trackInteraction('character_hero_click', { character: characterType });
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(event) {
    const button = event.currentTarget;
    const buttonType = button.classList.contains('btn-primary') ? 'primary' : 'secondary';
    const buttonText = button.textContent.trim();

    // Add click animation
    if (window.npzrAnimations) {
      window.npzrAnimations.animateButtonClick(button);
    }

    // Handle different button actions
    if (buttonText.includes('Play Now')) {
      this.handlePlayNowClick();
    } else if (buttonText.includes('Learn Rules')) {
      this.handleLearnRulesClick();
    }

    this.trackInteraction('button_click', { 
      type: buttonType, 
      text: buttonText 
    });
  }

  /**
   * Handle logo clicks
   */
  handleLogoClick(event) {
    // Easter egg: cycle through character colors
    const logo = event.currentTarget;
    const logoText = logo.querySelector('.logo-text');
    
    if (logoText) {
      logoText.classList.add('logo-rainbow');
      setTimeout(() => {
        logoText.classList.remove('logo-rainbow');
      }, 2000);
    }

    this.trackInteraction('logo_click');
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation() {
    // Handle Enter and Space key presses on focusable elements
    document.addEventListener('keydown', (event) => {
      const { key, target } = event;
      
      if (key === 'Enter' || key === ' ') {
        if (target.classList.contains('character-card')) {
          event.preventDefault();
          this.handleCharacterClick({ currentTarget: target });
        } else if (target.classList.contains('character-hero')) {
          event.preventDefault();
          this.handleHeroClick({ currentTarget: target });
        }
      }
      
      // Arrow key navigation for character cards
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
        this.handleArrowNavigation(event);
      }
    });
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(event) {
    const { key, target } = event;
    
    if (!target.classList.contains('character-card')) return;
    
    const cards = Array.from(document.querySelectorAll('.character-card'));
    const currentIndex = cards.indexOf(target);
    let nextIndex;

    switch (key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        // Move to previous row (assuming 4 columns on desktop)
        nextIndex = currentIndex >= 4 ? currentIndex - 4 : currentIndex;
        break;
      case 'ArrowDown':
        // Move to next row
        nextIndex = currentIndex < cards.length - 4 ? currentIndex + 4 : currentIndex;
        break;
    }

    if (nextIndex !== undefined && cards[nextIndex]) {
      event.preventDefault();
      cards[nextIndex].focus();
    }
  }

  /**
   * Set up accessibility features
   */
  setupAccessibilityFeatures() {
    // Add live region for announcements
    this.createLiveRegion();
    
    // Enhanced focus indicators
    this.setupFocusIndicators();
    
    // Skip navigation functionality
    this.setupSkipNavigation();
  }

  /**
   * Create live region for screen reader announcements
   */
  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    this.liveRegion = liveRegion;
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }

  /**
   * Set up enhanced focus indicators
   */
  setupFocusIndicators() {
    // Add visual focus indicators for better accessibility
    const focusableElements = document.querySelectorAll(
      'button, .character-card, .character-hero, a, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      element.addEventListener('focus', () => {
        element.classList.add('has-focus');
      });
      
      element.addEventListener('blur', () => {
        element.classList.remove('has-focus');
      });
    });
  }

  /**
   * Set up skip navigation
   */
  setupSkipNavigation() {
    const skipLink = document.querySelector('.skip-nav');
    if (skipLink) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /**
   * Set up character-specific interactions
   */
  setupCharacterInteractions() {
    // Add character-specific sound effects and animations
    const characters = ['ninja', 'pirate', 'zombie', 'robot'];
    
    characters.forEach(character => {
      const elements = document.querySelectorAll(`.${character}`);
      elements.forEach(element => {
        element.addEventListener('mouseenter', () => {
          this.playCharacterSound(character);
        });
      });
    });
  }

  /**
   * Set up button interactions
   */
  setupButtonInteractions() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
      button.addEventListener('mousedown', (event) => {
        this.createRippleEffect(button, event);
      });
    });
  }

  /**
   * Create ripple effect for buttons
   */
  createRippleEffect(button, event) {
    if (this.prefersReducedMotion()) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Handle Play Now button click
   */
  handlePlayNowClick() {
    this.announceToScreenReader('Play Now button activated. Game would start here.');
    // Placeholder for actual game launch
    console.log('Play Now clicked - would launch game');
  }

  /**
   * Handle Learn Rules button click
   */
  handleLearnRulesClick() {
    this.announceToScreenReader('Learn Rules button activated. Rules would be displayed here.');
    // Placeholder for rules display
    console.log('Learn Rules clicked - would show rules');
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Adjust any responsive interactions
    this.adjustResponsiveInteractions();
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Add any scroll-based interactions
    const scrollY = window.scrollY;
    
    // Parallax effect for hero section (if not reduced motion)
    if (!this.prefersReducedMotion()) {
      const heroSection = document.querySelector('.hero-section');
      if (heroSection && scrollY < window.innerHeight) {
        heroSection.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
    }
  }

  /**
   * Adjust interactions for different screen sizes
   */
  adjustResponsiveInteractions() {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Remove hover effects on mobile
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.remove('mobile-device');
    }
  }

  /**
   * Highlight an element temporarily
   */
  highlightElement(element) {
    element.classList.add('highlighted');
    setTimeout(() => {
      element.classList.remove('highlighted');
    }, 2000);
  }

  /**
   * Get character type from element classes
   */
  getCharacterType(element) {
    const classes = element.classList;
    if (classes.contains('ninja')) return 'ninja';
    if (classes.contains('pirate')) return 'pirate';
    if (classes.contains('zombie')) return 'zombie';
    if (classes.contains('robot')) return 'robot';
    return 'unknown';
  }

  /**
   * Play character-specific sound (placeholder)
   */
  playCharacterSound(character) {
    // Placeholder for sound effects
    // In a real implementation, you would play character-specific sounds
    console.log(`Playing ${character} sound effect`);
  }

  /**
   * Play hover sound (placeholder)
   */
  playHoverSound(character) {
    // Placeholder for hover sound effects
    console.log(`Playing ${character} hover sound`);
  }

  /**
   * Track user interactions (placeholder for analytics)
   */
  trackInteraction(action, data = {}) {
    // Placeholder for analytics tracking
    console.log('Interaction tracked:', action, data);
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Utility: Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Utility: Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Additional CSS for interactions
const interactionStyles = `
  .card-clicked {
    animation: cardClick 0.3s ease-out;
  }

  .highlighted {
    animation: highlight 2s ease-out;
  }

  .has-focus {
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.5) !important;
  }

  .logo-rainbow .logo-text {
    animation: rainbow 2s linear;
  }

  @keyframes cardClick {
    0% { transform: scale(1); }
    50% { transform: scale(0.98); }
    100% { transform: scale(1); }
  }

  @keyframes highlight {
    0%, 100% { 
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
    }
    50% { 
      box-shadow: 0 5px 30px rgba(255, 107, 53, 0.4);
    }
  }

  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .mobile-device .character-card:hover,
  .mobile-device .character-hero:hover {
    transform: none;
  }

  button {
    position: relative;
    overflow: hidden;
  }
`;

// Inject interaction styles
const interactionStyleSheet = document.createElement('style');
interactionStyleSheet.textContent = interactionStyles;
document.head.appendChild(interactionStyleSheet);

// Initialize interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.npzrInteractions = new NPZRInteractions();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NPZRInteractions;
}