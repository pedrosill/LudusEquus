(function () {
  const defaultLang = 'pt';
  let currentLang = defaultLang;

  // ==========================
  // Language handling
  // ==========================
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

    // Active language buttons
    document.querySelectorAll('[data-lang-btn], [data-lang-btn-terms]').forEach((button) => {
      const langValue =
        button.getAttribute('data-lang-btn') || button.getAttribute('data-lang-btn-terms');
      button.classList.toggle('is-active', langValue === currentLang);
    });

    // Gallery controls
    const prevLabel = currentLang === 'pt' ? 'Deslocar galeria para a esquerda' : 'Scroll gallery left';
    const nextLabel = currentLang === 'pt' ? 'Deslocar galeria para a direita' : 'Scroll gallery right';
    document.querySelectorAll('.photo-scroll-prev').forEach((button) => {
      button.setAttribute('aria-label', prevLabel);
    });
    document.querySelectorAll('.photo-scroll-next').forEach((button) => {
      button.setAttribute('aria-label', nextLabel);
    });

    syncMenuToggleLabel();
  };

  document
    .querySelectorAll('[data-lang-btn], [data-lang-btn-terms]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const langValue =
          button.getAttribute('data-lang-btn') || button.getAttribute('data-lang-btn-terms');
        applyLanguage(langValue);
      });
    });

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

  // ==========================
  // Menu + header behavior
  // ==========================
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const desktopMedia = window.matchMedia('(min-width: 980px)');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let mobileMenuHideTimer = null;

  const syncMenuToggleLabel = () => {
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

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;

    if (mobileMenuHideTimer) {
      window.clearTimeout(mobileMenuHideTimer);
      mobileMenuHideTimer = null;
    }

    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');

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
    menuToggle.setAttribute(
      'aria-label',
      currentLang === 'pt' ? 'Fechar menu' : 'Close menu'
    );

    if (reduceMotionQuery.matches) {
      mobileMenu.classList.add('is-open');
      return;
    }

    if (header) {
      header.classList.remove('is-hidden');
    }

    window.requestAnimationFrame(() => {
      mobileMenu.classList.add('is-open');
    });
  };

  if (menuToggle && mobileMenu) {
    syncMenuToggleLabel();

    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
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
  }

  // ==========================
  // Contact copy actions
  // ==========================
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

  // ==========================
  // Important info accordion
  // ==========================
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

  // ==========================
  // Gallery scroll controls
  // ==========================
  const photoGrid = document.getElementById('photo-grid');
  const prevBtn = document.querySelector('.photo-scroll-prev');
  const nextBtn = document.querySelector('.photo-scroll-next');

  if (photoGrid && prevBtn && nextBtn) {
    const scrollAmount = 260; // roughly one card

    const scrollGrid = (delta) => {
      photoGrid.scrollBy({ left: delta, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => scrollGrid(-scrollAmount));
    nextBtn.addEventListener('click', () => scrollGrid(scrollAmount));
  }

  // Initial language
  applyLanguage(defaultLang);
})();
