/* Unit 5 simulations: magnetism, EM waves, NMR */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3;

  /* 1. Charge in a magnetic field (2D) */
  Sim.make('sim-bcircle', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'v', label: 'Speed v', min: 2, max: 10, step: 0.5, v: 6, unit: '× 10⁶ m/s', show: function (v) { return v + ' × 10⁶ m/s'; } },
      { k: 'B', label: 'Field B (into screen)', min: 0.5, max: 2, step: 0.1, v: 1, unit: 'T' }
    ],
    buttons: [{ label: 'Proton', group: 'p', on: true, click: function (S) { S.st.e = false; S.st.trail = []; } }, { label: 'Electron', group: 'p', click: function (S) { S.st.e = true; S.st.trail = []; } }],
    reads: [{ k: 'F', label: 'Force F = qvB' }, { k: 'r', label: 'Radius r = mv/qB', big: true }, { k: 'T', label: 'Time for one circle' }],
    init: function (S) { S.st.e = false; S.st.a = 0; S.st.trail = []; },
    onChange: function (S) { S.st.trail = []; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), q = 1.6e-19, m = S.st.e ? 9.11e-31 : 1.67e-27, v = p.v * 1e6, r = m * v / (q * p.B), Tp = 2 * PI * m / (q * p.B);
      var rmax = m * 10e6 / (q * 0.5), R = r / rmax * H * 0.42, cx = W * 0.4, cy = H * 0.5, sgn = S.st.e ? -1 : 1;
      S.st.a += sgn * dt * 2.2 * (p.v / 6) / Math.max(0.15, R / (H * 0.42));
      D.clear(c, W, H);
      for (var gx = W * 0.05; gx < W * 0.78; gx += 46) for (var gy = 24; gy < H; gy += 46) { D.circle(c, gx, gy, 6, null, K.faint, 1); D.line(c, gx - 4, gy - 4, gx + 4, gy + 4, K.faint, 1); D.line(c, gx - 4, gy + 4, gx + 4, gy - 4, K.faint, 1); }
      var x = cx + R * Math.cos(S.st.a), y = cy + R * Math.sin(S.st.a);
      S.st.trail.push([x, y]); if (S.st.trail.length > 160) S.st.trail.shift();
      D.poly(c, S.st.trail, S.st.e ? K.neg : K.pos, 2);
      var tx = -Math.sin(S.st.a) * sgn, ty = Math.cos(S.st.a) * sgn;
      D.arrow(c, x, y, x + tx * 50, y + ty * 50, K.c3, 3); D.text(c, 'v', x + tx * 58, y + ty * 58, { weight: 700, color: K.c3, italic: true, serif: true, size: 15 });
      D.arrow(c, x, y, x + (cx - x) / (R || 1) * 40, y + (cy - y) / (R || 1) * 40, K.c2, 3); D.text(c, 'F', x + (cx - x) / (R || 1) * 50, y + (cy - y) / (R || 1) * 50, { weight: 700, color: K.c2, italic: true, serif: true, size: 15 });
      D.circle(c, x, y, 9, S.st.e ? K.neg : K.pos); D.text(c, S.st.e ? '−' : '+', x, y + 1, { align: 'center', color: '#fff', weight: 700, size: 13 });
      D.text(c, '⊗ = B into screen', W * 0.86, H * 0.12, { align: 'center', size: 12, color: K.muted });
      D.text(c, 'circle drawn to scale', W * 0.86, H * 0.2, { align: 'center', size: 11, color: K.muted });
      D.text(c, 'full height = ' + f(rmax / 0.42 * 1000, 3) + ' mm', W * 0.86, H * 0.26, { align: 'center', size: 11, color: K.muted });
      S.set('F', f(q * v * p.B, 3) + ' N'); S.set('r', r >= 1e-3 ? f(r * 1000, 3) + ' mm' : f(r * 1e6, 3) + ' µm'); S.set('T', f(Tp, 3) + ' s');
    }
  });

  /* 2. Helix (3D) */
  Sim.make('sim-helix3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.9, ph: 1.2, r: 21 },
    controls: [{ k: 'ang', label: 'Angle &theta; between v and B', min: 0, max: 90, step: 5, v: 60, unit: '°' }],
    reads: [{ k: 'perp', label: 'v sin&theta; (makes the circle)' }, { k: 'par', label: 'v cos&theta; (along B)' }, { k: 'shape', label: 'Path', big: true }],
    init: function (S) {
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#1565c0'); T.setArrow(a, [i * 2.6, -3.8, j * 2.6], [0, 7.6, 0], 0.4); }
      T.label(S.scene, 'B', '#1565c0', 1).position.set(2.6, 4.3, 2.6);
      S.st.dot = T.sphere(0.22, 0xc62828); S.scene.add(S.st.dot);
      S.st.line = T.line(S.scene, 0xc62828, 900); S.st.pts = []; S.st.t = 0;
    },
    onChange: function (S) { S.st.pts = []; S.st.t = 0; },
    draw: function (S, c, W, H, dt) {
      var th = S.p.ang * PI / 180, v = 1.8, r = v * Math.sin(th) * 1.0, vy = v * Math.cos(th) * 0.5;
      S.st.t += dt * 2.5;
      var y = -3.5 + vy * S.st.t; if (y > 3.5 || S.st.t > 60) { S.st.t = 0; S.st.pts = []; y = -3.5; }
      var p = [r * Math.cos(S.st.t), y, r * Math.sin(S.st.t)];
      S.st.pts.push(p); if (S.st.pts.length > 900) S.st.pts.shift();
      S.st.dot.position.set(p[0], p[1], p[2]); T.setLine(S.st.line, S.st.pts);
      S.set('perp', f(Math.sin(th) * 100, 3) + '% of v'); S.set('par', f(Math.cos(th) * 100, 3) + '% of v');
      S.set('shape', S.p.ang === 90 ? 'circle' : S.p.ang === 0 ? 'straight line (no force)' : 'helix (spiral)');
    }
  });

  /* 3. Magnetotactic bacteria */
  Sim.make('sim-bacteria', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'dir', label: 'Field direction', min: 0, max: 360, step: 5, v: 0, unit: '°' },
      { k: 'B', label: 'Field strength B', min: 0, max: 100, step: 5, v: 50, unit: 'µT' }
    ],
    reads: [{ k: 'al', label: 'How well they line up', big: true }, { k: 'cmp', label: 'Earth’s field for comparison' }],
    init: function (S) { S.st.b = []; for (var i = 0; i < 34; i++) S.st.b.push({ x: Math.random(), y: Math.random(), a: Math.random() * 2 * PI }); },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), phi = p.dir * PI / 180, kAl = p.B / 12, sum = 0;
      D.clear(c, W, H);
      for (var gx = 40; gx < W; gx += 90) for (var gy = 30; gy < H; gy += 70) D.arrow(c, gx - Math.cos(phi) * 18, gy + Math.sin(phi) * 18, gx + Math.cos(phi) * 18, gy - Math.sin(phi) * 18, 'rgba(21,101,192,' + (0.15 + p.B / 250) + ')', 2, 8);
      S.st.b.forEach(function (b) {
        b.a += (-kAl * Math.sin(b.a - phi)) * dt + 1.3 * Math.sqrt(dt) * (Math.random() * 2 - 1) * 1.7;
        b.x += Math.cos(b.a) * dt * 0.05 * (H / W); b.y -= Math.sin(b.a) * dt * 0.05;
        b.x = (b.x + 1) % 1; b.y = (b.y + 1) % 1; sum += Math.cos(b.a - phi);
        var x = b.x * W, y = b.y * H, ux = Math.cos(b.a), uy = -Math.sin(b.a);
        c.save(); c.translate(x, y); c.rotate(Math.atan2(uy, ux));
        D.rect(c, -13, -5, 26, 10, 'rgba(46,125,50,0.75)', K.c3, 5, 1);
        for (var i = -2; i <= 2; i++) D.circle(c, i * 4, 0, 1.6, K.ink);
        D.line(c, -13, 0, -22, Math.sin(S.t * 12 + x) * 3, K.c3, 1.2);
        c.restore();
      });
      var al = sum / S.st.b.length;
      S.set('al', Math.round(Math.max(0, al) * 100) + '%'); S.set('cmp', 'about 50 µT');
    }
  });

  /* 4. LC oscillator */
  Sim.make('sim-lc', {
    aspect: 0.42, animate: true,
    controls: [{ k: 'L', label: 'Inductance L', min: 1, max: 10, step: 0.5, v: 5, unit: 'mH' }, { k: 'C', label: 'Capacitance C', min: 1, max: 10, step: 0.5, v: 5, unit: 'µF' }],
    reads: [{ k: 'f', label: 'f = 1/(2&pi;&radic;LC)', big: true }, { k: 'T', label: 'Period T' }, { k: 'note', label: 'Animation' }],
    init: function (S) { S.st.ph = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), fr = 1 / (2 * PI * Math.sqrt(p.L * 1e-3 * p.C * 1e-6)), fref = 1 / (2 * PI * Math.sqrt(25e-9));
      S.st.ph += dt * 2 * PI * 0.35 * fr / fref;
      var q = Math.cos(S.st.ph), i = -Math.sin(S.st.ph), UE = q * q, UB = i * i;
      D.clear(c, W, H);
      var x0 = W * 0.08, y0 = H * 0.18, w = W * 0.42, h = H * 0.64;
      D.rect(c, x0, y0, w, h, null, K.ink, 0, 2.5);
      // capacitor on left side
      var cx = x0, cy = y0 + h / 2; D.rect(c, cx - 22, cy - 12, 44, 24, K.bg, null, 0);
      D.line(c, cx - 20, cy - 6, cx + 20, cy - 6, K.ink, 3); D.line(c, cx - 20, cy + 6, cx + 20, cy + 6, K.ink, 3);
      var n = Math.round(Math.abs(q) * 5);
      for (var j = 0; j < n; j++) { var xx = cx - 16 + j * 8; D.text(c, q > 0 ? '+' : '−', xx, cy - 15, { align: 'center', size: 11, weight: 700, color: q > 0 ? K.pos : K.neg }); D.text(c, q > 0 ? '−' : '+', xx, cy + 16, { align: 'center', size: 11, weight: 700, color: q > 0 ? K.neg : K.pos }); }
      // coil on right side
      var lx = x0 + w; D.rect(c, lx - 14, cy - 36, 28, 72, K.bg, null, 0);
      for (var k = 0; k < 6; k++) { c.save(); c.strokeStyle = K.ink; c.lineWidth = 2.2; c.beginPath(); c.arc(lx, cy - 30 + k * 12, 6, -PI / 2, PI / 2); c.stroke(); c.restore(); }
      if (UB > 0.02) for (var m = 1; m <= 3; m++) { c.save(); c.strokeStyle = 'rgba(21,101,192,' + UB * 0.6 + ')'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(lx, cy, 14 + m * 10, 44 + m * 6, 0, 0, 2 * PI); c.stroke(); c.restore(); }
      if (Math.abs(i) > 0.05) { var d = i > 0 ? 1 : -1; D.arrow(c, x0 + w / 2 - d * 30, y0, x0 + w / 2 + d * 30, y0, K.c3, 2 + 3 * Math.abs(i)); }
      D.text(c, 'C', cx - 30, cy, { align: 'right', weight: 700 }); D.text(c, 'L', lx + 22, cy - 50, { weight: 700 });
      // energy bars
      var bx = W * 0.62, bw = W * 0.32;
      [['Electric energy in C', UE, K.pos], ['Magnetic energy in L', UB, K.neg], ['Total', 1, K.c3]].forEach(function (b, j) {
        var y = H * 0.2 + j * H * 0.25; D.text(c, b[0], bx, y, { size: 12.5, weight: 600, color: b[2] });
        D.rect(c, bx, y + 10, bw, 18, K.surface, null, 4); D.rect(c, bx, y + 10, bw * b[1], 18, b[2], null, 4);
      });
      S.set('f', f(fr, 3) + ' Hz'); S.set('T', f(1000 / fr, 3) + ' ms'); S.set('note', 'slowed down a lot');
    }
  });

  /* 5. EM wave (3D) */
  Sim.make('sim-emwave3d', {
    webgl: true, aspect: 0.52, animate: true, camera: { th: 0.75, ph: 1.15, r: 15 },
    controls: [{ k: 'lam', label: 'Wavelength &lambda; (display units)', min: 2, max: 8, step: 0.5, v: 4 }],
    reads: [{ k: 'r', label: 'E and B' }, { k: 'd', label: 'Direction of travel' }],
    init: function (S) {
      S.st.E = []; S.st.B = []; for (var i = 0; i < 30; i++) { S.st.E.push(T.arrow(S.scene, '#c62828')); S.st.B.push(T.arrow(S.scene, '#1565c0')); }
      S.st.lE = T.line(S.scene, 0xc62828, 300); S.st.lB = T.line(S.scene, 0x1565c0, 300);
      var ax = T.arrow(S.scene, '#56655b'); T.setArrow(ax, [-7.5, 0, 0], [15.5, 0, 0], 0.5);
      T.label(S.scene, 'E', '#c62828', 1).position.set(-7, 2.6, 0); T.label(S.scene, 'B', '#1565c0', 1).position.set(-7, 0, 2.6); T.label(S.scene, 'travel', '#56655b', 1).position.set(8.5, 0.5, 0);
    },
    draw: function (S, c, W, H) {
      var k = 2 * PI / S.p.lam, w = 2.2, t = S.t, pe = [], pb = [];
      for (var i = 0; i < 300; i++) { var x = -7 + 14 * i / 299, a = Math.sin(k * x - w * t); pe.push([x, 2 * a, 0]); pb.push([x, 0, 2 * a]); }
      T.setLine(S.st.lE, pe); T.setLine(S.st.lB, pb);
      for (var j = 0; j < 30; j++) { var X = -7 + 14 * j / 29, A = Math.sin(k * X - w * t); T.setArrow(S.st.E[j], [X, 0, 0], [0, 2 * A, 0], 0.25); T.setArrow(S.st.B[j], [X, 0, 0], [0, 0, 2 * A], 0.25); }
      S.set('r', 'perpendicular, in step'); S.set('d', 'perpendicular to both');
    }
  });

  /* 6. EM spectrum explorer */
  var regions = [[-12, -11, 'Gamma rays', '#7c3aed'], [-11, -8, 'X-rays', '#5b6bd8'], [-8, -6.4, 'Ultraviolet', '#8e6be8'], [-6.4, -6.15, 'Visible', null], [-6.15, -3, 'Infrared', '#d9534f'], [-3, 0, 'Microwave', '#e09b3d'], [0, 3, 'Radio', '#5d9c59']];
  var uses = { 'Gamma rays': 'radiotherapy, sterilising, PET', 'X-rays': 'radiography, CT, crystallography', 'Ultraviolet': 'sterilising, vitamin D, fluorescence', 'Visible': 'vision, photosynthesis, microscopy', 'Infrared': 'thermal imaging, thermometers', 'Microwave': 'heating water, diathermy', 'Radio': 'MRI signal, telemetry, radio' };
  Sim.make('sim-emspectrum', {
    aspect: 0.32, minH: 220,
    controls: [{ k: 'l', label: 'Wavelength &lambda;', min: -12, max: 3, step: 0.02, v: -6.3, map: function (x) { return Math.pow(10, x); }, show: function (v) { return v >= 1 ? f(v, 3) + ' m' : v >= 1e-3 ? f(v * 1000, 3) + ' mm' : v >= 1e-6 ? f(v * 1e6, 3) + ' µm' : f(v * 1e9, 3) + ' nm'; } }],
    reads: [{ k: 'reg', label: 'Region', big: true }, { k: 'f', label: 'Frequency f = c/&lambda;' }, { k: 'E', label: 'Photon energy hc/&lambda;' }, { k: 'ion', label: 'Ionising?' }, { k: 'use', label: 'Uses' }],
    draw: function (S, c, W, H) {
      var K = C(), lg = Math.log10(S.p.l), x0 = W * 0.04, x1 = W * 0.96, y = H * 0.42, X = function (l) { return x0 + (l + 12) / 15 * (x1 - x0); };
      D.clear(c, W, H);
      regions.forEach(function (r) {
        if (r[3]) D.rect(c, X(r[0]), y - 20, X(r[1]) - X(r[0]), 40, r[3], null, 0);
        else { var g = c.createLinearGradient(X(r[0]), 0, X(r[1]), 0); ['#7b2cbf', '#3a86ff', '#2ec4b6', '#ffd60a', '#ff7b00', '#d00000'].forEach(function (cc, i) { g.addColorStop(i / 5, cc); }); c.fillStyle = g; c.fillRect(X(r[0]), y - 20, X(r[1]) - X(r[0]), 40); }
        if (r[2] !== 'Visible') D.text(c, r[2], (X(r[0]) + X(r[1])) / 2, y, { align: 'center', size: 11, weight: 700, color: '#fff' });
      });
      D.text(c, 'visible', X(-6.27), y - 30, { align: 'center', size: 11, weight: 700, color: K.ink });
      [-12, -9, -6, -3, 0, 3].forEach(function (l) { D.line(c, X(l), y + 20, X(l), y + 26, K.muted, 1); D.text(c, ['1 pm', '1 nm', '1 µm', '1 mm', '1 m', '1 km'][(l + 12) / 3], X(l), y + 36, { align: 'center', size: 10.5, color: K.muted }); });
      D.text(c, '← higher energy', x0, y + 56, { size: 11, color: K.muted }); D.text(c, 'longer wavelength →', x1, y + 56, { size: 11, color: K.muted, align: 'right' });
      D.line(c, X(lg), y - 28, X(lg), y + 28, K.ink, 3); D.circle(c, X(lg), y + 30, 6, K.ink);
      var reg = regions.filter(function (r) { return lg >= r[0] && lg <= r[1]; })[0] || regions[0], fr = 3e8 / S.p.l, E = 6.63e-34 * fr / 1.6e-19;
      S.set('reg', reg[2]); S.set('f', f(fr, 3) + ' Hz'); S.set('E', f(E, 3) + ' eV'); S.set('ion', E > 10 ? 'yes' : 'no'); S.set('use', uses[reg[2]]);
    }
  });

  /* 7. Stopping radiation */
  var barriers = [['No barrier', [1, 1, 1]], ['Paper', [0, 1, 1]], ['Aluminium (5 mm)', [0, 0, 0.9]], ['Lead (5 cm)', [0, 0, 0.25]]];
  Sim.make('sim-radiation', {
    aspect: 0.42, animate: true,
    buttons: barriers.map(function (b, i) { return { label: b[0], group: 'b', on: i === 0, click: function (S) { S.st.b = i; } }; }),
    reads: [{ k: 'a', label: '&alpha; gets through' }, { k: 'bt', label: '&beta; gets through' }, { k: 'g', label: '&gamma; gets through' }],
    init: function (S) { S.st.b = 0; S.st.parts = []; S.st.acc = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), xb = W * 0.5, pass = barriers[S.st.b][1], names = ['α (helium nucleus)', 'β (electron)', 'γ (photon)'], cols = [K.pos, K.neg, K.c4];
      S.st.acc += dt; while (S.st.acc > 0.06) { S.st.acc -= 0.06; var t = Math.floor(Math.random() * 3); S.st.parts.push({ t: t, x: W * 0.1, y: H * (0.22 + 0.28 * t) + (Math.random() - 0.5) * 16, ok: Math.random() < pass[t] }); }
      D.clear(c, W, H);
      D.rect(c, W * 0.03, H * 0.1, W * 0.07, H * 0.8, K.surface, K.ink, 6, 1.5); D.text(c, 'source', W * 0.065, H * 0.95, { align: 'center', size: 11, color: K.muted });
      if (S.st.b) D.rect(c, xb - (S.st.b === 3 ? 18 : S.st.b === 2 ? 8 : 2), H * 0.08, S.st.b === 3 ? 36 : S.st.b === 2 ? 16 : 4, H * 0.84, S.st.b === 3 ? '#6b7280' : S.st.b === 2 ? '#c0c6cc' : '#f5f0e1', K.ink, 2, 1);
      if (S.st.b) D.text(c, barriers[S.st.b][0], xb, H * 0.05, { align: 'center', size: 12, weight: 600 });
      S.st.parts = S.st.parts.filter(function (p) {
        p.x += dt * (p.t === 0 ? 160 : p.t === 1 ? 280 : 360);
        if (!p.ok && S.st.b && p.x > xb - 20) return false;
        D.circle(c, p.x, p.y, p.t === 0 ? 5 : p.t === 1 ? 3 : 2.5, cols[p.t]);
        return p.x < W;
      });
      names.forEach(function (n, i) { D.text(c, n, W * 0.12, H * (0.22 + 0.28 * i) - 18, { size: 12, weight: 700, color: cols[i] }); });
      S.set('a', Math.round(pass[0] * 100) + '%'); S.set('bt', Math.round(pass[1] * 100) + '%'); S.set('g', Math.round(pass[2] * 100) + '%');
    }
  });

  /* 8. NMR precession and resonance (3D) */
  Sim.make('sim-nmr3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.6, ph: 1.2, r: 13 },
    controls: [
      { k: 'B', label: 'Magnet strength B', min: 0.5, max: 3, step: 0.1, v: 1.5, unit: 'T' },
      { k: 'rf', label: 'Radio frequency sent', min: 20, max: 130, step: 0.5, v: 50, unit: 'MHz' }
    ],
    buttons: [{ label: 'RF pulse', click: function (S) { S.st.pulse = S.t; S.st.hit = Math.abs(S.p.rf - 42.58 * S.p.B) / (42.58 * S.p.B) < 0.03; } }],
    reads: [{ k: 'fl', label: 'Larmor frequency 42.58 &times; B', big: true }, { k: 'rf', label: 'Radio frequency sent' }, { k: 'st', label: 'Result' }],
    init: function (S) {
      S.st.sp = []; S.st.pulse = -99; S.st.hit = false;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#c2410c'); var s = T.sphere(0.25, 0xc2410c); s.position.set(i * 2.6, 0, j * 2.6); S.scene.add(s); S.st.sp.push({ a: a, x: i * 2.6, z: j * 2.6, ph: Math.random() * 6 }); }
      var bA = T.arrow(S.scene, '#1565c0'); T.setArrow(bA, [-5.5, -3, -5.5], [0, 6, 0], 0.5); T.label(S.scene, 'B', '#1565c0', 1).position.set(-5.5, 3.6, -5.5);
      T.grid(S.scene, 10, -2.2);
    },
    draw: function (S, c, W, H, dt) {
      var fl = 42.58 * S.p.B, since = S.t - S.st.pulse, tilt = 0.3;
      if (S.st.hit && since >= 0) tilt = since < 1 ? 0.3 + (PI / 2 - 0.3) * since : Math.max(0.3, PI / 2 - (since - 1) * 0.4);
      S.st.sp.forEach(function (s) {
        s.ph += dt * S.p.B * 2.4;
        T.setArrow(s.a, [s.x, 0, s.z], [1.8 * Math.sin(tilt) * Math.cos(s.ph), 1.8 * Math.cos(tilt), 1.8 * Math.sin(tilt) * Math.sin(s.ph)], 0.35);
      });
      var near = Math.abs(S.p.rf - fl) / fl < 0.03;
      S.set('fl', f(fl, 3) + ' MHz'); S.set('rf', f(S.p.rf, 3) + ' MHz');
      S.set('st', since >= 0 && since < 6 ? (S.st.hit ? 'resonance: spins tipped, now relaxing' : 'off resonance: nothing absorbed') : near ? 'tuned: press RF pulse' : 'not tuned yet');
    }
  });
})();
