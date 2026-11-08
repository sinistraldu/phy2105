/* PHY1103 Unit 2: current and resistance simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp, e0 = 8.85e-12;

  /* ---------- 2D: Poisson between plates ---------- */
  Sim.make('sim-poisson', {
    aspect: 0.62, maxH: 520,
    controls: [
      { k: 'V0', label: 'Left plate V<sub>0</sub>', min: -10, max: 10, step: 0.5, v: 10, unit: 'V' },
      { k: 'VL', label: 'Right plate V<sub>L</sub>', min: -10, max: 10, step: 0.5, v: 0, unit: 'V' },
      { k: 'rho', label: 'Charge density &rho; in the gap', min: -3, max: 3, step: 0.1, v: 0, show: function (v) { return f(v, 3) + ' µC/m³'; } }
    ],
    reads: [{ k: 'Vm', label: 'V at the middle' }, { k: 'E0', label: 'E at the left plate' }, { k: 'EL', label: 'E at the right plate' }, { k: 'ext', label: 'Peak of V inside' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), L = 0.01, rho = p.rho * 1e-6, a = -rho / (2 * e0), A = (p.VL - p.V0 - a * L * L) / L;
      var V = function (x) { return a * x * x + A * x + p.V0; }, E = function (x) { return -(2 * a * x + A); };
      D.clear(c, W, H);
      var b1 = { x: W * 0.1, y: H * 0.05, w: W * 0.84, h: H * 0.42 }, b2 = { x: W * 0.1, y: H * 0.56, w: W * 0.84, h: H * 0.36 }, p1 = [], p2 = [];
      for (var x = 0; x <= L * 1.0001; x += L / 200) { p1.push([x * 1000, V(x)]); p2.push([x * 1000, E(x)]); }
      var g1 = D.graph(c, b1, { x0: 0, x1: 10, y0: -25, y1: 25, yl: 'V(x) (V)' }, [{ pts: p1, color: K.c1, w: 3 }]);
      var g2 = D.graph(c, b2, { x0: 0, x1: 10, y0: -5000, y1: 5000, xl: 'x (mm) →', yl: 'E = −dV/dx (V/m)' }, [{ pts: p2, color: K.c2, w: 3 }]);
      [-20, 0, 20].forEach(function (v) { D.text(c, String(v), b1.x - 4, g1.py(v), { size: 10, align: 'right', color: K.faint }); });
      [-5000, 0, 5000].forEach(function (v) { D.text(c, String(v), b2.x - 4, g2.py(v), { size: 10, align: 'right', color: K.faint }); });
      D.rect(c, b1.x - 10, b1.y, 8, b1.h, K.ink, null, 2); D.rect(c, b1.x + b1.w + 2, b1.y, 8, b1.h, K.ink, null, 2);
      if (Math.abs(p.rho) > 0.01) for (var i = 0; i < 18; i++) D.text(c, p.rho > 0 ? '+' : '−', b1.x + (i + 0.5) * b1.w / 18, b1.y + b1.h - 10, { align: 'center', size: 12, weight: 700, color: p.rho > 0 ? K.pos : K.neg });
      var xm = a !== 0 ? -A / (2 * a) : -1;
      S.set('Vm', f(V(L / 2), 3) + ' V'); S.set('E0', f(E(0), 3) + ' V/m'); S.set('EL', f(E(L), 3) + ' V/m');
      S.set('ext', xm > 0 && xm < L ? f(V(xm), 3) + ' V at x = ' + f(xm * 1000, 3) + ' mm' : 'none inside (monotonic)');
    }
  });

  /* ---------- 3D: polarization of a dielectric ---------- */
  Sim.make('sim-polarize3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.15, r: 13 },
    controls: [
      { k: 'E', label: 'Applied field E<sub>0</sub>', min: 0, max: 3, step: 0.1, v: 1.5, show: function (v) { return f(v, 3) + ' (units)'; } },
      { k: 'chi', label: 'Susceptibility &chi;<sub>e</sub>', min: 0, max: 6, step: 0.25, v: 3 },
      { k: 'T', label: 'Temperature (thermal jiggle)', min: 0.1, max: 3, step: 0.1, v: 0.8, show: function (v) { return '×' + v.toFixed(1); } }
    ],
    reads: [{ k: 'k', label: '&kappa; = 1 + &chi;<sub>e</sub>' }, { k: 'al', label: 'Average alignment' }, { k: 'Ein', label: 'Field inside E<sub>0</sub>/&kappa;', big: true }, { k: 'P', label: 'P = &epsilon;<sub>0</sub>&chi;<sub>e</sub>E (relative)' }],
    init: function (S) {
      var st = S.st; st.m = [];
      S.scene.add(new THREE.Mesh(new THREE.BoxGeometry(6, 4, 4), T.mat(0xb07a2a, { opacity: 0.12 })));
      var pl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.6, 4.6), T.mat(0xc62828)); pl.position.x = -3.6; S.scene.add(pl);
      var pr = pl.clone(); pr.material = T.mat(0x1d4ed8); pr.position.x = 3.6; S.scene.add(pr);
      for (var i = 0; i < 5; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < 4; k++) {
        var a = T.arrow(S.scene, '#4338ca'); st.m.push({ a: a, p: [-2.4 + i * 1.2, -1.5 + j, -1.5 + k], th: Math.random() * PI, ph: Math.random() * 2 * PI });
      }
      st.bl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), 60); S.scene.add(st.bl);
      st.m4 = new THREE.Matrix4(); st.cn = new THREE.Color(0x1d4ed8); st.cp = new THREE.Color(0xc62828);
      for (var q = 0; q < 60; q++) st.bl.setColorAt(q, q % 2 ? st.cp : st.cn);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, sum = 0, pull = p.E * p.chi * 0.6;
      st.m.forEach(function (o) {
        o.th += (-pull * Math.sin(o.th) * dt * 2) + (Math.random() - 0.5) * p.T * Math.sqrt(dt) * 2.5; o.ph += (Math.random() - 0.5) * p.T * Math.sqrt(dt) * 3;
        var dx = Math.cos(o.th), ds = Math.sin(o.th), v = [dx * 0.8, ds * Math.cos(o.ph) * 0.8, ds * Math.sin(o.ph) * 0.8];
        T.setArrow(o.a, [o.p[0] - v[0] / 2, o.p[1] - v[1] / 2, o.p[2] - v[2] / 2], v, 0.22); sum += dx;
      });
      var al = Math.max(0, sum / st.m.length), kap = 1 + p.chi, nb = Math.round(al * 30);
      st.bl.count = 2 * nb;
      for (var i = 0; i < nb; i++) { var y = -1.8 + (i % 6) * 0.72, z = -1.8 + Math.floor(i / 6) * 0.72; st.m4.makeTranslation(-3.15, y, z); st.bl.setMatrixAt(2 * i, st.m4); st.bl.setColorAt(2 * i, st.cn); st.m4.makeTranslation(3.15, y, z); st.bl.setMatrixAt(2 * i + 1, st.m4); st.bl.setColorAt(2 * i + 1, st.cp); }
      st.bl.instanceMatrix.needsUpdate = true; if (st.bl.instanceColor) st.bl.instanceColor.needsUpdate = true;
      S.set('k', f(kap, 3)); S.set('al', Math.round(al * 100) + '%'); S.set('Ein', f(p.E / kap, 3)); S.set('P', f(p.chi * p.E / kap, 3));
      S.msg('Small spheres on the faces: bound charge (− next to the + plate, + next to the − plate).');
    }
  });

  /* ---------- 3D: drift through a narrowing wire ---------- */
  function wireR(k, x) { return 1.2 - (1.2 - 1.2 * Math.sqrt(k)) * Math.exp(-Math.pow(x / 1.6, 4)); }
  Sim.make('sim-current3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.8, ph: 1.15, r: 13 },
    controls: [
      { k: 'I', label: 'Current I', min: 0, max: 5, step: 0.25, v: 2, unit: 'A' },
      { k: 'k', label: 'Narrow part: area (% of normal)', min: 20, max: 100, step: 5, v: 35, map: function (v) { return v / 100; }, show: function (v) { return Math.round(v * 100) + '%'; } }
    ],
    reads: [{ k: 'J1', label: 'J in the wide part (A = 1 mm&sup2;)' }, { k: 'J2', label: 'J in the narrow part', big: true }, { k: 'vd', label: 'Drift speed there (copper)' }],
    init: function (S) {
      var st = S.st; st.k = -1; st.e = [];
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), T.mat(0x1d4ed8), 320); S.scene.add(st.mesh);
      for (var i = 0; i < 320; i++) st.e.push({ x: Math.random() * 12 - 6, q: Math.sqrt(Math.random()) * 0.9, a: Math.random() * 6.28 });
      st.m4 = new THREE.Matrix4(); st.ja = [T.arrow(S.scene, '#c2410c'), T.arrow(S.scene, '#c2410c')];
      T.label(S.scene, 'conventional current I', '#c2410c', 1.1).position.set(-3.5, 2.4, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, k = p.k;
      if (st.k !== k) {
        st.k = k; if (st.wall) { S.scene.remove(st.wall); st.wall.geometry.dispose(); }
        var pr = []; for (var y = -6; y <= 6.001; y += 0.2) pr.push(new THREE.Vector2(wireR(k, y), y));
        st.wall = new THREE.Mesh(new THREE.LatheGeometry(pr, 40), T.mat(0xc98a3a, { opacity: 0.25, side: THREE.DoubleSide })); st.wall.rotation.z = PI / 2; S.scene.add(st.wall);
      }
      st.e.forEach(function (o, i) {
        var R = wireR(k, o.x), v = Math.pow(1.2 / R, 2); o.x -= dt * p.I * 0.35 * v; if (o.x < -6) o.x += 12;
        st.m4.makeTranslation(o.x + (Math.random() - 0.5) * 0.05, o.q * R * Math.cos(o.a), o.q * R * Math.sin(o.a)); st.mesh.setMatrixAt(i, st.m4);
      });
      st.mesh.instanceMatrix.needsUpdate = true;
      T.setArrow(st.ja[0], [-5, 1.7, 0], [Math.max(0.01, p.I * 0.5), 0, 0], 0.3); T.setArrow(st.ja[1], [-0.5, 1.7 * Math.sqrt(k) + 0.4, 0], [Math.max(0.01, p.I * 0.5 / k), 0, 0], 0.3);
      var J1 = p.I / 1e-6, J2 = J1 / k;
      S.set('J1', f(J1, 3) + ' A/m²'); S.set('J2', f(J2, 3) + ' A/m²'); S.set('vd', f(J2 / (8.5e28 * 1.6e-19) * 1000, 3) + ' mm/s');
      S.msg('Electrons (blue) drift opposite to the conventional current.');
    }
  });

  /* ---------- 2D: resistance of a wire ---------- */
  var mats = [['Copper', 1.7e-8, 0.0039], ['Aluminium', 2.8e-8, 0.0039], ['Nichrome', 1.1e-6, 0.0004], ['Carbon', 3.5e-5, -0.0005]];
  Sim.make('sim-wire', {
    aspect: 0.36, minH: 230,
    controls: [
      { k: 'L', label: 'Length L', min: 0.1, max: 20, step: 0.1, v: 10, unit: 'm' },
      { k: 'd', label: 'Diameter', min: 0.1, max: 3, step: 0.05, v: 1, unit: 'mm' },
      { k: 'T', label: 'Temperature', min: -50, max: 300, step: 5, v: 20, unit: '°C' }
    ],
    buttons: mats.map(function (m, i) { return { label: m[0], group: 'm', on: i === 0, click: function (S) { S.st.m = i; } }; }),
    reads: [{ k: 'rho', label: '&rho;(T) = &rho;<sub>0</sub>[1 + &alpha;(T &minus; 20)]' }, { k: 'R', label: 'R = &rho;L/A', big: true }, { k: 'G', label: 'Conductance G = 1/R' }],
    init: function (S) { S.st.m = 0; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), m = mats[S.st.m], rho = m[1] * (1 + m[2] * (p.T - 20)), A = PI * Math.pow(p.d / 2000, 2), R = rho * p.L / A;
      D.clear(c, W, H);
      var len = W * (0.15 + 0.75 * p.L / 20), th = 4 + p.d * 14, x0 = (W - len) / 2, cy = H * 0.45, hot = clamp((p.T - 20) / 280, 0, 1);
      D.rect(c, x0, cy - th / 2, len, th, 'rgba(' + Math.round(190 + 60 * hot) + ',' + Math.round(130 - 60 * hot) + ',60,0.85)', K.ink, th / 2, 1);
      D.text(c, m[0] + ' wire, L = ' + p.L + ' m, d = ' + p.d + ' mm', W / 2, H * 0.12, { align: 'center', size: 12.5, weight: 600 });
      D.text(c, hot > 0.05 ? 'hot' : p.T < 0 ? 'cold' : '', x0 + len + 18, cy, { size: 12, color: K.c2 });
      S.set('rho', f(rho, 3) + ' Ω·m'); S.set('R', R >= 1e3 ? f(R / 1e3, 3) + ' kΩ' : f(R, 3) + ' Ω'); S.set('G', f(1 / R, 3) + ' S');
    }
  });

  /* ---------- 2D: drift velocity ---------- */
  function resetE(S) { S.st.el = []; for (var i = 0; i < 40; i++) { var a = Math.random() * 2 * PI; S.st.el.push({ x: Math.random(), y: Math.random(), vx: Math.cos(a), vy: Math.sin(a), tc: Math.random() }); } S.st.trk = []; }
  Sim.make('sim-drift', {
    aspect: 0.48, animate: true,
    controls: [
      { k: 'E', label: 'Applied field E', min: 0, max: 3, step: 0.1, v: 1, show: function (v) { return f(v * 0.1, 3) + ' V/m'; } },
      { k: 'tau', label: 'Collision time &tau;', min: 0.5, max: 4, step: 0.1, v: 2, show: function (v) { return f(v * 1e-14, 3) + ' s'; } },
      { k: 'n', label: 'Electron density n', min: 2, max: 15, step: 0.5, v: 8.5, show: function (v) { return f(v * 1e28, 3) + ' m⁻³'; } }
    ],
    buttons: [{ label: 'Restart', click: resetE }],
    reads: [{ k: 'vd', label: 'v<sub>d</sub> = eE&tau;/m' }, { k: 'J', label: 'J = nev<sub>d</sub>' }, { k: 'sig', label: '&sigma; = ne&sup2;&tau;/m', big: true }, { k: 'rho', label: '&rho; = 1/&sigma;' }],
    init: resetE,
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), st = S.st, sp = 0.25, acc = p.E * 0.25;
      D.clear(c, W, H);
      for (var i = 0; i < 14; i++) for (var j = 0; j < 6; j++) D.circle(c, (i + 0.5) / 14 * W, (j + 0.5) / 6 * H, 4, K.grid);
      st.el.forEach(function (e, idx) {
        e.tc += dt / (p.tau * 0.25);
        if (e.tc > 1 && Math.random() < 0.5) { var a = Math.random() * 2 * PI; e.vx = Math.cos(a); e.vy = Math.sin(a); e.tc = 0; }
        e.vx -= acc * dt * 4; // electrons accelerate opposite to E (E points +x)
        e.x += e.vx * sp * dt * (H / W); e.y += e.vy * sp * dt;
        if (e.x < 0) e.x += 1; if (e.x > 1) e.x -= 1; if (e.y < 0) e.y += 1; if (e.y > 1) e.y -= 1;
        if (idx === 0) { st.trk.push([e.x * W, e.y * H]); if (st.trk.length > 220) st.trk.shift(); }
        D.circle(c, e.x * W, e.y * H, idx === 0 ? 6 : 3.5, idx === 0 ? K.c2 : K.neg);
      });
      for (var t = 1; t < st.trk.length; t++) if (Math.abs(st.trk[t][0] - st.trk[t - 1][0]) < W / 2 && Math.abs(st.trk[t][1] - st.trk[t - 1][1]) < H / 2) D.line(c, st.trk[t - 1][0], st.trk[t - 1][1], st.trk[t][0], st.trk[t][1], 'rgba(194,65,12,0.5)', 1.5);
      if (p.E > 0) { D.arrow(c, W * 0.06, 18, W * 0.06 + 40 + p.E * 30, 18, K.c3, 3); D.text(c, 'E', W * 0.06 + 50 + p.E * 30, 18, { weight: 700, color: K.c3 }); D.arrow(c, W * 0.94, 18, W * 0.94 - 30 - p.E * 20, 18, K.neg, 3); D.text(c, 'drift', W * 0.94 - 40 - p.E * 20, 18, { align: 'right', size: 12, color: K.neg }); }
      var e = 1.6e-19, me = 9.11e-31, E = p.E * 0.1, tau = p.tau * 1e-14, n = p.n * 1e28, vd = e * E * tau / me, sig = n * e * e * tau / me;
      S.set('vd', f(vd, 3) + ' m/s'); S.set('J', f(n * e * vd, 3) + ' A/m²'); S.set('sig', f(sig, 3) + ' S/m'); S.set('rho', f(1 / sig, 3) + ' Ω·m');
    }
  });

  /* ---------- 2D: resistor colour code ---------- */
  var cols = ['#111111', '#7b3f00', '#d32f2f', '#f57c00', '#fbc02d', '#2e7d32', '#1565c0', '#7b1fa2', '#9e9e9e', '#fafafa'], names = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
  Sim.make('sim-colour', {
    aspect: 0.32, minH: 210,
    controls: [
      { k: 'b1', label: 'Band 1 (first digit)', min: 1, max: 9, step: 1, v: 4, show: function (v) { return names[v] + ' = ' + v; } },
      { k: 'b2', label: 'Band 2 (second digit)', min: 0, max: 9, step: 1, v: 7, show: function (v) { return names[v] + ' = ' + v; } },
      { k: 'b3', label: 'Band 3 (multiplier)', min: 0, max: 6, step: 1, v: 2, show: function (v) { return names[v] + ' = ×10' + ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶'][v]; } }
    ],
    buttons: [{ label: 'Gold 5%', group: 't', on: true, click: function (S) { S.st.tol = 5; } }, { label: 'Silver 10%', group: 't', click: function (S) { S.st.tol = 10; } },
      { k: 'quiz', label: 'Quiz me', click: function (S) { S.st.quiz = true; S.setControl('b1', 1 + Math.floor(Math.random() * 9)); S.setControl('b2', Math.floor(Math.random() * 10)); S.setControl('b3', Math.floor(Math.random() * 6)); } },
      { label: 'Show answer', click: function (S) { S.st.quiz = false; } }],
    reads: [{ k: 'R', label: 'Resistance', big: true }, { k: 'rng', label: 'Range (tolerance)' }],
    init: function (S) { S.st.tol = 5; S.st.quiz = false; },
    onChange: function (S) { S.st.quiz = false; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), R = (p.b1 * 10 + p.b2) * Math.pow(10, p.b3), cx = W / 2, cy = H * 0.5, bw = W * 0.5, bh = H * 0.36;
      D.clear(c, W, H);
      D.line(c, W * 0.06, cy, W * 0.94, cy, K.muted, 4);
      D.rect(c, cx - bw / 2, cy - bh / 2, bw, bh, '#e6d3a8', '#a38956', bh / 2.2, 1.5);
      [p.b1, p.b2, p.b3].forEach(function (b, i) { D.rect(c, cx - bw * 0.3 + i * bw * 0.16, cy - bh / 2, bw * 0.08, bh, cols[b], null, 0); });
      D.rect(c, cx + bw * 0.28, cy - bh / 2, bw * 0.06, bh, S.st.tol === 5 ? '#c9a227' : '#c0c0c0', null, 0);
      var txt = R >= 1e6 ? f(R / 1e6, 3) + ' MΩ' : R >= 1e3 ? f(R / 1e3, 3) + ' kΩ' : f(R, 3) + ' Ω';
      S.set('R', S.st.quiz ? '? (work it out)' : txt + ' ±' + S.st.tol + '%');
      S.set('rng', S.st.quiz ? '?' : f(R * (1 - S.st.tol / 100), 3) + ' to ' + f(R * (1 + S.st.tol / 100), 3) + ' Ω');
    }
  });

  /* ---------- 2D: EMF, internal resistance, power ---------- */
  Sim.make('sim-emf', {
    aspect: 0.5,
    controls: [
      { k: 'E', label: 'EMF &epsilon;', min: 1, max: 24, step: 0.5, v: 12, unit: 'V' },
      { k: 'r', label: 'Internal resistance r', min: 0.1, max: 5, step: 0.1, v: 1, unit: 'Ω' },
      { k: 'R', label: 'Load resistance R', min: 0, max: 20, step: 0.1, v: 3, unit: 'Ω' }
    ],
    reads: [{ k: 'I', label: 'I = &epsilon;/(R + r)' }, { k: 'V', label: 'Terminal voltage &epsilon; &minus; Ir' }, { k: 'P', label: 'Power in load I&sup2;R', big: true }, { k: 'eff', label: 'Efficiency R/(R + r)' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), I = p.E / (p.R + p.r), V = p.E - I * p.r, P = I * I * p.R, Pmax = p.E * p.E / (4 * p.r);
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.08, w: W * 0.86, h: H * 0.76 }, pts = [];
      for (var R = 0; R <= 20.001; R += 0.05) pts.push([R, p.E * p.E * R / Math.pow(R + p.r, 2)]);
      var g = D.graph(c, box, { x0: 0, x1: 20, y0: 0, y1: Math.max(Pmax * 1.15, 1), xl: 'load R (Ω) →', yl: 'power in the load (W)', vlines: [{ x: p.r, label: 'R = r', color: K.c2 }], dots: [{ x: p.R, y: P, color: K.c1, r: 7 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [0, 5, 10, 15, 20].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('I', f(I, 3) + ' A'); S.set('V', f(V, 3) + ' V'); S.set('P', f(P, 3) + ' W (max ' + f(Pmax, 3) + ' W)'); S.set('eff', f(p.R / (p.R + p.r) * 100, 3) + '%');
    }
  });
})();
