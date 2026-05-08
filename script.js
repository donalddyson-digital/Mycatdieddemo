/* =================================================================
   MY CAT DIED — Vanilla JS interactions (multi-page)
   ================================================================= */
(function () {
  'use strict';

  // ---------- Header scroll state ----------
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.classList.remove('open');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }
  function openMenu() {
    if (!toggle || !menu) return;
    toggle.classList.add('open');
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) closeMenu();
      else openMenu();
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  // ---------- Smooth scroll for in-page anchors ----------
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  // ---------- Reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---------- Hero video(s): ensure autoplay (iOS-safe) + filename fallback ----------
  // Two videos coexist (desktop + mobile); CSS shows the right one. Treat each independently.
  var heroVideos = document.querySelectorAll('.hero-video');
  heroVideos.forEach(function (heroVideo) {
    heroVideo.muted = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('playsinline', '');

    var isMobileVideo = heroVideo.classList.contains('hero-video-mobile');

    // Filename fallback list — different for mobile vs desktop video
    var fallbacks = isMobileVideo ? [
      'videos/hero-foregroundmobile.mp4',
      'videos/hero-foregroundmobile.MP4',
      'videos/hero-foregroundmobile.MOV',
      'videos/hero-foregroundmobile.mov'
    ] : [
      'videos/hero-foreground.mp4',
      'videos/hero-foreground.MP4',
      'videos/hero-foreground.MOV',
      'videos/hero-foreground.mov'
    ];

    heroVideo.addEventListener('error', function tryFallback() {
      var idx = parseInt(heroVideo.dataset.fallbackIdx || '0', 10);
      if (idx >= fallbacks.length) return;
      heroVideo.dataset.fallbackIdx = (idx + 1).toString();
      while (heroVideo.firstChild) heroVideo.removeChild(heroVideo.firstChild);
      heroVideo.src = fallbacks[idx];
      heroVideo.load();
    }, true);

    var p = heroVideo.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { /* autoplay blocked — element shows nothing until user interacts */ });
    }
  });

  // ---------- Subtle mouse parallax for hero scene (desktop only) ----------
  if (window.matchMedia &&
      window.matchMedia('(min-width: 1025px)').matches &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    var ship1 = document.querySelector('.ship-1');
    var ship2 = document.querySelector('.ship-2');
    var ship3 = document.querySelector('.ship-3');
    var aura = document.querySelector('.hero-aura');
    var stage = document.querySelector('.hero-video-stage');

    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (ship1) ship1.style.transform = 'translate(' + (x * 12) + 'px, ' + (y * 8) + 'px)';
      if (ship2) ship2.style.transform = 'translate(' + (x * -10) + 'px, ' + (y * 6) + 'px) rotate(-2deg)';
      if (ship3) ship3.style.transform = 'translate(' + (x * 8) + 'px, ' + (y * -5) + 'px) rotate(2deg)';
      if (aura)  aura.style.transform  = 'translate(' + (x * -6) + 'px, ' + (y * -4) + 'px)';
      if (stage) stage.style.transform = 'translate(' + (x * -4) + 'px, ' + (y * -2) + 'px)';
    });
  }

  // ---------- Contact form async submit ----------
  var form = document.querySelector('.contact-form');
  var note = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (note) {
        note.textContent = 'Sending\u2026';
        note.classList.remove('error');
      }

      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          if (note) note.textContent = 'Thank you — your message has been sent.';
          return;
        }
        return res.json().then(function (d) {
          if (note) {
            var msg = (d && d.errors && d.errors.map(function (x) { return x.message; }).join(', ')) ||
                      'Something went wrong. Try again.';
            note.textContent = msg;
            note.classList.add('error');
          }
        });
      })
      .catch(function () {
        if (note) {
          note.textContent = 'Network error. Please try again.';
          note.classList.add('error');
        }
      });
    });
  }
})();
