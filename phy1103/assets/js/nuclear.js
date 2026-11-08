/* PHY1103 Unit 7: nuclear physics simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  var uMeV = 931.5, mH = 1.007825, mN = 1.008665;

  /* semi-empirical binding energy (MeV) */
  function BE(A, Z) {
    var N = A - Z, d = 0;
    if (Z % 2 === 0 && N % 2 === 0) d = 1; else if (Z % 2 === 1 && N % 2 === 1) d = -1;
    return 15.75 * A - 17.8 * Math.pow(A, 2 / 3) - 0.711 * Z * (Z - 1) / Math.pow(A, 1 / 3) - 23.7 * Math.pow(A - 2 * Z, 2) / A + d * 11.18 / Math.sqrt(A);
  }
  function Zstable(A) { return Math.max(1, Math.round(A / (1.98 + 0.0155 * Math.pow(A, 2 / 3)))); }
  var real = [['²H', 2, 1, 2.014102], ['⁴He', 4, 2, 4.002603], ['¹²C', 12, 6, 12.0], ['¹⁶O', 16, 8, 15.994915], ['⁵⁶Fe', 56, 26, 55.934936], ['¹²⁰Sn', 120, 50, 119.902199], ['²³⁵U', 235, 92, 235.043930], ['²³⁸U', 238, 92, 238.050788]];
  var sym = { 1: 'H', 2: 'He', 3: 'Li', 6: 'C', 8: 'O', 26: 'Fe', 50: 'Sn', 92: 'U' };

  /* ---------- 2D: binding energy per nucleon ---------- */
  Sim.make('sim-binding', {
    aspect: 0.5,
    controls: [{ k: 'A', label: 'Mass number A (formula)', min: 10, max: 250, step: 1, v: 56 }],
    buttons: real.map(function (r, j) { return { label: r[0], group: 'n', on: j === 4, click: function (S) { S.st.r = j; S.setControl('A', clamp(r[1], 10, 250)); } }; }),
    reads: [{ k: 'zn', label: 'Protons Z, neutrons N' }, { k: 'dm', label: 'Mass defect &Delta;m = Zm<sub>H</sub> + Nm<sub>n</sub> &minus; M' }, { k: 'B', label: 'Binding energy B = &Delta;m &times; 931.5 MeV/u' }, { k: 'BA', label: 'B/A', big: true }, { k: 'R', label: 'Radius R = 1.2 A<sup>1/3</sup> fm' }],
    init: function (S) { S.st.r = 4; },
    onChange: function (S) { S.st.r = -1; document.querySelectorAll('#sim-binding [data-group="n"]').forEach(function (b) { b.classList.remove('on'); }); },
    draw: function (S, c, W, H) {
      var K = C(), pts = [], A, Z, B, dm, label;
      for (var a = 10; a <= 250; a++) { var z = Zstable(a); pts.push([a, BE(a, z) / a]); }
      if (S.st.r >= 0) { var r = real[S.st.r]; A = r[1]; Z = r[2]; dm = Z * mH + (A - Z) * mN - r[3]; B = dm * uMeV; label = r[0] + ' (measured mass ' + r[3] + ' u)'; }
      else { A = S.p.A; Z = Zstable(A); B = BE(A, Z); dm = B / uMeV; label = 'A = ' + A + ' (formula)'; }
      D.clear(c, W, H);
      var box = { x: W * 0.07, y: H * 0.06, w: W * 0.9, h: H * 0.8 };
      var dots = real.map(function (r) { var d = r[2] * mH + (r[1] - r[2]) * mN - r[3]; return { x: r[1], y: d * uMeV / r[1], r: 4, color: K.c2 }; });
      dots.push({ x: A, y: B / A, r: 8, color: K.pos });
      var g = D.graph(c, box, { x0: 0, x1: 250, y0: 0, y1: 10, xl: 'mass number A →', yl: 'binding energy per nucleon (MeV)', hlines: [{ y: 8.79, label: 'peak ≈ 8.8 MeV near ⁵⁶Fe', color: K.faint }], dots: dots }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      real.forEach(function (r) { var d = r[2] * mH + (r[1] - r[2]) * mN - r[3]; D.text(c, r[0], g.px(r[1]) + 6, g.py(d * uMeV / r[1]) + 11, { size: 11, color: K.c2, weight: 600 }); });
      D.arrow(c, g.px(20), g.py(3.2), g.px(52), g.py(3.2), K.c3, 2); D.text(c, 'fusion releases energy', g.px(14), g.py(2.5), { size: 11.5, color: K.c3, weight: 700 });
      D.arrow(c, g.px(235), g.py(3.2), g.px(125), g.py(3.2), K.c4, 2); D.text(c, 'fission releases energy', g.px(232), g.py(2.5), { size: 11.5, color: K.c4, weight: 700, align: 'right' });
      [0, 50, 100, 150, 200, 250].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      [2, 4, 6, 8].forEach(function (u) { D.text(c, String(u), box.x - 6, g.py(u), { size: 10, align: 'right', color: K.faint }); });
      D.text(c, label, box.x + box.w - 8, box.y + box.h - 30, { size: 12, align: 'right', color: K.pos, weight: 700, bg: K.bg });
      S.set('zn', Z + (sym[Z] ? ' (' + sym[Z] + ')' : '') + ', ' + (A - Z)); S.set('dm', f(dm, 4) + ' u'); S.set('B', f(B, 4) + ' MeV'); S.set('BA', f(B / A, 3) + ' MeV'); S.set('R', f(1.2 * Math.pow(A, 1 / 3), 3) + ' fm');
    }
  });

  /* ---------- 2D: random decay of many atoms ---------- */
  function resetDecay(S) {
    var st = S.st, n = Math.round(S.p.N0), tau = S.p.T / Math.LN2; st.t = 0; st.hist = [[0, n]];
    st.tdec = []; for (var i = 0; i < n; i++) st.tdec.push(-tau * Math.log(1 - Math.random()));
  }
  Sim.make('sim-decay', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'N0', label: 'Starting number of nuclei N<sub>0</sub>', min: 50, max: 400, step: 10, v: 400 },
      { k: 'T', label: 'Half-life T<sub>1/2</sub>', min: 1, max: 10, step: 0.5, v: 3, unit: 's' }
    ],
    buttons: [{ label: 'Restart', click: resetDecay }],
    reads: [{ k: 'N', label: 'Nuclei left N (count)' }, { k: 'Nth', label: 'Theory N<sub>0</sub>e<sup>&minus;&lambda;t</sup>', big: true }, { k: 'lam', label: '&lambda; = ln2 / T<sub>1/2</sub>; mean life &tau; = 1/&lambda;' }, { k: 'act', label: 'Activity A = &lambda;N' }],
    init: resetDecay, onChange: resetDecay,
    draw: function (S, c, W, H, dt) {
      var K = C(), st = S.st, p = S.p, n = st.tdec.length, lam = Math.LN2 / p.T, tmax = 5 * p.T;
      if (st.t < tmax) st.t = Math.min(tmax, st.t + dt);
      var left = 0; st.tdec.forEach(function (td) { if (td > st.t) left++; });
      if (st.t > st.hist[st.hist.length - 1][0] + 0.05) st.hist.push([st.t, left]);
      D.clear(c, W, H);
      var gw = Math.min(W * 0.4, H * 0.86), cols = 20, cell = gw / cols, x0 = W * 0.03, y0 = (H - gw) / 2;
      for (var i = 0; i < n; i++) {
        var cx = x0 + (i % cols + 0.5) * cell, cy = y0 + (Math.floor(i / cols) + 0.5) * cell, alive = st.tdec[i] > st.t, fresh = !alive && st.t - st.tdec[i] < 0.25;
        D.circle(c, cx, cy, cell * 0.36, alive ? K.c1 : fresh ? K.pos : K.grid);
      }
      D.text(c, 'blue: not yet decayed', x0, y0 - 10, { size: 11, color: K.muted });
      var box = { x: W * 0.48, y: H * 0.06, w: W * 0.49, h: H * 0.8 }, th = [];
      for (var t = 0; t <= tmax; t += tmax / 200) th.push([t, n * Math.exp(-lam * t)]);
      var vl = []; for (var k = 1; k <= 4; k++) vl.push({ x: k * p.T, label: k + 'T½', color: K.faint });
      var g = D.graph(c, box, { x0: 0, x1: tmax, y0: 0, y1: n * 1.08, xl: 'time (s) →', yl: 'N', vlines: vl, hlines: [{ y: n / 2, label: 'N₀/2' }, { y: n / 4, label: 'N₀/4' }] }, [{ pts: th, color: K.c2, w: 2, dash: [5, 4] }, { pts: st.hist, color: K.c1, w: 2.5 }]);
      D.circle(c, g.px(st.t), g.py(left), 5, K.pos);
      S.set('N', left + ' at t = ' + f(st.t, 2) + ' s'); S.set('Nth', f(n * Math.exp(-lam * st.t), 3)); S.set('lam', f(lam, 3) + ' s⁻¹; τ = ' + f(1 / lam, 3) + ' s'); S.set('act', f(lam * left, 3) + ' decays/s');
    }
  });

  /* ---------- 2D: radioactive series A -> B -> C ---------- */
  Sim.make('sim-series', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'TA', label: 'Half-life of parent A', min: 0.5, max: 20, step: 0.5, v: 8, unit: 'h' },
      { k: 'TB', label: 'Half-life of daughter B', min: 0.5, max: 20, step: 0.5, v: 2, unit: 'h' }
    ],
    reads: [{ k: 'tm', label: 'Time of maximum daughter t<sub>m</sub>', big: true }, { k: 'now', label: 'At the cursor: A, B, C (% of N<sub>0</sub>)' }, { k: 'reg', label: 'Regime' }],
    draw: function (S, c, W, H) {
      var K = C(), la = Math.LN2 / S.p.TA, lb = Math.LN2 / S.p.TB, tmax = 4 * Math.max(S.p.TA, S.p.TB) + 2;
      var NB = function (t) { return Math.abs(lb - la) < 1e-6 ? la * t * Math.exp(-la * t) : la / (lb - la) * (Math.exp(-la * t) - Math.exp(-lb * t)); };
      var pa = [], pb = [], pc = [];
      for (var t = 0; t <= tmax; t += tmax / 300) { var a = Math.exp(-la * t), b = NB(t); pa.push([t, a]); pb.push([t, b]); pc.push([t, 1 - a - b]); }
      var tm = Math.abs(lb - la) < 1e-6 ? 1 / la : Math.log(lb / la) / (lb - la), tc = (S.t * tmax / 10) % tmax;
      D.clear(c, W, H);
      var box = { x: W * 0.06, y: H * 0.06, w: W * 0.68, h: H * 0.8 };
      var g = D.graph(c, box, { x0: 0, x1: tmax, y0: 0, y1: 1.05, xl: 'time (h) →', yl: 'fraction of N₀', vlines: [{ x: tm, label: 't_m', color: K.c3 }, { x: tc, color: K.faint }] }, [{ pts: pa, color: K.c1, w: 2.5 }, { pts: pb, color: K.c3, w: 2.5 }, { pts: pc, color: K.c4, w: 2.5 }]);
      var va = Math.exp(-la * tc), vb = NB(tc), vc = 1 - va - vb;
      [[va, K.c1, 'A parent'], [vb, K.c3, 'B daughter'], [vc, K.c4, 'C stable']].forEach(function (q, i) {
        D.circle(c, g.px(tc), g.py(q[0]), 5, q[1]);
        var bx = W * 0.78 + i * W * 0.07, bh = q[0] * box.h;
        D.rect(c, bx, box.y + box.h - bh, W * 0.05, bh, q[1], null, 3);
        D.text(c, q[2].split(' ')[0], bx + W * 0.025, box.y + box.h + 12, { size: 12, align: 'center', color: q[1], weight: 700 });
      });
      D.rect(c, W * 0.775, box.y, W * 0.215, box.h, null, K.line, 6, 1);
      var reg = S.p.TA > 5 * S.p.TB ? 'parent lives much longer: B/A settles to a constant (equilibrium)' : S.p.TA > S.p.TB ? 'parent lives longer: transient equilibrium, B decays with A’s half-life' : 'daughter lives longer: no equilibrium, A is used up first';
      S.set('tm', f(tm, 3) + ' h'); S.set('now', f(100 * va, 3) + ', ' + f(100 * vb, 3) + ', ' + f(100 * vc, 3)); S.set('reg', reg);
    }
  });

  /* ---------- 2D: alpha, beta, gamma ---------- */
  var absorbers = [['No absorber', 0], ['Paper', 1], ['5 mm aluminium', 2], ['5 cm lead', 3]];
  Sim.make('sim-abg', {
    aspect: 0.5, animate: true,
    controls: [{ k: 'B', label: 'Magnetic field into the screen', min: 0, max: 1, step: 0.05, v: 0.5, unit: '(scaled)' }],
    buttons: absorbers.map(function (a, j) { return { label: a[0], group: 'ab', on: j === 0, click: function (S) { S.st.ab = a[1]; } }; }),
    reads: [{ k: 'a', label: '&alpha; (helium nucleus, +2e)' }, { k: 'b', label: '&beta;<sup>&minus;</sup> (electron, &minus;e)' }, { k: 'g', label: '&gamma; (photon, no charge)' }],
    init: function (S) { S.st.ab = 0; S.st.ps = []; S.st.next = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), st = S.st, Bf = S.p.B, sx = W * 0.08, sy = H * 0.5, xa = W * 0.62, sc = W / 900;
      var spec = { a: { v: 160, w: -0.9, col: K.c4, stop: 1 }, b: { v: 330, w: 4.2, col: K.c1, stop: 2 }, g: { v: 480, w: 0, col: K.c3, stop: 9 } };
      st.next -= dt; if (st.next <= 0 && dt > 0) { st.next = 0.09; ['a', 'b', 'g'].forEach(function (k) { st.ps.push({ k: k, x: sx, y: sy, th: (Math.random() - 0.5) * 0.06, tr: [] }); }); }
      D.clear(c, W, H);
      for (var gx = W * 0.15; gx < W * 0.98; gx += 34 * sc) for (var gy = H * 0.1; gy < H * 0.92; gy += 34 * sc) if (Bf > 0) { D.text(c, '×', gx, gy, { size: 10 + 6 * Bf, align: 'center', color: K.grid }); }
      if (st.ab) { var aw = [0, 4, 12, 30][st.ab] * sc; D.rect(c, xa, H * 0.06, aw, H * 0.88, [0, '#e9dfc7', '#b9bfcc', '#6b6f7e'][st.ab], K.line, 2); D.text(c, absorbers[st.ab][0], xa + aw / 2, H * 0.04 + 4, { size: 11, align: 'center', color: K.muted, weight: 600 }); }
      D.rect(c, sx - 26 * sc, sy - 14 * sc, 26 * sc, 28 * sc, K.ink, null, 3); D.text(c, 'source', sx - 13 * sc, sy + 26 * sc, { size: 11, align: 'center', color: K.muted });
      st.ps = st.ps.filter(function (q) {
        var s = spec[q.k], steps = 4, h = dt / steps;
        for (var i = 0; i < steps; i++) {
          q.th += s.w * Bf * h * (s.v / 330); q.x += s.v * sc * Math.cos(q.th) * h; q.y += s.v * sc * Math.sin(q.th) * h;
          if (st.ab && q.x >= xa && !q.passed) { if (st.ab >= s.stop || (q.k === 'g' && st.ab === 3 && Math.random() < 0.6)) { q.dead = 0.3; break; } q.passed = true; }
        }
        if (q.dead !== undefined) { q.dead -= dt; if (q.dead < 0) return false; }
        return q.x < W && q.y > 0 && q.y < H && q.x > 0;
      });
      st.ps.forEach(function (q) { var s = spec[q.k]; D.circle(c, q.x, q.y, q.k === 'a' ? 4.5 : q.k === 'b' ? 2.6 : 2.2, q.dead !== undefined ? K.faint : s.col); });
      D.text(c, 'α curves up (positive, heavy: gentle bend)', W * 0.16, H * 0.1, { size: 11.5, color: K.c4, weight: 700, bg: K.bg });
      D.text(c, 'β⁻ curves down sharply (negative, light)', W * 0.16, H * 0.9, { size: 11.5, color: K.c1, weight: 700, bg: K.bg });
      D.text(c, 'γ goes straight', W * 0.86, sy - 14, { size: 11.5, color: K.c3, weight: 700, align: 'center', bg: K.bg });
      var stops = ['passes', 'stopped'];
      S.set('a', (st.ab >= 1 ? 'stopped by ' + absorbers[st.ab][0].toLowerCase() : 'passes') + ' · range ~ 5 cm air · strongly ionising');
      S.set('b', (st.ab >= 2 ? 'stopped' : 'passes') + ' · range ~ 1 m air · moderately ionising');
      S.set('g', (st.ab === 3 ? 'reduced (exponential), not stopped' : stops[0]) + ' · very penetrating · weakly ionising');
    }
  });

  /* ---------- 3D: build a nucleus ---------- */
  var packPts = (function () {
    var pts = [], n = 6;
    for (var i = -n; i <= n; i++) for (var j = -n; j <= n; j++) for (var k = -n; k <= n; k++) if ((i + j + k) % 2 === 0) pts.push([i * 0.7071, j * 0.7071, k * 0.7071]);
    pts.forEach(function (p) { p.push(Math.hypot(p[0], p[1] + 0.13, p[2] + 0.07)); });
    pts.sort(function (a, b) { return a[3] - b[3]; });
    return pts.slice(0, 260);
  })();
  Sim.make('sim-nucleus3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.1, r: 14 },
    controls: [
      { k: 'Z', label: 'Protons Z', min: 1, max: 100, step: 1, v: 26 },
      { k: 'N', label: 'Neutrons N', min: 0, max: 150, step: 1, v: 30 },
      { k: 'j', label: 'Jiggle (nucleon motion)', min: 0, max: 1, step: 0.05, v: 0.3 }
    ],
    buttons: [['⁴He', 2, 2], ['¹²C', 6, 6], ['⁵⁶Fe', 26, 30], ['¹⁹⁷Au', 79, 118], ['²³⁸U', 92, 146]].map(function (q) { return { label: q[0], click: function (S) { S.setControl('Z', q[1]); S.setControl('N', q[2]); } }; }),
    reads: [{ k: 'A', label: 'A = Z + N' }, { k: 'R', label: 'R = R<sub>0</sub>A<sup>1/3</sup> (R<sub>0</sub> = 1.2 fm)', big: true }, { k: 'rho', label: 'Density A / (4&pi;R&sup3;/3)' }, { k: 'ba', label: 'B/A (formula) and stability' }],
    init: function (S) {
      var st = S.st, cp = new THREE.Color(0xc62828), cn = new THREE.Color(0x8a8fa8);
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 16, 12), T.mat(0xffffff), 260); st.m4 = new THREE.Matrix4();
      for (var i = 0; i < 260; i++) st.mesh.setColorAt(i, i % 2 ? cn : cp);
      S.scene.add(st.mesh);
      st.shell = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), T.mat(0x4338ca, { opacity: 0.12 })); S.scene.add(st.shell);
      st.cp = cp; st.cn = cn; st.key = '';
      st.lb = T.label(S.scene, 'red = proton, grey = neutron', '#4338ca', 1.1); st.lb.position.set(0, -5.2, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, Z = p.Z, N = p.N, A = Z + N, sc = 0.62, key = Z + '/' + N;
      if (key !== st.key) {
        st.key = key;
        for (var i = 0; i < Math.min(A, 260); i++) st.mesh.setColorAt(i, Math.floor((i + 1) * Z / A) > Math.floor(i * Z / A) ? st.cp : st.cn);
        st.mesh.instanceColor.needsUpdate = true; st.mesh.count = Math.min(A, 260);
      }
      var amp = p.j * 0.12;
      for (var k = 0; k < st.mesh.count; k++) { var q = packPts[k], ph = S.t * 9 + k * 1.7; st.m4.makeTranslation(q[0] * sc + amp * Math.sin(ph), q[1] * sc + amp * Math.sin(ph * 1.3 + 1), q[2] * sc + amp * Math.cos(ph * 0.9)); st.mesh.setMatrixAt(k, st.m4); }
      st.mesh.instanceMatrix.needsUpdate = true;
      var Rv = packPts[Math.min(A, 260) - 1][3] * sc + 0.5; st.shell.scale.set(Rv, Rv, Rv);
      var R = 1.2 * Math.pow(A, 1 / 3), rho = A / (4 / 3 * PI * Math.pow(R * 1e-15, 3)) * 1.67e-27;
      var b = A > 4 ? BE(A, Z) / A : null, zs = Zstable(A), stab = Math.abs(Z - zs) <= Math.max(1, A * 0.02) ? 'near the stability line' : Z > zs ? 'too many protons (β⁺ / α decay)' : 'too many neutrons (β⁻ decay)';
      S.set('A', String(A) + (A > 260 ? ' (showing 260)' : '')); S.set('R', f(R, 3) + ' fm'); S.set('rho', f(rho, 3) + ' kg/m³ (same for all nuclei)');
      S.set('ba', (b === null ? 'light nucleus' : f(b, 3) + ' MeV') + ' · ' + (A > 209 ? 'A > 209: unstable (α)' : stab));
    }
  });

  /* ---------- 3D: chain reaction ---------- */
  var NU = 400;
  function resetChain(S) {
    var st = S.st; st.fuel = []; st.neut = []; st.fis = 0; st.gen = 0; st.maxN = 0; st.flash = [];
    for (var i = 0; i < NU; i++) { var r = 4.5 * Math.cbrt(Math.random()), th = Math.acos(2 * Math.random() - 1), ph = 2 * PI * Math.random(); st.fuel.push({ p: new THREE.Vector3(r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)), used: false }); }
    var g = new THREE.Color(0x2f6b3a), m = st.m4;
    st.fuel.forEach(function (u, i) { m.makeTranslation(u.p.x, u.p.y, u.p.z); st.um.setMatrixAt(i, m); st.um.setColorAt(i, g); });
    st.um.instanceMatrix.needsUpdate = true; st.um.instanceColor.needsUpdate = true;
  }
  function fire(S, from, gen) {
    var st = S.st, free = st.fuel.filter(function (u) { return !u.used; });
    if (!free.length || st.neut.length > 590) return;
    var tg = null, best = 1e9;
    for (var i = 0; i < 6; i++) { var u = free[Math.floor(Math.random() * free.length)], d = u.p.distanceTo(from); if (d < best) { best = d; tg = u; } }
    st.neut.push({ p: from.clone(), tg: tg, gen: gen, sp: 5 + Math.random() * 3 });
  }
  Sim.make('sim-chain3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.4, ph: 1.15, r: 15 },
    controls: [{ k: 'k', label: 'Multiplication factor k (control rods in &rarr; smaller k)', min: 0.5, max: 2.5, step: 0.05, v: 1.5 }],
    buttons: [{ label: 'Send one neutron', click: function (S) { fire(S, new THREE.Vector3(-7, 0, 0), 1); S.st.neut[S.st.neut.length - 1].sure = true; S.st.neut[S.st.neut.length - 1].sp = 6; } }, { label: 'Reset fuel', click: resetChain }],
    reads: [{ k: 'gen', label: 'Generation' }, { k: 'n', label: 'Neutrons in flight' }, { k: 'fis', label: 'Fissions so far', big: true }, { k: 'E', label: 'Energy released (&asymp; 200 MeV each)' }, { k: 'reg', label: 'Regime' }],
    init: function (S) {
      var st = S.st; st.m4 = new THREE.Matrix4();
      st.um = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), T.mat(0xffffff), NU); S.scene.add(st.um);
      st.nm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), T.mat(0x1d4ed8), 600); st.nm.count = 0; S.scene.add(st.nm);
      st.fl = []; for (var i = 0; i < 40; i++) { var s = T.sphere(1, 0xffb300, { opacity: 0.5 }); s.visible = false; S.scene.add(s); st.fl.push(s); }
      resetChain(S);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, k = S.p.k, grey = new THREE.Color(0xb5b0a0), old = st.neut;
      st.neut = [];
      old.forEach(function (n) {
        var d = n.tg.p.clone().sub(n.p), L = d.length(), step = n.sp * dt;
        if (L > step) { n.p.addScaledVector(d.normalize(), step); st.neut.push(n); return; }
        if (n.tg.used) { fire(S, n.p, n.gen); if (n.sure && st.neut.length) st.neut[st.neut.length - 1].sure = true; return; }
        if (n.sure || Math.random() < k / 2.5) {
          var u = n.tg, idx = st.fuel.indexOf(u); u.used = true; st.fis++; st.gen = Math.max(st.gen, n.gen);
          st.um.setColorAt(idx, grey); st.um.instanceColor.needsUpdate = true;
          st.flash.push({ p: u.p.clone(), t: 0 });
          var m = Math.random() < 0.5 ? 2 : 3; for (var j = 0; j < m; j++) fire(S, u.p, n.gen + 1);
        }
      });
      st.maxN = Math.max(st.maxN, st.neut.length);
      st.nm.count = Math.min(st.neut.length, 600);
      for (var i = 0; i < st.nm.count; i++) { var q = st.neut[i].p; st.m4.makeTranslation(q.x, q.y, q.z); st.nm.setMatrixAt(i, st.m4); }
      st.nm.instanceMatrix.needsUpdate = true;
      st.flash = st.flash.filter(function (fl) { fl.t += dt; return fl.t < 0.4; });
      st.fl.forEach(function (s, i) { var fl = st.flash[st.flash.length - 1 - i]; s.visible = !!fl; if (fl) { s.position.copy(fl.p); var r = 0.2 + fl.t * 2; s.scale.set(r, r, r); s.material.opacity = 0.6 * (1 - fl.t / 0.4); } });
      var reg = k < 0.98 ? 'subcritical (k < 1): the chain dies out' : k <= 1.02 ? 'critical (k = 1): steady, as in a power reactor' : 'supercritical (k > 1): grows each generation (bomb if uncontrolled)';
      S.set('gen', String(st.gen)); S.set('n', String(st.neut.length)); S.set('fis', st.fis + ' of ' + NU + ' nuclei'); S.set('E', f(st.fis * 200, 3) + ' MeV = ' + f(st.fis * 200 * 1.602e-13, 3) + ' J'); S.set('reg', reg);
    }
  });
})();
