/* ==========================================================================
   Hero globe — dotted, draggable orthographic globe drawn on a 2D canvas.
   Company hubs glow on the surface; the card and list beside it stay in sync.
   ========================================================================== */
(function () {
  'use strict';

  const canvas = document.getElementById('heroGlobe');
  const stage = document.getElementById('globeStage');
  const card = document.getElementById('hubCard');
  const list = document.getElementById('hubList');
  if (!canvas || !stage || !window.GLOBE_LAND || !window.SITE_DATA) return;

  const hero = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const companies = window.SITE_DATA.companies;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const INK = '27,26,23';
  const GOLD = '176,141,87';
  const TOUR_MS = 6500;
  const DEG = Math.PI / 180;

  /* ---------- Geometry ---------- */
  const toVec = (lat, lon) => {
    const p = lat * DEG, t = lon * DEG, c = Math.cos(p);
    return [c * Math.sin(t), Math.sin(p), c * Math.cos(t)];
  };

  const land = window.GLOBE_LAND;
  const dotCount = land.length / 2;
  const dots = new Float32Array(dotCount * 3);
  for (let i = 0; i < dotCount; i++) {
    const v = toVec(land[i * 2] / 10, land[i * 2 + 1] / 10);
    dots[i * 3] = v[0]; dots[i * 3 + 1] = v[1]; dots[i * 3 + 2] = v[2];
  }

  const hubs = companies.map((c) => ({ c, v: toVec(c.lat, c.lon), x: 0, y: 0, z: 0 }));

  // Great-circle arcs from the first hub to each of the others, lifted off the surface.
  const buildArc = (a, b) => {
    const STEPS = 48;
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const om = Math.acos(Math.min(1, Math.max(-1, dot)));
    const s = Math.sin(om) || 1;
    const pts = new Float32Array((STEPS + 1) * 3);
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
      const lift = 1 + Math.sin(Math.PI * t) * Math.min(om, 1.6) * 0.13;
      pts[i * 3] = (a[0] * k1 + b[0] * k2) * lift;
      pts[i * 3 + 1] = (a[1] * k1 + b[1] * k2) * lift;
      pts[i * 3 + 2] = (a[2] * k1 + b[2] * k2) * lift;
    }
    return { pts, steps: STEPS };
  };
  const arcs = hubs.slice(1).map((h, i) => ({ hub: i + 1, ...buildArc(hubs[0].v, h.v) }));

  /* ---------- State ---------- */
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, dotR = 1;
  let lambda = -hubs[0].c.lon * DEG + 0.35, phi = 0.42;
  let targetLambda = null, targetPhi = null;
  let velocity = 0;
  let active = 0, lineK = 0;
  let revealK = 0, revealed = false;
  let dragging = false, lastX = 0, lastY = 0;
  let hoverHub = -1, listHold = false;
  let tourT = 0, visible = true, last = 0, time = 0;
  let cardBox = null;

  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const project = (x, y, z) => {
    const cl = Math.cos(lambda), sl = Math.sin(lambda), cp = Math.cos(phi), sp = Math.sin(phi);
    const x1 = x * cl + z * sl;
    const z1 = -x * sl + z * cl;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  };

  /* ---------- Layout ---------- */
  const measure = () => {
    const hb = hero.getBoundingClientRect();
    const sb = stage.getBoundingClientRect();
    W = hb.width; H = hb.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    cx = sb.left - hb.left + sb.width / 2;
    cy = sb.top - hb.top + sb.height / 2;
    R = (Math.min(sb.width, sb.height) / 2) * 0.92;
    dotR = Math.max(0.85, R / 215);

    const showLine = card && window.matchMedia('(min-width: 992px)').matches;
    if (showLine) {
      const cb = card.getBoundingClientRect();
      cardBox = { x: cb.left - hb.left, y: cb.top - hb.top + 12 };
    } else {
      cardBox = null;
    }
  };

  /* ---------- Drawing ---------- */
  const BUCKETS = 4;
  const buckets = Array.from({ length: BUCKETS }, () => []);

  const drawDots = (scale) => {
    const cl = Math.cos(lambda), sl = Math.sin(lambda), cp = Math.cos(phi), sp = Math.sin(phi);
    const r = dotR * scale;
    buckets.forEach((b) => { b.length = 0; });

    ctx.fillStyle = 'rgba(' + INK + ',.07)';
    ctx.beginPath();
    for (let i = 0; i < dotCount; i++) {
      const x = dots[i * 3], y = dots[i * 3 + 1], z = dots[i * 3 + 2];
      const x1 = x * cl + z * sl;
      const z1 = -x * sl + z * cl;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const sx = cx + x1 * R * scale, sy = cy - y2 * R * scale;
      if (z2 < 0) {
        ctx.rect(sx - r * 0.45, sy - r * 0.45, r * 0.9, r * 0.9);
      } else {
        buckets[Math.min(BUCKETS - 1, Math.floor(z2 * BUCKETS))].push(sx, sy);
      }
    }
    ctx.fill();

    const alphas = [0.26, 0.42, 0.6, 0.78];
    for (let b = 0; b < BUCKETS; b++) {
      const pts = buckets[b];
      ctx.fillStyle = 'rgba(' + INK + ',' + alphas[b] + ')';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        ctx.moveTo(pts[i] + r, pts[i + 1]);
        ctx.arc(pts[i], pts[i + 1], r, 0, 6.2832);
      }
      ctx.fill();
    }
  };

  const drawDial = (scale) => {
    const r = R * scale;
    const glow = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    glow.addColorStop(0, 'rgba(251,248,242,.95)');
    glow.addColorStop(1, 'rgba(231,223,207,.5)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 6.2832);
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(' + INK + ',.12)';
    ctx.stroke();

    // Fine instrument ring: ticks turn with the globe.
    const outer = r * 1.055, TICKS = 72;
    ctx.strokeStyle = 'rgba(' + GOLD + ',.55)';
    ctx.beginPath();
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * 6.2832 + lambda * 0.5;
      const len = i % 6 === 0 ? 9 : 4;
      ctx.moveTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.lineTo(cx + Math.cos(a) * (outer + len), cy + Math.sin(a) * (outer + len));
    }
    ctx.stroke();
  };

  const drawArcs = (scale) => {
    arcs.forEach((arc, n) => {
      const isActive = arc.hub === active;
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + (isActive ? 0.95 : 0.34) + ')';
      ctx.beginPath();
      let pen = false;
      const pts = arc.pts;
      for (let i = 0; i <= arc.steps; i++) {
        const p = project(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
        const seen = p[2] > 0 || p[0] * p[0] + p[1] * p[1] > 1;
        if (!seen) { pen = false; continue; }
        const sx = cx + p[0] * R * scale, sy = cy - p[1] * R * scale;
        if (pen) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
        pen = true;
      }
      ctx.stroke();

      if (reduceMotion) return;
      // A small pulse travelling along the arc.
      const t = (time * 0.00016 + n / arcs.length) % 1;
      const i = Math.floor(t * arc.steps);
      const p = project(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      if (p[2] > 0 || p[0] * p[0] + p[1] * p[1] > 1) {
        ctx.fillStyle = 'rgba(' + GOLD + ',1)';
        ctx.beginPath();
        ctx.arc(cx + p[0] * R * scale, cy - p[1] * R * scale, isActive ? 2.6 : 1.8, 0, 6.2832);
        ctx.fill();
      }
    });
  };

  const drawHubs = (scale) => {
    hubs.forEach((h, i) => {
      const p = project(h.v[0], h.v[1], h.v[2]);
      h.x = cx + p[0] * R * scale; h.y = cy - p[1] * R * scale; h.z = p[2];
      if (p[2] <= 0) return;

      const on = i === active;
      const fade = Math.min(1, p[2] * 3);
      if (!reduceMotion) {
        const pulse = ((time * 0.0006 + i * 0.37) % 1);
        ctx.strokeStyle = 'rgba(' + GOLD + ',' + (1 - pulse) * 0.7 * fade + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(h.x, h.y, (on ? 7 : 5) + pulse * (on ? 18 : 11), 0, 6.2832);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + GOLD + ',' + fade + ')';
      ctx.beginPath();
      ctx.arc(h.x, h.y, on ? 6 : 4, 0, 6.2832);
      ctx.fill();
      if (on) {
        ctx.fillStyle = 'rgba(251,248,242,' + fade + ')';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 2.2, 0, 6.2832);
        ctx.fill();
      }
    });
  };

  // Thin leader line from the active hub to its card.
  const drawLeader = () => {
    const h = hubs[active];
    if (!cardBox || h.z <= 0.06) return;
    const k = easeOut(lineK);
    if (k <= 0) return;
    const elbowX = h.x + (cardBox.x - h.x) * 0.72;
    const a = Math.min(1, h.z * 4);
    ctx.strokeStyle = 'rgba(' + GOLD + ',' + 0.9 * a + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    const midX = h.x + (elbowX - h.x) * Math.min(1, k * 2);
    const midY = h.y + (cardBox.y - h.y) * Math.min(1, k * 2);
    ctx.lineTo(midX, midY);
    if (k > 0.5) ctx.lineTo(elbowX + (cardBox.x - elbowX) * ((k - 0.5) * 2), cardBox.y);
    ctx.stroke();
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const k = easeOut(revealK);
    if (k <= 0) return;
    const scale = 0.86 + 0.14 * k;
    ctx.globalAlpha = k;
    drawDial(scale);
    drawDots(scale);
    drawArcs(scale);
    drawHubs(scale);
    drawLeader();
    ctx.globalAlpha = 1;
  };

  /* ---------- Card + list ---------- */
  const buttons = [];
  if (list) {
    companies.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hub-btn';
      b.innerHTML = '<span class="hub-btn__no">0' + (i + 1) + '</span><span class="hub-btn__name">' + c.name +
        '</span><span class="hub-btn__city">' + c.city + '</span>';
      b.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        listHold = true;
        select(i, true);
      });
      b.addEventListener('pointerleave', () => { listHold = false; tourT = 0; });
      b.addEventListener('focus', () => { listHold = true; select(i, true); });
      b.addEventListener('blur', () => { listHold = false; tourT = 0; });
      b.addEventListener('click', () => { select(i, true); tourT = 0; });
      list.appendChild(b);
      buttons.push(b);
    });
  }

  const renderCard = (c) => {
    if (!card) return;
    card.querySelector('.hub-card__city').textContent = c.city;
    card.querySelector('.hub-card__name').textContent = c.name;
    card.querySelector('.hub-card__tag').textContent = c.tag;
    card.querySelector('.hub-card__metrics').innerHTML = c.metrics.map((m) =>
      '<div><strong>' + m[0] + '</strong><span>' + m[1] + '</span></div>').join('');
    if (window.gsap && !reduceMotion) {
      gsap.fromTo(card.querySelectorAll('.hub-card__city, .hub-card__name, .hub-card__tag, .hub-card__metrics > div'),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out', overwrite: true });
    }
  };

  function select(i, rotate) {
    const changed = i !== active;
    active = i;
    buttons.forEach((b, n) => {
      b.classList.toggle('is-active', n === i);
      b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
      if (n !== i) b.style.setProperty('--p', 0);
    });
    if (changed) { renderCard(companies[i]); lineK = 0; tourT = 0; }
    if (rotate) {
      const h = hubs[i].c;
      const spin = h.spin === undefined ? 0.35 : h.spin;
      targetLambda = lambda + wrapPi(-h.lon * DEG + spin - lambda);
      targetPhi = clamp(h.lat * DEG * 0.6, -0.55, 0.62);
      velocity = 0;
    }
  }

  /* ---------- Pointer ---------- */
  const pointerPos = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  const inDisc = (x, y) => Math.hypot(x - cx, y - cy) <= R * 1.06;
  const hubAt = (x, y, radius) => {
    let best = -1, bd = radius;
    hubs.forEach((h, i) => {
      if (h.z <= 0.02) return;
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = pointerPos(e);
    if (!inDisc(x, y)) return;
    const hit = hubAt(x, y, e.pointerType === 'mouse' ? 18 : 30);
    if (hit > -1) select(hit, false);
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    targetLambda = targetPhi = null;
    velocity = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });

  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const k = 1 / Math.max(R, 1);
      const dx = (e.clientX - lastX) * k;
      lambda += dx;
      velocity = dx;
      if (e.pointerType === 'mouse') phi = clamp(phi + (e.clientY - lastY) * k, -0.7, 0.75);
      lastX = e.clientX; lastY = e.clientY;
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const [x, y] = pointerPos(e);
    const hit = hubAt(x, y, 18);
    if (hit !== hoverHub) {
      hoverHub = hit;
      if (hit > -1) select(hit, false);
      if (hit === -1) tourT = 0;
    }
    canvas.style.cursor = hit > -1 ? 'pointer' : inDisc(x, y) ? 'grab' : '';
  });

  const endDrag = () => {
    dragging = false;
    tourT = 0;
    canvas.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    if (hoverHub > -1) { hoverHub = -1; tourT = 0; }
  });

  /* ---------- Loop ---------- */
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(now - last, 50);
    last = now;
    time += dt;

    if (revealed && revealK < 1) revealK = Math.min(1, revealK + dt / 1400);
    if (lineK < 1) lineK = Math.min(1, lineK + dt / 900);

    if (!dragging) {
      if (targetLambda !== null) {
        const ease = reduceMotion ? 1 : 1 - Math.pow(0.0025, dt / 1000);
        lambda += (targetLambda - lambda) * ease;
        phi += (targetPhi - phi) * ease;
        if (Math.abs(targetLambda - lambda) < 0.002) targetLambda = targetPhi = null;
      } else if (Math.abs(velocity) > 0.00005) {
        lambda += velocity;
        velocity *= Math.pow(0.05, dt / 1000);
      } else if (!reduceMotion && hoverHub === -1 && !listHold) {
        lambda += 0.000022 * dt;
      }
    }

    // Guided tour through the companies until someone interacts.
    if (revealed && !reduceMotion && !dragging && hoverHub === -1 && !listHold) {
      tourT += dt;
      if (buttons[active]) buttons[active].style.setProperty('--p', Math.min(1, tourT / TOUR_MS));
      if (tourT >= TOUR_MS) select((active + 1) % hubs.length, true);
    } else if (buttons[active]) {
      buttons[active].style.setProperty('--p', 1);
    }

    draw();
  };

  /* ---------- Boot ---------- */
  const api = {
    reveal() {
      if (revealed) return;
      revealed = true;
      if (reduceMotion) revealK = 1;
    }
  };
  window.heroGlobe = api;

  renderCard(companies[0]);
  buttons.forEach((b, n) => {
    b.classList.toggle('is-active', n === 0);
    b.setAttribute('aria-pressed', n === 0 ? 'true' : 'false');
  });
  select(0, true);
  lambda = targetLambda; phi = targetPhi; targetLambda = targetPhi = null;

  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(hero);
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);
  }

  // Without the intro timeline (no GSAP, reduced motion) show the globe straight away.
  if (!window.gsap || reduceMotion) api.reveal();
  setTimeout(() => api.reveal(), 7000);

  requestAnimationFrame((t) => { last = t; tick(t); });
})();
