/* PHY1201 Unit 6: polarization simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  var DEG = PI / 180;

  function polWave(S, st, a, b, del, z0, z1, n, col) { var pts = [], t = S.t * 2.5; for (var i = 0; i <= n; i++) { var z = z0 + (z1 - z0) * i / n, ph = t - 1.4 * z; pts.push([z, b * Math.cos(ph + del), a * Math.cos(ph)]); } return pts; }
  function stateName(a, b, del) {
    var d = ((del % (2 * PI)) + 2 * PI) % (2 * PI);
    if (a < 0.02 || b < 0.02 || Math.abs(Math.sin(d)) < 0.03) return 'plane (linear)';
    if (Math.abs(a - b) < 0.03 && Math.abs(Math.cos(d)) < 0.03) return 'circular (' + (Math.sin(d) > 0 ? 'one sense' : 'other sense') + ')';
    return 'elliptical';
  }

  /* ---------- 3D: states of polarization ---------- */
  Sim.make('sim-polstate3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.9, ph: 1.2, r: 13 },
    controls: [
      { k: 'a', label: 'Amplitude of E<sub>x</sub>', min: 0, max: 1.5, step: 0.05, v: 1.2 },
      { k: 'b', label: 'Amplitude of E<sub>y</sub>', min: 0, max: 1.5, step: 0.05, v: 1.2 },
      { k: 'd', label: 'Phase difference &delta;', min: 0, max: 360, step: 5, v: 90, unit: '°' }
    ],
    buttons: [['Plane', 1.2, 1.2, 0], ['Circular', 1.2, 1.2, 90], ['Elliptical', 1.4, 0.7, 60]].map(function (q) { return { label: q[0], click: function (S) { S.setControl('a', q[1]); S.setControl('b', q[2]); S.setControl('d', q[3]); } }; }),
    reads: [{ k: 's', label: 'State of polarization', big: true }, { k: 'eq', label: 'Path of the tip of E' }],
    init: function (S) {
      var st = S.st; st.ar = []; for (var i = 0; i < 26; i++) st.ar.push(T.arrow(S.scene, '#b4441f'));
      st.tip = T.line(S.scene, 0xb4441f, 200); st.trace = T.line(S.scene, 0x2f5d78, 200);
      var ax = T.line(S.scene, 0x8b9098, 2); T.setLine(ax, [[-6, 0, 0], [6, 0, 0]]);
      var scr = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), T.mat(0xe8e4dd, { opacity: 0.6, side: THREE.DoubleSide })); scr.rotation.y = PI / 2; scr.position.x = 6; S.scene.add(scr);
      var l = T.label(S.scene, 'path of E seen face-on', '#2f5d78', 0.8); l.position.set(6, 2.3, 0);
    },
    draw: function (S) {
      var st = S.st, p = S.p, del = p.d * DEG, pts = polWave(S, st, p.a, p.b, del, -6, 5.9, 199);
      for (var i = 0; i < 26; i++) { var q = pts[Math.round(i * 199 / 25)]; T.setArrow(st.ar[i], [q[0], 0, 0], [0, q[1], q[2]], 0.15); }
      T.setLine(st.tip, pts);
      var tr = []; for (var k = 0; k <= 199; k++) { var ph = 2 * PI * k / 199; tr.push([5.98, p.b * Math.cos(ph + del), p.a * Math.cos(ph)]); } T.setLine(st.trace, tr);
      S.set('s', stateName(p.a, p.b, del)); S.set('eq', 'x²/a² + y²/b² − (2xy/ab)cosδ = sin²δ');
    }
  });

  /* ---------- 3D: polarizer, analyzer, Malus' law ---------- */
  function sheet(S, x, col) { var g = new THREE.Group(), m = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), T.mat(col, { opacity: 0.35, side: THREE.DoubleSide })); m.rotation.y = PI / 2; g.add(m); for (var i = -3; i <= 3; i++) { var l = T.line(g, 0x22262b, 2); var h = Math.sqrt(Math.max(0, 1.6 * 1.6 - Math.pow(i * 0.4, 2))); T.setLine(l, [[0, -h, i * 0.4], [0, h, i * 0.4]]); } var ax = T.arrow(g, '#22262b'); T.setArrow(ax, [0, -2, 0], [0, 4, 0], 0.3); g.position.x = x; S.scene.add(g); return g; }
  Sim.make('sim-malus3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.75, ph: 1.25, r: 12.5 },
    controls: [
      { k: 'p', label: 'Polarizer axis angle', min: 0, max: 180, step: 1, v: 0, unit: '°' },
      { k: 'q', label: 'Analyzer axis angle', min: 0, max: 180, step: 1, v: 60, unit: '°' },
      { k: 'm', label: 'Middle polarizer angle (when inserted)', min: 0, max: 180, step: 1, v: 45, unit: '°' }
    ],
    buttons: [{ k: 'mid', label: 'Insert a middle polarizer', click: function (S, b) { S.st.mid = !S.st.mid; b.classList.toggle('on', S.st.mid); } }, { label: 'Cross them', click: function (S) { S.setControl('q', (S.p.p + 90) % 180); } }],
    reads: [{ k: 'I1', label: 'After the polarizer: I<sub>0</sub>/2' }, { k: 'I2', label: 'After the analyzer: I = I<sub>1</sub>cos&sup2;&theta; (Malus)', big: true }, { k: 'th', label: 'Angle &theta; between the axes' }],
    init: function (S) {
      var st = S.st; st.mid = false; st.P = sheet(S, -2.5, 0x8fc1de); st.Q = sheet(S, 4, 0x8fc1de); st.M = sheet(S, 0.8, 0xf0c060);
      st.un = []; for (var i = 0; i < 12; i++) st.un.push(T.arrow(S.scene, '#b4441f'));
      st.w1 = []; st.w2 = []; st.w3 = []; for (var j = 0; j < 8; j++) { st.w1.push(T.arrow(S.scene, '#b4441f')); st.w2.push(T.arrow(S.scene, '#b4441f')); st.w3.push(T.arrow(S.scene, '#b4441f')); }
      st.det = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 2), T.mat(0x22262b)); st.det.position.x = 7; S.scene.add(st.det);
      st.glow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true })); st.glow.rotation.y = -PI / 2; st.glow.position.x = 6.78; S.scene.add(st.glow);
      var l = T.label(S.scene, 'unpolarized light', '#59606a', 1.1); l.position.set(-5.5, 2.3, 0); var l2 = T.label(S.scene, 'detector', '#22262b', 1); l2.position.set(7, 1.6, 0);
    },
    draw: function (S) {
      var st = S.st, p = S.p, t = S.t * 2.5, rot = function (ang, amp) { return [0, amp * Math.cos(ang), amp * Math.sin(ang)]; };
      st.P.rotation.x = p.p * DEG; st.Q.rotation.x = p.q * DEG; st.M.rotation.x = p.m * DEG; st.M.visible = st.mid;
      var I0 = 1, I1 = 0.5, xs = st.mid ? 0.8 : 4, I2, I3;
      for (var i = 0; i < 12; i++) { var x = -6.5 + i * 0.35, ph = t - 1.4 * x, ang = (i * 47) % 180 * DEG; T.setArrow(st.un[i], [x, 0, 0], rot(ang, 1.1 * Math.cos(ph)), 0.15); }
      var a1 = Math.sqrt(I1) * 1.5;
      for (var j = 0; j < 8; j++) { var x1 = -2.3 + j * (xs + 2.3 - 0.3) / 8, ph1 = t - 1.4 * x1; T.setArrow(st.w1[j], [x1, 0, 0], rot(p.p * DEG, a1 * Math.cos(ph1)), 0.15); }
      if (st.mid) { I2 = I1 * Math.pow(Math.cos((p.m - p.p) * DEG), 2); I3 = I2 * Math.pow(Math.cos((p.q - p.m) * DEG), 2); }
      else { I2 = I1; I3 = I1 * Math.pow(Math.cos((p.q - p.p) * DEG), 2); }
      for (var k = 0; k < 8; k++) { var x2 = 1 + k * 0.38, ph2 = t - 1.4 * x2; st.w2[k].visible = st.mid; if (st.mid) T.setArrow(st.w2[k], [x2, 0, 0], rot(p.m * DEG, Math.sqrt(I2) * 1.5 * Math.cos(ph2)), 0.15); }
      for (var m = 0; m < 6; m++) { var x3 = 4.2 + m * 0.42, ph3 = t - 1.4 * x3; T.setArrow(st.w3[m], [x3, 0, 0], rot(p.q * DEG, Math.sqrt(I3) * 1.5 * Math.cos(ph3)), 0.15); }
      st.w3[6].visible = st.w3[7].visible = false;
      st.glow.material.opacity = I3 * 2;
      var th = Math.abs(p.q - p.p) % 180;
      S.set('I1', f(I1 * 100, 3) + '% of I₀'); S.set('I2', f(I3 * 100, 3) + '% of I₀' + (st.mid ? ' (through three sheets)' : '')); S.set('th', f(Math.min(th, 180 - th), 3) + '°' + (Math.abs(th - 90) < 0.5 && !st.mid ? ' (crossed: dark)' : ''));
    }
  });

  /* ---------- 2D: Brewster's law ---------- */
  Sim.make('sim-brewster', {
    aspect: 0.5,
    controls: [
      { k: 'i', label: 'Angle of incidence i', min: 0, max: 89, step: 0.5, v: 56.3, unit: '°' },
      { k: 'n', label: 'Refractive index &mu;', min: 1.2, max: 2.5, step: 0.01, v: 1.5 }
    ],
    buttons: [{ label: 'Go to Brewster angle', click: function (S) { S.setControl('i', Math.round(Math.atan(S.p.n) / DEG * 2) / 2); } }],
    reads: [{ k: 'B', label: 'Brewster angle i<sub>p</sub> = tan<sup>&minus;1</sup>&mu;', big: true }, { k: 'R', label: 'Reflected fraction R<sub>s</sub>, R<sub>p</sub>' }, { k: 'deg', label: 'Reflected light is' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, n = p.n, F = function (i) { var r = Math.asin(Math.sin(i) / n), ci = Math.cos(i), cr = Math.cos(r), rs = (ci - n * cr) / (ci + n * cr), rp = (n * ci - cr) / (n * ci + cr); return [rs * rs, rp * rp, r]; };
      var i = p.i * DEG, v = F(i), iB = Math.atan(n);
      D.clear(c, W, H);
      var cx = W * 0.25, cy = H * 0.5, L = Math.min(W * 0.2, H * 0.4);
      D.rect(c, cx - L * 1.2, cy, L * 2.4, L * 1.1, 'rgba(47,93,120,0.15)', null, 0); D.line(c, cx - L * 1.2, cy, cx + L * 1.2, cy, K.ink, 1.5); D.line(c, cx, cy - L, cx, cy + L, K.faint, 1, [4, 3]);
      var inc = [cx - L * Math.sin(i), cy - L * Math.cos(i)], ref = [cx + L * Math.sin(i), cy - L * Math.cos(i)], tr = [cx + L * Math.sin(v[2]), cy + L * Math.cos(v[2])];
      D.arrow(c, inc[0], inc[1], cx, cy, K.ink, 2); D.arrow(c, cx, cy, ref[0], ref[1], K.c1, 1 + 6 * (v[0] + v[1])); D.arrow(c, cx, cy, tr[0], tr[1], K.c2, 2.5);
      D.text(c, 'reflected', ref[0], ref[1] - 10, { size: 11, color: K.c1, align: 'center', weight: 600 }); D.text(c, 'refracted', tr[0] + 6, tr[1], { size: 11, color: K.c2, weight: 600 });
      var ang = PI - i - v[2]; D.text(c, 'angle between reflected and refracted: ' + f(ang / DEG, 3) + '°', cx, H * 0.96, { size: 11, align: 'center', color: Math.abs(ang / DEG - 90) < 0.6 ? K.pos : K.muted, weight: 600 });
      var box = { x: W * 0.52, y: H * 0.07, w: W * 0.45, h: H * 0.8 }, ps = [], pp = [];
      for (var a = 0; a <= 89.5; a += 0.5) { var q = F(a * DEG); ps.push([a, q[0]]); pp.push([a, q[1]]); }
      var g = D.graph(c, box, { x0: 0, x1: 90, y0: 0, y1: 1, xl: 'angle of incidence (°) →', yl: 'reflected fraction: s (orange), p (blue)', vlines: [{ x: iB / DEG, label: 'Brewster', color: K.pos }] }, [{ pts: ps, color: K.c1, w: 2.5 }, { pts: pp, color: K.c2, w: 2.5 }]);
      D.circle(c, g.px(p.i), g.py(v[0]), 5, K.c1); D.circle(c, g.px(p.i), g.py(v[1]), 5, K.c2);
      var deg = (v[0] - v[1]) / (v[0] + v[1] + 1e-12);
      S.set('B', f(iB / DEG, 3) + '°'); S.set('R', f(v[0] * 100, 3) + '%, ' + f(v[1] * 100, 3) + '%'); S.set('deg', v[1] < 1e-4 ? 'completely plane polarized (E perpendicular to the plane of incidence)' : f(deg * 100, 3) + '% polarized');
    }
  });

  /* ---------- 2D: double refraction in calcite ---------- */
  Sim.make('sim-calcite', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'rot', label: 'Rotate the crystal', min: 0, max: 360, step: 1, v: 30, unit: '°' },
      { k: 't', label: 'Crystal thickness', min: 5, max: 40, step: 1, v: 20, unit: 'mm' },
      { k: 'an', label: 'Analyzer on top (angle)', min: 0, max: 180, step: 1, v: 0, unit: '°' }
    ],
    buttons: [{ k: 'ana', label: 'Use the analyzer', click: function (S, b) { S.st.ana = !S.st.ana; b.classList.toggle('on', S.st.ana); } }],
    reads: [{ k: 'sep', label: 'Separation of the two images (&asymp; 0.11 t)', big: true }, { k: 'o', label: 'O-ray (ordinary)' }, { k: 'e', label: 'E-ray (extraordinary)' }],
    init: function (S) { S.st.ana = false; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, rot = p.rot * DEG, sep = 0.11 * p.t, cx = W * 0.72, cy = H * 0.5, sc = 8;
      D.clear(c, W, H);
      var x0 = W * 0.06, x1 = W * 0.38, y0 = H * 0.25, y1 = H * 0.25 + p.t * H * 0.015;
      D.poly(c, [[x0, y0], [x1, y0], [x1 + 30, y1], [x0 + 30, y1]], K.c2, 1.5, true, 'rgba(143,193,222,0.25)');
      var ex = (x0 + x1) / 2; D.arrow(c, ex, H * 0.05, ex, y0, K.ink, 2);
      D.line(c, ex, y0, ex, y1, K.c1, 2); D.line(c, ex, y0, ex + sep * sc * 0.7, y1, K.c3, 2);
      D.arrow(c, ex, y1, ex, H * 0.95, K.c1, 2); D.arrow(c, ex + sep * sc * 0.7, y1, ex + sep * sc * 0.7, H * 0.95, K.c3, 2);
      D.text(c, 'O-ray (obeys Snell)', ex - 8, H * 0.9, { size: 11, align: 'right', color: K.c1, weight: 600 }); D.text(c, 'E-ray', ex + sep * sc * 0.7 + 8, H * 0.9, { size: 11, color: K.c3, weight: 600 });
      D.text(c, 'side view', x0, H * 0.05, { size: 11, color: K.muted });
      var Io = 1, Ie = 1; if (S.st.ana) { Io = Math.pow(Math.cos((p.an - p.rot) * DEG), 2); Ie = Math.pow(Math.sin((p.an - p.rot) * DEG), 2); }
      D.circle(c, cx, cy, H * 0.38, K.surface, K.line, 1.5);
      D.text(c, 'looking down at a dot on the paper', cx, H * 0.06, { size: 11, align: 'center', color: K.muted });
      D.circle(c, cx, cy, 12, 'rgba(180,68,31,' + (0.15 + 0.85 * Io) + ')'); D.text(c, 'O', cx, cy, { size: 10, align: 'center', color: '#fff', weight: 700 });
      var ex2 = cx + sep * sc * Math.cos(rot), ey2 = cy + sep * sc * Math.sin(rot);
      D.circle(c, ex2, ey2, 12, 'rgba(63,125,58,' + (0.15 + 0.85 * Ie) + ')'); D.text(c, 'E', ex2, ey2, { size: 10, align: 'center', color: '#fff', weight: 700 });
      D.circle(c, cx, cy, sep * sc, null, K.faint, 1, [3, 3]);
      S.set('sep', f(sep, 3) + ' mm'); S.set('o', S.st.ana ? 'brightness ' + f(Io * 100, 3) + '%: polarized perpendicular to the principal section' : 'stays fixed as the crystal turns');
      S.set('e', S.st.ana ? 'brightness ' + f(Ie * 100, 3) + '%: polarized in the principal section' : 'circles around the O image as the crystal turns');
    }
  });

  /* ---------- 3D: retardation (wave) plates ---------- */
  Sim.make('sim-waveplate3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.95, ph: 1.2, r: 14 },
    controls: [
      { k: 'th', label: 'Input polarization angle to the optic axis', min: 0, max: 90, step: 1, v: 45, unit: '°' },
      { k: 'd', label: 'Retardation &delta; = 2&pi;(&mu;<sub>o</sub>&minus;&mu;<sub>e</sub>)t/&lambda;', min: 0, max: 360, step: 5, v: 90, unit: '°' }
    ],
    buttons: [{ label: 'Quarter-wave plate', click: function (S) { S.setControl('d', 90); } }, { label: 'Half-wave plate', click: function (S) { S.setControl('d', 180); } }, { label: 'No plate (δ = 0)', click: function (S) { S.setControl('d', 0); } }],
    reads: [{ k: 'out', label: 'Output light', big: true }, { k: 't', label: 'Thickness for calcite at 589 nm (&mu;<sub>o</sub>&minus;&mu;<sub>e</sub> = 0.172)' }],
    init: function (S) {
      var st = S.st; st.inp = T.line(S.scene, 0xb4441f, 200); st.out = T.line(S.scene, 0xb4441f, 200);
      st.ai = []; st.ao = []; for (var i = 0; i < 10; i++) { st.ai.push(T.arrow(S.scene, '#b4441f')); st.ao.push(T.arrow(S.scene, '#2f5d78')); }
      st.plate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.4, 3.4), T.mat(0x8fc1de, { opacity: 0.45 })); S.scene.add(st.plate);
      var oa = T.arrow(S.scene, '#22262b'); T.setArrow(oa, [0, -1.9, 0], [0, 3.8, 0], 0.3);
      var l = T.label(S.scene, 'optic axis', '#22262b', 0.8); l.position.set(0, 2.4, 0);
      var ax = T.line(S.scene, 0x8b9098, 2); T.setLine(ax, [[-6, 0, 0], [6, 0, 0]]);
    },
    draw: function (S) {
      var st = S.st, p = S.p, th = p.th * DEG, A = 1.3, a = A * Math.sin(th), b = A * Math.cos(th), del = p.d * DEG;
      var pin = polWave(S, st, a, b, 0, -6, -0.35, 99), pout = polWave(S, st, a, b, del, 0.35, 6, 99);
      T.setLine(st.inp, pin); T.setLine(st.out, pout);
      for (var i = 0; i < 10; i++) { var q = pin[Math.round(i * 99 / 9)], r = pout[Math.round(i * 99 / 9)]; T.setArrow(st.ai[i], [q[0], 0, 0], [0, q[1], q[2]], 0.13); T.setArrow(st.ao[i], [r[0], 0, 0], [0, r[1], r[2]], 0.13); }
      var name = stateName(a, b, del);
      if (name.indexOf('plane') === 0 && Math.abs(Math.cos(del) + 1) < 0.01 && p.th > 0 && p.th < 90) name = 'plane, turned through 2θ = ' + f(2 * p.th, 3) + '°';
      S.set('out', name); S.set('t', 'quarter-wave t = λ/4(μₒ−μₑ) = ' + f(589e-9 / (4 * 0.172) * 1e6, 3) + ' µm; this plate: ' + f(p.d / 360 * 589e-9 / 0.172 * 1e6, 3) + ' µm');
    }
  });

  /* ---------- 2D: polarimeter and optical activity ---------- */
  Sim.make('sim-polarimeter', {
    aspect: 0.45,
    controls: [
      { k: 'c', label: 'Sugar concentration C', min: 0, max: 0.3, step: 0.005, v: 0.1, unit: 'g/cm³' },
      { k: 'l', label: 'Tube length l', min: 1, max: 4, step: 0.5, v: 2, unit: 'dm' },
      { k: 'an', label: 'Analyzer setting (turn for darkness)', min: -90, max: 90, step: 0.5, v: 0, unit: '°' }
    ],
    reads: [{ k: 'rot', label: 'Rotation &theta; = [&alpha;] l C ([&alpha;] = 66.5&deg; for sucrose)', big: true }, { k: 'I', label: 'Brightness seen' }, { k: 'fd', label: 'Concentration found from your analyzer setting' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, rot = 66.5 * p.l * p.c, I = Math.pow(Math.sin((p.an - rot) * DEG), 2), y = H * 0.45;
      D.clear(c, W, H);
      var x = [W * 0.07, W * 0.17, W * 0.26, W * 0.7, W * 0.8, W * 0.92];
      D.circle(c, x[0], y, 10, '#ffd34d'); D.text(c, 'sodium lamp', x[0], y + 26, { size: 10.5, align: 'center', color: K.muted });
      D.rect(c, x[1] - 4, y - 30, 8, 60, K.c2, null, 2); D.text(c, 'polarizer', x[1], y + 44, { size: 10.5, align: 'center', color: K.muted });
      D.rect(c, x[2], y - 22, x[3] - x[2], 44, 'rgba(183,121,31,' + (0.08 + p.c * 1.5) + ')', K.line, 8);
      D.text(c, 'tube of sugar solution, length ' + p.l + ' dm', (x[2] + x[3]) / 2, y + 40, { size: 11, align: 'center', color: K.muted });
      for (var k = 0; k <= 8; k++) { var xx = x[2] + (x[3] - x[2]) * k / 8, ang = rot * k / 8 * DEG; D.line(c, xx - 14 * Math.sin(ang), y - 14 * Math.cos(ang), xx + 14 * Math.sin(ang), y + 14 * Math.cos(ang), K.c1, 2); }
      D.text(c, 'plane of vibration turns gradually', (x[2] + x[3]) / 2, y - 34, { size: 11, align: 'center', color: K.c1 });
      D.rect(c, x[4] - 4, y - 30, 8, 60, K.c2, null, 2); D.text(c, 'analyzer', x[4], y + 44, { size: 10.5, align: 'center', color: K.muted });
      D.circle(c, x[5], y, 26, 'rgba(255,211,77,' + (0.05 + 0.95 * I) + ')', K.ink, 1.5); D.text(c, 'eyepiece', x[5], y + 44, { size: 10.5, align: 'center', color: K.muted });
      S.set('rot', f(rot, 3) + '° (clockwise: dextro-rotatory)'); S.set('I', f(I * 100, 3) + '%' + (I < 0.003 ? ' — dark: reading found!' : ''));
      S.set('fd', I < 0.003 ? f(p.an / (66.5 * p.l), 3) + ' g/cm³' : 'turn the analyzer until the field is dark');
    }
  });
})();
