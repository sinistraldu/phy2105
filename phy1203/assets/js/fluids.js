/* Unit 2 simulations: fluids */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, g = 9.8;
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }

  /* 1. Plates and viscosity */
  var fluidsV = [['Water', 0.001], ['Blood', 0.004], ['Olive oil', 0.084], ['Honey', 10]];
  Sim.make('sim-plates', {
    aspect: 0.42, animate: true,
    controls: [{ k: 'v', label: 'Top plate speed v', min: 0, max: 0.5, step: 0.01, v: 0.2, unit: 'm/s' }],
    buttons: fluidsV.map(function (q, i) { return { label: q[0], group: 'fl', on: i === 1, click: function (S) { S.st.fl = i; } }; }),
    reads: [{ k: 'eta', label: 'Viscosity &eta;' }, { k: 'grad', label: 'Speed gradient v/d' }, { k: 'F', label: 'Force F = &eta;A v/d', big: true }],
    init: function (S) { S.st.fl = 1; S.st.x = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), fl = fluidsV[S.st.fl], A = 0.01, d = 0.005, F = fl[1] * A * p.v / d;
      S.st.x += p.v * dt * 400;
      D.clear(c, W, H);
      var x0 = W * 0.08, x1 = W * 0.92, yb = H * 0.82, yt = H * 0.2, n = 7;
      D.rect(c, x0, yt, x1 - x0, yb - yt, K.water, null, 0);
      D.rect(c, x0 - 10, yb, x1 - x0 + 20, 12, K.faint, null, 2);
      D.text(c, 'fixed plate', x0, yb + 24, { size: 12, color: K.muted });
      var px = x0 + ((S.st.x % 60) + 60) % 60;
      D.rect(c, x0 - 10, yt - 14, x1 - x0 + 20, 14, K.c1, null, 2);
      for (var q = px; q < x1; q += 60) D.line(c, q, yt - 14, q, yt, 'rgba(255,255,255,0.6)', 2);
      D.text(c, 'moving plate → ' + f(p.v, 2) + ' m/s', x0, yt - 26, { size: 12, color: K.c1, weight: 600 });
      for (var i = 1; i <= n; i++) {
        var fr = i / (n + 1), y = yb - fr * (yb - yt), vl = p.v * fr;
        D.arrow(c, W * 0.45, y, W * 0.45 + vl * (W * 0.4 / 0.5), y, K.c2, 2.5);
        var off = (S.st.x * fr) % 90;
        for (var xx = x0 + off; xx < x1; xx += 90) D.circle(c, xx, y, 3, K.muted);
      }
      D.text(c, fl[0] + ' between plates (gap d = 5 mm)', W * 0.5, H * 0.94, { align: 'center', size: 12, color: K.muted });
      S.set('eta', f(fl[1], 3) + ' Pa·s'); S.set('grad', f(p.v / d, 3) + ' s⁻¹'); S.set('F', f(F, 3) + ' N');
    }
  });

  /* 2. IV bag height */
  Sim.make('sim-iv', {
    aspect: 0.55, animate: true,
    controls: [{ k: 'h', label: 'Bag height above the vein h', min: 0, max: 1.5, step: 0.01, v: 0.8, unit: 'm' }],
    reads: [{ k: 'P', label: 'Pressure at needle &rho;gh' }, { k: 'mm', label: 'In mmHg', big: true }, { k: 'pv', label: 'Vein pressure' }],
    init: function (S) { S.st.drops = []; S.st.acc = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), P = 1000 * g * p.h, mm = P / 133.3, pv = 8, net = mm - pv;
      D.clear(c, W, H);
      var gy = H * 0.86, sc = (H * 0.68) / 1.5, bx = W * 0.3, by = gy - p.h * sc;
      D.line(c, bx - 30, gy + 6, bx - 30, H * 0.05, K.faint, 4);
      D.line(c, bx - 30, Math.min(by - 30, gy - 20), bx, Math.min(by - 30, gy - 20), K.faint, 3);
      // arm
      D.rect(c, W * 0.55, gy - 14, W * 0.38, 28, 'rgba(230,180,150,0.6)', K.muted, 14, 1);
      D.text(c, 'arm (vein)', W * 0.74, gy + 26, { align: 'center', size: 12, color: K.muted });
      // bag
      D.rect(c, bx - 24, by - 64, 48, 60, K.water, K.c1, 8, 2);
      D.text(c, 'IV', bx, by - 34, { align: 'center', weight: 700, color: K.c1 });
      // drip chamber
      var dcY = by + 4; D.rect(c, bx - 8, dcY, 16, 30, null, K.muted, 4, 1.5);
      if (net > 0) { S.st.acc += dt * Math.min(6, net / 6); if (S.st.acc > 1) { S.st.acc = 0; S.st.drops.push(0); } }
      S.st.drops = S.st.drops.filter(function (y) { return y < 22; }).map(function (y) { return y + dt * 60; });
      S.st.drops.forEach(function (y) { D.circle(c, bx, dcY + 4 + y, 3, K.c1); });
      // tube
      c.save(); c.strokeStyle = K.c1; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, dcY + 30); c.bezierCurveTo(bx, gy, W * 0.45, gy, W * 0.6, gy); c.stroke(); c.restore();
      // height marker
      D.line(c, W * 0.1, by, W * 0.1, gy, K.ink, 1.5); D.line(c, W * 0.08, by, W * 0.12, by, K.ink, 1.5); D.line(c, W * 0.08, gy, W * 0.12, gy, K.ink, 1.5);
      D.text(c, 'h = ' + p.h.toFixed(2) + ' m', W * 0.1 + 8, (by + gy) / 2, { size: 13, weight: 600 });
      S.set('P', f(P, 3) + ' Pa'); S.set('mm', f(mm, 3) + ' mmHg'); S.set('pv', pv + ' mmHg');
      S.msg(net > 0 ? 'Fluid flows in. Drip rate grows with the extra pressure.' : 'Too low: the vein pushes back, nothing flows in.');
    }
  });

  /* 3. Hydraulic lift */
  Sim.make('sim-hydraulic', {
    aspect: 0.5,
    controls: [
      { k: 'F1', label: 'Push on small piston F<sub>1</sub>', min: 0, max: 200, step: 5, v: 100, unit: 'N' },
      { k: 'k', label: 'Area ratio A<sub>2</sub>/A<sub>1</sub>', min: 1, max: 50, step: 1, v: 20 }
    ],
    reads: [{ k: 'P', label: 'Pressure (same everywhere)' }, { k: 'F2', label: 'Force on big piston F<sub>2</sub>', big: true }, { k: 'm', label: 'Can lift a mass of' }, { k: 'd', label: 'Small piston moves 10 cm, big one rises' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), A1 = 0.01, P = p.F1 / A1, F2 = P * A1 * p.k;
      D.clear(c, W, H);
      var base = H * 0.86, top = H * 0.36, w1 = W * 0.06, w2 = Math.min(W * 0.4, w1 * Math.sqrt(p.k) * 1.2), x1 = W * 0.18, x2 = W * 0.62;
      D.rect(c, x1 - w1 / 2, top, w1, base - top, K.water, K.ink, 0, 1.5);
      D.rect(c, x2 - w2 / 2, top, w2, base - top, K.water, K.ink, 0, 1.5);
      D.rect(c, x1, base - 30, x2 - x1, 30, K.water, null, 0);
      D.line(c, x1 + w1 / 2, base - 30, x2 - w2 / 2, base - 30, K.ink, 1.5); D.line(c, x1 - w1 / 2, base, x2 + w2 / 2, base, K.ink, 1.5);
      D.rect(c, x1 - w1 / 2 - 2, top + 4, w1 + 4, 10, K.muted, null, 2);
      D.rect(c, x2 - w2 / 2 - 2, top + 4, w2 + 4, 10, K.muted, null, 2);
      var k = 0.5;
      D.arrow(c, x1, top - 10 - Math.max(8, p.F1 * k * 0.6), x1, top + 2, K.c2, 4);
      D.text(c, 'F₁ = ' + f(p.F1, 3) + ' N', x1, top - 22 - p.F1 * k * 0.6, { align: 'center', weight: 700, color: K.c2, size: 13, bg: K.bg });
      var L2 = Math.min(top - 30, 10 + Math.sqrt(F2) * 1.4);
      D.arrow(c, x2, top + 2, x2, top - L2, K.c3, 6);
      D.text(c, 'F₂ = ' + f(F2, 3) + ' N', x2 + 14, top - L2 / 2, { weight: 700, color: K.c3, size: 13, bg: K.bg });
      D.text(c, 'same pressure P = ' + f(P, 3) + ' Pa everywhere', (x1 + x2) / 2, base - 48, { align: 'center', size: 12, color: K.c1, weight: 600 });
      S.set('P', f(P, 3) + ' Pa'); S.set('F2', f(F2, 3) + ' N'); S.set('m', f(F2 / g, 3) + ' kg'); S.set('d', f(10 / p.k, 3) + ' cm');
    }
  });

  /* 4. Float or sink */
  var fluidsB = [['Fresh water', 1000], ['Sea water', 1025], ['Ethanol', 789]];
  Sim.make('sim-float', {
    aspect: 0.48,
    controls: [{ k: 'r', label: 'Block density &rho;<sub>block</sub>', min: 100, max: 2000, step: 5, v: 500, unit: 'kg/m³' }],
    buttons: fluidsB.map(function (q, i) { return { label: q[0], group: 'b', on: i === 0, click: function (S) { S.st.fl = i; } }; }),
    reads: [{ k: 'w', label: 'Weight of block (1 L)' }, { k: 'fb', label: 'Buoyant force if fully under' }, { k: 'fr', label: 'Fraction under the surface', big: true }],
    init: function (S) { S.st.fl = 0; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), fl = fluidsB[S.st.fl], V = 0.001, wt = p.r * V * g, fb = fl[1] * V * g;
      D.clear(c, W, H);
      var tx = W * 0.15, tw = W * 0.5, ty = H * 0.12, th = H * 0.78, surf = ty + th * 0.3, s = Math.min(H * 0.3, 90);
      D.rect(c, tx, surf, tw, ty + th - surf, K.water, null, 0);
      D.poly(c, [[tx, ty], [tx, ty + th], [tx + tw, ty + th], [tx + tw, ty]], K.ink, 2);
      var ratio = p.r / fl[1], by, state;
      if (Math.abs(ratio - 1) < 0.01) { by = surf + (ty + th - surf) / 2 - s / 2; state = 'Neutral: it hovers'; }
      else if (ratio < 1) { by = surf - s * (1 - ratio); state = 'Floats'; }
      else { by = ty + th - s - 2; state = 'Sinks to the bottom'; }
      var bx = tx + tw / 2 - s / 2;
      D.rect(c, bx, by, s, s, 'rgba(180,110,40,0.85)', K.ink, 3, 1.5);
      var sub = Math.max(0, Math.min(s, by + s - surf));
      if (sub > 0 && sub < s) D.line(c, bx - 6, surf, bx + s + 6, surf, K.c1, 2);
      var cx = bx + s / 2;
      D.arrow(c, bx - 16, by + s / 2, bx - 16, by + s / 2 + 20 + wt * 3, K.pos, 3.5);
      D.text(c, 'weight', bx - 22, by + s / 2 + 14, { align: 'right', size: 12, color: K.pos, weight: 600, bg: K.bg });
      var fbNow = fl[1] * g * V * sub / s;
      if (fbNow > 0.1) { D.arrow(c, bx + s + 16, by + s / 2, bx + s + 16, by + s / 2 - 20 - fbNow * 3, K.c3, 3.5); D.text(c, 'buoyancy', bx + s + 24, by + s / 2 - 10, { size: 12, color: K.c3, weight: 600, bg: K.bg }); }
      D.text(c, fl[0] + ': ' + fl[1] + ' kg/m³', tx + tw / 2, ty + th + 14, { align: 'center', size: 12, color: K.muted });
      D.text(c, state, W * 0.82, H * 0.45, { align: 'center', size: 18, weight: 700, color: ratio < 1 ? K.c3 : ratio > 1.01 ? K.pos : K.c1 });
      S.set('w', f(wt, 3) + ' N'); S.set('fb', f(fb, 3) + ' N');
      S.set('fr', ratio < 1 ? Math.round(ratio * 100) + '% (= ρ_block/ρ_fluid)' : '100%');
    }
  });

  /* 5. Venturi / stenosis */
  Sim.make('sim-venturi', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'k', label: 'Narrow area A<sub>2</sub>/A<sub>1</sub>', min: 0.2, max: 1, step: 0.05, v: 0.5 },
      { k: 'v1', label: 'Speed in the wide part v<sub>1</sub>', min: 0.1, max: 0.6, step: 0.05, v: 0.4, unit: 'm/s' }
    ],
    reads: [{ k: 'v2', label: 'Speed in narrow part v<sub>2</sub>', big: true }, { k: 'P1', label: 'Pressure P<sub>1</sub> (wide)' }, { k: 'P2', label: 'Pressure P<sub>2</sub> (narrow)', big: true }, { k: 'dP', label: 'Drop &frac12;&rho;(v<sub>2</sub>&sup2; &minus; v<sub>1</sub>&sup2;)' }],
    init: function (S) { S.st.pts = []; for (var i = 0; i < 70; i++) S.st.pts.push({ x: Math.random(), y: Math.random() * 1.8 - 0.9 }); },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), rho = 1060, P1 = 4000, v2 = p.v1 / p.k, dP = 0.5 * rho * (v2 * v2 - p.v1 * p.v1), P2 = P1 - dP;
      D.clear(c, W, H);
      var cy = H * 0.66, h1 = H * 0.17, h2 = h1 * Math.sqrt(p.k), x0 = W * 0.04, x1 = W * 0.96;
      var hw = function (x) { var u = (x - 0.5) / 0.16; var s = Math.exp(-u * u * u * u); return h1 + (h2 - h1) * s; };
      var top = [], bot = [];
      for (var i = 0; i <= 80; i++) { var u = i / 80, X = x0 + u * (x1 - x0); top.push([X, cy - hw(u)]); bot.push([X, cy + hw(u)]); }
      D.poly(c, top.concat(bot.slice().reverse()), null, 0, true, 'rgba(200,60,60,0.16)');
      D.poly(c, top, K.ink, 2.5); D.poly(c, bot, K.ink, 2.5);
      S.st.pts.forEach(function (q) {
        var A = hw(q.x) / h1; q.x += dt * p.v1 / (A * A) * 0.35; if (q.x > 1) q.x -= 1;
        D.circle(c, x0 + q.x * (x1 - x0), cy + q.y * hw(q.x), 3, K.pos);
      });
      // pressure tubes
      var sc = (cy - h1 - H * 0.06) / P1;
      [[0.18, P1, 'P₁'], [0.5, P2, 'P₂']].forEach(function (t) {
        var X = x0 + t[0] * (x1 - x0), yb = cy - hw(t[0]), lev = yb - Math.max(0, t[1]) * sc;
        D.rect(c, X - 7, H * 0.04, 14, yb - H * 0.04, null, K.muted, 0, 1.2);
        D.rect(c, X - 6, lev, 12, yb - lev, 'rgba(200,60,60,0.55)', null, 0);
        D.text(c, t[2], X + 12, lev, { size: 13, weight: 700, color: K.c1 });
      });
      S.set('v2', f(v2, 3) + ' m/s'); S.set('P1', f(P1, 3) + ' Pa'); S.set('P2', f(P2, 3) + ' Pa'); S.set('dP', f(dP, 3) + ' Pa');
      S.msg(P2 < 0 ? 'P<sub>2</sub> is below outside pressure: a soft vessel wall would be squeezed shut here.' : '');
    }
  });

  /* 6. Reynolds number */
  Sim.make('sim-reynolds', {
    aspect: 0.42, animate: true,
    controls: [
      { k: 'v', label: 'Blood speed v', min: 0.05, max: 1, step: 0.05, v: 0.2, unit: 'm/s' },
      { k: 'D', label: 'Vessel diameter D', min: 1, max: 30, step: 1, v: 5, unit: 'mm' }
    ],
    reads: [{ k: 'Re', label: 'Re = &rho;vD/&eta;', big: true }, { k: 'reg', label: 'Flow type' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), Re = 1060 * p.v * p.D / 1000 / 0.0035, t = S.t;
      D.clear(c, W, H);
      var cy = H * 0.5, hh = Math.min(H * 0.4, 26 + p.D * 4.5), x0 = W * 0.04, x1 = W * 0.96;
      D.rect(c, x0, cy - hh, x1 - x0, 2 * hh, 'rgba(200,60,60,0.14)', null, 0);
      D.line(c, x0, cy - hh, x1, cy - hh, K.ink, 2.5); D.line(c, x0, cy + hh, x1, cy + hh, K.ink, 2.5);
      var amp = Sim.clamp((Re - 1600) / 3000, 0, 1), cols = [K.c1, K.c3, K.c4, K.c2, K.c5];
      for (var j = 0; j < 5; j++) {
        var base = cy + (j - 2) * hh * 0.36, pts = [];
        for (var X = x0; X <= x1; X += 4) {
          var u = (X - x0) / (x1 - x0), sp = 2 + p.v * 8;
          var n = Math.sin(0.045 * X - sp * t + j * 1.3) * 0.5 + Math.sin(0.11 * X + 1.7 * sp * t + j * 2.1) * 0.3 + Math.sin(0.27 * X - 2.6 * sp * t + j) * 0.2;
          var a = amp * Math.min(1, u * 1.6) * hh * 0.9;
          pts.push([X, Sim.clamp(base + n * a, cy - hh + 3, cy + hh - 3)]);
        }
        D.poly(c, pts, cols[j], 2.5);
      }
      var reg = Re < 2000 ? 'Laminar (smooth layers)' : Re < 4000 ? 'Transitional (starting to wobble)' : 'Turbulent (chaotic swirls)';
      D.text(c, reg, W * 0.5, H * 0.07, { align: 'center', weight: 700, size: 14, color: Re < 2000 ? K.c3 : Re < 4000 ? K.c5 : K.pos });
      D.text(c, 'blood: ρ = 1060 kg/m³, η = 0.0035 Pa·s', W * 0.5, H * 0.94, { align: 'center', size: 11.5, color: K.muted });
      S.set('Re', f(Re, 3)); S.set('reg', Re < 2000 ? 'laminar' : Re < 4000 ? 'transitional' : 'turbulent');
    }
  });

  /* 7. Poiseuille */
  Sim.make('sim-poiseuille', {
    aspect: 0.45, animate: true,
    controls: [{ k: 'R', label: 'Vessel radius (% of normal)', min: 40, max: 100, step: 5, v: 100, unit: '%', show: function (v) { return v + '%'; } }],
    reads: [{ k: 'vm', label: 'Centre speed (&prop; R&sup2;)' }, { k: 'Q', label: 'Flow rate Q (&prop; R<sup>4</sup>)', big: true }, { k: 'Qa', label: 'Q for R<sub>0</sub> = 2 mm vessel' }, { k: 'res', label: 'Flow resistance' }],
    init: function (S) { S.st.pts = []; for (var i = 0; i < 90; i++) S.st.pts.push({ x: Math.random(), y: Math.random() * 2 - 1 }); },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), s = p.R / 100;
      D.clear(c, W, H);
      var cy = H * 0.5, R0 = H * 0.38, R = R0 * s, x0 = W * 0.04, x1 = W * 0.62;
      D.line(c, x0, cy - R0, x1, cy - R0, K.grid, 1, [4, 4]); D.line(c, x0, cy + R0, x1, cy + R0, K.grid, 1, [4, 4]);
      D.rect(c, x0, cy - R, x1 - x0, 2 * R, 'rgba(200,60,60,0.13)', null, 0);
      D.line(c, x0, cy - R, x1, cy - R, K.ink, 3); D.line(c, x0, cy + R, x1, cy + R, K.ink, 3);
      S.st.pts.forEach(function (q) { var v = (1 - q.y * q.y) * s * s; q.x += dt * v * 0.4; if (q.x > 1) q.x -= 1; D.circle(c, x0 + q.x * (x1 - x0), cy + q.y * R * 0.95, 2.6, K.pos); });
      var ax = x0 + (x1 - x0) * 0.35, vk = (x1 - x0) * 0.5, prof = [];
      for (var i = -6; i <= 6; i++) { var r = i / 6 * R * 0.97, v = (1 - (r / R) * (r / R)) * s * s; D.arrow(c, ax, cy + r, ax + v * vk, cy + r, K.c1, 2); prof.push([ax + v * vk, cy + r]); }
      D.poly(c, prof, K.c1, 1.5);
      D.line(c, ax, cy - R, ax, cy + R, K.muted, 1);
      // bars
      var bx = W * 0.7, bw = W * 0.26;
      [['centre speed', s * s, K.c1], ['flow rate Q', Math.pow(s, 4), K.pos]].forEach(function (b, j) {
        var y = H * 0.28 + j * H * 0.3;
        D.text(c, b[0] + ': ' + Math.round(b[1] * 100) + '%', bx, y - 10, { size: 13, weight: 700, color: b[2] });
        D.rect(c, bx, y, bw, 18, K.surface, null, 4); D.rect(c, bx, y, bw * b[1], 18, b[2], null, 4);
      });
      S.set('vm', Math.round(s * s * 100) + '% of normal'); S.set('Q', Math.round(Math.pow(s, 4) * 1000) / 10 + '% of normal');
      S.set('Qa', f(9.42 * Math.pow(s, 4), 3) + ' mL/s'); S.set('res', f(1 / Math.pow(s, 4), 3) + ' × normal');
    }
  });

  /* 8. Falling-ball viscometer */
  var liq = [['Motor oil', 0.25, 880], ['Glycerol', 1.41, 1260], ['Honey', 10, 1420]];
  Sim.make('sim-viscometer', {
    aspect: 0.55, maxH: 460, animate: true,
    controls: [{ k: 'r', label: 'Steel ball radius r', min: 0.5, max: 2, step: 0.1, v: 1, unit: 'mm' }],
    buttons: liq.map(function (q, i) { return { label: q[0], group: 'l', on: i === 1, click: function (S) { S.st.l = i; S.st.y = 0; S.st.clock = 0; } }; })
      .concat([{ label: 'Drop again', click: function (S) { S.st.y = 0; S.st.clock = 0; } }]),
    reads: [{ k: 'eta', label: 'Liquid viscosity &eta;' }, { k: 'vt', label: 'Terminal speed v<sub>t</sub>', big: true }, { k: 'clk', label: 'Stopwatch (real time)' }, { k: 'sp', label: 'Animation speed' }],
    init: function (S) { S.st.l = 1; S.st.y = 0; S.st.clock = 0; },
    onChange: function (S) { S.st.y = 0; S.st.clock = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), L = liq[S.st.l], r = p.r / 1000, vt = 2 * r * r * (7800 - L[2]) * g / (9 * L[1]), len = 0.2;
      var tfall = len / vt, speed = Math.max(1, Math.round(tfall / 5));
      if (S.st.y < len) { S.st.clock += dt * speed; S.st.y = Math.min(len, vt * S.st.clock); }
      D.clear(c, W, H);
      var tx = W * 0.35, tw = W * 0.14, ty = H * 0.08, th = H * 0.84, sc = th / len;
      D.rect(c, tx, ty, tw, th, 'rgba(200,150,40,' + (0.15 + S.st.l * 0.15) + ')', K.ink, 6, 2);
      for (var i = 0; i <= 4; i++) { var y = ty + th * i / 4; D.line(c, tx + tw, y, tx + tw + 10, y, K.ink, 1.5); D.text(c, (i * 5) + ' cm', tx + tw + 14, y, { size: 11, color: K.muted }); }
      var by = ty + 8 + S.st.y * sc * 0.96, br = 4 + p.r * 5;
      D.circle(c, tx + tw / 2, by, br, '#8a96a3', K.ink, 1.5);
      if (S.st.y < len) {
        D.arrow(c, tx - 18, by, tx - 18, by + 34, K.pos, 3); D.text(c, 'weight', tx - 24, by + 30, { align: 'right', size: 11.5, color: K.pos });
        D.arrow(c, tx - 18, by, tx - 18, by - 30, K.c3, 3); D.text(c, 'drag + buoyancy', tx - 24, by - 26, { align: 'right', size: 11.5, color: K.c3 });
      }
      D.text(c, L[0], tx + tw / 2, ty + th + 14, { align: 'center', size: 12, weight: 600 });
      D.text(c, S.st.y >= len ? 'Reached bottom: v = 0.20 m ÷ ' + S.st.clock.toFixed(2) + ' s' : 'falling at constant v_t', W * 0.78, H * 0.45, { align: 'center', size: 13, weight: 600, color: K.c1 });
      S.set('eta', f(L[1], 3) + ' Pa·s'); S.set('vt', f(vt, 3) + ' m/s'); S.set('clk', S.st.clock.toFixed(2) + ' s'); S.set('sp', speed === 1 ? 'real time' : speed + '× faster');
    }
  });

  /* 9. Diffusion */
  function resetDiff(S) { S.st.a = []; S.st.b = []; for (var i = 0; i < 110; i++) { S.st.a.push([0, 0]); S.st.b.push([0, 0]); } S.st.ts = 0; }
  Sim.make('sim-diffusion', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'rb', label: 'Big particle radius', min: 0.5, max: 5, step: 0.1, v: 3.5, unit: 'nm' },
      { k: 'T', label: 'Temperature T', min: 280, max: 320, step: 1, v: 310, unit: 'K' }
    ],
    buttons: [{ label: 'Restart', click: resetDiff }],
    reads: [{ k: 'Da', label: 'D small (r = 0.14 nm)' }, { k: 'Db', label: 'D big', big: true }, { k: 'ratio', label: 'D<sub>small</sub> / D<sub>big</sub>' }, { k: 'ts', label: 'Time (real)' }],
    init: resetDiff,
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), kB = 1.38e-23, eta = 0.001;
      var Da = kB * p.T / (6 * PI * eta * 0.14e-9), Db = kB * p.T / (6 * PI * eta * p.rb * 1e-9);
      var tsim = dt * 0.006; S.st.ts += tsim;
      var pxPerM = 1e7 * Math.min(W, 900) / 900; // 10 px per micrometre at full width
      D.clear(c, W, H);
      [[S.st.a, Da, K.c3, W * 0.27, 'small molecule (like O₂)'], [S.st.b, Db, K.c4, W * 0.73, 'protein (radius ' + p.rb.toFixed(1) + ' nm)']].forEach(function (set) {
        var arr = set[0], Dc = set[1], cx = set[3], cy = H * 0.52, half = Math.min(W * 0.21, H * 0.42), sig = Math.sqrt(2 * Dc * tsim) * pxPerM;
        D.rect(c, cx - half, cy - half, 2 * half, 2 * half, null, K.line, 6, 1);
        var rms = Math.sqrt(2 * Dc * S.st.ts) * pxPerM;
        if (rms > 2) D.circle(c, cx, cy, Math.min(rms, half), null, set[2], 1.5);
        arr.forEach(function (q) {
          q[0] += gauss() * sig; q[1] += gauss() * sig;
          if (Math.abs(q[0]) > half - 3) q[0] = Math.sign(q[0]) * (2 * (half - 3) - Math.abs(q[0]));
          if (Math.abs(q[1]) > half - 3) q[1] = Math.sign(q[1]) * (2 * (half - 3) - Math.abs(q[1]));
          D.circle(c, cx + q[0], cy + q[1], 3, set[2]);
        });
        D.text(c, set[4], cx, cy - half - 12, { align: 'center', size: 12.5, weight: 600, color: set[2] });
      });
      D.text(c, 'circle = rms distance √(2Dt)  ·  box width ≈ ' + Math.round(2 * Math.min(W * 0.21, H * 0.42) / pxPerM * 1e6) + ' µm', W * 0.5, H - 10, { align: 'center', size: 11, color: K.muted });
      S.set('Da', f(Da, 3) + ' m²/s'); S.set('Db', f(Db, 3) + ' m²/s'); S.set('ratio', f(Da / Db, 3)); S.set('ts', f(S.st.ts * 1000, 3) + ' ms');
    }
  });
})();

/* 3D: inside a blood vessel (Poiseuille flow) */
(function () {
  var T = Sim.T3, f = Sim.fmt, N = 420, LEN = 8;
  Sim.make('sim-vessel3d', {
    webgl: true, aspect: 0.5, animate: true, camera: { th: 0.9, ph: 1.2, r: 11.5 },
    controls: [{ k: 'R', label: 'Vessel radius (% of normal)', min: 40, max: 100, step: 5, v: 100, show: function (v) { return v + '%'; } }],
    reads: [{ k: 'vm', label: 'Centre speed (&prop; R&sup2;)' }, { k: 'Q', label: 'Flow rate Q (&prop; R<sup>4</sup>)', big: true }],
    init: function (S) {
      var sc = S.scene;
      S.st.tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, LEN, 40, 1, true), T.mat(0xc62828, { opacity: 0.18, side: THREE.DoubleSide }));
      S.st.tube.rotation.z = Math.PI / 2; sc.add(S.st.tube);
      var geo = new THREE.SphereGeometry(0.06, 8, 6), pts = [];
      S.st.mesh = new THREE.InstancedMesh(geo, new THREE.MeshPhongMaterial({ color: 0xffffff }), N); sc.add(S.st.mesh);
      for (var i = 0; i < N; i++) pts.push({ x: Math.random() * LEN - LEN / 2, r: Math.sqrt(Math.random()), a: Math.random() * 6.283 });
      S.st.pts = pts; S.st.m4 = new THREE.Matrix4(); S.st.col = new THREE.Color();
      S.st.arrows = []; for (var j = -4; j <= 4; j++) S.st.arrows.push(T.arrow(sc, '#2f6690'));
    },
    draw: function (S, c, W, H, dt) {
      var s = S.p.R / 100, R = 1.5 * s;
      S.st.tube.scale.set(s, 1, s);
      S.st.pts.forEach(function (q, i) {
        var v = (1 - q.r * q.r) * s * s; q.x += v * dt * 2.2; if (q.x > LEN / 2) q.x -= LEN;
        S.st.m4.makeTranslation(q.x, q.r * R * 0.95 * Math.cos(q.a), q.r * R * 0.95 * Math.sin(q.a));
        S.st.mesh.setMatrixAt(i, S.st.m4);
        S.st.col.setHSL(0.0 + 0.12 * (1 - q.r * q.r), 0.85, 0.35 + 0.3 * (1 - q.r * q.r)); S.st.mesh.setColorAt(i, S.st.col);
      });
      S.st.mesh.instanceMatrix.needsUpdate = true; if (S.st.mesh.instanceColor) S.st.mesh.instanceColor.needsUpdate = true;
      S.st.arrows.forEach(function (a, j) { var y = (j - 4) / 4 * R * 0.95, v = (1 - (y / R) * (y / R)) * s * s; Sim.T3.setArrow(a, [-1, y, 0], [v * 2.4, 0, 0], 0.25); });
      S.set('vm', Math.round(s * s * 100) + '% of normal'); S.set('Q', Math.round(Math.pow(s, 4) * 1000) / 10 + '% of normal');
    }
  });
})();
