/* ══════════════════════════════════════════════
   RAHUL PRAJAPATI — PORTFOLIO JS
   Senior WordPress & PHP Developer | 2026
══════════════════════════════════════════════ */

/* ── Navbar: scroll shadow & active link ── */
(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    highlightNav();
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  function highlightNav() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) current = s.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }
  highlightNav();
})();

/* ── Scroll animations (IntersectionObserver) ── */
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-scroll]').forEach((el, i) => {
    el.style.transitionDelay = (i % 5) * 0.08 + 's';
    observer.observe(el);
  });
})();

/* ── Timeline items entrance ── */
(function () {
  const tlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.timeline-item').forEach((el, i) => {
    el.style.transitionDelay = i * 0.1 + 's';
    tlObserver.observe(el);
  });
})();

/* ── Skill bars animated on scroll ── */
(function () {
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-fill').forEach((bar, i) => {
          setTimeout(() => bar.classList.add('animated'), i * 80 + 150);
        });
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.skill-category').forEach(cat => skillObserver.observe(cat));
})();

/* ── Project filter ── */
(function () {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards   = document.querySelectorAll('.project-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const cats  = (card.dataset.category || '').split(' ');
        const match = filter === 'all' || cats.includes(filter);
        card.classList.toggle('hidden', !match);
        if (match) {
          card.style.animation = 'none';
          void card.offsetHeight;
          card.style.animation = '';
        }
      });
    });
  });
})();

/* ── Back to top smooth ── */
(function () {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── Avatar image fallback ── */
(function () {
  const img = document.querySelector('.avatar-img');
  if (!img) return;
  img.addEventListener('error', function () {
    this.style.display = 'none';
    const fb = this.nextElementSibling;
    if (fb) fb.style.display = 'flex';
  });
})();
