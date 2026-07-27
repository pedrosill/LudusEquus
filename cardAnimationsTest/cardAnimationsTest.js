const shell = document.querySelector('.test-shell');
const grid = document.querySelector('[data-card-test-grid]');
const dimmer = document.querySelector('[data-card-dimmer]');
const cards = Array.from(document.querySelectorAll('[data-card-test-item]'));
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let activeCard = null;
let openTimer = null;

const clearOpenTimer = () => {
  if (openTimer) {
    window.clearTimeout(openTimer);
    openTimer = null;
  }
};

const setDimmerVisible = (visible) => {
  if (!dimmer) return;

  dimmer.hidden = !visible;
  dimmer.classList.toggle('is-visible', visible);
};

const setShellDimmed = (dimmed) => {
  if (!shell) return;
  shell.classList.toggle('is-dimmed', dimmed);
};

const syncCardStates = () => {
  cards.forEach((card) => {
    const details = card.querySelector('.experience-details');
    const trigger = card.querySelector('[data-card-open]');
    const isActive = card === activeCard;

    card.classList.toggle('is-expanded', isActive);
    card.setAttribute('aria-expanded', isActive ? 'true' : 'false');

    if (details) {
      details.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }

    if (trigger) {
      trigger.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      trigger.textContent = isActive ? 'Less Info' : 'Learn More';
    }
  });
};

const closeCard = () => {
  if (!activeCard) return;

  clearOpenTimer();
  setDimmerVisible(false);
  setShellDimmed(false);

  activeCard = null;
  syncCardStates();
};

const openCard = (card) => {
  if (!card) return;

  clearOpenTimer();

  if (activeCard && activeCard !== card) {
    activeCard.classList.remove('is-expanded');
  }

  activeCard = card;
  setShellDimmed(true);
  setDimmerVisible(true);
  syncCardStates();

  if (reduceMotionQuery.matches) {
    return;
  }

  card.classList.add('is-opening');
  openTimer = window.setTimeout(() => {
    card.classList.remove('is-opening');
    openTimer = null;
  }, 260);
};

cards.forEach((card) => {
  const trigger = card.querySelector('[data-card-open]');
  const closeButton = card.querySelector('[data-card-close]');

  trigger?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (activeCard === card) {
      closeCard();
      return;
    }

    openCard(card);
  });

  closeButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeCard();
  });
});

dimmer?.addEventListener('click', closeCard);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCard();
  }
});

window.addEventListener('resize', () => {
  if (!grid) return;

  if (activeCard) {
    setShellDimmed(true);
    setDimmerVisible(true);
  }
});

const cardObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              cardObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      )
    : null;

cards.forEach((card, index) => {
  if (cardObserver) {
    cardObserver.observe(card);
  } else {
    card.classList.add('is-visible');
  }

  card.style.transitionDelay = `${index * 90}ms`;
});

syncCardStates();
