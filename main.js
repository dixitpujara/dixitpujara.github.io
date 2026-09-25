/* ══════════════════════════════════════════════
   DIXIT PUJARA — PORTFOLIO JS
   Nav · theme · reveals · 3D tilt · cursor
══════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Loading screen: hide once the hero photo/3D is ready (min 600ms, max 2.5s) ── */
(function () {
  const loader = document.getElementById('pageLoader');
  const hero   = document.getElementById('home');
  if (!loader) return;
  const start = performance.now();
  let hidden = false;
  function hide() {
    if (hidden) return;
    hidden = true;
    const wait = reduceMotion ? 0 : Math.max(0, 600 - (performance.now() - start));
    setTimeout(() => loader.classList.add('done'), wait);
  }
  window.addEventListener('hero-ready', hide);
  setTimeout(() => {
    // 3D module never reported in (blocked or failed): fall back to the plain photo
    if (hero && !hero.classList.contains('webgl-ready')) hero.classList.add('no-webgl');
    hide();
  }, 2500);
})();

/* ── Navbar: scroll shadow & active link ── */
(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id]');

  function highlightNav() {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) current = s.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }

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

  navbar.classList.toggle('scrolled', window.scrollY > 20);
  highlightNav();
})();

/* ── Theme toggle (light / dark) ── */
(function () {
  const root   = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function apply(theme, persist) {
    root.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (persist) {
      try { localStorage.setItem('dp-theme', theme); } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }

  apply(root.getAttribute('data-theme') || 'light', false);

  toggle.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });

})();

/* ── Scroll reveal (3D perspective) ── */
(function () {
  const items = document.querySelectorAll('[data-scroll], .timeline-item');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-scroll]').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.07 + 's';
    observer.observe(el);
  });
  document.querySelectorAll('.timeline-item').forEach(el => observer.observe(el));
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
          card.classList.add('visible');
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
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();

/* ── Per-box colours: taken from the box's own icon/logo, else a rotating palette ── */
(function () {
  const palette = [
    ['#6366F1', '#8B5CF6'], ['#0EA5E9', '#06B6D4'], ['#10B981', '#14B8A6'], ['#F59E0B', '#EF4444'],
    ['#EC4899', '#8B5CF6'], ['#8B5CF6', '#06B6D4'], ['#F97316', '#F59E0B'], ['#14B8A6', '#6366F1'],
  ];
  const isVivid = hex => {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return Math.max(r, g, b) - Math.min(r, g, b) > 60 && (r + g + b) / 3 > 50;
  };

  function coloursFor(card) {
    const styled = card.querySelector('[style*="gradient"]');
    if (styled) {
      const hex = (styled.getAttribute('style').match(/#[0-9a-f]{6}/gi) || []).filter(isVivid);
      if (hex.length) return [hex[0], hex[1] || hex[0]];
    }
    const logo = card.querySelector('img[src*="simpleicons"], img[src*="/si/"]');
    const m = logo && logo.getAttribute('src').match(/([0-9a-f]{6})(?:\.svg)?$/i);
    if (m && isVivid('#' + m[1])) return ['#' + m[1], '#' + m[1]];
    return null;
  }

  const groups = [
    '.logo-grid', '.about-highlights', '.about-sidebar', '.skills-grid', '.timeline',
    '.projects-grid', '.cert-grid', '.services-grid', '.contact-grid'
  ];
  const cardSel = '.logo-card, .highlight-item, .info-card, .skill-category, .timeline-card, .project-card, .cert-card, .service-card, .contact-card';

  groups.forEach((g, gi) => {
    document.querySelectorAll(g).forEach(group => {
      group.querySelectorAll(cardSel).forEach((card, i) => {
        const [c1, c2] = coloursFor(card) || palette[(i + gi * 3) % palette.length];
        card.style.setProperty('--c1', c1);
        card.style.setProperty('--c2', c2);
      });
    });
  });
})();

/* ── 3D tilt cards (cursor tracked) ── */
(function () {
  if (!finePointer || reduceMotion) return;

  const selector = [
    '.tilt', '.logo-card', '.highlight-item', '.info-card', '.skill-category',
    '.timeline-card', '.project-card', '.cert-card', '.service-card', '.contact-card'
  ].join(',');

  document.querySelectorAll(selector).forEach(el => {
    el.classList.add('tilt');
    const glare = document.createElement('span');
    glare.className = 'tilt-glare';
    el.appendChild(glare);

    const max = el.classList.contains('hero-terminal') ? 10 : 8;
    const base = el.classList.contains('hero-terminal') ? 'perspective(900px) rotateY(-14deg) rotateX(6deg)' : '';
    let raf = 0;

    el.addEventListener('pointerenter', () => {
      el.classList.add('tilting');
      el.style.transition = 'transform .15s linear, box-shadow .45s, border-color .35s';
    });

    el.addEventListener('pointermove', e => {
      const r  = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(6px)`;
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
    });

    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.classList.remove('tilting');
      el.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1), box-shadow .45s, border-color .35s';
      el.style.transform = base;
      setTimeout(() => {
        if (!el.classList.contains('tilting')) { el.style.transition = ''; el.style.transform = ''; }
      }, 720);
    });
  });
})();

/* ── Cursor ring + hero spotlight ── */
(function () {
  const hero = document.getElementById('home');

  if (hero) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--sy', (e.clientY - r.top) + 'px');
      hero.classList.add('pointer-active');
    });
    hero.addEventListener('pointerleave', () => hero.classList.remove('pointer-active'));
  }

  if (!finePointer || reduceMotion) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  let tx = -100, ty = -100, x = -100, y = -100;
  window.addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    ring.classList.add('on');
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('on'));

  document.addEventListener('pointerover', e => {
    ring.classList.toggle('hover', !!e.target.closest('a, button'));
  });

  (function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();
