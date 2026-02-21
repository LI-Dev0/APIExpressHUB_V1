// ============================================================================
// HOME PAGE INTERACTIVE FEATURES
// ============================================================================

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initHeroJokePreview();
  initStatsCounter();
  initFeatureCardAnimations();
});

// ============================================================================
// HERO SECTION - LIVE JOKE PREVIEW
// ============================================================================
const initHeroJokePreview = () => {
  const jokeContainer = document.getElementById('hero-joke-preview');
  const jokeButton = document.getElementById('hero-joke-btn');
  
  if (!jokeContainer || !jokeButton) return;

  // Fetch initial joke on page load
  fetchAndDisplayJoke();

  // Add click handler for refresh button
  jokeButton.addEventListener('click', fetchAndDisplayJoke);
};

const fetchAndDisplayJoke = async () => {
  const jokeContainer = document.getElementById('hero-joke-preview');
  const jokeButton = document.getElementById('hero-joke-btn');
  
  if (!jokeContainer) return;

  try {
    // Show loading state
    jokeButton.disabled = true;
    jokeButton.textContent = '🔄 Loading...';
    jokeContainer.classList.add('loading');

    // Randomly choose between dad jokes and Chuck Norris jokes
    const jokeType = Math.random() > 0.5 ? 'dad' : 'chuck';
    const response = await fetch(`/api/jokes/${jokeType}`);
    
    if (!response.ok) throw new Error('Failed to fetch joke');

    const html = await response.text();
    
    // Fade out, update content, fade in
    jokeContainer.style.opacity = '0';
    
    setTimeout(() => {
      jokeContainer.innerHTML = html;
      jokeContainer.style.opacity = '1';
      jokeContainer.classList.remove('loading');
      jokeButton.disabled = false;
      jokeButton.textContent = '🔄 Get Another';
    }, 300);

  } catch (error) {
    console.error('Error fetching joke:', error);
    jokeContainer.innerHTML = `
      <div style="padding: 20px; font-size: 1.1rem; color: #dc3545;">
        <p>😅 Couldn't fetch a joke right now. Try again!</p>
      </div>
    `;
    jokeContainer.classList.remove('loading');
    jokeButton.disabled = false;
    jokeButton.textContent = '🔄 Try Again';
  }
};

// ============================================================================
// STATS COUNTER ANIMATION - Intersection Observer
// ============================================================================
const initStatsCounter = () => {
  const statsSection = document.getElementById('stats-section');
  if (!statsSection) return;

  const counters = document.querySelectorAll('.stat-number');
  
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        counters.forEach(counter => {
          animateCounter(counter);
        });
        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  observer.observe(statsSection);
};

const animateCounter = (element) => {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps
  let current = 0;

  const updateCounter = () => {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current).toLocaleString();
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target.toLocaleString();
    }
  };

  updateCounter();
};

// ============================================================================
// FEATURE CARD 3D TILT EFFECT
// ============================================================================
const initFeatureCardAnimations = () => {
  const cards = document.querySelectorAll('.feature-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });

    // Add subtle tilt on mouse move
    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return; // Skip on mobile
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `
        translateY(-8px) 
        scale(1.02) 
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
      `;
    });
  });
};

// ============================================================================
// SMOOTH SCROLL FOR NAVIGATION
// ============================================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================================================
// PREFERS REDUCED MOTION - Accessibility
// ============================================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  document.documentElement.style.setProperty('--animation-duration', '0.01ms');
}
