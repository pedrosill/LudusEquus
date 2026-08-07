(function () {
  const defaultLang = 'pt';
  let currentLang = defaultLang;
  const header = document.querySelector('.site-header');
  const desktopMedia = window.matchMedia('(min-width: 980px)');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Keep hero sizing and header offsets in sync with the real viewport.
  const syncViewportMetrics = () => {
    document.documentElement.style.setProperty('--hero-vh', `${window.innerHeight * 0.01}px`);
    if (!header) return;

    const headerHeight = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--site-header-h', `${headerHeight}px`);
  };

  syncViewportMetrics();
  window.addEventListener('orientationchange', () => {
    window.setTimeout(syncViewportMetrics, 150);
  });

  window.addEventListener('resize', () => {
    window.requestAnimationFrame(syncViewportMetrics);
  });

  const syncMenuToggleLabel = () => {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    if (!menuToggle) return;

    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute(
      'aria-label',
      isExpanded
        ? currentLang === 'pt'
          ? 'Fechar menu'
          : 'Close menu'
        : currentLang === 'pt'
          ? 'Abrir menu'
          : 'Open menu'
    );
  };

  // Keep copy, language buttons, and translated labels in sync.
  const setupLanguageSwitcher = () => {
    const applyLanguage = (lang) => {
      currentLang = window.LUDUS_COPY[lang] ? lang : defaultLang;
      document.documentElement.lang = currentLang;

      // Main copy
      document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        const value = window.LUDUS_COPY[currentLang][key];
        if (value) {
          node.textContent = value;
        }
      });

      // Terms page copy
      document.querySelectorAll('[data-i18n-terms]').forEach((node) => {
        const key = node.getAttribute('data-i18n-terms');
        const value = window.LUDUS_COPY[currentLang][key];
        if (value) {
          node.textContent = value;
        }
      });

      document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
        const spec = node.getAttribute('data-i18n-attr');
        if (!spec) return;

        spec.split(';').forEach((entry) => {
          const [attrName, key] = entry.split(':').map((part) => part.trim());
          if (!attrName || !key) return;

          const value = window.LUDUS_COPY[currentLang][key];
          if (value) {
            node.setAttribute(attrName, value);
          }
        });
      });

      // Active language buttons
      document.querySelectorAll('[data-lang-btn], [data-lang-btn-terms]').forEach((button) => {
        const langValue =
          button.getAttribute('data-lang-btn') || button.getAttribute('data-lang-btn-terms');
        button.classList.toggle('is-active', langValue === currentLang);
      });

      // Gallery controls
      const prevLabel =
        currentLang === 'pt' ? 'Deslocar galeria para a esquerda' : 'Scroll gallery left';
      const nextLabel =
        currentLang === 'pt' ? 'Deslocar galeria para a direita' : 'Scroll gallery right';
      document.querySelectorAll('.photo-scroll-prev').forEach((button) => {
        button.setAttribute('aria-label', prevLabel);
      });
      document.querySelectorAll('.photo-scroll-next').forEach((button) => {
        button.setAttribute('aria-label', nextLabel);
      });

      syncMenuToggleLabel();
    };

    document.querySelectorAll('[data-lang-btn], [data-lang-btn-terms]').forEach((button) => {
      button.addEventListener('click', () => {
        const langValue =
          button.getAttribute('data-lang-btn') || button.getAttribute('data-lang-btn-terms');
        applyLanguage(langValue);
      });
    });

    applyLanguage(defaultLang);
  };

  // Keep the homepage landing aligned with the main content on small screens.
  if (document.querySelector('.hero') && !window.location.hash) {
    const landingMedia = window.matchMedia('(max-width: 979px)');
    if (landingMedia.matches) {
      window.requestAnimationFrame(() => {
        const main = document.getElementById('main');
        if (main) {
          main.scrollIntoView({ block: 'start' });
        }
      });
    }
  }

  // Handle the mobile menu, backdrop behavior, and Escape-to-close.
  const setupMobileMenu = () => {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    let mobileMenuHideTimer = null;

    const closeMenu = () => {
      if (!menuToggle || !mobileMenu) return;

      if (mobileMenuHideTimer) {
        window.clearTimeout(mobileMenuHideTimer);
        mobileMenuHideTimer = null;
      }

      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');

      if (header) {
        header.classList.remove('is-hidden');
      }

      mobileMenu.classList.remove('is-open');
      syncMenuToggleLabel();

      if (reduceMotionQuery.matches) {
        mobileMenu.hidden = true;
        return;
      }

      mobileMenuHideTimer = window.setTimeout(() => {
        if (!mobileMenu.classList.contains('is-open')) {
          mobileMenu.hidden = true;
        }
        mobileMenuHideTimer = null;
      }, 240);
    };

    const openMenu = () => {
      if (!menuToggle || !mobileMenu) return;

      if (mobileMenuHideTimer) {
        window.clearTimeout(mobileMenuHideTimer);
        mobileMenuHideTimer = null;
      }

      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.hidden = false;
      document.body.classList.add('menu-open');
      if (header) {
        header.classList.remove('is-hidden');
      }
      menuToggle.setAttribute(
        'aria-label',
        currentLang === 'pt' ? 'Fechar menu' : 'Close menu'
      );

      if (reduceMotionQuery.matches) {
        mobileMenu.classList.add('is-open');
        return;
      }

      window.requestAnimationFrame(() => {
        mobileMenu.classList.add('is-open');
      });
    };

    if (!menuToggle || !mobileMenu) return;

    syncMenuToggleLabel();

    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (menuToggle.getAttribute('aria-expanded') !== 'true') return;

      const clickedInsideMenu = mobileMenu.contains(event.target);
      const clickedToggle = menuToggle.contains(event.target);

      if (!clickedInsideMenu && !clickedToggle) {
        closeMenu();
      }
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    desktopMedia.addEventListener('change', (event) => {
      if (event.matches) {
        closeMenu();
      }
    });
  };

  setupLanguageSwitcher();
  setupMobileMenu();

  // ==========================
  // Contact copy actions
  // ==========================
  const setupCopyActions = () => {
  const copyButtons = document.querySelectorAll('[data-copy-text]');
  const copyStatus = document.querySelector('.cta-copy-status');
  let copyStatusTimer = null;

  const setCopyStatus = (message) => {
    if (!copyStatus) return;

    copyStatus.textContent = message;
    copyStatus.classList.add('is-visible');

    if (copyStatusTimer) {
      window.clearTimeout(copyStatusTimer);
    }

    copyStatusTimer = window.setTimeout(() => {
      copyStatus.textContent = '';
      copyStatus.classList.remove('is-visible');
    }, 1800);
  };

  const copyToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const tempInput = document.createElement('textarea');
    tempInput.value = value;
    tempInput.setAttribute('readonly', '');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(tempInput);
    return successful;
  };

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy-text');
      if (!value) return;

      try {
        const copied = await copyToClipboard(value);
        if (copied) {
          setCopyStatus(currentLang === 'pt' ? 'Copiado para a área de transferência.' : 'Copied to clipboard.');
        } else {
          setCopyStatus(currentLang === 'pt' ? 'Não foi possível copiar.' : 'Could not copy.');
        }
      } catch (_error) {
        setCopyStatus(currentLang === 'pt' ? 'Não foi possível copiar.' : 'Could not copy.');
      }
    });
  });
  };

  setupCopyActions();

  // ==========================
  // Who modal
  // ==========================
  const setupWhoModal = () => {
    const whoModal = document.querySelector('[data-who-modal]');
    if (!whoModal) return;

    const whoModalOpeners = document.querySelectorAll('[data-who-modal-open]');
    const whoModalClosers = whoModal.querySelectorAll('[data-who-modal-close]');
    const whoModalCard = whoModal.querySelector('.who-modal-card');
    let whoModalHideTimer = null;
    let lastWhoModalTrigger = null;

    const closeWhoModal = () => {
      if (whoModalHideTimer) {
        window.clearTimeout(whoModalHideTimer);
        whoModalHideTimer = null;
      }

      whoModal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      whoModal.setAttribute('aria-hidden', 'true');

      const returnFocus = lastWhoModalTrigger;
      lastWhoModalTrigger = null;

      if (reduceMotionQuery.matches) {
        whoModal.hidden = true;
        if (returnFocus && typeof returnFocus.focus === 'function') {
          returnFocus.focus();
        }
        return;
      }

      whoModalHideTimer = window.setTimeout(() => {
        if (!whoModal.classList.contains('is-open')) {
          whoModal.hidden = true;
        }

        if (returnFocus && typeof returnFocus.focus === 'function') {
          returnFocus.focus();
        }

        whoModalHideTimer = null;
      }, 240);
    };

    const openWhoModal = (trigger) => {
      if (whoModalHideTimer) {
        window.clearTimeout(whoModalHideTimer);
        whoModalHideTimer = null;
      }

      lastWhoModalTrigger = trigger || null;
      whoModal.hidden = false;
      whoModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      if (reduceMotionQuery.matches) {
        whoModal.classList.add('is-open');
        if (whoModalCard && typeof whoModalCard.focus === 'function') {
          whoModalCard.focus();
        }
        return;
      }

      window.requestAnimationFrame(() => {
        whoModal.classList.add('is-open');
        const closeButton = whoModal.querySelector('.who-modal-close');
        if (closeButton && typeof closeButton.focus === 'function') {
          closeButton.focus();
        } else if (whoModalCard && typeof whoModalCard.focus === 'function') {
          whoModalCard.focus();
        }
      });
    };

    whoModalOpeners.forEach((button) => {
      button.addEventListener('click', () => openWhoModal(button));
    });

    whoModalClosers.forEach((button) => {
      button.addEventListener('click', closeWhoModal);
    });

    if (whoModalCard) {
      whoModalCard.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && whoModal.classList.contains('is-open')) {
        closeWhoModal();
      }
    });
  };

  setupWhoModal();

  // ==========================
  // Important info accordion
  // ==========================
  const setupInfoAccordion = () => {
    const infoAccordionItems = document.querySelectorAll('.term-accordion');
    const accordionTimers = new WeakMap();
    const accordionMotionMs = 240;

    const syncAccordionState = (item) => {
      const trigger = item.querySelector('.term-accordion-trigger');
      if (trigger) {
        trigger.setAttribute(
          'aria-expanded',
          item.open && !item.classList.contains('is-closing') ? 'true' : 'false'
        );
      }
    };

    const closeAccordion = (item) => {
      if (!item.open || item.classList.contains('is-closing')) return;

      const timerId = accordionTimers.get(item);
      if (timerId) {
        window.clearTimeout(timerId);
        accordionTimers.delete(item);
      }

      if (reduceMotionQuery.matches) {
        item.open = false;
        item.classList.remove('is-closing');
        syncAccordionState(item);
        return;
      }

      item.classList.add('is-closing');
      syncAccordionState(item);

      const closingTimer = window.setTimeout(() => {
        item.open = false;
        item.classList.remove('is-closing');
        syncAccordionState(item);
        accordionTimers.delete(item);
      }, accordionMotionMs);

      accordionTimers.set(item, closingTimer);
    };

    const openAccordion = (item) => {
      if (item.open && !item.classList.contains('is-closing')) return;

      const timerId = accordionTimers.get(item);
      if (timerId) {
        window.clearTimeout(timerId);
        accordionTimers.delete(item);
      }

      item.open = true;
      item.classList.remove('is-closing');
      syncAccordionState(item);

      if (reduceMotionQuery.matches) return;

      window.requestAnimationFrame(() => {
        syncAccordionState(item);
      });
    };

    infoAccordionItems.forEach((item) => {
      syncAccordionState(item);

      const trigger = item.querySelector('.term-accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', (event) => {
        event.preventDefault();

        const isOpen = item.open && !item.classList.contains('is-closing');

        if (isOpen) {
          closeAccordion(item);
          return;
        }

        infoAccordionItems.forEach((otherItem) => {
          if (otherItem !== item && otherItem.open) {
            closeAccordion(otherItem);
          }
        });

        openAccordion(item);
      });
    });
  };

  setupInfoAccordion();

  // ==========================
  // Experience cards
  // ==========================
  const setupExperienceCards = () => {
    const experiencesRoot = document.querySelector('[data-experiences-root]');
    if (!experiencesRoot) return;

    const grid = experiencesRoot.querySelector('[data-experience-grid]');
    const dimmer = experiencesRoot.querySelector('[data-card-dimmer]');
    const modalLayer = experiencesRoot.querySelector('[data-card-modal-layer]');
    const carouselDots = Array.from(experiencesRoot.querySelectorAll('[data-carousel-dot]'));
    const carouselEdgeHint = experiencesRoot.querySelector('[data-carousel-edge-hint]');
    const cards = Array.from(experiencesRoot.querySelectorAll('[data-experience-card]'));

    if (!grid || !modalLayer || !cards.length) return;

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const originalMainImages = new WeakMap();
    const cardOrigins = new Map();
    const mobileBookingOrigins = new Map();
    const carouselHintsShown = new Set();

    let activeCard = null;
    let lastTrigger = null;
    let viewportTimer = null;
    let viewportFrame = 0;
    let carouselFrame = 0;
    let carouselSectionHasEntered = false;
    let activeCarouselHintIndex = null;

    const isCompactCarousel = () => window.matchMedia('(max-width: 1199px)').matches;
    const isMobileBooking = () => window.matchMedia('(max-width: 759px)').matches;

    const getViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      return Math.max(1, Math.round(viewportHeight));
    };

    const getGridCards = () => cards.filter((card) => card.parentElement === grid);

    const getFocusableElements = () => {
      if (!activeCard) return [];

      const focusables = Array.from(activeCard.querySelectorAll(focusableSelector));
      const externalBooking = modalLayer.querySelector('.experience-actions.is-mobile-booking');

      if (externalBooking) {
        focusables.push(...externalBooking.querySelectorAll(focusableSelector));
      }

      return [...new Set(focusables)].filter(
        (element) =>
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0
      );
    };

    const isFocusWithinCardModal = (element) => {
      if (!activeCard || !element) return false;
      if (activeCard.contains(element)) return true;

      const externalBooking = modalLayer.querySelector('.experience-actions.is-mobile-booking');
      return Boolean(externalBooking?.contains(element));
    };

    const syncCompactLayout = () => {
      const compact = getViewportHeight() < 760;
      cards.forEach((card) => {
        card.classList.toggle('compact-layout', card === activeCard && compact);
      });
    };

    const syncCarouselEdgeHintPosition = (activeCardForHint) => {
      if (!carouselEdgeHint || !activeCardForHint) return;

      const sectionRect = experiencesRoot.getBoundingClientRect();
      const cardRect = activeCardForHint.getBoundingClientRect();
      const markerTop = cardRect.top + cardRect.height / 2 - sectionRect.top - 10;

      carouselEdgeHint.style.top = `${Math.max(0, markerTop)}px`;
    };

    const clearCarouselHint = () => {
      activeCarouselHintIndex = null;
      grid.classList.remove('is-carousel-hinting');
      carouselEdgeHint?.classList.remove('is-visible', 'is-second-hint');
    };

    const syncCarouselHint = (currentIndex, gridCards) => {
      if (!gridCards[currentIndex + 1]) {
        clearCarouselHint();
        return;
      }

      if (carouselHintsShown.has(currentIndex)) {
        if (activeCarouselHintIndex !== currentIndex) {
          clearCarouselHint();
        }
        return;
      }

      carouselHintsShown.add(currentIndex);
      activeCarouselHintIndex = currentIndex;
      grid.classList.remove('is-carousel-hinting');
      carouselEdgeHint?.classList.remove('is-visible', 'is-second-hint');
      carouselEdgeHint?.classList.toggle('is-second-hint', currentIndex === 1);

      window.requestAnimationFrame(() => {
        if (activeCarouselHintIndex !== currentIndex) return;

        grid.classList.add('is-carousel-hinting');
        carouselEdgeHint?.classList.add('is-visible');
      });
    };

    const syncMobileCarousel = () => {
      if (activeCard) return;

      const gridCards = getGridCards();
      if (!isCompactCarousel() || !gridCards.length) {
        clearCarouselHint();
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

      const currentCard = gridCards[currentIndex];
      syncCarouselEdgeHintPosition(currentCard);

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

    const scheduleMobileCarouselSync = () => {
      if (carouselFrame) return;

      carouselFrame = window.requestAnimationFrame(() => {
        carouselFrame = 0;
        syncMobileCarousel();
      });
    };

    const syncMobileBookingAction = () => {
      if (!activeCard) return;

      const existingOrigin = mobileBookingOrigins.get(activeCard);
      const actions = activeCard.querySelector('.experience-actions') || existingOrigin?.actions;

      if (!actions) return;

      if (isMobileBooking()) {
        if (actions.parentElement !== modalLayer) {
          mobileBookingOrigins.set(activeCard, {
            parent: actions.parentElement,
            nextSibling: actions.nextSibling,
            actions,
          });
          actions.classList.add('is-mobile-booking');
          modalLayer.appendChild(actions);
        }

        activeCard.classList.add('is-mobile-booking-layout');
        const cardRect = activeCard.getBoundingClientRect();
        const actionHeight = actions.getBoundingClientRect().height || actions.offsetHeight;
        const viewportHeight = getViewportHeight();
        const gap = 12;
        const safeSpace = 16;
        const groupHeight = cardRect.height + gap + actionHeight;
        const centeredTop = (viewportHeight - groupHeight) / 2;
        const maximumTop = viewportHeight - groupHeight - safeSpace;
        const groupTop = Math.max(safeSpace, Math.min(centeredTop, maximumTop));

        activeCard.style.setProperty('--experience-mobile-card-top', `${groupTop}px`);
        actions.style.setProperty(
          '--mobile-booking-top',
          `${groupTop + cardRect.height + gap}px`
        );
        return;
      }

      if (actions.parentElement === modalLayer) {
        restoreMobileBookingAction(activeCard);
      }
    };

    const scheduleExperienceViewportSync = () => {
      window.clearTimeout(viewportTimer);
      viewportTimer = window.setTimeout(() => {
        if (viewportFrame) return;

        viewportFrame = window.requestAnimationFrame(() => {
          viewportFrame = 0;
          experiencesRoot.style.setProperty('--experience-vh', `${getViewportHeight() * 0.01}px`);
          syncCompactLayout();
          syncMobileCarousel();
          syncMobileBookingAction();
        });
      }, 100);
    };

    const setModalVisibility = (visible) => {
      modalLayer.setAttribute('aria-hidden', visible ? 'false' : 'true');

      if (dimmer) {
        dimmer.hidden = !visible;
        dimmer.classList.toggle('is-visible', visible);
        dimmer.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }

      document.body.classList.toggle('modal-open', visible);
    };

    const restoreMobileBookingAction = (card) => {
      const origin = mobileBookingOrigins.get(card);
      const actions = card?.querySelector('.experience-actions') || origin?.actions;

      if (!origin || !actions) {
        card?.classList.remove('is-mobile-booking-layout');
        card?.style.removeProperty('--experience-mobile-card-top');
        return;
      }

      if (origin.nextSibling?.parentNode === origin.parent) {
        origin.parent.insertBefore(actions, origin.nextSibling);
      } else {
        origin.parent.appendChild(actions);
      }

      actions.classList.remove('is-mobile-booking');
      actions.style.removeProperty('--mobile-booking-top');
      card.classList.remove('is-mobile-booking-layout');
      card.style.removeProperty('--experience-mobile-card-top');
      mobileBookingOrigins.delete(card);
    };

    const moveCardToModal = (card) => {
      if (card.parentElement === modalLayer) return;

      const rect = card.getBoundingClientRect();
      const originParent = card.parentElement;
      const computedStyle = window.getComputedStyle(card);
      const placeholder = document.createElement('div');

      placeholder.className = 'experience-card-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.height = `${rect.height}px`;
      placeholder.style.minHeight = `${rect.height}px`;
      placeholder.style.borderRadius = computedStyle.borderRadius;
      placeholder.style.transition = 'height 320ms var(--ease-premium)';

      cardOrigins.set(card, {
        parent: originParent,
        nextSibling: card.nextSibling,
        placeholder,
        rect,
      });

      card.before(placeholder);
      modalLayer.appendChild(card);
      card.classList.add('is-modal');
    };

    const restoreCardFromModal = (card) => {
      const origin = cardOrigins.get(card);
      if (!origin?.parent) return;

      if (origin.placeholder?.parentNode === origin.parent) {
        origin.parent.insertBefore(card, origin.placeholder);
        origin.placeholder.remove();
      } else if (origin.nextSibling?.parentNode === origin.parent) {
        origin.parent.insertBefore(card, origin.nextSibling);
      } else {
        origin.parent.appendChild(card);
      }

      card.classList.remove('is-modal', 'is-expand-left', 'is-expanded', 'compact-layout');
      cardOrigins.delete(card);
    };

    const restoreOriginalMainImage = (card) => {
      const mainImage = card?.querySelector('.experience-image img');
      const thumbnails = card?.querySelector('[data-thumbnails]');
      const original = originalMainImages.get(card);

      if (mainImage && original) {
        ['src', 'srcset', 'sizes', 'alt'].forEach((attribute) => {
          const value = original[attribute];
          if (value === null || value === undefined) {
            mainImage.removeAttribute(attribute);
          } else {
            mainImage.setAttribute(attribute, value);
          }
        });
      }

      thumbnails?.querySelectorAll('.experience-thumb').forEach((thumbnail, index) => {
        thumbnail.classList.toggle('is-active', index === 0);
        thumbnail.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      });
    };

    const syncThumbnailLabels = () => {
      cards.forEach((card) => {
        const thumbnails = card.querySelector('[data-thumbnails]');
        if (!thumbnails) return;

        const label =
          thumbnails.getAttribute('aria-label') ||
          card.querySelector('[data-card-title]')?.textContent.trim() ||
          '';

        thumbnails.querySelectorAll('.experience-thumb').forEach((thumbnail, index) => {
          thumbnail.setAttribute('aria-label', `${label} ${index + 1}`.trim());
        });
      });
    };

    const setupThumbnails = (card) => {
      const mainImage = card.querySelector('.experience-image img');
      const thumbnails = card.querySelector('[data-thumbnails]');
      if (!mainImage || !thumbnails) return;

      originalMainImages.set(card, {
        src: mainImage.getAttribute('src'),
        srcset: mainImage.getAttribute('srcset'),
        sizes: mainImage.getAttribute('sizes'),
        alt: mainImage.getAttribute('alt'),
      });

      const sourceMap = new Map();
      cards.forEach((candidate) => {
        const image = candidate.querySelector('.experience-image img');
        const source = image?.getAttribute('src') || image?.currentSrc;
        if (!source || sourceMap.has(source)) return;

        sourceMap.set(source, {
          src: source,
          image,
        });
      });

      thumbnails.replaceChildren();
      Array.from(sourceMap.values()).forEach((source, index) => {
        const button = document.createElement('button');
        const image = document.createElement('img');

        button.className = 'experience-thumb';
        button.type = 'button';
        button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        button.addEventListener('click', () => {
          mainImage.removeAttribute('srcset');
          mainImage.removeAttribute('sizes');
          mainImage.setAttribute('src', source.src);
          const sourceAlt = source.image?.getAttribute('alt') || '';
          if (sourceAlt) mainImage.setAttribute('alt', sourceAlt);

          thumbnails.querySelectorAll('.experience-thumb').forEach((thumbnail) => {
            const isActive = thumbnail === button;
            thumbnail.classList.toggle('is-active', isActive);
            thumbnail.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
        });

        image.src = source.src;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        button.appendChild(image);
        thumbnails.appendChild(button);
      });

      syncThumbnailLabels();
    };

    const syncCardStates = () => {
      cards.forEach((card, index) => {
        const title = card.querySelector('[data-card-title]');
        const details = card.querySelector('[data-card-details]');
        const trigger = card.querySelector('[data-card-open]');
        const closeButton = card.querySelector('[data-card-close]');
        const isActive = card === activeCard;
        const baseId = `experience-card-${index + 1}`;

        if (title && !title.id) title.id = `${baseId}-title`;
        if (details && !details.id) details.id = `${baseId}-details`;

        card.classList.toggle('is-expanded', isActive);
        card.classList.toggle('is-modal', isActive);

        if (isActive) {
          card.setAttribute('role', 'dialog');
          card.setAttribute('aria-modal', 'true');
          card.setAttribute('tabindex', '-1');
          if (title?.id) card.setAttribute('aria-labelledby', title.id);
          if (details?.id) card.setAttribute('aria-describedby', details.id);
        } else {
          card.removeAttribute('role');
          card.removeAttribute('aria-modal');
          card.removeAttribute('tabindex');
          card.removeAttribute('aria-labelledby');
          card.removeAttribute('aria-describedby');
        }

        details?.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        trigger?.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        closeButton?.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        if (closeButton) closeButton.tabIndex = isActive ? 0 : -1;
      });

      modalLayer.setAttribute('aria-hidden', activeCard ? 'false' : 'true');
    };

    const focusActiveCard = () => {
      if (!activeCard) return;

      const target = activeCard.querySelector('[data-card-close]') || getFocusableElements()[0] || activeCard;
      target.focus({ preventScroll: true });
    };

    const clearOpenState = ({ restoreFocus = true } = {}) => {
      if (!activeCard) return;

      const card = activeCard;
      const trigger = lastTrigger;

      setModalVisibility(false);
      restoreOriginalMainImage(card);
      restoreMobileBookingAction(card);
      restoreCardFromModal(card);
      activeCard = null;
      lastTrigger = null;
      syncCardStates();
      syncMobileCarousel();

      if (restoreFocus && trigger && typeof trigger.focus === 'function') {
        trigger.focus({ preventScroll: true });
      }
    };

    const openCard = (card, trigger) => {
      if (!card) return;
      if (activeCard && activeCard !== card) clearOpenState({ restoreFocus: false });

      lastTrigger = trigger || null;
      moveCardToModal(card);
      activeCard = card;
      syncCardStates();
      setModalVisibility(true);
      syncCompactLayout();
      syncMobileBookingAction();

      if (reduceMotionQuery.matches) {
        focusActiveCard();
        return;
      }

      window.requestAnimationFrame(() => {
        syncMobileBookingAction();
        focusActiveCard();
      });
    };

    cards.forEach((card) => {
      setupThumbnails(card);

      const trigger = card.querySelector('[data-card-open]');
      const closeButton = card.querySelector('[data-card-close]');

      trigger?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCard(card, trigger);
      });

      closeButton?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearOpenState();
      });
    });

    dimmer?.addEventListener('click', clearOpenState);

    document.addEventListener('keydown', (event) => {
      if (!activeCard) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        clearOpenState();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements();
      if (!focusables.length) {
        event.preventDefault();
        activeCard.focus({ preventScroll: true });
        return;
      }

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];
      const currentFocus = document.activeElement;

      if (event.shiftKey) {
        if (!isFocusWithinCardModal(currentFocus) || currentFocus === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus({ preventScroll: true });
        }
      } else if (!isFocusWithinCardModal(currentFocus) || currentFocus === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus({ preventScroll: true });
      }
    });

    grid.addEventListener('scroll', scheduleMobileCarouselSync, { passive: true });

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

    if (carouselHintObserver) {
      carouselHintObserver.observe(grid);
    } else {
      carouselSectionHasEntered = true;
    }

    const thumbnailLabelObserver =
      'MutationObserver' in window
        ? new MutationObserver((records) => {
            if (records.some((record) => record.target.hasAttribute('data-thumbnails'))) {
              syncThumbnailLabels();
            }
          })
        : null;

    thumbnailLabelObserver?.observe(experiencesRoot, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });

    const visualViewport = window.visualViewport;
    window.addEventListener('resize', scheduleExperienceViewportSync);
    window.addEventListener('orientationchange', () => {
      window.setTimeout(scheduleExperienceViewportSync, 150);
    });
    visualViewport?.addEventListener('resize', scheduleExperienceViewportSync);
    visualViewport?.addEventListener('scroll', scheduleExperienceViewportSync);
    window.addEventListener('load', scheduleExperienceViewportSync, { once: true });

    experiencesRoot.style.setProperty('--experience-vh', `${getViewportHeight() * 0.01}px`);
    syncCardStates();
    syncCompactLayout();
    syncMobileCarousel();
  };

  setupExperienceCards();

  // Header hide/show on scroll (mobile only)
  let lastScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      if (!header || document.body.classList.contains('menu-open') || desktopMedia.matches) {
        return;
      }

      header.classList.remove('is-hidden');
      lastScrollY = window.scrollY;
    },
    { passive: true }
  );

  // ==========================
  // Reveal on scroll
  // ==========================
  const setupScrollReveal = () => {
  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.16 }
        )
      : null;

  document.querySelectorAll('.reveal').forEach((element) => {
    if (observer) {
      observer.observe(element);
    } else {
      element.classList.add('is-visible');
    }
  });
  };

  setupScrollReveal();

  // ==========================
  // BEGIN: Featured draggable gallery
  // ==========================
  const setupFeatureGalleryDrag = () => {
    const featureGalleryTrack = document.querySelector('[data-feature-gallery-track]');
    if (!featureGalleryTrack) return;

    const featureGalleryImages = Array.from(featureGalleryTrack.getElementsByTagName('img'));
    let featureGalleryPointerType = 'mouse';

    const handlePointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      featureGalleryPointerType = event.pointerType || 'mouse';
      featureGalleryTrack.dataset.mouseDownAt = String(event.clientX);
      featureGalleryTrack.classList.add('is-dragging');
      featureGalleryTrack.setPointerCapture(event.pointerId);
    };

    const handlePointerUp = () => {
      featureGalleryTrack.dataset.mouseDownAt = '0';
      featureGalleryTrack.dataset.prevPercentage = featureGalleryTrack.dataset.percentage ?? '0';
      featureGalleryTrack.classList.remove('is-dragging');
    };

    const handlePointerMove = (event) => {
      if (featureGalleryTrack.dataset.mouseDownAt === '0') return;

      const mouseDelta = parseFloat(featureGalleryTrack.dataset.mouseDownAt || '0') - event.clientX;
      const dragScale =
        featureGalleryPointerType === 'touch'
          ? 2.75
          : featureGalleryPointerType === 'pen'
            ? 2.1
            : 1.5;
      const maxDelta = window.innerWidth * dragScale;
      const percentage = (mouseDelta / maxDelta) * -100;
      const nextPercentageUnconstrained =
        parseFloat(featureGalleryTrack.dataset.prevPercentage || '0') + percentage;
      const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

      featureGalleryTrack.dataset.percentage = String(nextPercentage);

      featureGalleryTrack.animate(
        {
          transform: `translate(${nextPercentage}%, -50%)`,
        },
        { duration: 1200, fill: 'forwards' }
      );

      for (const image of featureGalleryImages) {
        image.animate(
          {
            objectPosition: `${100 + nextPercentage}% `,
          },
          { duration: 1200, fill: 'forwards' }
        );
      }
    };

    featureGalleryTrack.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
  };

  setupFeatureGalleryDrag();
  // ==========================
  // END: Featured draggable gallery
  // ==========================

})();
