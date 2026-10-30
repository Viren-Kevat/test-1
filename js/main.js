/* ==========================================================================
   Viren Kevat — CEO Portfolio
   Bootstrap · Swiper · GSAP + ScrollTrigger · Lenis
   Shared by every page; each feature only starts if its markup exists.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const page = document.body.getAttribute('data-page') || 'home';
  const pageCover = $('#pageTransition');

  // If the animation libraries failed to load, fall back to a plain static page.
  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove('js');
    if (pageCover) pageCover.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------ *
   * Smooth scrolling (Lenis) wired into GSAP's ticker
   * ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.siteLenis = lenis;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  const scrollToTarget = (target) => {
    if (target === 0 || target === '#home' || target === '#top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.6, easing: easeOut });
      else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: easeOut });
    else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  // Wrap every word of an element in a masked span, keeping inline tags (<em>, <br>) intact.
  function splitWords(root) {
    const out = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            const inner = document.createElement('span');
            w.className = 'w';
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
            out.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
    return out;
  }

  const setCounter = (el, val) => {
    const d = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = val.toLocaleString('en-US', {
      minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: !el.hasAttribute('data-plain'),
    });
  };

  /* ------------------------------------------------------------------ *
   * Page transitions (slide-over panel between pages)
   * ------------------------------------------------------------------ */
  const isPageLink = (a) => {
    const href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:|\/\/)/i.test(href)) return false;
    if (a.target && a.target !== '_self') return false;
    return /\.html(#.*)?$/i.test(href);
  };

  const currentFile = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const revealPage = () => {
    if (!pageCover || !pageCover.classList.contains('is-cover')) return;
    gsap.set(pageCover, { yPercent: 0 });
    pageCover.classList.remove('is-cover');
    gsap.to(pageCover, {
      yPercent: -100, duration: 1, delay: 0.25, ease: 'power4.inOut',
      onComplete: () => gsap.set(pageCover, { clearProps: 'transform' }),
    });
  };

  const leavePage = (href) => {
    if (!pageCover || reduceMotion) { location.href = href; return; }
    if (lenis) lenis.stop();
    gsap.set(pageCover, { yPercent: 100 });
    gsap.to(pageCover, { yPercent: 0, duration: 0.8, ease: 'power4.inOut', onComplete: () => { location.href = href; } });
    setTimeout(() => { location.href = href; }, 1600); // safety net
  };

  // If the browser restores the page from its back/forward cache, undo the exit animation.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    if (pageCover) gsap.set(pageCover, { clearProps: 'transform' });
    if (lenis) lenis.start();
  });

  /* ------------------------------------------------------------------ *
   * Menu (Bootstrap offcanvas) + links
   * ------------------------------------------------------------------ */
  const menuEl = $('#menu');
  const menu = menuEl ? bootstrap.Offcanvas.getOrCreateInstance(menuEl) : null;
  let pendingHash = null;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href') || '';

    if (a.hasAttribute('data-top') || href === '#top') {
      e.preventDefault();
      scrollToTarget(0);
      return;
    }

    if (href.length > 1 && href.charAt(0) === '#' && $(href)) {
      e.preventDefault();
      if (menuEl && menuEl.contains(a) && menuEl.classList.contains('show')) { pendingHash = href; menu.hide(); }
      else scrollToTarget(href);
      return;
    }

    if (isPageLink(a)) {
      const file = href.split('#')[0].toLowerCase();
      e.preventDefault();
      if (file === currentFile()) {
        if (menuEl && menuEl.classList.contains('show')) { pendingHash = '#top'; menu.hide(); }
        else scrollToTarget(0);
        return;
      }
      leavePage(href);
    }
  });

  if (menuEl) {
    menuEl.addEventListener('show.bs.offcanvas', () => lenis && lenis.stop());
    menuEl.addEventListener('hidden.bs.offcanvas', () => {
      if (lenis) lenis.start();
      if (pendingHash) { scrollToTarget(pendingHash); pendingHash = null; }
    });
  }

  /* ------------------------------------------------------------------ *
   * Header: glass background + hide on scroll down
   * ------------------------------------------------------------------ */
  const header = $('#header');
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle('is-scrolled', y > 40);
    if (y > 500 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 500) header.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  /* ------------------------------------------------------------------ *
   * Swipers
   * ------------------------------------------------------------------ */
  if ($('#projectsSwiper')) {
    const projTotal = $$('#projectsSwiper .swiper-slide').length;
    const projCurrent = $('#projCurrent');
    const projBar = $('#projBar');
    $('#projTotal').textContent = String(projTotal).padStart(2, '0');

    const updateProj = (s) => {
      const i = s.realIndex + 1;
      projCurrent.textContent = String(i).padStart(2, '0');
      projBar.style.transform = 'scaleX(' + i / projTotal + ')';
    };

    new Swiper('#projectsSwiper', {
      slidesPerView: 'auto',
      centeredSlides: true,
      loop: true,
      loopAdditionalSlides: 2,
      spaceBetween: 40,
      speed: 900,
      grabCursor: true,
      navigation: { prevEl: '#projPrev', nextEl: '#projNext' },
      breakpoints: { 0: { spaceBetween: 16 }, 768: { spaceBetween: 40 } },
      on: { init: updateProj, slideChange: updateProj },
    });
  }

  if ($('#testiSwiper')) {
    new Swiper('#testiSwiper', {
      loop: true,
      speed: 1000,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: { delay: 6500, disableOnInteraction: false },
      pagination: { el: '#testiSwiper .swiper-pagination', clickable: true },
    });
  }

  if ($('#momentsSwiper')) {
    new Swiper('#momentsSwiper', {
      slidesPerView: 'auto',
      spaceBetween: 24,
      speed: 800,
      grabCursor: true,
      freeMode: { enabled: true, momentum: true },
      mousewheel: { forceToAxis: true },
    });
  }

  /* ------------------------------------------------------------------ *
   * Forms (front-end only): contact, newsletter
   * ------------------------------------------------------------------ */
  $$('form[data-form]').forEach((form) => {
    const note = $('.form-note', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach((input) => {
        const valid = input.value.trim() !== '' && (input.type !== 'email' || /^\S+@\S+\.\S+$/.test(input.value));
        const field = input.closest('.field');
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid) ok = false;
      });
      if (note) note.textContent = ok ? form.dataset.success : 'Please complete the highlighted fields.';
      if (ok) form.reset();
    });
  });

  /* ------------------------------------------------------------------ *
   * Insights: category filter
   * ------------------------------------------------------------------ */
  const chips = $$('[data-filter]');
  if (chips.length) {
    const cards = $$('[data-cat]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));
        const cat = chip.dataset.filter;
        const show = [];
        cards.forEach((card) => {
          const match = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('d-none', !match);
          if (match) show.push(card);
        });
        show.forEach((card, i) => {
          const no = $('.hrow__no', card);
          if (no) no.textContent = String(i + 1).padStart(2, '0');
        });
        gsap.fromTo(show, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' });
        ScrollTrigger.refresh();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Reduced motion: no preloader, no scroll animation, static values
   * ------------------------------------------------------------------ */
  const preloader = $('#preloader');

  if (reduceMotion) {
    if (preloader) preloader.remove();
    if (pageCover) pageCover.remove();
    $$('[data-count]').forEach((el) => setCounter(el, parseFloat(el.dataset.count)));
    return;
  }

  /* ------------------------------------------------------------------ *
   * Intro: preloader (first visit to home) or page reveal
   * ------------------------------------------------------------------ */
  const hasHeroIntro = !!$('[data-hero]');

  if (hasHeroIntro) {
    gsap.set('[data-hero="line"]', { yPercent: 110 });
    gsap.set('[data-hero="fade"]', { y: 24, opacity: 0 });
  }

  const heroIn = (tl, at) => {
    tl.add(() => { if (window.heroGlobe) window.heroGlobe.reveal(); }, at)
      .to('[data-hero="line"]', { yPercent: 0, duration: 1.3, stagger: 0.14, ease: 'power4.out' }, '<')
      .to('[data-hero="fade"]', { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=0.8');
  };

  if (preloader) {
    try { sessionStorage.setItem('vk_seen', '1'); } catch (e) {}
    const counter = { v: 0 };
    const countEl = $('#loadCount');
    const intro = gsap.timeline({ delay: 0.2 });

    intro
      .from('.preloader__inner > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0)
      .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = Math.round(counter.v); } }, 0)
      .to('.preloader__inner', { y: -30, opacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.15')
      .to(preloader, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, '-=0.1');
    heroIn(intro, '-=0.55');
    intro
      .from('.site-header', { y: -40, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=1')
      .add(() => { preloader.style.display = 'none'; });
  } else {
    revealPage();
    if (hasHeroIntro) heroIn(gsap.timeline({ delay: 0.7 }), 0);
  }

  /* ------------------------------------------------------------------ *
   * Scroll animations — started once the page is visible
   * ------------------------------------------------------------------ */
  const initScroll = () => {
    // Word-by-word headline reveal
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.035,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Generic fade-up
    $$('[data-fade]').forEach((el) => {
      gsap.from(el, {
        y: 48, opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Staggered groups (cards, list items)
    $$('[data-stagger]').forEach((group) => {
      gsap.from(Array.from(group.children), {
        y: 56, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });

    // Masked image reveals
    $$('.reveal-img').forEach((el) => {
      gsap.from(el, {
        clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // Parallax: images are oversized inside an overflow-hidden parent
    $$('[data-speed]').forEach((img) => {
      const amp = parseFloat(img.dataset.speed) * 60; // percent of the image's own height
      gsap.fromTo(img, { yPercent: -amp }, {
        yPercent: amp, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Counters
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2.4, ease: 'power2.out',
        onUpdate: () => setCounter(el, obj.v),
        onComplete: () => setCounter(el, end),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Article reading progress
    if ($('#readProgress') && $('#article')) {
      gsap.to('#readProgress', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '#article', start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }

    // Sliders drift in as a group
    $$('.projects__swiper, .moments').forEach((el) => {
      gsap.from(el, {
        y: 90, opacity: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Footer wordmark rises in
    gsap.from('.footer__big', {
      yPercent: 40, opacity: 0, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer__big', start: 'top 100%', once: true },
    });
  };

  if (preloader) initScroll();
  else gsap.delayedCall(0.45, initScroll);

  /* ------------------------------------------------------------------ *
   * Custom cursor
   * ------------------------------------------------------------------ */
  const cursor = $('#cursor');
  if (cursor && finePointer) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    const label = $('.cursor__label', cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.classList.add('is-on');
      cx(e.clientX); cy(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('mouseenter', () => cursor.classList.add('is-on'));

    const setMode = (cls, text) => {
      cursor.classList.remove('is-link', 'is-drag');
      if (cls) cursor.classList.add(cls);
      label.textContent = text || '';
    };
    // Delegated so it also covers content added later, such as the detail view.
    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (!t.closest) return;
      if (t.closest('[data-detail]')) setMode('is-drag', 'Open');
      else if (t.closest('#projectsSwiper, #momentsSwiper')) setMode('is-drag', 'Drag');
      else if (t.closest('a, button, .ach, .hrow, .xp, input, select, textarea')) setMode('is-link');
      else setMode(null);
    });
  }

  /* ------------------------------------------------------------------ *
   * Recalculate triggers once every image has loaded
   * ------------------------------------------------------------------ */
  window.addEventListener('load', () => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    // Pinned sections change the page height, so re-apply any #hash after measuring.
    if (location.hash && location.hash.length > 1 && $(location.hash)) {
      setTimeout(() => {
        if (lenis) lenis.scrollTo($(location.hash), { immediate: true, force: true });
        else $(location.hash).scrollIntoView();
      }, 60);
    }
  });

  // Safety net: never leave the page covered if something above failed.
  setTimeout(() => {
    if (pageCover && pageCover.classList.contains('is-cover')) revealPage();
  }, 3500);
})();
