/* PHY1103 Unit 6: quantum physics simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  var h = 6.626e-34, c0 = 2.998e8, e = 1.602e-19, me = 9.109e-31, kB = 1.381e-23;
  function wl(nm, a) { var r = 0, g = 0, b = 0; if (nm < 380) { r = 0.5; b = 1; } else if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1; return 'rgba(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ',' + (a === undefined ? 1 : a) + ')'; }

  /* ---------- 2D: blackbody ---------- */
  Sim.make('sim-planck', {
    aspect: 0.5,
    controls: [{ k: 'T', label: 'Temperature T', min: 1000, max: 8000, step: 50, v: 5800, unit: 'K' }],
    buttons: [{ k: 'rj', label: 'Show classical Rayleigh–Jeans', click: function (S, b) { S.st.rj = !S.st.rj; b.classList.toggle('on', S.st.rj); } }],
    reads: [{ k: 'lm', label: '&lambda;<sub>max</sub> = b/T', big: true }, { k: 'P', label: 'Total power &sigma;T<sup>4</sup>' }, { k: 'reg', label: 'Peak lies in' }],
    init: function (S) { S.st.rj = false; },
    draw: function (S, c, W, H) {
      var K = C(), Tm = S.p.T, B = function (l) { return 2 * h * c0 * c0 / Math.pow(l, 5) / (Math.exp(h * c0 / (l * kB * Tm)) - 1); }, RJ = function (l) { return 2 * c0 * kB * Tm / Math.pow(l, 4); };
      var lm = 2.898e-3 / Tm, Bmax = B(lm), pts = [], prj = [];
      for (var n = 50; n <= 3000; n += 10) { pts.push([n, B(n * 1e-9) / Bmax]); prj.push([n, Math.min(RJ(n * 1e-9) / Bmax, 3)]); }
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.06, w: W * 0.88, h: H * 0.8 };
      var g = D.graph(c, box, { x0: 0, x1: 3000, y0: 0, y1: 1.25, xl: 'wavelength (nm) →', yl: 'spectral radiance (relative)', vlines: [{ x: lm * 1e9, label: 'λ_max', color: K.c2 }] }, S.st.rj ? [{ pts: prj, color: K.c4, w: 2 }, { pts: pts, color: K.c1, w: 3 }] : [{ pts: pts, color: K.c1, w: 3 }]);
      for (var v = 380; v < 750; v += 4) { c.fillStyle = wl(v, 0.55); c.fillRect(g.px(v), box.y + box.h - 10, g.px(v + 4) - g.px(v) + 1, 10); }
      [0, 500, 1000, 1500, 2000, 2500, 3000].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      if (S.st.rj) D.text(c, 'purple: classical (blows up at short λ)', box.x + box.w - 6, box.y + 14, { align: 'right', size: 11.5, color: K.c4, weight: 600 });
      S.set('lm', f(lm * 1e9, 3) + ' nm'); S.set('P', f(5.67e-8 * Math.pow(Tm, 4), 3) + ' W/m²'); S.set('reg', lm * 1e9 < 380 ? 'ultraviolet' : lm * 1e9 < 750 ? 'visible' : 'infrared');
    }
  });

  /* ---------- 2D: photoelectric lab ---------- */
  var metals = [['Caesium', 2.1], ['Sodium', 2.28], ['Zinc', 4.3], ['Copper', 4.7], ['Platinum', 6.35]];
  Sim.make('sim-photo', {
    aspect: 0.55, animate: true,
    controls: [
      { k: 'lam', label: 'Wavelength &lambda;', min: 150, max: 700, step: 1, v: 400, unit: 'nm' },
      { k: 'I', label: 'Light intensity', min: 0, max: 100, step: 5, v: 60, unit: '%' },
      { k: 'V', label: 'Voltage on the collector', min: -5, max: 5, step: 0.05, v: 1, unit: 'V' }
    ],
    buttons: metals.map(function (m, i) { return { label: m[0] + ' (' + m[1] + ' eV)', group: 'm', on: i === 1, click: function (S) { S.st.m = i; } }; }),
    reads: [{ k: 'E', label: 'Photon energy hf' }, { k: 'K', label: 'K<sub>max</sub> = hf &minus; &phi;', big: true }, { k: 'V0', label: 'Stopping voltage V<sub>0</sub>' }, { k: 'l0', label: 'Threshold &lambda;<sub>0</sub> = hc/&phi;' }, { k: 'I', label: 'Current' }],
    init: function (S) { S.st.m = 1; S.st.el = []; S.st.acc = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), p = S.p, phi = metals[S.st.m][1], Eph = 1239.84 / p.lam, Km = Eph - phi, V0 = Math.max(0, Km), cur = Km <= 0 ? 0 : p.V >= 0 ? p.I : p.V <= -V0 ? 0 : p.I * (1 + p.V / V0);
      D.clear(c, W, H);
      var cx0 = W * 0.08, cx1 = W * 0.42, cy = H * 0.42;
      D.rect(c, cx0 - 20, H * 0.08, cx1 - cx0 + 60, H * 0.68, 'rgba(160,170,200,0.12)', K.line, 30, 1.5);
      D.rect(c, cx0, cy - 50, 10, 100, K.muted, null, 2); D.rect(c, cx1, cy - 50, 10, 100, K.ink, null, 2);
      D.text(c, metals[S.st.m][0], cx0 + 5, cy + 64, { align: 'center', size: 11 }); D.text(c, 'collector', cx1 + 5, cy + 64, { align: 'center', size: 11 });
      if (p.I > 0) { var col = wl(p.lam, 0.25 + 0.6 * p.I / 100); c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(cx0 + 120, H * 0.06); c.lineTo(cx0 + 160, H * 0.06); c.lineTo(cx0 + 12, cy + 20); c.lineTo(cx0 + 12, cy - 20); c.closePath(); c.fill(); c.restore(); }
      if (Km > 0 && p.I > 0) { S.st.acc += dt * p.I / 8; while (S.st.acc > 1) { S.st.acc -= 1; S.st.el.push({ x: 0, y: (Math.random() - 0.5) * 80, v: Math.sqrt(Km) * (0.4 + 0.6 * Math.random()), dir: 1 }); } }
      var gap = cx1 - cx0 - 10;
      S.st.el = S.st.el.filter(function (o) {
        var a = p.V / 5 * 1.2; o.v += a * dt * o.dir * 1.5; if (o.v < 0) { o.dir = -o.dir; o.v = -o.v; }
        o.x += o.dir * o.v * dt * 0.6; var X = cx0 + 10 + o.x * gap;
        D.circle(c, X, cy + o.y * 0.9, 3.5, K.neg);
        return o.x >= 0 && o.x <= 1;
      });
      var box = { x: W * 0.58, y: H * 0.08, w: W * 0.38, h: H * 0.68 }, pts = [];
      for (var v = -5; v <= 5.0001; v += 0.05) pts.push([v, Km <= 0 ? 0 : v >= 0 ? p.I : v <= -V0 ? 0 : p.I * (1 + v / V0)]);
      var gg = D.graph(c, box, { x0: -5, x1: 5, y0: 0, y1: 110, xl: 'V (volts) →', yl: 'current', vlines: Km > 0 ? [{ x: -V0, label: '−V₀', color: K.c2 }] : [], dots: [{ x: p.V, y: cur, color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [-5, 0, 5].forEach(function (u) { D.text(c, String(u), gg.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      D.text(c, Km > 0 ? '' : 'below threshold: no electrons at any intensity', W * 0.3, H * 0.92, { align: 'center', size: 12, weight: 600, color: K.pos });
      S.set('E', f(Eph, 3) + ' eV'); S.set('K', Km > 0 ? f(Km, 3) + ' eV' : '0 (no emission)'); S.set('V0', Km > 0 ? f(V0, 3) + ' V' : '–'); S.set('l0', f(1239.84 / phi, 3) + ' nm'); S.set('I', f(cur, 3) + '% of saturation');
    }
  });

  /* ---------- 3D: photons and electrons ---------- */
  Sim.make('sim-photo3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.9, ph: 1.15, r: 13 },
    controls: [
      { k: 'lam', label: 'Wavelength &lambda;', min: 150, max: 700, step: 5, v: 300, unit: 'nm' },
      { k: 'rate', label: 'Intensity (photons per second)', min: 1, max: 30, step: 1, v: 10 },
      { k: 'phi', label: 'Work function &phi;', min: 1.5, max: 6, step: 0.05, v: 2.28, unit: 'eV' }
    ],
    reads: [{ k: 'E', label: 'hf' }, { k: 'K', label: 'K<sub>max</sub>', big: true }, { k: 'cnt', label: 'Electrons emitted' }],
    init: function (S) {
      var st = S.st; st.ph = []; st.el = []; st.acc = 0; st.n = 0;
      var plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 4), T.mat(0x9aa0b8)); S.scene.add(plate);
      st.pm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd54f }), 120); S.scene.add(st.pm);
      st.em = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), T.mat(0x1d4ed8), 200); S.scene.add(st.em);
      st.m4 = new THREE.Matrix4(); T.label(S.scene, 'metal', '#5d5975', 1).position.set(0, 2.6, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, Eph = 1239.84 / p.lam, Km = Eph - p.phi;
      st.pm.material.color.set(wl(clamp(p.lam, 380, 700), 1).replace(/rgba\((\d+),(\d+),(\d+),[^)]+\)/, 'rgb($1,$2,$3)'));
      st.acc += dt * p.rate; while (st.acc > 1) { st.acc -= 1; st.ph.push(new THREE.Vector3(-7, 2 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3)); }
      var dir = new THREE.Vector3(7, -2, 0).normalize();
      st.ph = st.ph.filter(function (q) { q.addScaledVector(dir, dt * 6); if (q.x >= -0.15) { if (Km > 0) { st.n++; st.el.push({ p: new THREE.Vector3(0.2, q.y, q.z), v: new THREE.Vector3(1, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2).normalize().multiplyScalar(Math.sqrt(Km) * (0.5 + 0.5 * Math.random()) * 1.6) }); } return false; } return true; });
      st.el = st.el.filter(function (o) { o.p.addScaledVector(o.v, dt); return o.p.x < 8; }).slice(-200);
      st.pm.count = Math.min(120, st.ph.length); st.ph.slice(0, 120).forEach(function (q, i) { st.m4.makeTranslation(q.x, q.y, q.z); st.pm.setMatrixAt(i, st.m4); }); st.pm.instanceMatrix.needsUpdate = true;
      st.em.count = st.el.length; st.el.forEach(function (o, i) { st.m4.makeTranslation(o.p.x, o.p.y, o.p.z); st.em.setMatrixAt(i, st.m4); }); st.em.instanceMatrix.needsUpdate = true;
      S.set('E', f(Eph, 3) + ' eV'); S.set('K', Km > 0 ? f(Km, 3) + ' eV' : 'none: hf < φ'); S.set('cnt', String(st.n));
    }
  });

  /* ---------- 2D: Compton scattering ---------- */
  Sim.make('sim-compton', {
    aspect: 0.5,
    controls: [
      { k: 'th', label: 'Scattering angle &theta;', min: 0, max: 180, step: 1, v: 90, unit: '°' },
      { k: 'lam', label: 'Incident wavelength &lambda;', min: 1, max: 60, step: 0.5, v: 10, unit: 'pm' }
    ],
    reads: [{ k: 'dl', label: '&Delta;&lambda; = (h/m<sub>e</sub>c)(1 &minus; cos&theta;)', big: true }, { k: 'l2', label: 'Scattered &lambda;&prime;' }, { k: 'E', label: 'Photon energy before / after' }, { k: 'Ke', label: 'Electron kinetic energy' }],
    draw: function (S, c, W, H) {
      var K = C(), th = S.p.th * PI / 180, lc = 2.426, l1 = S.p.lam, l2 = l1 + lc * (1 - Math.cos(th)), E1 = 1239.84e3 / l1, E2 = 1239.84e3 / l2;
      var phi = th === 0 ? PI / 2 : Math.atan(1 / ((1 + lc / l1) * Math.tan(th / 2)));
      D.clear(c, W, H);
      var ox = W * 0.42, oy = H * 0.5, L = Math.min(W * 0.33, H * 0.42);
      var wave = function (x0, y0, ang, len, lam, col) { var pts = []; var k = 2 * PI / Math.max(6, lam * 1.6); for (var s = 0; s <= len; s += 2) { var a = 9 * Math.sin(k * s); pts.push([x0 + s * Math.cos(ang) - a * Math.sin(ang), y0 + s * Math.sin(ang) + a * Math.cos(ang)]); } D.poly(c, pts, col, 2.2); var en = pts[pts.length - 1]; D.arrow(c, en[0] - 10 * Math.cos(ang), en[1] - 10 * Math.sin(ang), en[0] + 4 * Math.cos(ang), en[1] + 4 * Math.sin(ang), col, 2.5, 9); };
      wave(ox - L, oy, 0, L - 18, l1, K.c4);
      wave(ox + 18 * Math.cos(-th), oy + 18 * Math.sin(-th), -th, L, l2, K.c2);
      D.circle(c, ox, oy, 9, K.neg); D.arrow(c, ox, oy, ox + L * 0.6 * Math.cos(phi), oy + L * 0.6 * Math.sin(phi), K.neg, 3);
      D.text(c, 'electron recoils', ox + L * 0.6 * Math.cos(phi) + 6, oy + L * 0.6 * Math.sin(phi) + 12, { size: 12, color: K.neg, weight: 600 });
      D.text(c, 'λ = ' + f(l1, 3) + ' pm', ox - L * 0.6, oy - 24, { size: 12, color: K.c4, weight: 700 }); D.text(c, 'λ′ = ' + f(l2, 3) + ' pm', ox + L * 0.75 * Math.cos(-th), oy + L * 0.75 * Math.sin(-th) - 20, { size: 12, color: K.c2, weight: 700, align: 'center' });
      c.save(); c.strokeStyle = K.faint; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + L, oy); c.stroke(); c.restore();
      c.save(); c.strokeStyle = K.ink; c.beginPath(); c.arc(ox, oy, 34, -th, 0); c.stroke(); c.restore(); D.text(c, 'θ', ox + 42 * Math.cos(-th / 2), oy + 42 * Math.sin(-th / 2), { italic: true, serif: true, size: 15 });
      S.set('dl', f(l2 - l1, 3) + ' pm'); S.set('l2', f(l2, 3) + ' pm'); S.set('E', f(E1, 3) + ' / ' + f(E2, 3) + ' eV'); S.set('Ke', f(E1 - E2, 3) + ' eV');
    }
  });

  /* ---------- 3D: de Broglie waves on an orbit ---------- */
  Sim.make('sim-orbit3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.3, ph: 1.15, r: 13 },
    controls: [
      { k: 'n', label: 'Orbit number n', min: 1, max: 8, step: 1, v: 4 },
      { k: 'r', label: 'Orbit radius (&times; the allowed r<sub>n</sub>)', min: 0.7, max: 1.3, step: 0.01, v: 1 }
    ],
    reads: [{ k: 'fit', label: 'Wavelengths around the orbit 2&pi;r/&lambda;', big: true }, { k: 'rn', label: 'Allowed radius r<sub>n</sub> = 0.0529 n&sup2; nm' }, { k: 'En', label: 'Energy E<sub>n</sub> = &minus;13.6/n&sup2; eV' }],
    init: function (S) { var st = S.st; S.scene.add(T.sphere(0.25, 0xc62828)); st.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 8, 120), T.mat(0x9aa0b8)); st.ring.rotation.x = PI / 2; S.scene.add(st.ring); st.w = T.line(S.scene, 0x4338ca, 800); st.e = T.line(S.scene, 0xb8b2e6, 800); st.t = 0; },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, R0 = 4, Rv = R0 * p.r, lam = 2 * PI * R0 / p.n, nf = 2 * PI * Rv / lam, pts = []; st.t += dt;
      st.ring.scale.set(Rv, Rv, 1);
      var ok = Math.abs(nf - Math.round(nf)) < 0.02, amp = 0.7 * Math.cos(st.t * 2), ep = [];
      for (var i = 0; i <= 799; i++) { var s = i / 799, ang = s * 2 * PI, y = ok ? amp * Math.sin(nf * ang) : 0.7 * Math.sin(nf * ang - st.t * 3); pts.push([Rv * Math.cos(ang), y, Rv * Math.sin(ang)]); ep.push([Rv * Math.cos(ang), ok ? 0.7 * Math.sin(nf * ang) : 0.7 * Math.sin(nf * ang), Rv * Math.sin(ang)]); }
      T.setLine(st.e, ep);
      T.setLine(st.w, pts);
      S.set('fit', f(nf, 3) + (Math.abs(nf - Math.round(nf)) < 0.02 ? ' ✓ whole number: standing wave' : ' ✗ the wave does not join up'));
      S.set('rn', f(0.0529 * p.n * p.n, 3) + ' nm'); S.set('En', f(-13.6 / (p.n * p.n), 3) + ' eV');
    }
  });

  /* ---------- 2D: phase vs group velocity ---------- */
  Sim.make('sim-groupvel', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'a', label: 'Dispersion &alpha; in &omega; = ck + &alpha;k&sup2;', min: -0.3, max: 0.3, step: 0.01, v: 0.15 },
      { k: 'dk', label: 'Spread &Delta;k between the two waves', min: 0.1, max: 1.5, step: 0.05, v: 0.5 }
    ],
    reads: [{ k: 'vp', label: 'Phase velocity &omega;/k' }, { k: 'vg', label: 'Group velocity d&omega;/dk', big: true }, { k: 'len', label: 'Group length &asymp; 2&pi;/&Delta;k' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, cc = 1, k0 = 6, w = function (k) { return cc * k + p.a * k * k; }, k1 = k0 - p.dk / 2, k2 = k0 + p.dk / 2, t = S.t * 0.8;
      var vp = w(k0) / k0, vg = cc + 2 * p.a * k0, Lx = 40;
      D.clear(c, W, H);
      var box = { x: W * 0.04, y: H * 0.08, w: W * 0.92, h: H * 0.78 }, pts = [], env = [], p1 = [], p2 = [];
      for (var x = 0; x <= Lx; x += 0.05) {
        var y1 = Math.cos(k1 * x - w(k1) * t), y2 = Math.cos(k2 * x - w(k2) * t); pts.push([x, (y1 + y2) / 2]); p1.push([x, 1.6 + y1 * 0.25]); p2.push([x, -1.6 + y2 * 0.25]);
        env.push([x, Math.abs(Math.cos((p.dk / 2) * x - ((w(k2) - w(k1)) / 2) * t))]);
      }
      var g = D.graph(c, box, { x0: 0, x1: Lx, y0: -2, y1: 2, xl: 'x →' }, [{ pts: p1, color: K.faint, w: 1 }, { pts: p2, color: K.faint, w: 1 }, { pts: env, color: K.c3, w: 2 }, { pts: env.map(function (q) { return [q[0], -q[1]]; }), color: K.c3, w: 2 }, { pts: pts, color: K.c1, w: 2.5 }]);
      var xp = ((vp * t) % (2 * PI / k0 * 6) + 2 * PI / k0 * 6) % (2 * PI / k0 * 6) + 2, xg = ((vg * t) % Lx + Lx) % Lx;
      D.circle(c, g.px(xp), g.py(1), 6, K.pos); D.text(c, 'crest (vₚ)', g.px(xp), g.py(1) - 14, { align: 'center', size: 11, color: K.pos, weight: 700 });
      D.line(c, g.px(xg), box.y, g.px(xg), box.y + box.h, K.c3, 1.5, [4, 3]); D.text(c, 'group (v_g)', g.px(xg) + 4, box.y + box.h - 12, { size: 11, color: K.c3, weight: 700 });
      D.text(c, 'grey: the two separate waves', box.x + 6, box.y + 12, { size: 11, color: K.muted });
      S.set('vp', f(vp, 3)); S.set('vg', f(vg, 3) + (Math.abs(vg - vp) < 0.01 ? ' (= vₚ, no dispersion)' : vg > vp ? ' (> vₚ)' : ' (< vₚ)')); S.set('len', f(2 * PI / p.dk, 3));
    }
  });

  /* ---------- 2D: X-ray spectrum ---------- */
  var targets = [['Tungsten W', 74, [[0.0209, 1], [0.0184, 0.3]], 69.5], ['Molybdenum Mo', 42, [[0.0711, 1], [0.0632, 0.3]], 20.0], ['Copper Cu', 29, [[0.154, 1], [0.139, 0.3]], 8.98]];
  Sim.make('sim-xspec', {
    aspect: 0.5,
    controls: [{ k: 'V', label: 'Tube voltage V', min: 5, max: 100, step: 1, v: 35, unit: 'kV' }, { k: 'i', label: 'Tube current', min: 5, max: 50, step: 1, v: 20, unit: 'mA' }],
    buttons: targets.map(function (t, j) { return { label: t[0], group: 't', on: j === 1, click: function (S) { S.st.t = j; } }; }),
    reads: [{ k: 'lm', label: '&lambda;<sub>min</sub> = hc/eV', big: true }, { k: 'lines', label: 'Characteristic lines' }],
    init: function (S) { S.st.t = 1; },
    draw: function (S, c, W, H) {
      var K = C(), tg = targets[S.st.t], V = S.p.V, lmin = 1.23984 / V, on = V > tg[3], pts = [], lmax = 0.2;
      var I = function (l) { var s = l > lmin ? tg[1] * (l / lmin - 1) / (l * l) * 1e-3 : 0; if (on) tg[2].forEach(function (q) { s += q[1] * 1.2 * tg[1] / (q[0] * q[0]) * 1e-3 * Math.min(1, (V - tg[3]) / 15 + 0.3) * Math.exp(-Math.pow((l - q[0]) / 0.0012, 2)); }); return s * S.p.i / 20; };
      for (var l = 0.002; l <= lmax; l += 0.0005) pts.push([l, I(l)]);
      var ym = 0; pts.forEach(function (q) { ym = Math.max(ym, q[1]); });
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.06, w: W * 0.88, h: H * 0.8 };
      var g = D.graph(c, box, { x0: 0, x1: lmax, y0: 0, y1: Math.max(ym, 0.5) * 1.15, xl: 'wavelength (nm) →', yl: 'intensity', vlines: [{ x: lmin, label: 'λ_min', color: K.c2 }] }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      [0, 0.05, 0.1, 0.15, 0.2].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('lm', f(lmin, 3) + ' nm'); S.set('lines', on ? 'Kα ' + tg[2][0][0] + ' nm, Kβ ' + tg[2][1][0] + ' nm' : 'none yet: need V > ' + tg[3] + ' kV');
    }
  });

  /* ---------- 3D: Miller planes and Bragg ---------- */
  Sim.make('sim-miller3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.05, r: 13 },
    controls: [
      { k: 'h', label: 'h', min: 0, max: 3, step: 1, v: 1 }, { k: 'k', label: 'k', min: 0, max: 3, step: 1, v: 1 }, { k: 'l', label: 'l', min: 0, max: 3, step: 1, v: 1 },
      { k: 'th', label: 'Glancing angle &theta;', min: 5, max: 85, step: 0.5, v: 34, unit: '°' },
      { k: 'lam', label: 'X-ray wavelength &lambda;', min: 0.05, max: 0.3, step: 0.002, v: 0.154, unit: 'nm' }
    ],
    reads: [{ k: 'd', label: 'd<sub>hkl</sub> = a/&radic;(h&sup2;+k&sup2;+l&sup2;) (a = 0.40 nm)' }, { k: 'n', label: '2d sin&theta;/&lambda;', big: true }, { k: 'I', label: 'Reflection' }],
    init: function (S) {
      var st = S.st; S.renderer.localClippingEnabled = true; st.key = '';
      st.clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 1.6), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1.6), new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.6), new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.6), new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.6), new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.6)];
      st.atoms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), 64); S.scene.add(st.atoms);
      st.planes = []; for (var i = 0; i < 12; i++) { var m = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshPhongMaterial({ color: 0x4338ca, transparent: true, opacity: 0.25, side: THREE.DoubleSide, clippingPlanes: st.clip, depthWrite: false })); S.scene.add(m); st.planes.push(m); }
      S.scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 3, 3)), new THREE.LineBasicMaterial({ color: 0x5d5975 })));
      st.inB = T.cyl(0.05, 0x9333ea); S.scene.add(st.inB); st.outB = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), new THREE.MeshBasicMaterial({ color: 0xffb300, transparent: true })); S.scene.add(st.outB);
      st.m4 = new THREE.Matrix4(); st.cA = new THREE.Color(0x4338ca); st.cB = new THREE.Color(0xb9bdd0);
      for (var q = 0; q < 64; q++) st.atoms.setColorAt(q, st.cB);
    },
    draw: function (S) {
      var st = S.st, p = S.p, hh = p.h, kk = p.k, ll = p.l; if (hh + kk + ll === 0) hh = 1;
      var nrm = Math.sqrt(hh * hh + kk * kk + ll * ll), nv = new THREE.Vector3(hh, kk, ll).normalize(), key = [hh, kk, ll].join();
      if (key !== st.key) {
        st.key = key; var n = 0;
        for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) for (var cc = 0; cc < 4; cc++) { st.m4.makeTranslation(a - 1.5, b - 1.5, cc - 1.5); st.atoms.setMatrixAt(n, st.m4); var s = (hh * a + kk * b + ll * cc) / 3; st.atoms.setColorAt(n, Math.abs(s - Math.round(s)) < 1e-6 ? st.cA : st.cB); n++; }
        st.atoms.instanceMatrix.needsUpdate = true; if (st.atoms.instanceColor) st.atoms.instanceColor.needsUpdate = true;
        // planes h x + k y + l z = m (lattice units of 3 cells: a plane every 1/nrm along n, here in cube coordinates 0..3)
        var mmax = (hh + kk + ll) * 3;
        st.planes.forEach(function (pl, i) {
          var m = i; pl.visible = m <= mmax && i < 12;
          var dist = m / nrm * 1 - (nv.x + nv.y + nv.z) * 1.5; // shift because the cube is centred
          pl.position.copy(nv.clone().multiplyScalar(dist)); pl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nv);
        });
      }
      var d = 0.4 / nrm, th = p.th * PI / 180, N = 8, ph = 2 * PI * 2 * d * Math.sin(th) / p.lam, I = Math.abs(Math.sin(ph / 2)) < 1e-6 ? 1 : Math.pow(Math.sin(N * ph / 2) / (N * Math.sin(ph / 2)), 2);
      var tv = new THREE.Vector3(1, 0, 0); if (Math.abs(nv.dot(tv)) > 0.9) tv.set(0, 1, 0); tv.sub(nv.clone().multiplyScalar(nv.dot(tv))).normalize();
      var inD = tv.clone().multiplyScalar(Math.cos(th)).add(nv.clone().multiplyScalar(-Math.sin(th))), outD = tv.clone().multiplyScalar(Math.cos(th)).add(nv.clone().multiplyScalar(Math.sin(th)));
      T.span(st.inB, [-inD.x * 6, -inD.y * 6, -inD.z * 6], [0, 0, 0]); T.span(st.outB, [0, 0, 0], [outD.x * 6, outD.y * 6, outD.z * 6]); st.outB.material.opacity = 0.08 + 0.92 * I;
      S.set('d', f(d, 3) + ' nm'); S.set('n', f(2 * d * Math.sin(th) / p.lam, 3)); S.set('I', I > 0.5 ? 'bright: Bragg condition met' : I > 0.05 ? 'weak' : 'dark');
    }
  });

  /* ---------- 2D: wave packet and uncertainty ---------- */
  Sim.make('sim-packet', {
    aspect: 0.6, maxH: 520,
    controls: [{ k: 'dk', label: 'Spread of wavenumbers &Delta;k', min: 0.1, max: 3, step: 0.05, v: 0.8 }, { k: 'N', label: 'Number of waves added', min: 2, max: 60, step: 1, v: 30 }],
    reads: [{ k: 'dx', label: '&Delta;x (rms width)' }, { k: 'dkk', label: '&Delta;k (rms)' }, { k: 'pr', label: '&Delta;x &middot; &Delta;k', big: true }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, k0 = 8, N = Math.round(p.N), ks = [], ws = [], L = 30;
      for (var i = 0; i < N; i++) { var k = k0 - 2.5 * p.dk + 5 * p.dk * (N === 1 ? 0.5 : i / (N - 1)); ks.push(k); ws.push(Math.exp(-Math.pow(k - k0, 2) / (2 * p.dk * p.dk))); }
      var pts = [], env = [], s2 = 0, sx2 = 0, sk = 0, sk2 = 0, wsum = 0;
      for (var x = -L; x <= L; x += 0.05) { var y = 0, re = 0, im = 0; for (var j = 0; j < N; j++) { y += ws[j] * Math.cos(ks[j] * x); re += ws[j] * Math.cos((ks[j] - k0) * x); im += ws[j] * Math.sin((ks[j] - k0) * x); } var a2 = re * re + im * im; pts.push([x, y]); env.push([x, Math.sqrt(a2)]); s2 += a2; sx2 += a2 * x * x; }
      var amax = env.reduce(function (m, q) { return Math.max(m, q[1]); }, 0) || 1;
      ws.forEach(function (w, j) { var w2 = w * w; wsum += w2; sk += w2 * ks[j]; sk2 += w2 * ks[j] * ks[j]; });
      var dx = Math.sqrt(sx2 / s2), mk = sk / wsum, dK = Math.sqrt(sk2 / wsum - mk * mk);
      D.clear(c, W, H);
      var b1 = { x: W * 0.06, y: H * 0.05, w: W * 0.9, h: H * 0.5 }, b2 = { x: W * 0.06, y: H * 0.64, w: W * 0.9, h: H * 0.28 };
      D.graph(c, b1, { x0: -L, x1: L, y0: -1.15, y1: 1.15, xl: 'x →', yl: 'ψ(x)' }, [{ pts: env.map(function (q) { return [q[0], q[1] / amax]; }), color: K.c3, w: 1.5 }, { pts: pts.map(function (q) { return [q[0], q[1] / amax]; }), color: K.c1, w: 2 }]);
      var g2 = D.graph(c, b2, { x0: k0 - 8, x1: k0 + 8, y0: 0, y1: 1.1, xl: 'k →', yl: 'amount of each k' }, []);
      ks.forEach(function (k, j) { D.line(c, g2.px(k), g2.py(0), g2.px(k), g2.py(ws[j]), K.c4, Math.max(1.5, Math.min(5, 140 / N))); });
      S.set('dx', f(dx, 3)); S.set('dkk', f(dK, 3)); S.set('pr', f(dx * dK, 3) + ' (≥ 0.5)');
      S.msg(N < 12 ? 'Few waves: the packet repeats (the sum is periodic). Add more waves for a single isolated packet.' : '');
    }
  });

  /* ---------- 3D: pair production and annihilation ---------- */
  Sim.make('sim-pair3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.2, ph: 0.5, r: 16 },
    controls: [
      { k: 'E', label: 'Gamma-ray energy', min: 0.5, max: 6, step: 0.05, v: 3, unit: 'MeV' },
      { k: 'B', label: 'Magnetic field (up)', min: 0.3, max: 2, step: 0.1, v: 1, unit: 'T (scaled)' }
    ],
    buttons: [{ label: 'Fire gamma', click: function (S) { var st = S.st; st.mode = 'gamma'; st.gx = -8; st.parts = []; st.anni = null; } }, { label: 'Annihilate', click: function (S) { var st = S.st; st.mode = 'anni'; st.anni = { t: 0, dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize() }; st.parts = []; } }],
    reads: [{ k: 'th', label: 'Threshold 2m<sub>e</sub>c&sup2;' }, { k: 'K', label: 'Kinetic energy shared', big: true }, { k: 'st', label: 'What happened' }],
    init: function (S) {
      var st = S.st; st.mode = 'idle'; st.parts = [];
      S.scene.add(T.sphere(0.35, 0x9aa0b8));
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#c7c4e6'); T.setArrow(a, [i * 4, -2, j * 4], [0, 4, 0], 0.3); }
      st.gam = T.line(S.scene, 0xffb300, 200); st.tr = [T.line(S.scene, 0x1d4ed8, 1500), T.line(S.scene, 0xc62828, 1500)];
      st.dots = [T.sphere(0.15, 0x1d4ed8), T.sphere(0.15, 0xc62828)]; st.dots.forEach(function (d) { S.scene.add(d); });
      st.ph = [T.line(S.scene, 0xffb300, 200), T.line(S.scene, 0xffb300, 200)]; st.lb = [T.label(S.scene, '0.511 MeV', '#a15c07', 0.9), T.label(S.scene, '0.511 MeV', '#a15c07', 0.9)];
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, Kt = p.E - 1.022, msg = 'press Fire gamma';
      st.gam.visible = false; st.dots.forEach(function (d) { d.visible = false; }); st.tr.forEach(function (l) { l.visible = false; }); st.ph.forEach(function (l) { l.visible = false; }); st.lb.forEach(function (l) { l.visible = false; });
      if (st.mode === 'gamma') {
        st.gx += dt * 6; var pts = []; for (var s = 0; s < 4; s += 0.05) pts.push([st.gx - 4 + s, 0.25 * Math.sin(s * 8), 0]); T.setLine(st.gam, pts); st.gam.visible = true;
        if (st.gx > 0 && Kt > 0 && !st.parts.length) { var pmag = Math.sqrt(Math.pow(Kt / 2 + 0.511, 2) - 0.261); st.parts = [{ q: -1, p: new THREE.Vector3(0, 0, 0), v: new THREE.Vector3(1, 0, 0.35).normalize().multiplyScalar(pmag), tr: [] }, { q: 1, p: new THREE.Vector3(0, 0, 0), v: new THREE.Vector3(1, 0, -0.35).normalize().multiplyScalar(pmag), tr: [] }]; }
        if (st.gx > 0 && Kt > 0) { st.gam.visible = false; }
        msg = Kt > 0 ? (st.gx > 0 ? 'pair created: e⁻ (blue) and e⁺ (red) curl opposite ways' : 'gamma approaching the nucleus') : 'below 1.022 MeV: no pair, the photon passes through';
        if (st.gx > 10) st.mode = st.parts.length ? 'pair' : 'idle';
      }
      if (st.parts.length) {
        st.parts.forEach(function (o, i) {
          for (var k = 0; k < 6; k++) { var hh = dt / 6, Bv = new THREE.Vector3(0, p.B, 0), a = o.v.clone().cross(Bv).multiplyScalar(o.q * 0.9 / Math.max(0.6, o.v.length())); o.v.addScaledVector(a, hh); o.v.multiplyScalar(1 - 0.25 * hh); o.p.addScaledVector(o.v, hh * 1.4); }
          o.tr.push([o.p.x, o.p.y, o.p.z]); if (o.tr.length > 1500) o.tr.shift();
          st.dots[i].position.copy(o.p); st.dots[i].visible = true; T.setLine(st.tr[i], o.tr); st.tr[i].visible = true;
        });
        if (st.mode === 'pair') msg = 'they lose energy and spiral inward (as in a bubble chamber)';
      }
      if (st.mode === 'anni' && st.anni) {
        st.anni.t += dt; var d = st.anni.dir, L = Math.min(7, st.anni.t * 5);
        [1, -1].forEach(function (sg, i) { var pts = []; for (var s = 0; s <= L; s += 0.05) pts.push([sg * d.x * s - sg * d.z * 0.2 * Math.sin(s * 8), 0, sg * d.z * s + sg * d.x * 0.2 * Math.sin(s * 8)]); T.setLine(st.ph[i], pts); st.ph[i].visible = true; st.lb[i].position.set(sg * d.x * (L + 0.8), 0.5, sg * d.z * (L + 0.8)); st.lb[i].visible = true; });
        if (st.anni.t < 0.4) { st.dots.forEach(function (dd, i) { dd.visible = true; dd.position.set((i ? 1 : -1) * (1 - st.anni.t / 0.4) * 2, 0, 0); }); }
        msg = 'e⁻ + e⁺ → two 511 keV photons, back to back';
      }
      S.set('th', '1.022 MeV'); S.set('K', Kt > 0 ? f(Kt, 3) + ' MeV (' + f(Kt / 2, 3) + ' each)' : 'below threshold'); S.set('st', msg);
    }
  });
})();
