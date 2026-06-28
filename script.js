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

  // ==========================
  // Menu + header behavior
  // ==========================
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const desktopMedia = window.matchMedia('(min-width: 980px)');

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute(
      'aria-label',
      currentLang === 'pt' ? 'Abrir menu' : 'Open menu'
    );
    mobileMenu.hidden = true;
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute(
      'aria-label',
      currentLang === 'pt' ? 'Fechar menu' : 'Close menu'
    );
    mobileMenu.hidden = false;
    document.body.classList.add('menu-open');

    if (header) {
      header.classList.remove('is-hidden');
    }
  };

  if (menuToggle && mobileMenu) {
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

  // Header hide/show on scroll (mobile only)
  let lastScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      if (!header || document.body.classList.contains('menu-open') || desktopMedia.matches) {
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 16) {
        header.classList.remove('is-hidden');
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > 96 && currentScrollY > lastScrollY + 6) {
        header.classList.add('is-hidden');
      } else if (currentScrollY < lastScrollY - 6) {
        header.classList.remove('is-hidden');
      }

      lastScrollY = currentScrollY;
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
