/* =========================================================
   main.js — Theme, nav, scroll reveal, custom cursor,
             mobile menu, active links, contact form handler
   ========================================================= */

'use strict';

/* ─── DOM REFS ───────────────────────────────────────────── */
const html        = document.documentElement;
const navbar      = document.getElementById('navbar');
const themeBtn    = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const cursorDot   = document.getElementById('cursor-dot');
const cursorRing  = document.getElementById('cursor-ring');
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

/* ─── THEME ──────────────────────────────────────────────── */
function setTheme(t) {
  html.setAttribute('data-theme', t);
  localStorage.setItem('pss-theme', t);
  if (themeIcon) {
    themeIcon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

/* Restore saved theme on load */
const savedTheme = localStorage.getItem('pss-theme') || 'dark';
setTheme(savedTheme);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

/* ─── NAVBAR SCROLL SHADOW ───────────────────────────────── */
const onScroll = () => {
  if (window.scrollY > 20) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
  updateActiveNav();
};

window.addEventListener('scroll', onScroll, { passive: true });

/* ─── MOBILE MENU ────────────────────────────────────────── */
function closeMobile() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
}

hamburger?.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

/* Close on outside click */
document.addEventListener('click', (e) => {
  if (mobileMenu?.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)) {
    closeMobile();
  }
});

/* Expose globally for inline onclick on mobile links */
window.closeMobile = closeMobile;

/* ─── SCROLL REVEAL ──────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ─── ACTIVE NAV LINK ────────────────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

function updateActiveNav() {
  let current = '';
  sections.forEach((s) => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

/* ─── CUSTOM CURSOR ──────────────────────────────────────── */
if (cursorDot && cursorRing) {
  let ringX = 0, ringY = 0;
  let dotX  = 0, dotY  = 0;
  let mx    = 0, my    = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  /* Lerp ring for smooth lag effect */
  function animateCursor() {
    dotX  = mx;
    dotY  = my;
    ringX += (mx - ringX) * 0.12;
    ringY += (my - ringY) * 0.12;

    cursorDot.style.left  = dotX  + 'px';
    cursorDot.style.top   = dotY  + 'px';
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';

    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  /* Hover on interactive elements → enlarge ring */
  const hoverEls = document.querySelectorAll(
    'a, button, .skill-tag, .project-tech, .tl-card, .ahi, .skill-card, .project-card'
  );

  hoverEls.forEach((el) => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
  });

  /* Hide cursor when leaving window */
  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity  = '0';
    cursorRing.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity  = '1';
    cursorRing.style.opacity = '1';
  });

  /* Hide on mobile (no cursor) */
  if ('ontouchstart' in window) {
    cursorDot.style.display  = 'none';
    cursorRing.style.display = 'none';
    document.body.style.cursor = 'auto';
  }
}

/* ─── CURSOR TRAIL SPARKLES ──────────────────────────────── */
let lastTrail = 0;

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastTrail < 60) return; /* throttle to ~16 per sec */
  lastTrail = now;

  const dot = document.createElement('div');
  dot.className = 'cursor-trail';
  dot.style.left = e.clientX + 'px';
  dot.style.top  = e.clientY + 'px';
  document.body.appendChild(dot);

  setTimeout(() => dot.remove(), 600);
}, { passive: true });

/* ─── CONTACT FORM (calls backend API) ───────────────────── */
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

    const payload = {
      name:    contactForm.name.value.trim(),
      email:   contactForm.email.value.trim(),
      message: contactForm.message.value.trim(),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showStatus('success', '✅ Message sent! I\'ll reply within 24 hours.');
        contactForm.reset();
      } else {
        showStatus('error', data.error || '❌ Something went wrong. Please try again.');
      }
    } catch {
      showStatus('error', '❌ Network error. Please email me directly.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
  });
}

function showStatus(type, msg) {
  if (!formStatus) return;
  formStatus.className = `form-status ${type}`;
  formStatus.textContent = msg;

  setTimeout(() => {
    formStatus.className = 'form-status';
    formStatus.textContent = '';
  }, 6000);
}

/* ─── SMOOTH SECTION SCROLL (offset for fixed nav) ──────── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMobile();

    const top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─── YEAR IN FOOTER ─────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─── PERF: Lazy-load non-critical JS ─────────────────────── */
/* Particles script is already deferred via defer attribute.   */
/* This logs render timing for debugging.                      */
window.addEventListener('load', () => {
  if (typeof performance !== 'undefined') {
    const t = performance.getEntriesByType('navigation')[0];
    console.log(
      `%c⚡ Portfolio loaded in ${Math.round(t.loadEventEnd)}ms`,
      'color: #818cf8; font-weight: bold;'
    );
  }
});
