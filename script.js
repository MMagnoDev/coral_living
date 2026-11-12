/* ==========================================================================
   SERENIQUE — LENIS SMOOTH SCROLL, PARALLAX & INTERACTIVE RITUALS
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ------------------------------------------------------------------------
     1. LENIS SMOOTH SCROLL INITIALIZATION
     ------------------------------------------------------------------------ */
  let lenis = null;

  if (typeof window.Lenis === 'function' && !prefersReducedMotion) {
    lenis = new window.Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.4,
    });
  }

  /* ------------------------------------------------------------------------
     2. HERO ENTRANCE REVEAL
     ------------------------------------------------------------------------ */
  const heroLines = document.querySelectorAll('[data-hero-line]');
  const heroAside = document.querySelector('[data-hero-aside]');

  window.requestAnimationFrame(() => {
    heroLines.forEach((line, idx) => {
      line.style.transitionDelay = `${0.14 + idx * 0.14}s`;
      line.classList.add('is-visible');
    });
    if (heroAside) {
      heroAside.classList.add('is-visible');
    }
  });

  /* ------------------------------------------------------------------------
     3. SCROLL PROGRESS BAR, HEADER STATE & PARALLAX LOOP
     ------------------------------------------------------------------------ */
  const progressBar = document.getElementById('scrollProgressBar');
  const siteHeader = document.getElementById('siteHeader');
  const heroSection = document.querySelector('.hero, .subpage-hero');
  const parallaxLayers = Array.from(document.querySelectorAll('[data-parallax]'));
  const parallaxBoxes = Array.from(document.querySelectorAll('[data-parallax-box]'));

  function updateScrollEffects() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar
    if (progressBar && maxScroll > 0) {
      const ratio = Math.min(1, Math.max(0, scrollY / maxScroll));
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    // Header surface transition once past hero fold
    if (siteHeader && heroSection) {
      const heroThreshold = heroSection.offsetHeight * 0.78;
      siteHeader.classList.toggle('is-scrolled', scrollY > heroThreshold);
    }

    if (prefersReducedMotion) return;

    const vh = window.innerHeight;

    // Full-bleed background parallax (Hero + Mid-Page Banner)
    for (const el of parallaxLayers) {
      const speed = parseFloat(el.dataset.parallax || '0');
      const parent = el.parentElement;
      if (!parent) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > vh + 120) continue;
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const translateY = centerOffset * speed;
      el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    }

    // Subtle editorial card depth parallax (Section 2 staggered images)
    if (window.innerWidth > 768) {
      for (const box of parallaxBoxes) {
        const speed = parseFloat(box.dataset.parallaxBox || '0');
        const rect = box.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) continue;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const shift = progress * speed * 140;
        box.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      }
    }
  }

  function raf(time) {
    if (lenis) {
      lenis.raf(time);
    }
    updateScrollEffects();
    window.requestAnimationFrame(raf);
  }
  window.requestAnimationFrame(raf);

  /* ------------------------------------------------------------------------
     4. INTERSECTION OBSERVER — REVEALS & METRIC COUNTERS
     ------------------------------------------------------------------------ */
  const revealItems = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          const delay = parseInt(target.dataset.delay || '0', 10);

          if (delay > 0) {
            target.style.transitionDelay = `${delay}ms`;
          }

          target.classList.add('is-revealed');
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -6% 0px',
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }

  // Animated Stat Counters (94%, 97%)
  const countUpEls = document.querySelectorAll('.count-up');

  function animateCounter(el) {
    const targetValue = parseInt(el.dataset.target || '0', 10);
    if (prefersReducedMotion || !targetValue) {
      el.textContent = String(targetValue);
      return;
    }

    const duration = 1250;
    const startTime = performance.now();

    function step(now) {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = String(Math.round(eased * targetValue));
      if (elapsed < 1) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && countUpEls.length) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    countUpEls.forEach((el) => counterObserver.observe(el));
  }

  /* ------------------------------------------------------------------------
     5. SMOOTH ANCHOR NAVIGATION VIA LENIS
     ------------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const targetEl = document.querySelector(href);
      if (!targetEl) return;

      e.preventDefault();
      closeMobileDrawer();

      if (lenis) {
        lenis.scrollTo(targetEl, {
          offset: href === '#hero' ? 0 : -64,
          duration: 1.35,
        });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ------------------------------------------------------------------------
     6. SERVICES ACCORDION (Row 2 open by default)
     ------------------------------------------------------------------------ */
  const serviceItems = document.querySelectorAll('[data-service-item]');

  serviceItems.forEach((item) => {
    const trigger = item.querySelector('.service-item__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('is-open');

      serviceItems.forEach((other) => {
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.service-item__trigger');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isCurrentlyOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }

      if (lenis) {
        window.setTimeout(() => lenis.resize(), 480);
      }
    });
  });

  /* ------------------------------------------------------------------------
     7. TESTIMONIAL CAROUSEL
     ------------------------------------------------------------------------ */
  const testimonials = [
    {
      quote:
        'Sentir-se em casa também passa por quem encontra. Uma nova etapa ganha forma através das pessoas que passam a fazer parte dela.',
      author:
        'Partilhamos uma rede cuidadosamente selecionada de parceiros, profissionais e contactos locais para facilitar processos, criar oportunidades e ajudá-lo a encontrar o seu lugar na comunidade.',
    },
    {
      quote:
        'Desde a primeira conversa em Cascais, sentimos uma escuta genuína e um conhecimento profundo do território que transformou toda a nossa mudança.',
      author: 'Família M., Lisboa & Cascais',
    },
    {
      quote:
        'A Coral abriu-nos portas a casas fora do circuito habitual e apresentou-nos os parceiros certos para começar a viver Portugal desde o primeiro dia.',
      author: 'Henrique & Sofia T., Investidores',
    },
  ];

  let activeTestimonialIndex = 0;
  const testimonialText = document.getElementById('testimonialText');
  const testimonialAuthor = document.getElementById('testimonialAuthor');
  const testimonialCounter = document.getElementById('testimonialCounter');
  const prevTestimonialBtn = document.getElementById('prevTestimonial');
  const nextTestimonialBtn = document.getElementById('nextTestimonial');

  function renderTestimonial(nextIdx) {
    if (!testimonialText || !testimonialAuthor || !testimonialCounter) return;
    activeTestimonialIndex =
      (nextIdx + testimonials.length) % testimonials.length;
    const item = testimonials[activeTestimonialIndex];

    testimonialText.classList.add('is-switching');
    window.setTimeout(() => {
      testimonialText.textContent = item.quote;
      testimonialAuthor.textContent = item.author;
      testimonialCounter.textContent = `0${activeTestimonialIndex + 1} / 0${testimonials.length}`;
      testimonialText.classList.remove('is-switching');
    }, 220);
  }

  if (prevTestimonialBtn) {
    prevTestimonialBtn.addEventListener('click', () =>
      renderTestimonial(activeTestimonialIndex - 1)
    );
  }

  if (nextTestimonialBtn) {
    nextTestimonialBtn.addEventListener('click', () =>
      renderTestimonial(activeTestimonialIndex + 1)
    );
  }

  /* ------------------------------------------------------------------------
     8. FAQ ACCORDION
     ------------------------------------------------------------------------ */
  const faqItems = document.querySelectorAll('[data-faq-item]');

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-item__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.faq-item__trigger');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }

      if (lenis) {
        window.setTimeout(() => lenis.resize(), 420);
      }
    });
  });

  /* ------------------------------------------------------------------------
     9. MOBILE MENU & PRIVATE SANCTUARY MODAL
     ------------------------------------------------------------------------ */
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  function closeMobileDrawer() {
    if (!mobileDrawer || !mobileMenuToggle) return;
    mobileDrawer.classList.remove('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    if (lenis && !sanctuaryModal?.classList.contains('is-open')) {
      lenis.start();
    }
  }

  if (mobileMenuToggle && mobileDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      const opening = !mobileDrawer.classList.contains('is-open');
      mobileDrawer.classList.toggle('is-open', opening);
      mobileDrawer.setAttribute('aria-hidden', String(!opening));
      mobileMenuToggle.setAttribute('aria-expanded', String(opening));
      if (lenis) {
        if (opening) lenis.stop();
        else lenis.start();
      }
    });
  }

  const sanctuaryModal = document.getElementById('sanctuaryModal');
  const guestRitualSelect = document.getElementById('guestRitual');
  const sanctuaryForm = document.getElementById('sanctuaryForm');
  const formStatus = document.getElementById('formStatus');

  function openModal(ritualName) {
    if (!sanctuaryModal) return;
    closeMobileDrawer();
    if (ritualName && guestRitualSelect) {
      guestRitualSelect.value = ritualName;
    }
    if (formStatus) formStatus.textContent = '';
    sanctuaryModal.classList.add('is-open');
    sanctuaryModal.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
  }

  function closeModal() {
    if (!sanctuaryModal) return;
    sanctuaryModal.classList.remove('is-open');
    sanctuaryModal.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }

  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal(btn.dataset.ritual || '');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeMobileDrawer();
    }
  });

  if (sanctuaryForm) {
    sanctuaryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName =
        document.getElementById('guestName')?.value?.trim() || 'Visitante';
      const ritual = guestRitualSelect?.value || 'Conversa Inicial';
      if (formStatus) {
        formStatus.textContent = `Obrigado, ${guestName}. Recebemos o seu pedido sobre ${ritual}. Entraremos em contacto consigo muito em breve.`;
      }
      sanctuaryForm.reset();
    });
  }

  /* ------------------------------------------------------------------------
     10. COLLECTION CATEGORY FILTER (collection.html)
     ------------------------------------------------------------------------ */
  const filterPills = document.querySelectorAll('[data-filter]');
  const collectionCards = document.querySelectorAll('[data-category]');

  if (filterPills.length && collectionCards.length) {
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const filter = pill.dataset.filter;

        filterPills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        collectionCards.forEach((card) => {
          const categories = (card.dataset.category || '').split(' ');
          const match = filter === 'all' || categories.includes(filter);
          card.classList.toggle('is-hidden', !match);
        });

        if (lenis) {
          window.setTimeout(() => lenis.resize(), 120);
        }
      });
    });
  }
})();

