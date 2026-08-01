const shell = document.querySelector('.test-shell');
const grid = document.querySelector('[data-card-test-grid]');
const dimmer = document.querySelector('[data-card-dimmer]');
const modalLayer = document.querySelector('[data-card-modal-layer]');
const carouselDots = Array.from(document.querySelectorAll('[data-carousel-dot]'));
const carouselEdgeHint = document.querySelector('[data-carousel-edge-hint]');
const cards = Array.from(document.querySelectorAll('[data-card-test-item]'));
const originalMainImages = new WeakMap();
const mobileBookingOrigins = new Map();
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let activeCard = null;
let openTimer = null;
let lastTrigger = null;
let viewportRaf = 0;
let compactResizeTimer = 0;
const cardOrigins = new Map();

const syncViewportMetrics = () => {
  root.style.setProperty('--test-vh', `${window.innerHeight * 0.01}px`);
};

const scheduleViewportMetricsSync = () => {
  if (viewportRaf) return;

  viewportRaf = window.requestAnimationFrame(() => {
    viewportRaf = 0;
    syncViewportMetrics();
    syncCompactLayout();
    syncMobileCarousel();
    syncMobileBookingAction();
    reflowActiveCard();
  });
};

const syncCompactLayout = () => {
  cards.forEach((card) => {
    card.classList.toggle('compact-layout', card === activeCard && window.innerHeight < 760);
  });
};

const syncMobileCarousel = () => {
  if (!grid) return;

  const isMobile = window.matchMedia('(max-width: 1199px)').matches;
  const gridCards = cards.filter((card) => card.parentElement === grid);

  if (!isMobile || !gridCards.length) {
    grid.classList.remove('is-carousel-hinting');
    carouselEdgeHint?.classList.remove('is-visible');
    carouselEdgeHint?.classList.remove('is-second-hint');
    cards.forEach((card) => {
      card.classList.remove('is-carousel-current', 'is-carousel-previous', 'is-carousel-next');
    });
    carouselDots.forEach((dot) => dot.setAttribute('aria-current', 'false'));
    return;
  }

  const gridCenter = grid.scrollLeft + grid.clientWidth / 2;
  const currentIndex = gridCards.reduce((closestIndex, card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const closestCard = gridCards[closestIndex];
    const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;

    return Math.abs(cardCenter - gridCenter) < Math.abs(closestCenter - gridCenter)
      ? index
      : closestIndex;
  }, 0);

  syncCarouselEdgeHintPosition(gridCards[currentIndex]);

  if (carouselSectionHasEntered) {
    syncCarouselHint(currentIndex, gridCards);
  }

  cards.forEach((card) => {
    const index = gridCards.indexOf(card);
    card.classList.toggle('is-carousel-current', index === currentIndex);
    card.classList.toggle('is-carousel-previous', index === currentIndex - 1);
    card.classList.toggle('is-carousel-next', index === currentIndex + 1);
  });

  carouselDots.forEach((dot, index) => {
    dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
  });
};

const syncCarouselEdgeHintPosition = (activeCardForHint) => {
  if (!grid || !carouselEdgeHint) return;

  const section = grid.closest('.test-section');
  const targetRect = (activeCardForHint || grid).getBoundingClientRect();
  const sectionRect = section?.getBoundingClientRect();

  if (!sectionRect) return;

  carouselEdgeHint.style.top = `${targetRect.top + targetRect.height / 2 - sectionRect.top - 10}px`;
};

let mobileCarouselRaf = 0;
let carouselSectionHasEntered = false;
let activeCarouselHintIndex = null;
const carouselHintsShown = new Set();

const scheduleMobileCarouselSync = () => {
  if (mobileCarouselRaf) return;

  mobileCarouselRaf = window.requestAnimationFrame(() => {
    mobileCarouselRaf = 0;
    syncMobileCarousel();
  });
};

const syncCarouselHint = (currentIndex, gridCards) => {
  if (!grid || !gridCards[currentIndex + 1]) {
    grid.classList.remove('is-carousel-hinting');
    carouselEdgeHint?.classList.remove('is-visible');
    carouselEdgeHint?.classList.remove('is-second-hint');
    activeCarouselHintIndex = null;
    return;
  }

  if (carouselHintsShown.has(currentIndex)) {
    if (activeCarouselHintIndex !== currentIndex) {
      grid.classList.remove('is-carousel-hinting');
      carouselEdgeHint?.classList.remove('is-visible');
      carouselEdgeHint?.classList.remove('is-second-hint');
      activeCarouselHintIndex = null;
    }
    return;
  }

  carouselHintsShown.add(currentIndex);
  activeCarouselHintIndex = currentIndex;
  grid.classList.remove('is-carousel-hinting');
  carouselEdgeHint?.classList.remove('is-visible');
  carouselEdgeHint?.classList.toggle('is-second-hint', currentIndex === 1);
  window.requestAnimationFrame(() => {
    if (activeCarouselHintIndex === currentIndex) {
      carouselEdgeHint?.classList.add('is-visible');
    }
  });
};

const syncMobileBookingAction = () => {
  if (!activeCard || !modalLayer) return;

  const actions =
    activeCard.querySelector('.experience-actions') ||
    mobileBookingOrigins.get(activeCard)?.actions;
  const isMobile = window.matchMedia('(max-width: 759px)').matches;

  if (!actions) return;

  if (isMobile && actions.parentElement !== modalLayer) {
    mobileBookingOrigins.set(activeCard, {
      parent: actions.parentElement,
      nextSibling: actions.nextSibling,
      actions,
    });
    actions.classList.add('is-mobile-booking');
    modalLayer.appendChild(actions);
  }

  if (isMobile && actions.parentElement === modalLayer) {
    const cardRect = activeCard.getBoundingClientRect();
    actions.style.setProperty('--mobile-booking-top', `${cardRect.bottom + 12}px`);
    return;
  }

  if (!isMobile && actions.parentElement === modalLayer) {
    restoreMobileBookingAction(activeCard);
  }
};

const scheduleCompactLayoutSync = () => {
  window.clearTimeout(compactResizeTimer);
  compactResizeTimer = window.setTimeout(syncCompactLayout, 120);
};

const getFocusableElements = (container) => {
  const focusables = Array.from(container.querySelectorAll(focusableSelector));
  const externalBooking =
    container === activeCard ? modalLayer?.querySelector('.is-mobile-booking') : null;

  if (externalBooking) {
    focusables.push(...externalBooking.querySelectorAll(focusableSelector));
  }

  return [...new Set(focusables)].filter(
    (element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0
  );
};

const clearOpenTimer = () => {
  if (openTimer) {
    window.clearTimeout(openTimer);
    openTimer = null;
  }
};

const setDimmerVisible = (visible) => {
  if (modalLayer) {
    modalLayer.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

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
  const availableHeight = Math.max(0, viewportHeight - margin * 2);
  const minimumHeight = Math.min(180, availableHeight);

  return Math.min(Math.max(height, minimumHeight), availableHeight);
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
    placeholder: null,
    rect: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    },
  });

  const placeholder = document.createElement('div');
  const computedStyle = window.getComputedStyle(card);

  placeholder.className = 'experience-card-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.style.height = `${rect.height}px`;
  placeholder.style.minHeight = `${rect.height}px`;
  placeholder.style.gridColumn = computedStyle.gridColumn;
  placeholder.style.gridRow = computedStyle.gridRow;
  placeholder.style.borderRadius = computedStyle.borderRadius;
  placeholder.style.transition = 'height 320ms var(--ease)';

  card.before(placeholder);
  cardOrigins.get(card).placeholder = placeholder;
  applyModalGeometry(card, rect);
  modalLayer.appendChild(card);
  card.classList.add('is-modal');
};

const reflowActiveCard = () => {
  if (!activeCard || activeCard.parentElement !== modalLayer) return;

  const origin = cardOrigins.get(activeCard);

  if (!origin?.rect) return;

  const placeholderRect = origin.placeholder?.getBoundingClientRect();

  if (placeholderRect) {
    origin.rect = {
      ...origin.rect,
      top: placeholderRect.top,
      left: placeholderRect.left,
      right: placeholderRect.right,
      width: placeholderRect.width,
    };
  }

  applyModalGeometry(activeCard, origin.rect);
};

const restoreCardFromModal = (card) => {
  const origin = cardOrigins.get(card);

  if (!origin?.parent) return;

  if (origin.placeholder?.parentNode === origin.parent) {
    origin.parent.insertBefore(card, origin.placeholder);
    origin.placeholder.remove();
  } else if (origin.nextSibling && origin.nextSibling.parentNode === origin.parent) {
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

const restoreMobileBookingAction = (card) => {
  const origin = mobileBookingOrigins.get(card);
  const actions = card?.querySelector('.experience-actions') || origin?.actions;

  if (!actions || !origin?.parent) return;

  if (origin.nextSibling?.parentNode === origin.parent) {
    origin.parent.insertBefore(actions, origin.nextSibling);
  } else {
    origin.parent.appendChild(actions);
  }

  actions.classList.remove('is-mobile-booking');
  actions.style.removeProperty('--mobile-booking-top');
  mobileBookingOrigins.delete(card);
};

cards.forEach((card, index) => {
  const title = card.querySelector('.experience-copy h2');
  const summary = card.querySelector('.experience-summary');
  const details = card.querySelector('.experience-details');
  const trigger = card.querySelector('[data-card-open]');
  const closeButton = card.querySelector('[data-card-close]');
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

  if (closeButton) {
    closeButton.setAttribute('aria-hidden', 'true');
    closeButton.tabIndex = -1;
  }

  const mainImage = card.querySelector('.experience-image img');
  const thumbnails = card.querySelector('[data-thumbnails]');

  if (mainImage && thumbnails) {
    originalMainImages.set(card, mainImage.currentSrc || mainImage.src);

    const sources = [
      mainImage.currentSrc || mainImage.src,
      ...cards
        .map((candidate) => candidate.querySelector('.experience-image img'))
        .filter(Boolean)
        .map((image) => image.currentSrc || image.src),
    ].slice(0, 4);

    sources.forEach((source, thumbnailIndex) => {
      const button = document.createElement('button');
      const image = document.createElement('img');

      button.className = 'experience-thumb';
      if (thumbnailIndex === 0) {
        button.classList.add('is-active');
      }
      button.type = 'button';
      button.setAttribute('aria-label', `View image ${thumbnailIndex + 1}`);
      image.src = source;
      image.alt = '';
      image.loading = 'lazy';
      button.appendChild(image);
      button.addEventListener('click', () => {
        mainImage.src = source;
        thumbnails.querySelectorAll('.experience-thumb').forEach((thumbnail) => {
          thumbnail.classList.toggle('is-active', thumbnail === button);
        });
      });
      thumbnails.appendChild(button);
    });
  }
});

const syncCardStates = () => {
  cards.forEach((card) => {
    const title = card.querySelector('.experience-copy h2');
    const details = card.querySelector('.experience-details');
    const trigger = card.querySelector('[data-card-open]');
    const closeButton = card.querySelector('[data-card-close]');
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
      trigger.textContent = 'Learn More';
    }

    if (closeButton) {
      closeButton.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      closeButton.tabIndex = isActive ? 0 : -1;
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

const restoreOriginalMainImage = (card) => {
  const mainImage = card?.querySelector('.experience-image img');
  const thumbnails = card?.querySelector('[data-thumbnails]');
  const originalSource = originalMainImages.get(card);

  if (mainImage && originalSource) {
    mainImage.src = originalSource;
  }

  thumbnails?.querySelectorAll('.experience-thumb').forEach((thumbnail, index) => {
    thumbnail.classList.toggle('is-active', index === 0);
  });
};

const closeCard = () => {
  if (!activeCard) return;

  clearOpenTimer();
  setDimmerVisible(false);
  setShellDimmed(false);

  const triggerToRestore = lastTrigger;
  restoreOriginalMainImage(activeCard);
  restoreMobileBookingAction(activeCard);
  restoreCardFromModal(activeCard);
  activeCard = null;
  syncCardStates();
  syncMobileCarousel();
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
    restoreOriginalMainImage(activeCard);
    restoreMobileBookingAction(activeCard);
    restoreCardFromModal(activeCard);
    activeCard.classList.remove('is-expanded');
    activeCard.classList.remove('is-opening');
  }

  moveCardToModal(card);
  activeCard = card;
  syncCompactLayout();
  syncMobileCarousel();
  syncMobileBookingAction();
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
      syncMobileBookingAction();
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
syncMobileCarousel();
window.addEventListener('load', syncMobileCarousel);
window.addEventListener('resize', scheduleViewportMetricsSync);
window.addEventListener('resize', scheduleCompactLayoutSync);
window.addEventListener('orientationchange', () => {
  syncViewportMetrics();
  syncCompactLayout();
  syncMobileCarousel();
  reflowActiveCard();
});

grid?.addEventListener('scroll', scheduleMobileCarouselSync, { passive: true });

carouselDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const index = Number(dot.dataset.carouselDot);
    const targetCard = cards[index];

    if (!targetCard || targetCard.parentElement !== grid) return;

    grid.scrollTo({
      left: targetCard.offsetLeft - (grid.clientWidth - targetCard.offsetWidth) / 2,
      behavior: reduceMotionQuery.matches ? 'auto' : 'smooth',
    });
  });
});

const carouselHintObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries, observer) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            carouselSectionHasEntered = true;
            syncMobileCarousel();
            observer.disconnect();
          }
        },
        { threshold: 0.35 }
      )
    : null;

if (carouselHintObserver && grid) {
  carouselHintObserver.observe(grid);
} else {
  carouselSectionHasEntered = true;
  syncMobileCarousel();
}

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
syncCompactLayout();
