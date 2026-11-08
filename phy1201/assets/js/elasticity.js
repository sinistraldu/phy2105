/* PHY1201 Unit 1: elasticity simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }

  /* ---------- 3D: states of matter ---------- */
  var NA = 125;
  Sim.make('sim-states3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.15, r: 17 },
    controls: [{ k: 'T', label: 'Temperature (relative to melting point)', min: 0.1, max: 3, step: 0.05, v: 0.5 }],
    buttons: [{ label: 'Solid', click: function (S) { S.setControl('T', 0.5); } }, { label: 'Liquid', click: function (S) { S.setControl('T', 1.5); } }, { label: 'Gas', click: function (S) { S.setControl('T', 2.7); } }],
    reads: [{ k: 'st', label: 'State', big: true }, { k: 'sh', label: 'Shape and volume' }, { k: 'el', label: 'Elastic behaviour' }],
    init: function (S) {
      var st = S.st; st.m4 = new THREE.Matrix4(); st.a = [];
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 14, 10), T.mat(0xb4441f), NA);
      for (var i = 0; i < NA; i++) {
        var x = i % 5, y = Math.floor(i / 5) % 5, z = Math.floor(i / 25), site = new THREE.Vector3((x - 2) * 1.05, (y - 2) * 1.05 - 2.2, (z - 2) * 1.05);
        st.a.push({ s: site, p: site.clone(), v: new THREE.Vector3(gauss(), gauss(), gauss()).multiplyScalar(0.3) });
        st.mesh.setColorAt(i, new THREE.Color(0xb4441f));
      }
      S.scene.add(st.mesh);
      st.box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 9, 10)), new THREE.LineBasicMaterial({ color: 0x8b9098 })); st.box.position.y = 0; S.scene.add(st.box);
      st.bonds = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8b9098, transparent: true, opacity: 0.5 }));
      var pos = []; for (var i2 = 0; i2 < NA; i2++) [1, 5, 25].forEach(function (d) { var j = i2 + d; if (j < NA && ((d === 1 && i2 % 5 < 4) || (d === 5 && Math.floor(i2 / 5) % 5 < 4) || d === 25)) pos.push(i2, j); });
      st.pairs = pos; st.bonds.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos.length * 3), 3)); S.scene.add(st.bonds);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, Tm = S.p.T, solid = Tm < 1, gas = Tm > 2, vs = Math.sqrt(Tm) * (solid ? 0.5 : 1.4), cen = new THREE.Vector3(0, -2.2, 0);
      st.a.forEach(function (a) {
        if (solid) { a.v.addScaledVector(a.p.clone().sub(a.s), -40 * dt); a.v.multiplyScalar(1 - Math.min(0.5, dt * 2)); }
        else if (!gas) { var d = a.p.clone().sub(cen), L = d.length(); if (L > 2.6) a.v.addScaledVector(d, -6 * dt * (L - 2.6) / L); a.v.y -= 2 * dt; }
        var kk = solid ? 1 : 3; a.v.x += gauss() * dt * kk; a.v.y += gauss() * dt * kk; a.v.z += gauss() * dt * kk;
        var sp = a.v.length(); if (sp > 1e-6) a.v.multiplyScalar(1 + (vs - sp) / sp * Math.min(1, dt * 4));
        a.p.addScaledVector(a.v, dt);
        [['x', 4.7], ['y', 4.2], ['z', 4.7]].forEach(function (q) { var k = q[0]; if (a.p[k] > q[1]) { a.p[k] = q[1]; a.v[k] = -Math.abs(a.v[k]); } if (a.p[k] < -q[1]) { a.p[k] = -q[1]; a.v[k] = Math.abs(a.v[k]); } });
      });
      st.a.forEach(function (a, i) { st.m4.makeTranslation(a.p.x, a.p.y, a.p.z); st.mesh.setMatrixAt(i, st.m4); });
      st.mesh.instanceMatrix.needsUpdate = true;
      st.bonds.visible = solid;
      if (solid) { var arr = st.bonds.geometry.attributes.position; st.pairs.forEach(function (idx, k) { var p = st.a[idx].p; arr.setXYZ(k, p.x, p.y, p.z); }); arr.needsUpdate = true; }
      S.set('st', solid ? 'Solid' : gas ? 'Gas' : 'Liquid');
      S.set('sh', solid ? 'fixed shape and fixed volume' : gas ? 'no fixed shape or volume: fills the box' : 'takes the shape of the container, fixed volume');
      S.set('el', solid ? 'has Young’s, shear and bulk moduli (resists all deformation)' : gas ? 'only a (small) bulk modulus: easy to compress' : 'bulk modulus only: no rigidity (η = 0), flows under shear');
    }
  });

  /* ---------- 2D: stress-strain diagram ---------- */
  var mats = [
    { n: 'Mild steel', E: 200e3, pts: [[0, 0], [0.00125, 250], [0.02, 250], [0.06, 330], [0.15, 400], [0.22, 360], [0.25, 320]], prop: 0.00125, uts: 0.15, br: 0.25, ductile: true },
    { n: 'Aluminium', E: 70e3, pts: [[0, 0], [0.0034, 240], [0.01, 275], [0.05, 300], [0.12, 310], [0.16, 280], [0.17, 265]], prop: 0.0034, uts: 0.12, br: 0.17, ductile: true },
    { n: 'Cast iron', E: 100e3, pts: [[0, 0], [0.0012, 120], [0.003, 175], [0.006, 200]], prop: 0.0012, uts: 0.006, br: 0.006, ductile: false },
    { n: 'Concrete (tension)', E: 30e3, pts: [[0, 0], [0.0001, 3], [0.00015, 3.5]], prop: 0.0001, uts: 0.00015, br: 0.00015, ductile: false }
  ];
  function sig(m, e) { var p = m.pts; for (var i = 1; i < p.length; i++) if (e <= p[i][0]) return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (e - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return p[p.length - 1][1]; }
  Sim.make('sim-stressstrain', {
    aspect: 0.5,
    controls: [{ k: 'e', label: 'Stretch the specimen (% of breaking strain)', min: 0, max: 100, step: 0.5, v: 40, unit: '%' }],
    buttons: mats.map(function (m, j) { return { label: m.n, group: 'm', on: j === 0, click: function (S) { S.st.m = j; } }; }),
    reads: [{ k: 's', label: 'Stress &sigma; = F/A', big: true }, { k: 'e', label: 'Strain &epsilon; = &Delta;L/L' }, { k: 'reg', label: 'Region' }, { k: 'u', label: 'Energy absorbed &int;&sigma; d&epsilon; (per m&sup3;)' }, { k: 'set', label: 'Permanent set if unloaded now' }],
    init: function (S) { S.st.m = 0; },
    draw: function (S, c, W, H) {
      var K = C(), m = mats[S.st.m], e = S.p.e / 100 * m.br, s = sig(m, e), pts = [], area = [[0, 0]], u = 0, prev = 0;
      for (var i = 0; i <= 400; i++) { var x = m.br * i / 400; pts.push([x, sig(m, x)]); if (x <= e) { area.push([x, sig(m, x)]); u += (sig(m, x) + sig(m, prev)) / 2 * (x - prev); prev = x; } }
      area.push([e, s]); area.push([e, 0]);
      var smax = Math.max.apply(null, m.pts.map(function (q) { return q[1]; }));
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.07, w: W * 0.6, h: H * 0.78 };
      var g = D.graph(c, box, { x0: 0, x1: m.br * 1.05, y0: 0, y1: smax * 1.2, xl: 'strain ε →', yl: 'stress σ (MPa)' }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      D.poly(c, area.map(function (q) { return [g.px(q[0]), g.py(q[1])]; }), null, 0, true, 'rgba(180,68,31,0.18)');
      var set = m.ductile && e > m.prop ? Math.max(0, e - s / m.E) : 0;
      if (set > 0) D.line(c, g.px(e), g.py(s), g.px(set), g.py(0), K.c2, 1.6, [5, 4]);
      D.circle(c, g.px(e), g.py(s), 6, K.pos);
      var marks = [[m.prop, 'proportional limit'], [m.uts, m.ductile ? 'ultimate strength' : 'fracture']];
      if (m.ductile) marks.push([m.br, 'fracture']);
      marks.forEach(function (q, k) { var y = sig(m, q[0]); D.circle(c, g.px(q[0]), g.py(y), 3.5, K.c2); D.text(c, q[1], g.px(q[0]) + 6, g.py(y) - 12 - (k === 0 ? 4 : 0), { size: 11, color: K.c2, weight: 600 }); });
      if (m.ductile) D.text(c, 'yielding', g.px(0.012 * m.br / 0.25 + m.prop), g.py(sig(m, m.prop)) + 14, { size: 11, color: K.muted });
      // specimen
      var cx = W * 0.84, L0 = H * 0.42, Lp = L0 * (1 + Math.min(e, 0.3) * 1.6), w0 = W * 0.05, top = H * 0.5 - Lp / 2, neck = e > m.uts && m.ductile ? (e - m.uts) / (m.br - m.uts) : 0;
      D.rect(c, cx - w0 * 1.3, top - 26, w0 * 2.6, 26, K.surface, K.line, 3); D.rect(c, cx - w0 * 1.3, top + Lp, w0 * 2.6, 26, K.surface, K.line, 3);
      var shape = []; for (var k = 0; k <= 40; k++) { var y2 = top + Lp * k / 40, mid = Math.exp(-Math.pow((k - 20) / 5, 2)), hw = w0 / 2 * (1 - 0.35 * e - 0.55 * neck * mid); shape.push([cx + hw, y2]); }
      for (var k2 = 40; k2 >= 0; k2--) { var y3 = top + Lp * k2 / 40, mid2 = Math.exp(-Math.pow((k2 - 20) / 5, 2)), hw2 = w0 / 2 * (1 - 0.35 * e - 0.55 * neck * mid2); shape.push([cx - hw2, y3]); }
      var broke = S.p.e >= 100;
      D.poly(c, shape, K.ink, 1.2, true, broke ? K.grid : '#b9b3a8');
      if (broke) D.line(c, cx - w0, top + Lp / 2, cx + w0, top + Lp / 2, K.bg, 4);
      D.arrow(c, cx, top - 28, cx, top - 60, K.pos, 2.5); D.arrow(c, cx, top + Lp + 28, cx, top + Lp + 60, K.pos, 2.5);
      D.text(c, broke ? 'BROKEN' : 'specimen', cx, H - 10, { size: 11.5, align: 'center', color: broke ? K.pos : K.muted, weight: 700 });
      var reg = e <= m.prop ? 'elastic: Hooke’s law, σ = Yε, returns to original length' : !m.ductile ? 'brittle: almost no plastic region' : e <= m.uts ? 'plastic: yielding and strain hardening' : 'necking: the bar thins locally and breaks';
      S.set('s', f(s, 3) + ' MPa'); S.set('e', f(e, 3) + ' (' + f(e * 100, 3) + '%)'); S.set('reg', broke ? 'fractured' : reg); S.set('u', f(u, 3) + ' MJ/m³'); S.set('set', set > 0 ? f(set * 100, 3) + '% (dashed line, slope Y)' : 'none: fully elastic');
    }
  });

  /* ---------- 2D: loaded wire (Searle) ---------- */
  var wires = [['Steel', 200, 500], ['Copper', 120, 220], ['Aluminium', 70, 110], ['Brass', 100, 350]];
  Sim.make('sim-wire', {
    aspect: 0.5,
    controls: [
      { k: 'L', label: 'Length L', min: 0.5, max: 3, step: 0.05, v: 2, unit: 'm' },
      { k: 'd', label: 'Diameter d', min: 0.2, max: 2, step: 0.02, v: 0.5, unit: 'mm' },
      { k: 'm', label: 'Load m', min: 0, max: 20, step: 0.1, v: 5, unit: 'kg' }
    ],
    buttons: wires.map(function (w, j) { return { label: w[0], group: 'w', on: j === 0, click: function (S) { S.st.w = j; } }; }),
    reads: [{ k: 'sg', label: 'Stress F/A' }, { k: 'dl', label: 'Extension &Delta;L = FL / AY', big: true }, { k: 'eps', label: 'Strain &Delta;L/L' }, { k: 'W', label: 'Strain energy &frac12;F&Delta;L' }, { k: 'u', label: 'Energy density &frac12;&sigma;&epsilon;' }],
    init: function (S) { S.st.w = 0; },
    draw: function (S, c, W, H) {
      var K = C(), w = wires[S.st.w], p = S.p, F = p.m * 9.81, A = PI * Math.pow(p.d * 1e-3 / 2, 2), Y = w[1] * 1e9, sg = F / A, dl = F * p.L / (A * Y), broke = sg > w[2] * 1e6, eps = dl / p.L;
      D.clear(c, W, H);
      var cx = W * 0.25, top = H * 0.08, Lpx = H * 0.25 + p.L / 3 * H * 0.35, ext = Math.min(dl * 1000 * 6, H * 0.15);
      D.rect(c, W * 0.06, top - 8, W * 0.38, 10, K.ink, null, 2);
      for (var hx = W * 0.07; hx < W * 0.43; hx += 12) D.line(c, hx, top - 8, hx + 8, top - 16, K.faint, 1);
      var bottom = top + Lpx + (broke ? 0 : ext);
      D.line(c, cx, top, cx, broke ? top + Lpx * 0.7 : bottom, K.c2, 1 + p.d * 1.5);
      D.line(c, cx - 50, top, cx - 50, top + Lpx, K.faint, 1.5); D.text(c, 'reference wire', cx - 54, top + Lpx / 2, { size: 10.5, align: 'right', color: K.faint });
      if (!broke) {
        var bh = 14 + p.m * 2.2; D.rect(c, cx - 22, bottom, 44, bh, K.c1, null, 4); D.text(c, f(p.m, 3) + ' kg', cx, bottom + bh / 2, { size: 11, align: 'center', color: '#fff', weight: 700 });
        D.line(c, cx - 50, top + Lpx, cx - 6, top + Lpx, K.c3, 1.2, [3, 3]); D.line(c, cx - 50, bottom, cx - 6, bottom, K.c3, 1.2);
        D.text(c, 'ΔL (magnified)', cx + 30, (top + Lpx + bottom) / 2, { size: 11, color: K.c3, weight: 600 });
      } else { D.text(c, 'the wire snapped: stress exceeded the breaking stress (' + w[2] + ' MPa)', W * 0.05, H * 0.9, { size: 12, color: K.pos, weight: 700 }); }
      var box = { x: W * 0.52, y: H * 0.08, w: W * 0.45, h: H * 0.78 }, pts = [];
      for (var mm = 0; mm <= 20; mm += 0.25) { var F2 = mm * 9.81; if (F2 / A > w[2] * 1e6) break; pts.push([mm, F2 * p.L / (A * Y) * 1000]); }
      var ymax = Math.max(0.1, 20 * 9.81 * p.L / (A * Y) * 1000);
      var g = D.graph(c, box, { x0: 0, x1: 20, y0: 0, y1: ymax * 1.1, xl: 'load (kg) →', yl: 'extension (mm)' }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      if (!broke) D.circle(c, g.px(p.m), g.py(dl * 1000), 6, K.pos);
      D.text(c, 'straight line: Hooke’s law; the area under the F–ΔL line is the stored energy', box.x + 6, box.y + 30, { size: 11, color: K.muted });
      S.set('sg', f(sg / 1e6, 3) + ' MPa' + (broke ? ' (too large!)' : '')); S.set('dl', broke ? '—' : f(dl * 1000, 3) + ' mm'); S.set('eps', f(eps, 3)); S.set('W', broke ? '—' : f(0.5 * F * dl, 3) + ' J'); S.set('u', broke ? '—' : f(0.5 * sg * eps, 3) + ' J/m³');
    }
  });

  /* ---------- 3D: deform a cube (tension, shear, bulk) ---------- */
  Sim.make('sim-cube3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.15, r: 11 },
    controls: [
      { k: 's', label: 'Applied stress (tension / shear / pressure)', min: 0, max: 400, step: 5, v: 200, unit: 'MPa' },
      { k: 'Y', label: 'Young’s modulus Y', min: 1, max: 210, step: 1, v: 200, unit: 'GPa' },
      { k: 'nu', label: 'Poisson’s ratio &sigma;', min: -0.5, max: 0.49, step: 0.01, v: 0.3 },
      { k: 'X', label: 'Magnify the deformation', min: 1, max: 500, step: 1, v: 150, unit: '×' }
    ],
    buttons: [['Tension', 0], ['Shear', 1], ['Bulk (pressure)', 2]].map(function (q) { return { label: q[0], group: 'mode', on: q[1] === 0, click: function (S) { S.st.mode = q[1]; } }; }),
    reads: [{ k: 'G', label: 'Rigidity &eta; = Y / 2(1+&sigma;)' }, { k: 'K', label: 'Bulk modulus K = Y / 3(1&minus;2&sigma;)' }, { k: 'def', label: 'Deformation', big: true }, { k: 'u', label: 'Energy density &frac12; stress &times; strain' }],
    init: function (S) {
      var st = S.st; st.mode = 0;
      st.cube = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), T.mat(0xb4441f, { opacity: 0.85 })); st.cube.matrixAutoUpdate = false; S.scene.add(st.cube);
      st.edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 3, 3)), new THREE.LineBasicMaterial({ color: 0x22262b })); st.edge.matrixAutoUpdate = false; S.scene.add(st.edge);
      st.ref = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 3, 3)), new THREE.LineDashedMaterial({ color: 0x8b9098, dashSize: 0.15, gapSize: 0.1 })); st.ref.computeLineDistances(); S.scene.add(st.ref);
      st.ar = []; for (var i = 0; i < 6; i++) st.ar.push(T.arrow(S.scene, '#2f5d78'));
      T.grid(S.scene, 10, -2.6);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, Y = p.Y * 1e3, nu = p.nu, G = Y / (2 * (1 + nu)), K = Y / (3 * (1 - 2 * nu)), s = p.s, X = p.X, M = new THREE.Matrix4(), txt, u;
      st.ar.forEach(function (a) { a.visible = false; });
      var a = Math.min(1, s / 400) * 1.6 + 0.2;
      if (st.mode === 0) {
        var e = s / Y, ed = clamp(e * X, -0.6, 0.8), lat = clamp(-nu * e * X, -0.5, 0.5);
        M.makeScale(1 + lat, 1 + ed, 1 + lat);
        T.setArrow(st.ar[0], [0, 1.5 * (1 + ed) + 0.1, 0], [0, a, 0]); T.setArrow(st.ar[1], [0, -1.5 * (1 + ed) - 0.1, 0], [0, -a, 0]);
        txt = 'length +' + f(e * 100, 3) + '%, width ' + f(-nu * e * 100, 3) + '%'; u = 0.5 * s * e;
      } else if (st.mode === 1) {
        var th = s / G, td = clamp(th * X, 0, 1.2);
        M.set(1, Math.tan(td), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        T.setArrow(st.ar[0], [-1.5 + 1.5 * Math.tan(td), 1.65, 0], [a, 0, 0]); T.setArrow(st.ar[1], [1.5 - 1.5 * Math.tan(td), -1.65, 0], [-a, 0, 0]);
        T.setArrow(st.ar[2], [1.65 + 1.5 * Math.tan(td) * 0, -1.2, 0], [0, a * 0.8, 0]); T.setArrow(st.ar[3], [-1.65, 1.2, 0], [0, -a * 0.8, 0]);
        txt = 'shear angle θ = ' + f(th, 3) + ' rad (' + f(th * 180 / PI, 3) + '°)'; u = 0.5 * s * th;
      } else {
        var dv = nu >= 0.4999 ? 0 : s / K, sc = Math.cbrt(Math.max(0.15, 1 - dv * X));
        M.makeScale(sc, sc, sc);
        [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (n, i) { T.setArrow(st.ar[i], [n[0] * (1.5 * sc + 0.2 + a), n[1] * (1.5 * sc + 0.2 + a), n[2] * (1.5 * sc + 0.2 + a)], [-n[0] * a, -n[1] * a, -n[2] * a]); });
        txt = 'volume −' + f(dv * 100, 3) + '%'; u = 0.5 * s * dv;
      }
      st.cube.matrix.copy(M); st.edge.matrix.copy(M);
      S.set('G', f(G / 1e3, 3) + ' GPa'); S.set('K', nu > 0.495 ? 'very large (incompressible)' : f(K / 1e3, 3) + ' GPa'); S.set('def', txt); S.set('u', f(u, 3) + ' MJ/m³');
    }
  });

  /* ---------- 2D: relations among the elastic constants ---------- */
  var nus = [['Cork', 0.0], ['Concrete', 0.2], ['Steel', 0.3], ['Copper', 0.34], ['Rubber', 0.49]];
  Sim.make('sim-moduli', {
    aspect: 0.5,
    controls: [
      { k: 'nu', label: 'Poisson’s ratio &sigma;', min: -0.95, max: 0.49, step: 0.01, v: 0.3 },
      { k: 'Y', label: 'Young’s modulus Y', min: 1, max: 210, step: 1, v: 200, unit: 'GPa' }
    ],
    buttons: nus.map(function (q) { return { label: q[0] + ' ' + q[1], click: function (S) { S.setControl('nu', q[1]); } }; }),
    reads: [{ k: 'G', label: '&eta; = Y / 2(1+&sigma;)' }, { k: 'K', label: 'K = Y / 3(1&minus;2&sigma;)' }, { k: 'chk', label: 'Check: 9/Y = 1/K + 3/&eta;', big: true }],
    draw: function (S, c, W, H) {
      var Kc = C(), p = S.p, pg = [], pk = [];
      for (var n = -0.99; n <= 0.49; n += 0.005) { pg.push([n, 1 / (2 * (1 + n))]); pk.push([n, Math.min(4, 1 / (3 * (1 - 2 * n)))]); }
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.07, w: W * 0.88, h: H * 0.78 };
      var g = D.graph(c, box, { x0: -1, x1: 0.5, y0: 0, y1: 2.2, xl: 'Poisson’s ratio σ →', yl: 'modulus ÷ Y', vlines: [{ x: 0, label: 'σ = 0', color: Kc.faint }], hlines: [{ y: 1, label: 'Y', color: Kc.faint }] }, [{ pts: pg, color: Kc.c2, w: 2.5 }, { pts: pk, color: Kc.c1, w: 2.5 }]);
      var G = 1 / (2 * (1 + p.nu)), K = 1 / (3 * (1 - 2 * p.nu));
      D.circle(c, g.px(p.nu), g.py(G), 6, Kc.c2); if (K < 2.2) D.circle(c, g.px(p.nu), g.py(K), 6, Kc.c1);
      D.text(c, 'η / Y (rigidity)', g.px(-0.62), g.py(1.75), { size: 12, color: Kc.c2, weight: 700 });
      D.text(c, 'K / Y (bulk)', g.px(0.25), g.py(1.6), { size: 12, color: Kc.c1, weight: 700 });
      D.text(c, 'theory: −1 < σ < ½;  real materials 0 to ½', box.x + box.w - 8, box.y + box.h - 30, { size: 11.5, align: 'right', color: Kc.muted });
      var Yv = p.Y, Gv = Yv * G, Kv = Yv * K;
      S.set('G', f(Gv, 3) + ' GPa'); S.set('K', p.nu > 0.48 ? f(Kv, 3) + ' GPa (huge: nearly incompressible)' : f(Kv, 3) + ' GPa');
      S.set('chk', f(9 / Yv, 4) + ' = ' + f(1 / Kv + 3 / Gv, 4));
    }
  });
})();
