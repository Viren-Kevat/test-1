/* ==========================================================================
   Interaction patterns shared by every page:
   expanding panels · pinned horizontal scroll · hover image lists · detail views
   Loaded before main.js so pinned sections are measured first.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------ *
   * Expanding panels
   * ------------------------------------------------------------------ */
  $$('[data-expander]').forEach((group) => {
    const panels = $$('.xp', group);
    const open = (panel) => {
      panels.forEach((p) => {
        const on = p === panel;
        p.classList.toggle('is-active', on);
        const tab = $('.xp__tab', p);
        if (tab) tab.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    };
    panels.forEach((p) => {
      p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(p); });
      p.addEventListener('click', () => open(p));
      p.addEventListener('focusin', () => open(p));
    });
    open(panels[0]);
  });

  /* ------------------------------------------------------------------ *
   * Pinned horizontal scroll (desktop) — native swipe on smaller screens
   * ------------------------------------------------------------------ */
  const hscrolls = $$('[data-hscroll]');

  hscrolls.forEach((section) => {
    const rail = $('.hs-rail', section);
    const items = $$('[data-rail]', section);
    if (!rail || !items.length) return;
    section._railButtons = items.map((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hs-rail__btn';
      b.textContent = item.dataset.rail;
      rail.appendChild(b);
      return b;
    });
  });

  const setRail = (section, index) => {
    (section._railButtons || []).forEach((b, i) => b.classList.toggle('is-active', i === index));
  };

  if (hasGsap && !reduceMotion) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 992px)', () => {
      hscrolls.forEach((section) => {
        const track = $('.hs-track', section);
        const bar = $('.hs-progress span', section);
        const items = $$('[data-rail]', section);
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        section.classList.add('is-pinned');

        // Which item sits nearest the reading line, as a share of the distance.
        const stops = () => items.map((item) => Math.min(1, Math.max(0, (item.offsetLeft - window.innerWidth * 0.3) / distance())));

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: true,
            start: 'top top',
            end: () => '+=' + distance(),
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate(self) {
              if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
              if (!items.length) return;
              const s = stops();
              let idx = 0;
              s.forEach((v, i) => { if (self.progress >= v - 0.001) idx = i; });
              setRail(section, idx);
            },
          },
        });

        // Images drift gently inside their frames as the track moves.
        $$('[data-drift]', section).forEach((img) => {
          gsap.fromTo(img, { xPercent: -6 }, {
            xPercent: 6, ease: 'none',
            scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        });

        // Rail buttons jump to their chapter.
        (section._railButtons || []).forEach((b, i) => {
          b.onclick = () => {
            const st = tween.scrollTrigger;
            const y = st.start + (st.end - st.start) * stops()[i];
            if (window.siteLenis) window.siteLenis.scrollTo(y, { duration: 1.4 });
            else window.scrollTo(0, y);
          };
        });
        setRail(section, 0);
      });

      return () => {
        hscrolls.forEach((s) => s.classList.remove('is-pinned'));
      };
    });
  }

  // Below the pinned breakpoint the rail scrolls the native track instead.
  hscrolls.forEach((section) => {
    const track = $('.hs-track', section);
    const items = $$('[data-rail]', section);
    const hint = $('.hs-hint', section);
    if (hint && window.innerWidth < 992) hint.firstChild.textContent = 'Swipe ';
    (section._railButtons || []).forEach((b, i) => {
      b.addEventListener('click', () => {
        if (section.classList.contains('is-pinned')) return;
        track.scrollTo({ left: items[i].offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', () => {
      if (section.classList.contains('is-pinned') || !items.length) return;
      let idx = 0;
      items.forEach((item, i) => { if (track.scrollLeft >= item.offsetLeft - track.clientWidth * 0.4) idx = i; });
      setRail(section, idx);
    }, { passive: true });
    setRail(section, 0);
  });

  /* ------------------------------------------------------------------ *
   * Hover lists: one floating image that crossfades and follows the pointer
   * ------------------------------------------------------------------ */
  if (hasGsap && finePointer && !reduceMotion && $('[data-img]')) {
    const preview = document.createElement('div');
    preview.className = 'hover-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<img alt=""><img alt="">';
    document.body.appendChild(preview);

    const imgs = $$('img', preview);
    let front = 0, current = null, src = '';
    gsap.set(preview, { autoAlpha: 0, scale: 0.88, xPercent: -50, yPercent: -50 });
    const px = gsap.quickTo(preview, 'x', { duration: 0.65, ease: 'power3' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.65, ease: 'power3' });

    const place = (e) => {
      const half = 170;
      const x = e.clientX + half + 30 > window.innerWidth ? e.clientX - half - 30 : e.clientX + half + 30;
      px(x); py(Math.max(190, Math.min(window.innerHeight - 190, e.clientY)));
    };

    const swap = (url) => {
      if (url === src) return;
      src = url;
      const back = (front + 1) % 2;
      imgs[back].src = url;
      gsap.fromTo(imgs[back], { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', overwrite: true });
      gsap.to(imgs[front], { opacity: 0, duration: 0.5, overwrite: true });
      imgs[back].style.zIndex = 2;
      imgs[front].style.zIndex = 1;
      front = back;
    };

    // Warm the cache so the first hover has no blank frame.
    const warm = () => {
      $$('[data-img]').forEach((el) => { const i = new Image(); i.src = el.dataset.img; });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(warm); else setTimeout(warm, 1500);

    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest ? e.target.closest('[data-img]') : null;
      if (el === current) return;
      current = el;
      if (el) {
        swap(el.dataset.img);
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      } else {
        gsap.to(preview, { autoAlpha: 0, scale: 0.88, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
      }
    });
    window.addEventListener('mousemove', place, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * Click-open detail view
   * ------------------------------------------------------------------ */
  const details = window.SITE_DATA && window.SITE_DATA.details;
  if (details && $('[data-detail]')) {
    const dialog = document.createElement('dialog');
    dialog.className = 'detail';
    dialog.setAttribute('data-lenis-prevent', '');
    dialog.setAttribute('aria-labelledby', 'detailTitle');
    dialog.innerHTML =
      '<div class="detail__panel" data-lenis-prevent>' +
        '<div class="detail__media"><img alt=""></div>' +
        '<div class="detail__content">' +
          '<button type="button" class="detail__close"><span>Close</span><i class="bi bi-x-lg"></i></button>' +
          '<div class="detail__inner">' +
            '<span class="eyebrow detail__eyebrow"></span>' +
            '<h2 class="detail__title" id="detailTitle"></h2>' +
            '<p class="detail__lead"></p>' +
            '<div class="detail__metrics"></div>' +
            '<div class="detail__text"></div>' +
            '<ul class="detail__points"></ul>' +
            '<nav class="detail__nav" aria-label="Browse">' +
              '<button type="button" class="detail__prev"><i class="bi bi-arrow-left"></i><span></span></button>' +
              '<button type="button" class="detail__next"><span></span><i class="bi bi-arrow-right"></i></button>' +
            '</nav>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);

    const panel = $('.detail__panel', dialog);
    const media = $('.detail__media img', dialog);
    const inner = $('.detail__inner', dialog);
    const content = $('.detail__content', dialog);
    const cursor = $('#cursor');
    let group = null, keys = [], index = 0, origin = null, closing = false;

    const fill = () => {
      const item = details[group][keys[index]];
      media.src = item.image;
      media.alt = item.title;
      $('.detail__eyebrow', dialog).textContent = item.eyebrow;
      $('.detail__title', dialog).textContent = item.title;
      $('.detail__lead', dialog).textContent = item.lead;
      $('.detail__metrics', dialog).innerHTML = item.metrics.map((m) =>
        '<div><strong>' + m[0] + '</strong><span>' + m[1] + '</span></div>').join('');
      $('.detail__text', dialog).innerHTML = item.text.map((t) => '<p>' + t + '</p>').join('');
      $('.detail__points', dialog).innerHTML = item.points.map((t) => '<li>' + t + '</li>').join('');
      const prev = details[group][keys[(index - 1 + keys.length) % keys.length]];
      const next = details[group][keys[(index + 1) % keys.length]];
      $('.detail__prev span', dialog).textContent = prev.title;
      $('.detail__next span', dialog).textContent = next.title;
      content.scrollTop = 0;
      panel.scrollTop = 0;
    };

    const rectInset = (el) => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const t = Math.max(0, r.top), l = Math.max(0, r.left);
      const b = Math.max(0, vh - r.bottom), rr = Math.max(0, vw - r.right);
      // Fall back to a centred slit if the card has scrolled out of view.
      if (t >= vh || l >= vw || r.bottom <= 0 || r.right <= 0) return 'inset(40% 30% 40% 30%)';
      return 'inset(' + t + 'px ' + rr + 'px ' + b + 'px ' + l + 'px)';
    };

    const animateIn = () => {
      if (!hasGsap || reduceMotion) return;
      gsap.fromTo(inner.children, { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, stagger: 0.055, ease: 'power3.out', delay: 0.05, overwrite: true, clearProps: 'transform,opacity',
      });
      gsap.fromTo(media, { scale: 1.06 }, { scale: 1, duration: 1.3, ease: 'power3.out', overwrite: true });
    };

    const open = (trigger) => {
      const parts = trigger.dataset.detail.split(':');
      if (!details[parts[0]] || !details[parts[0]][parts[1]]) return;
      group = parts[0];
      keys = Object.keys(details[group]);
      index = keys.indexOf(parts[1]);
      origin = $('img', trigger) || trigger;
      fill();
      dialog.showModal();
      if (cursor) dialog.appendChild(cursor);
      if (window.siteLenis) window.siteLenis.stop();
      if (hasGsap && !reduceMotion) {
        gsap.killTweensOf(panel);
        gsap.fromTo(panel, { clipPath: rectInset(origin) }, {
          clipPath: 'inset(0px 0px 0px 0px)', duration: 1, ease: 'power4.inOut',
          onComplete: () => gsap.set(panel, { clearProps: 'clipPath' }),
        });
        gsap.set(inner.children, { opacity: 0 });
        gsap.delayedCall(0.45, animateIn);
      }
    };

    const finish = () => {
      if (cursor) document.body.appendChild(cursor);
      dialog.close();
      closing = false;
      if (window.siteLenis) window.siteLenis.start();
    };

    const close = () => {
      if (closing || !dialog.open) return;
      closing = true;
      if (hasGsap && !reduceMotion && origin) {
        gsap.to(panel, { clipPath: rectInset(origin), duration: 0.8, ease: 'power4.inOut', onComplete: finish });
      } else {
        finish();
      }
    };

    const step = (dir) => {
      index = (index + dir + keys.length) % keys.length;
      if (!hasGsap || reduceMotion) { fill(); return; }
      gsap.to([inner, media], {
        opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          fill();
          gsap.set([inner, media], { opacity: 1 });
          animateIn();
        },
      });
    };

    document.addEventListener('click', (e) => {
      const t = e.target.closest ? e.target.closest('[data-detail]') : null;
      if (t) { e.preventDefault(); open(t); }
    });
    $('.detail__close', dialog).addEventListener('click', close);
    $('.detail__prev', dialog).addEventListener('click', () => step(-1));
    $('.detail__next', dialog).addEventListener('click', () => step(1));
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ------------------------------------------------------------------ *
   * Contact channels pre-select the topic in the form
   * ------------------------------------------------------------------ */
  const topicSelect = $('#cTopic');
  if (topicSelect) {
    $$('[data-topic]').forEach((row) => {
      row.addEventListener('click', () => {
        topicSelect.value = row.dataset.topic;
        const name = $('#cName');
        if (name) setTimeout(() => name.focus({ preventScroll: true }), 1500);
      });
    });
  }
})();
