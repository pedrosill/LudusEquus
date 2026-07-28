const shell = document.querySelector('.test-shell');
const grid = document.querySelector('[data-card-test-grid]');
const dimmer = document.querySelector('[data-card-dimmer]');
const modalLayer = document.querySelector('[data-card-modal-layer]');
const cards = Array.from(document.querySelectorAll('[data-card-test-item]'));
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let activeCard = null;
let openTimer = null;
let lastTrigger = null;
let viewportRaf = 0;
const cardOrigins = new Map();

const syncViewportMetrics = () => {
  root.style.setProperty('--test-vh', `${window.innerHeight * 0.01}px`);
};

const scheduleViewportMetricsSync = () => {
  if (viewportRaf) return;

  viewportRaf = window.requestAnimationFrame(() => {
    viewportRaf = 0;
    syncViewportMetrics();
    reflowActiveCard();
  });
};

const getFocusableElements = (container) =>
  Array.from(container.querySelectorAll(focusableSelector)).filter(
    (element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0
  );

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
  document.body.classList.toggle('modal-open', visible);
};

const setShellDimmed = (dimmed) => {
  if (!shell) return;
  shell.classList.toggle('is-dimmed', dimmed);
};

const clampCardTop = (top, height) => {
  const viewportHeight = window.innerHeight;
  const margin = 16;
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  return Math.max(margin, Math.min(top, maxTop));
};

const clampCardHeight = (height) => {
  const viewportHeight = window.innerHeight;
  const margin = 16;
  return Math.max(240, Math.min(height, viewportHeight - margin * 2));
};

const getModalMetrics = (rect) => {
  const desiredWidth = Math.min(rect.width * 2.15, window.innerWidth - 32, 64 * 16);
  const fitHeight = clampCardHeight(rect.height);
  const fitTop = clampCardTop(rect.top, fitHeight);
  const availableRight = window.innerWidth - rect.left - 16;
  const availableLeft = rect.right - 16;
  const canExpandRight = availableRight >= desiredWidth;
  const canExpandLeft = availableLeft >= desiredWidth;
  const shouldExpandLeft = !canExpandRight && (canExpandLeft || availableLeft > availableRight);

  return {
    desiredWidth,
    fitHeight,
    fitTop,
    shouldExpandLeft,
  };
};

const applyModalGeometry = (card, rect) => {
  const metrics = getModalMetrics(rect);

  card.style.setProperty('--card-origin-top', `${rect.top}px`);
  card.style.setProperty('--card-fit-top', `${metrics.fitTop}px`);
  card.style.setProperty('--card-origin-left', `${rect.left}px`);
  card.style.setProperty('--card-origin-right', `${window.innerWidth - rect.right}px`);
  card.style.setProperty('--card-origin-width', `${rect.width}px`);
  card.style.setProperty('--card-origin-height', `${rect.height}px`);
  card.style.setProperty('--card-modal-width', `${metrics.desiredWidth}px`);
  card.style.setProperty('--card-fit-height', `${metrics.fitHeight}px`);
  card.classList.toggle('is-expand-left', metrics.shouldExpandLeft);
};

const moveCardToModal = (card) => {
  if (!modalLayer || !card || card.parentElement === modalLayer) return;

  const rect = card.getBoundingClientRect();
  cardOrigins.set(card, {
    parent: card.parentElement,
    nextSibling: card.nextSibling,
    rect: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    },
  });
  applyModalGeometry(card, rect);
  modalLayer.appendChild(card);
  card.classList.add('is-modal');
};

const reflowActiveCard = () => {
  if (!activeCard || activeCard.parentElement !== modalLayer) return;

  const origin = cardOrigins.get(activeCard);

  if (!origin?.rect) return;

  applyModalGeometry(activeCard, origin.rect);
};

const restoreCardFromModal = (card) => {
  const origin = cardOrigins.get(card);

  if (!origin?.parent) return;

  if (origin.nextSibling && origin.nextSibling.parentNode === origin.parent) {
    origin.parent.insertBefore(card, origin.nextSibling);
  } else {
    origin.parent.appendChild(card);
  }

  card.classList.remove('is-modal');
  card.classList.remove('is-expand-left');
  card.style.removeProperty('--card-origin-top');
  card.style.removeProperty('--card-fit-top');
  card.style.removeProperty('--card-origin-left');
  card.style.removeProperty('--card-origin-right');
  card.style.removeProperty('--card-origin-width');
  card.style.removeProperty('--card-origin-height');
  card.style.removeProperty('--card-modal-width');
  card.style.removeProperty('--card-fit-height');
  cardOrigins.delete(card);
};

cards.forEach((card, index) => {
  const title = card.querySelector('.experience-copy h2');
  const summary = card.querySelector('.experience-summary');
  const details = card.querySelector('.experience-details');
  const trigger = card.querySelector('[data-card-open]');
  const baseId = `experience-card-${index + 1}`;

  if (title && !title.id) {
    title.id = `${baseId}-title`;
  }

  if (summary && !summary.id) {
    summary.id = `${baseId}-summary`;
  }

  if (details && !details.id) {
    details.id = `${baseId}-details`;
  }

  if (trigger) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', details?.id || `${baseId}-details`);
  }
});

const syncCardStates = () => {
  cards.forEach((card) => {
    const title = card.querySelector('.experience-copy h2');
    const details = card.querySelector('.experience-details');
    const trigger = card.querySelector('[data-card-open]');
    const isActive = card === activeCard;
    const titleId = title?.id;
    const detailsId = details?.id;

    card.classList.toggle('is-expanded', isActive);

    if (!isActive) {
      card.classList.remove('is-opening');
    }

    card.classList.toggle('is-modal', isActive);

    if (isActive) {
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      if (titleId) {
        card.setAttribute('aria-labelledby', titleId);
      }

      if (detailsId) {
        card.setAttribute('aria-describedby', detailsId);
      }

      card.setAttribute('tabindex', '-1');
    } else {
      card.removeAttribute('role');
      card.removeAttribute('aria-modal');
      card.removeAttribute('aria-labelledby');
      card.removeAttribute('aria-describedby');
      card.removeAttribute('tabindex');
    }

    if (details) {
      details.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }

    if (trigger) {
      trigger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      trigger.textContent = isActive ? 'Less Info' : 'Learn More';
    }
  });
};

const focusActiveCard = () => {
  if (!activeCard) return;

  const focusables = getFocusableElements(activeCard);
  const target = activeCard.querySelector('[data-card-close]') || focusables[0] || activeCard;

  if (typeof target.focus === 'function') {
    target.focus({ preventScroll: true });
  }
};

const closeCard = () => {
  if (!activeCard) return;

  clearOpenTimer();
  setDimmerVisible(false);
  setShellDimmed(false);

  const triggerToRestore = lastTrigger;
  restoreCardFromModal(activeCard);
  activeCard = null;
  syncCardStates();
  lastTrigger = null;

  if (triggerToRestore && typeof triggerToRestore.focus === 'function') {
    triggerToRestore.focus({ preventScroll: true });
  }
};

const openCard = (card, trigger) => {
  if (!card) return;

  clearOpenTimer();
  lastTrigger = trigger || null;

  if (activeCard && activeCard !== card) {
    restoreCardFromModal(activeCard);
    activeCard.classList.remove('is-expanded');
    activeCard.classList.remove('is-opening');
  }

  moveCardToModal(card);
  activeCard = card;
  setShellDimmed(true);
  setDimmerVisible(true);
  syncCardStates();

  if (reduceMotionQuery.matches) {
    focusActiveCard();
    return;
  }

  requestAnimationFrame(() => {
    card.classList.add('is-opening');
    requestAnimationFrame(() => {
      card.classList.add('is-expanded');
      focusActiveCard();
      openTimer = window.setTimeout(() => {
        card.classList.remove('is-opening');
        openTimer = null;
      }, 260);
    });
  });
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

    openCard(card, trigger);
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
    return;
  }

  if (event.key !== 'Tab' || !activeCard) {
    return;
  }

  const focusables = getFocusableElements(activeCard);

  if (!focusables.length) {
    event.preventDefault();
    activeCard.focus({ preventScroll: true });
    return;
  }

  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  const currentFocus = document.activeElement;

  if (event.shiftKey) {
    if (!activeCard.contains(currentFocus) || currentFocus === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus({ preventScroll: true });
    }
  } else if (!activeCard.contains(currentFocus) || currentFocus === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus({ preventScroll: true });
  }
});

syncViewportMetrics();
window.addEventListener('resize', scheduleViewportMetricsSync);
window.addEventListener('orientationchange', () => {
  syncViewportMetrics();
  reflowActiveCard();
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
