/* PHY1203 3D simulations (part 2: electricity, magnetism, optics). Needs bio3d.js loaded first. */
(function () {
  if (!window.Sim || !window.THREE || !window.Bio3D) return;
  var T = Sim.T3, f = Sim.fmt, PI = Math.PI, clamp = Sim.clamp, span = Bio3D.span, cyl = Bio3D.cyl, add = Bio3D.add;
  function spikeShape(u) { if (u < 0) return -70; if (u < 0.5) return -55 + 85 * (u / 0.5); if (u < 2) return 30 - 110 * ((u - 0.5) / 1.5); if (u < 8) return -80 + 10 * (1 - Math.exp(-(u - 2) / 1.8)); return -70; }
  function vColor(col, v) { var s = clamp((v + 80) / 110, 0, 1); col.setHSL(0.62 - 0.62 * s, 0.85, 0.45 + 0.15 * s); return col; }

  /* ================= ELECTRICITY ================= */

  /* Electric field of two charges, with ions released into it */
  function Efield(qs, x, y, z) { var E = [0, 0, 0]; qs.forEach(function (q) { var dx = x - q[0], dy = y - q[1], dz = z - q[2], r2 = dx * dx + dy * dy + dz * dz + 0.02, s = q[3] / (r2 * Math.sqrt(r2)); E[0] += s * dx; E[1] += s * dy; E[2] += s * dz; }); return E; }
  Sim.make('sim-field3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.15, r: 12 },
    controls: [
      { k: 'q1', label: 'Charge q<sub>1</sub> (left)', min: -3, max: 3, step: 0.5, v: 2 },
      { k: 'q2', label: 'Charge q<sub>2</sub> (right)', min: -3, max: 3, step: 0.5, v: -2 },
      { k: 'sep', label: 'Separation', min: 0.5, max: 4, step: 0.1, v: 2.4 }
    ],
    buttons: [{ label: 'Release test charges', click: function (S) { S.st.rel(); } }],
    reads: [{ k: 'E', label: 'Field strength at the centre', big: true }, { k: 'type', label: 'Arrangement' }],
    init: function (S) {
      var st = S.st; st.arrows = []; st.key = ''; st.tp = [];
      for (var i = 0; i < 125; i++) st.arrows.push(T.arrow(S.scene, '#2d6a3e'));
      st.s1 = add(S, T.sphere(0.32, 0xc62828)); st.s2 = add(S, T.sphere(0.32, 0x1565c0));
      st.tmesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), T.mat(0xffb300), 40)); st.tmesh.count = 0; st.m4 = new THREE.Matrix4();
      st.trails = []; for (var t = 0; t < 40; t++) st.trails.push(T.line(S.scene, 0xffb300, 200));
      st.rel = function () {
        var p = S.p, src = p.q1 > 0 ? -p.sep / 2 : p.q2 > 0 ? p.sep / 2 : null; st.tp = [];
        for (var k = 0; k < 40; k++) { var a = Math.acos(2 * Math.random() - 1), b = Math.random() * 2 * PI, c0 = src === null ? [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6] : [src + 0.45 * Math.sin(a) * Math.cos(b), 0.45 * Math.cos(a), 0.45 * Math.sin(a) * Math.sin(b)]; st.tp.push({ p: c0, tr: [c0.slice()], done: false }); }
      };
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, qs = [[-p.sep / 2, 0, 0, p.q1], [p.sep / 2, 0, 0, p.q2]], key = [p.q1, p.q2, p.sep].join();
      st.s1.position.x = -p.sep / 2; st.s2.position.x = p.sep / 2;
      [[st.s1, p.q1], [st.s2, p.q2]].forEach(function (q) { q[0].visible = q[1] !== 0; q[0].material.color.setHex(q[1] > 0 ? 0xc62828 : 0x1565c0); q[0].scale.setScalar(0.5 + Math.abs(q[1]) * 0.3); });
      if (key !== st.key) {
        st.key = key; var n = 0;
        for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) for (var d = -2; d <= 2; d++) {
          var x = a * 1.3, y = b * 1.3, z = d * 1.3, E = Efield(qs, x, y, z), near = qs.some(function (q) { return q[3] !== 0 && Math.hypot(x - q[0], y, z) < 0.6; });
          var m = Math.hypot(E[0], E[1], E[2]) || 1, L = near ? 0 : Math.min(1.1, 0.2 + 0.7 * Math.pow(m, 0.5));
          T.setArrow(st.arrows[n++], [x - E[0] / m * L / 2, y - E[1] / m * L / 2, z - E[2] / m * L / 2], [E[0] / m * L, E[1] / m * L, E[2] / m * L], 0.22);
        }
        st.tp = [];
      }
      st.tmesh.count = st.tp.length;
      st.tp.forEach(function (t, i) {
        if (!t.done) for (var s = 0; s < 4; s++) {
          var E = Efield(qs, t.p[0], t.p[1], t.p[2]), m = Math.hypot(E[0], E[1], E[2]) || 1, sp = Math.min(0.06, 0.02 + 0.02 * m) * dt * 60;
          t.p = [t.p[0] + E[0] / m * sp, t.p[1] + E[1] / m * sp, t.p[2] + E[2] / m * sp];
          if (qs.some(function (q) { return q[3] < 0 && Math.hypot(t.p[0] - q[0], t.p[1], t.p[2]) < 0.35; }) || Math.hypot(t.p[0], t.p[1], t.p[2]) > 7) t.done = true;
        }
        if (t.tr.length < 200) t.tr.push(t.p.slice());
        st.m4.makeTranslation(t.p[0], t.p[1], t.p[2]); st.tmesh.setMatrixAt(i, st.m4); T.setLine(st.trails[i], t.tr); st.trails[i].visible = true;
      });
      for (var j = st.tp.length; j < 40; j++) st.trails[j].visible = false;
      st.tmesh.instanceMatrix.needsUpdate = true;
      var E0 = Efield(qs, 0, 0, 0), Em = Math.hypot(E0[0], E0[1], E0[2]);
      S.set('E', f(Em, 3) + ' (relative units)'); S.set('type', p.q1 * p.q2 < 0 ? 'unlike charges: lines join them' : p.q1 * p.q2 > 0 ? 'like charges: lines push apart' : 'a single charge');
    }
  });

  /* Two charged pith balls on threads */
  Sim.make('sim-pendulum3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.25, ph: 1.4, r: 9, target: [0, 2.4, 0] },
    controls: [
      { k: 'q', label: 'Charge on each ball q', min: 0, max: 60, step: 1, v: 25, unit: 'nC' },
      { k: 'm', label: 'Mass of each ball m', min: 0.5, max: 5, step: 0.1, v: 1, unit: 'g' },
      { k: 'L', label: 'Thread length L', min: 0.1, max: 0.5, step: 0.01, v: 0.3, unit: 'm' }
    ],
    buttons: [{ label: 'Opposite charges', click: function (S, b) { S.st.opp = !S.st.opp; b.classList.toggle('on', S.st.opp); } }],
    reads: [{ k: 'th', label: 'Angle from vertical &theta;' }, { k: 'r', label: 'Separation r', big: true }, { k: 'F', label: 'Coulomb force kq&sup2;/r&sup2;' }, { k: 'W', label: 'Weight mg' }],
    init: function (S) {
      var st = S.st; st.th = 0.12; st.w = 0; st.opp = false;
      add(S, cyl(0.06, 0x56655b)).position.set(0, 4.2, 0);
      st.t1 = T.line(S.scene, 0x56655b, 2); st.t2 = T.line(S.scene, 0x56655b, 2);
      st.b1 = add(S, T.sphere(0.3, 0xc62828)); st.b2 = add(S, T.sphere(0.3, 0xc62828));
      st.Fa = T.arrow(S.scene, '#7c3aed'); st.Fb = T.arrow(S.scene, '#7c3aed'); st.Wa = T.arrow(S.scene, '#1565c0');
      T.grid(S.scene, 10, -2.5);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, k = 8.99e9, m = p.m / 1000, g = 9.8, L = p.L, q = p.q * 1e-9, sign = st.opp ? -1 : 1;
      var sub = 40; for (var i = 0; i < sub; i++) {
        var h = dt / sub, r = Math.max(0.01, 2 * L * Math.sin(st.th)), F = sign * k * q * q / (r * r);
        var acc = clamp((F * Math.cos(st.th) - m * g * Math.sin(st.th)) / (m * L), -400, 400) - 4 * st.w;
        st.w += acc * h; st.th += st.w * h;
        if (st.th < 0.004) { st.th = 0.004; st.w = Math.max(0, st.w); }
        if (st.th > 1.4) { st.th = 1.4; st.w = 0; }
      }
      var sc = 4.2 / 0.5, Ld = L * sc, top = [0, 4.2, 0], x = Ld * Math.sin(st.th), y = 4.2 - Ld * Math.cos(st.th);
      T.setLine(st.t1, [top, [-x, y, 0]]); T.setLine(st.t2, [top, [x, y, 0]]);
      var bs = 0.18 + 0.08 * Math.cbrt(p.m); st.b1.position.set(-x, y, 0); st.b2.position.set(x, y, 0); st.b1.scale.setScalar(bs / 0.3); st.b2.scale.setScalar(bs / 0.3);
      st.b2.material.color.setHex(st.opp ? 0x1565c0 : 0xc62828);
      var r = 2 * L * Math.sin(st.th), F = k * q * q / (r * r), fa = Math.min(2, F * 60);
      T.setArrow(st.Fa, [-x, y, 0], [-fa * sign, 0, 0], 0.25); T.setArrow(st.Fb, [x, y, 0], [fa * sign, 0, 0], 0.25);
      T.setArrow(st.Wa, [x, y - 0.3, 0], [0, -Math.min(2, m * g * 60), 0], 0.25);
      S.set('th', f(st.th * 180 / PI, 3) + '°'); S.set('r', f(r * 100, 3) + ' cm'); S.set('F', f(F, 3) + ' N'); S.set('W', f(m * g, 3) + ' N');
      S.msg(st.opp ? 'Opposite charges attract: the balls swing together and touch.' : 'At rest, tan&theta; = F/(mg): the electric push balances the pull of gravity.');
    }
  });

  /* Membrane as a capacitor, with an action potential */
  Sim.make('sim-membrane3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.2, r: 12 },
    controls: [
      { k: 'V', label: 'Resting membrane potential', min: -90, max: -40, step: 5, v: -70, unit: 'mV' },
      { k: 'd', label: 'Membrane thickness d', min: 3, max: 10, step: 0.5, v: 7, unit: 'nm' },
      { k: 'kap', label: 'Dielectric constant &kappa;', min: 2, max: 10, step: 0.5, v: 7 }
    ],
    buttons: [{ label: 'Fire an action potential', click: function (S) { S.st.t0 = S.t; } }],
    reads: [{ k: 'Vn', label: 'Voltage now', big: true }, { k: 'E', label: 'Field E = V/d' }, { k: 'C', label: 'C per area = &kappa;&epsilon;<sub>0</sub>/d' }, { k: 'n', label: 'Extra ions per &micro;m&sup2;' }],
    init: function (S) {
      var st = S.st, n = 0, m4 = new THREE.Matrix4(); st.t0 = -99;
      st.heads = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), T.mat(0x5d9c59), 2 * 14 * 9)); st.hp = [];
      for (var s = -1; s <= 1; s += 2) for (var i = 0; i < 14; i++) for (var j = 0; j < 9; j++) st.hp.push([-3.9 + i * 0.6, s, -2.4 + j * 0.6]);
      st.core = add(S, new THREE.Mesh(new THREE.BoxGeometry(8.4, 1, 5.4), T.mat(0xf2d16b, { opacity: 0.45 })));
      st.ch = add(S, cyl(0.45, 0x2f80c0, { opacity: 0.8 }));
      T.label(S.scene, 'outside the cell', '#56655b', 1.1).position.set(0, 2.6, -2.6);
      T.label(S.scene, 'inside (cytoplasm)', '#56655b', 1.1).position.set(0, -2.6, -2.6);
      st.ionsTop = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), 60));
      st.ionsBot = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), 60));
      st.pos = []; for (var k = 0; k < 60; k++) st.pos.push([-3.8 + Math.random() * 7.6, -2.3 + Math.random() * 4.6]);
      st.na = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), T.mat(0xffb300), 12));
      st.ar = []; for (var a = 0; a < 6; a++) st.ar.push(T.arrow(S.scene, '#7c3aed'));
      st.m4 = m4; st.red = new THREE.Color(0xc62828); st.blue = new THREE.Color(0x1565c0);
      for (var q = 0; q < 60; q++) { st.ionsTop.setColorAt(q, st.red); st.ionsBot.setColorAt(q, st.blue); }
    },
    draw: function (S) {
      var st = S.st, p = S.p, el = (S.t - st.t0) * 4, V = st.t0 > -99 && el < 10 ? (el < 0.5 ? p.V + (30 - p.V) * el / 0.5 : spikeShape(el) * (p.V / -70)) : p.V;
      if (el >= 0.5 && el < 10 && st.t0 > -99) V = spikeShape(el) + (p.V + 70) * (el > 2 ? 1 : 0);
      var half = 0.25 + p.d * 0.1;
      st.core.scale.y = 2 * half - 0.2;
      for (var i = 0; i < st.hp.length; i++) { st.m4.makeTranslation(st.hp[i][0], st.hp[i][1] * half, st.hp[i][2]); st.heads.setMatrixAt(i, st.m4); }
      st.heads.instanceMatrix.needsUpdate = true;
      st.ch.scale.y = 2 * half + 0.4;
      var Cpa = p.kap * 8.85e-12 / (p.d * 1e-9), Q = Cpa * Math.abs(V) * 1e-3, n = Math.min(60, Math.round(Q / 6.2e-4 * 30));
      var topCol = V <= 0 ? st.red : st.blue, botCol = V <= 0 ? st.blue : st.red;
      [[st.ionsTop, half + 0.4, topCol], [st.ionsBot, -half - 0.4, botCol]].forEach(function (g) {
        g[0].count = n;
        for (var j = 0; j < n; j++) { st.m4.makeTranslation(st.pos[j][0], g[1], st.pos[j][1]); g[0].setMatrixAt(j, st.m4); g[0].setColorAt(j, g[2]); }
        g[0].instanceMatrix.needsUpdate = true; if (g[0].instanceColor) g[0].instanceColor.needsUpdate = true;
      });
      var flowing = st.t0 > -99 && el > 0 && el < 0.7; st.na.count = flowing ? 12 : 0;
      for (var q = 0; q < st.na.count; q++) { var yy = half + 1 - ((el * 4 + q / 12 * 2.5) % 2.5) * 1.6; st.m4.makeTranslation(0.2 * Math.cos(q), yy, 0.2 * Math.sin(q)); st.na.setMatrixAt(q, st.m4); }
      st.na.instanceMatrix.needsUpdate = true; st.ch.material.color.setHex(flowing ? 0xffb300 : 0x2f80c0);
      var L = Math.min(1.6, Math.abs(V) / 90 * 1.1 * (7 / p.d)), dir = V <= 0 ? -1 : 1;
      st.ar.forEach(function (a, i) { T.setArrow(a, [-3 + (i % 3) * 3 + (i > 2 ? 1.5 : 0), -dir * L / 2, i > 2 ? 1.2 : -1.2], [0, dir * L, 0], 0.25); });
      S.set('Vn', f(V, 3) + ' mV'); S.set('E', f(Math.abs(V) * 1e-3 / (p.d * 1e-9), 3) + ' V/m'); S.set('C', f(Cpa * 100, 3) + ' µF/cm²'); S.set('n', f(Q * 1e-12 / 1.6e-19, 3));
      S.msg(flowing ? 'Na⁺ channel open: Na⁺ ions (gold) rush in and the charges swap sides.' : '');
    }
  });

  /* 3D RC circuit: charge flowing onto capacitor plates */
  Sim.make('sim-rc3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.35, ph: 1.1, r: 14 },
    controls: [
      { k: 'R', label: 'Resistance R', min: 1, max: 10, step: 0.5, v: 4, unit: 'kΩ' },
      { k: 'C', label: 'Capacitance C', min: 100, max: 800, step: 50, v: 250, unit: 'µF' },
      { k: 'E', label: 'Battery voltage', min: 1, max: 12, step: 0.5, v: 9, unit: 'V' }
    ],
    buttons: [{ label: 'Charge', group: 'm', click: function (S) { S.st.mode = 1; } }, { label: 'Discharge', group: 'm', click: function (S) { S.st.mode = -1; } }],
    reads: [{ k: 'tau', label: '&tau; = RC' }, { k: 'v', label: 'Capacitor voltage', big: true }, { k: 'i', label: 'Current' }, { k: 'pct', label: 'Percent of battery voltage' }],
    init: function (S) {
      var st = S.st; st.mode = 0; st.v = 0; st.s = 0;
      var path = [[-4, -2, 0], [-4, 2, 0], [4, 2, 0], [4, -2, 0], [-4, -2, 0]]; st.path = path;
      var w = T.line(S.scene, 0x56655b, 5); T.setLine(w, path);
      st.bat = add(S, new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), T.mat(0x2d3a32))); st.bat.position.set(-4, 0, 0);
      var res = add(S, new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.4), T.mat(0xc2410c))); res.position.set(0, 2, 0);
      st.p1 = add(S, new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.8), T.mat(0x9aa5a0))); st.p1.position.set(4, 0.25, 0);
      st.p2 = add(S, new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.8), T.mat(0x9aa5a0))); st.p2.position.set(4, -0.25, 0); st.p1.rotation.z = PI / 2; st.p2.rotation.z = PI / 2;
      st.e = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), T.mat(0x2f80c0), 30));
      st.pl = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), 60));
      T.label(S.scene, 'battery', '#56655b', 0.9).position.set(-4, 1.3, 0); T.label(S.scene, 'R', '#c2410c', 0.9).position.set(0, 2.6, 0); T.label(S.scene, 'C', '#56655b', 0.9).position.set(4.8, 0, 0);
      st.graph = T.line(S.scene, 0x7c3aed, 300); st.hist = []; st.gt = 0;
      var ax = T.line(S.scene, 0x88998c, 3); T.setLine(ax, [[-3.5, -4.6, -2], [-3.5, -2.8, -2], [-3.5, -4.6, -2], [3.5, -4.6, -2]]);
      st.m4 = new THREE.Matrix4(); st.red = new THREE.Color(0xc62828); st.blue = new THREE.Color(0x1565c0);
      for (var q = 0; q < 60; q++) st.pl.setColorAt(q, q % 2 ? st.blue : st.red);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, tau = p.R * 1e3 * p.C * 1e-6, I = 0;
      if (st.mode === 1) { I = (p.E - st.v) / (p.R * 1e3); st.v += (p.E - st.v) * (1 - Math.exp(-dt / tau)); }
      if (st.mode === -1) { I = st.v / (p.R * 1e3); st.v *= Math.exp(-dt / tau); }
      st.bat.visible = st.mode !== -1;
      st.s += I * 1e3 * dt * 0.8 * (st.mode === -1 ? -1 : 1);
      var P = 24; for (var i = 0; i < 30; i++) { var u = (((st.s + i * P / 30) % P) + P) % P, q = [0, 0, 0], seg = [[-4, -2, 0, 4], [-4, 2, 8, 0], [4, 2, 0, -4], [4, -2, -8, 0]], acc = 0;
        for (var k = 0; k < 4; k++) { var L = Math.abs(seg[k][2] || seg[k][3]); if (u <= acc + L) { var t = (u - acc) / L; q = [seg[k][0] + seg[k][2] * t, seg[k][1] + seg[k][3] * t, 0]; break; } acc += L; }
        st.m4.makeTranslation(q[0], q[1], q[2] + 0.25); st.e.setMatrixAt(i, st.m4); }
      st.e.instanceMatrix.needsUpdate = true; st.e.visible = Math.abs(I) > 1e-6;
      var n = Math.round(Math.abs(st.v) / 12 * 30); st.pl.count = 2 * n;
      for (var j = 0; j < n; j++) { var x = 4 + (Math.floor(j / 6) - 2) * 0.3, z = (j % 6 - 2.5) * 0.3; st.m4.makeTranslation(x, 0.55, z); st.pl.setMatrixAt(2 * j, st.m4); st.pl.setColorAt(2 * j, st.red); st.m4.makeTranslation(x, -0.55, z); st.pl.setMatrixAt(2 * j + 1, st.m4); st.pl.setColorAt(2 * j + 1, st.blue); }
      st.pl.instanceMatrix.needsUpdate = true; if (st.pl.instanceColor) st.pl.instanceColor.needsUpdate = true;
      if (st.mode) { st.gt += dt; st.hist.push([-3.5 + Math.min(7, st.gt * 7 / 15), -4.6 + st.v / 12 * 1.8, -2]); if (st.hist.length > 300) st.hist.shift(); T.setLine(st.graph, st.hist); }
      S.set('tau', f(tau, 3) + ' s'); S.set('v', f(st.v, 3) + ' V'); S.set('i', f(I * 1000, 3) + ' mA'); S.set('pct', f(st.v / p.E * 100, 3) + '%');
      S.msg(st.mode === 0 ? 'Press Charge.' : 'After one &tau; the capacitor reaches 63%; after 5&tau; it is essentially full.');
    }
  });

  /* Action potential along an axon */
  Sim.make('sim-axon3d', {
    webgl: true, aspect: 0.45, camera: { th: 0.25, ph: 1.15, r: 17 },
    controls: [
      { k: 'dia', label: 'Axon diameter', min: 0.5, max: 20, step: 0.5, v: 2, unit: 'µm' },
      { k: 'rate', label: 'Automatic firing rate (0 = off)', min: 0, max: 4, step: 0.5, v: 0, unit: 'Hz' }
    ],
    buttons: [
      { label: 'Fire!', click: function (S) { S.st.fires.push(S.t); } },
      { label: 'Unmyelinated', group: 'm', on: true, click: function (S) { S.st.my = false; S.st.fires = []; } },
      { label: 'Myelinated', group: 'm', click: function (S) { S.st.my = true; S.st.fires = []; } }
    ],
    reads: [{ k: 'v', label: 'Real conduction speed', big: true }, { k: 't', label: 'Time to travel 1 m (spinal cord to toe)' }, { k: 'st', label: 'Signal' }],
    init: function (S) {
      var st = S.st, N = 90; st.N = N; st.my = false; st.fires = []; st.last = 0;
      st.seg = add(S, new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.18, 20), new THREE.MeshPhongMaterial({ color: 0xffffff }), N));
      st.rot = new THREE.Matrix4().makeRotationZ(PI / 2); st.m4 = new THREE.Matrix4(); st.sc = new THREE.Matrix4();
      st.sheaths = []; for (var k = 0; k < 8; k++) { var sh = cyl(0.7, 0xf5f5f0, { opacity: 0.85 }); sh.rotation.z = PI / 2; sh.scale.y = 1.6; sh.position.x = -7 + k * 2; add(S, sh); st.sheaths.push(sh); }
      add(S, T.sphere(1.2, 0x8e6bbf)).position.x = -9.2;
      st.col = new THREE.Color();
    },
    draw: function (S) {
      var st = S.st, p = S.p, any = false, dsc = 0.35 + p.dia / 20 * 0.9;
      if (p.rate > 0 && S.t - st.last > 1 / p.rate) { st.fires.push(S.t); st.last = S.t; }
      st.fires = st.fires.filter(function (t) { return S.t - t < 12; });
      var vReal = st.my ? 6 * p.dia : Math.sqrt(p.dia), vVis = st.my ? 2 + vReal / 6 : 0.8 + vReal * 0.8;
      st.sheaths.forEach(function (s) { s.visible = st.my; s.scale.set(dsc * 1.5, 1.6, dsc * 1.5); });
      for (var i = 0; i < st.N; i++) {
        var x = -8 + 16 * i / (st.N - 1), V = -70;
        st.fires.forEach(function (t0) {
          var el = S.t - t0, ta = st.my ? Math.floor((x + 8) / 2 + 0.5) * 2 / vVis : (x + 8) / vVis, v = spikeShape((el - ta) * 4);
          if (st.my) { var node = Math.abs((x + 8) % 2) < 0.25 || Math.abs((x + 8) % 2 - 2) < 0.25; if (!node && v > -70) v = -70 + (v + 70) * 0.35; }
          if (v > V) V = v;
        });
        if (V > -60) any = true;
        st.m4.makeTranslation(x, 0, 0).multiply(st.rot).multiply(st.sc.makeScale(dsc, 1, dsc)); st.seg.setMatrixAt(i, st.m4);
        st.seg.setColorAt(i, vColor(st.col, V));
      }
      st.seg.instanceMatrix.needsUpdate = true; if (st.seg.instanceColor) st.seg.instanceColor.needsUpdate = true;
      S.set('v', f(vReal, 3) + ' m/s'); S.set('t', f(1000 / vReal, 3) + ' ms');
      S.set('st', any ? 'spike travelling (red = +30 mV)' : 'at rest (blue = −70 mV)');
    }
  });

  /* ================= MAGNETISM ================= */

  /* Charge spiralling in a magnetic field */
  Sim.make('sim-helix3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.9, ph: 1.2, r: 16 },
    controls: [
      { k: 'ang', label: 'Angle between v and B', min: 0, max: 90, step: 5, v: 60, unit: '°' },
      { k: 'v', label: 'Speed v', min: 0.5, max: 2, step: 0.1, v: 1, show: function (v) { return f(v, 3) + ' × 10⁶ m/s'; } },
      { k: 'B', label: 'Field strength B', min: 0.5, max: 2, step: 0.1, v: 1, unit: 'T' },
      { k: 'm', label: 'Ion mass', min: 1, max: 4, step: 1, v: 1, show: function (v) { return v + ' u'; } }
    ],
    buttons: [{ label: 'Positive charge', group: 'q', on: true, click: function (S) { S.st.q = 1; S.st.pts = []; } }, { label: 'Negative charge', group: 'q', click: function (S) { S.st.q = -1; S.st.pts = []; } }],
    reads: [{ k: 'r', label: 'Radius r = mv sin&theta;/qB', big: true }, { k: 'T', label: 'Time per turn 2&pi;m/qB' }, { k: 'pitch', label: 'Pitch (distance per turn)' }],
    init: function (S) {
      var st = S.st; st.q = 1; st.pts = []; st.t = 0;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#1565c0'); T.setArrow(a, [i * 3.2, -3.8, j * 3.2], [0, 7.6, 0], 0.4); }
      T.label(S.scene, 'B', '#1565c0', 1).position.set(3.2, 4.3, 3.2);
      st.dot = add(S, T.sphere(0.22, 0xc62828)); st.line = T.line(S.scene, 0xc62828, 1500);
    },
    onChange: function (S) { S.st.pts = []; S.st.t = 0; },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, th = p.ang * PI / 180, r = Math.min(3.2, 1.8 * p.m * p.v * Math.sin(th) / p.B), wc = 2.2 * p.B / p.m * st.q, vy = 0.6 * p.v * Math.cos(th);
      st.t += dt;
      var y = -3.5 + vy * st.t; if (y > 3.5 || st.t > 40) { st.t = 0; st.pts = []; y = -3.5; }
      var P = [r * Math.cos(wc * st.t), y, r * Math.sin(wc * st.t)];
      st.pts.push(P); if (st.pts.length > 1500) st.pts.shift();
      st.dot.position.set(P[0], P[1], P[2]); st.dot.material.color.setHex(st.q > 0 ? 0xc62828 : 0x1565c0); T.setLine(st.line, st.pts);
      var mR = p.m * 1.67e-27, rr = mR * p.v * 1e6 * Math.sin(th) / (1.6e-19 * p.B), Tp = 2 * PI * mR / (1.6e-19 * p.B);
      S.set('r', f(rr * 1000, 3) + ' mm'); S.set('T', f(Tp, 3) + ' s'); S.set('pitch', f(p.v * 1e6 * Math.cos(th) * Tp * 1000, 3) + ' mm');
    }
  });

  /* Field around wires, with compasses */
  Sim.make('sim-wire3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 0.8, r: 15 },
    controls: [
      { k: 'I', label: 'Current in wire 1 (sign = direction)', min: -20, max: 20, step: 1, v: 10, unit: 'A' },
      { k: 'I2', label: 'Current in wire 2', min: -20, max: 20, step: 1, v: 0, unit: 'A' },
      { k: 'd', label: 'Distance between wires', min: 2, max: 6, step: 0.5, v: 4, unit: 'cm' }
    ],
    buttons: [{ k: 'earth', label: 'Earth’s field on', click: function (S, b) { S.st.earth = !S.st.earth; b.classList.toggle('on', S.st.earth); b.textContent = S.st.earth ? 'Earth’s field on' : 'Earth’s field off'; } }],
    reads: [{ k: 'B', label: 'B 2 cm from wire 1', big: true }, { k: 'F', label: 'Force between wires per metre' }, { k: 'dir', label: 'The wires' }],
    init: function (S) {
      var st = S.st; st.earth = true; S.btn('earth').classList.add('on');
      st.w1 = cyl(0.12, 0xc2410c); st.w1.scale.y = 9; add(S, st.w1); st.w2 = cyl(0.12, 0xc2410c); st.w2.scale.y = 9; add(S, st.w2);
      st.A1 = T.arrow(S.scene, '#c2410c'); st.A2 = T.arrow(S.scene, '#c2410c'); st.F1 = T.arrow(S.scene, '#7c3aed'); st.F2 = T.arrow(S.scene, '#7c3aed');
      var plane = add(S, new THREE.Mesh(new THREE.PlaneGeometry(12, 10), T.mat(0xdfe8df, { opacity: 0.5, side: THREE.DoubleSide }))); plane.rotation.x = -PI / 2;
      st.needles = [];
      for (var a = -5.6; a <= 5.7; a += 1.4) for (var b = -4.2; b <= 4.3; b += 1.4) {
        var g = new THREE.Group(), n1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), T.mat(0xc62828)), n2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), T.mat(0xbbbbbb));
        n1.rotation.z = -PI / 2; n1.position.x = 0.3; n2.rotation.z = PI / 2; n2.position.x = -0.3; g.add(n1); g.add(n2); g.position.set(a, 0.1, b); add(S, g); st.needles.push(g);
      }
      T.label(S.scene, 'N (Earth)', '#56655b', 1).position.set(0, 0.4, -5.4);
    },
    draw: function (S) {
      var st = S.st, p = S.p, x1 = -p.d / 2, x2 = p.d / 2, Be = st.earth ? 5e-5 : 0;
      st.w1.position.x = x1; st.w2.position.x = x2; st.w2.visible = p.I2 !== 0;
      [[st.A1, x1, p.I], [st.A2, x2, p.I2]].forEach(function (q) { T.setArrow(q[0], [q[1] + 0.4, q[2] >= 0 ? -1.5 : 1.5, 0], [0, q[2] === 0 ? 0 : (q[2] > 0 ? 3 : -3), 0], 0.4); });
      st.needles.forEach(function (g) {
        var Bx = 0, Bz = -Be;
        [[x1, p.I], [x2, p.I2]].forEach(function (w) { var dx = g.position.x - w[0], dz = g.position.z, rr = Math.hypot(dx, dz), B = 2e-7 * w[1] / Math.max(0.004, rr / 100); Bx += B * dz / rr; Bz += -B * dx / rr; });
        g.visible = Math.min(Math.hypot(g.position.x - x1, g.position.z), p.I2 ? Math.hypot(g.position.x - x2, g.position.z) : 99) > 0.5;
        if (Math.hypot(Bx, Bz) > 1e-9) g.rotation.y = Math.atan2(-Bz, Bx);
      });
      var F = 2e-7 * p.I * p.I2 / (p.d / 100), att = p.I * p.I2 > 0, fl = Math.min(2.5, Math.abs(F) * 400);
      T.setArrow(st.F1, [x1, 3, 0], [att ? fl : -fl, 0, 0], 0.3); T.setArrow(st.F2, [x2, 3, 0], [att ? -fl : fl, 0, 0], 0.3); st.F1.visible = st.F2.visible = F !== 0;
      S.set('B', f(Math.abs(2e-7 * p.I / 0.02), 3) + ' T'); S.set('F', f(Math.abs(F), 3) + ' N/m');
      S.set('dir', !p.I2 ? 'only wire 1 carries current' : att ? 'attract (currents the same way)' : 'repel (currents opposite)');
    }
  });

  /* Magnetotactic bacteria swimming in 3D */
  Sim.make('sim-bacteria3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.15, r: 15 },
    controls: [
      { k: 'az', label: 'Field direction (compass bearing)', min: 0, max: 360, step: 5, v: 0, unit: '°' },
      { k: 'el', label: 'Field dip angle (down into the ground)', min: 0, max: 80, step: 5, v: 40, unit: '°' },
      { k: 'B', label: 'Field strength B', min: 0, max: 100, step: 5, v: 50, unit: 'µT' },
      { k: 'T', label: 'Thermal jostling (temperature)', min: 0.2, max: 3, step: 0.1, v: 1, show: function (v) { return '×' + v.toFixed(1); } }
    ],
    reads: [{ k: 'al', label: 'How well they line up', big: true }, { k: 'r', label: '&mu;B / thermal energy (relative)' }],
    init: function (S) {
      var st = S.st, N = 40; st.b = [];
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), new THREE.MeshBasicMaterial({ color: 0x5aa0dc, wireframe: true, transparent: true, opacity: 0.2 })));
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), T.mat(0x8a6a4f))).position.y = -3.1;
      T.label(S.scene, 'mud (low oxygen)', '#8a6a4f', 1).position.set(0, -2.6, 4.2);
      st.Barrow = T.arrow(S.scene, '#1565c0');
      for (var i = 0; i < N; i++) {
        var g = new THREE.Group(), body = T.sphere(0.25, 0x2e7d32); body.scale.set(2.2, 0.8, 0.8); g.add(body);
        for (var k = -2; k <= 2; k++) { var m = T.sphere(0.06, 0x111111); m.position.x = k * 0.16; g.add(m); }
        add(S, g); var d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        st.b.push({ g: g, p: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 7), d: d });
      }
      st.X = new THREE.Vector3(1, 0, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, az = p.az * PI / 180, el = p.el * PI / 180, Bd = new THREE.Vector3(Math.sin(az) * Math.cos(el), -Math.sin(el), -Math.cos(az) * Math.cos(el)), sum = 0;
      T.setArrow(st.Barrow, [-Bd.x * 4, -Bd.y * 4 + 0, -Bd.z * 4], [Bd.x * 8, Bd.y * 8, Bd.z * 8], 0.6);
      var kAl = p.B / 15, noise = 1.4 * p.T;
      st.b.forEach(function (b) {
        var cross = new THREE.Vector3().crossVectors(b.d, Bd);
        b.d.addScaledVector(new THREE.Vector3().crossVectors(cross, b.d), kAl * dt);
        b.d.x += (Math.random() - 0.5) * noise * Math.sqrt(dt); b.d.y += (Math.random() - 0.5) * noise * Math.sqrt(dt); b.d.z += (Math.random() - 0.5) * noise * Math.sqrt(dt); b.d.normalize();
        b.p.addScaledVector(b.d, dt * 1.2);
        ['x', 'y', 'z'].forEach(function (ax, i) { var lim = [4.8, 2.8, 3.8][i]; if (b.p[ax] > lim) b.p[ax] = -lim; if (b.p[ax] < -lim) b.p[ax] = lim; });
        b.g.position.copy(b.p); b.g.quaternion.setFromUnitVectors(st.X, b.d); sum += b.d.dot(Bd);
      });
      var al = sum / st.b.length;
      S.set('al', Math.round(Math.max(0, al) * 100) + '%'); S.set('r', f(p.B / 50 / p.T, 3));
      S.msg(p.el > 20 ? 'The field dips into the ground, so following it leads the bacteria down to the mud they like.' : '');
    }
  });

  /* EM wave */
  Sim.make('sim-emwave3d', {
    webgl: true, aspect: 0.52, camera: { th: 0.75, ph: 1.15, r: 15 },
    controls: [
      { k: 'lam', label: 'Wavelength &lambda; (display units)', min: 1.5, max: 8, step: 0.25, v: 4 },
      { k: 'A', label: 'Amplitude (brightness)', min: 0.3, max: 2.5, step: 0.1, v: 2 },
      { k: 'pol', label: 'Polarisation angle', min: 0, max: 180, step: 5, v: 0, unit: '°' }
    ],
    reads: [{ k: 'f', label: 'Frequency f = c/&lambda;', big: true }, { k: 'I', label: 'Intensity (&prop; amplitude&sup2;)' }],
    init: function (S) {
      var st = S.st; st.E = []; st.B = []; st.ph = 0;
      for (var i = 0; i < 30; i++) { st.E.push(T.arrow(S.scene, '#c62828')); st.B.push(T.arrow(S.scene, '#1565c0')); }
      st.lE = T.line(S.scene, 0xc62828, 300); st.lB = T.line(S.scene, 0x1565c0, 300);
      var ax = T.arrow(S.scene, '#56655b'); T.setArrow(ax, [-7.5, 0, 0], [15.5, 0, 0], 0.5);
      T.label(S.scene, 'travel', '#56655b', 1).position.set(8.5, 0.5, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, k = 2 * PI / p.lam, cdisp = 3, pe = [], pb = [], po = p.pol * PI / 180, ey = Math.cos(po), ez = Math.sin(po);
      st.ph += cdisp * k * dt;
      for (var i = 0; i < 300; i++) { var x = -7 + 14 * i / 299, a = p.A * Math.sin(k * x - st.ph); pe.push([x, a * ey, a * ez]); pb.push([x, -a * ez, a * ey]); }
      T.setLine(st.lE, pe); T.setLine(st.lB, pb);
      for (var j = 0; j < 30; j++) { var X = -7 + 14 * j / 29, A = p.A * Math.sin(k * X - st.ph); T.setArrow(st.E[j], [X, 0, 0], [0, A * ey, A * ez], 0.25); T.setArrow(st.B[j], [X, 0, 0], [0, -A * ez, A * ey], 0.25); }
      S.set('f', f(cdisp / p.lam, 3) + ' (display units)'); S.set('I', f(p.A * p.A, 3) + ' (relative)');
    }
  });

  /* NMR: precession, resonance and relaxation */
  Sim.make('sim-nmr3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.2, r: 13 },
    controls: [
      { k: 'B', label: 'Magnet strength B', min: 0.5, max: 3, step: 0.1, v: 1.5, unit: 'T' },
      { k: 'rf', label: 'Radio frequency sent', min: 20, max: 130, step: 0.5, v: 50, unit: 'MHz' },
      { k: 'flip', label: 'Pulse strength (flip angle)', min: 30, max: 180, step: 10, v: 90, unit: '°' },
      { k: 'T1', label: 'Relaxation time T<sub>1</sub> (tissue type)', min: 0.5, max: 4, step: 0.25, v: 1.5, unit: 's' }
    ],
    buttons: [{ label: 'RF pulse', click: function (S) { S.st.pulse = S.t; S.st.hit = Math.abs(S.p.rf - 42.58 * S.p.B) / (42.58 * S.p.B) < 0.03; S.st.flip = S.p.flip * PI / 180; } }],
    reads: [{ k: 'fl', label: 'Larmor frequency 42.58 &times; B', big: true }, { k: 'sig', label: 'Signal picked up (M<sub>xy</sub>)' }, { k: 'st', label: 'Result' }],
    init: function (S) {
      var st = S.st; st.sp = []; st.pulse = -99; st.hit = false; st.flip = PI / 2;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#c2410c'); var s = T.sphere(0.25, 0xc2410c); s.position.set(i * 2.6, 0, j * 2.6); add(S, s); st.sp.push({ a: a, x: i * 2.6, z: j * 2.6, ph: Math.random() * 0.6 }); }
      var bA = T.arrow(S.scene, '#1565c0'); T.setArrow(bA, [-5.5, -3, -5.5], [0, 6, 0], 0.5); T.label(S.scene, 'B', '#1565c0', 1).position.set(-5.5, 3.6, -5.5);
      T.grid(S.scene, 10, -2.2);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, fl = 42.58 * p.B, since = S.t - st.pulse, tilt = 0.25, sig = 0;
      if (st.hit && since >= 0) { var tp = 0.8; tilt = since < tp ? 0.25 + (st.flip - 0.25) * since / tp : 0.25 + (st.flip - 0.25) * Math.exp(-(since - tp) / p.T1); }
      st.sp.forEach(function (s, i) {
        s.ph += dt * p.B * 2.4 * (1 + (since > 0.8 && st.hit ? (i - 4) * 0.02 : 0));
        T.setArrow(s.a, [s.x, 0, s.z], [1.8 * Math.sin(tilt) * Math.cos(s.ph), 1.8 * Math.cos(tilt), 1.8 * Math.sin(tilt) * Math.sin(s.ph)], 0.35);
      });
      sig = Math.abs(Math.sin(tilt)) * (st.hit && since > 0.8 ? Math.exp(-(since - 0.8) / (p.T1 * 0.6)) : st.hit && since >= 0 ? 1 : 0);
      var near = Math.abs(p.rf - fl) / fl < 0.03;
      S.set('fl', f(fl, 3) + ' MHz'); S.set('sig', Math.round(sig * 100) + '%');
      S.set('st', since >= 0 && since < 3 * p.T1 + 1 ? (st.hit ? 'resonance: spins tipped, now relaxing (T₁ = ' + p.T1 + ' s)' : 'off resonance: nothing absorbed') : near ? 'tuned: press RF pulse' : 'not tuned yet');
    }
  });

  /* MRI slice selection */
  Sim.make('sim-mri3d', {
    webgl: true, aspect: 0.5, camera: { th: 1.0, ph: 1.15, r: 15 },
    controls: [
      { k: 'G', label: 'Gradient strength G', min: 0, max: 20, step: 1, v: 10, unit: 'mT/m' },
      { k: 'rf', label: 'Radio frequency sent (offset from centre)', min: -300, max: 300, step: 5, v: 0, unit: 'kHz' },
      { k: 'bw', label: 'Pulse bandwidth', min: 1, max: 20, step: 1, v: 4, unit: 'kHz' }
    ],
    buttons: [{ label: '1.5 T scanner', group: 'b', on: true, click: function (S) { S.st.B0 = 1.5; } }, { label: '3 T scanner', group: 'b', click: function (S) { S.st.B0 = 3; } }],
    reads: [{ k: 'f0', label: 'Centre frequency 42.58 &times; B<sub>0</sub>' }, { k: 'z', label: 'Slice excited at', big: true }, { k: 'th', label: 'Slice thickness = bandwidth/(&gamma;G)' }],
    init: function (S) {
      var st = S.st; st.B0 = 1.5; st.slices = [];
      var bore = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 6, 48, 1, true), T.mat(0x9aa5a0, { opacity: 0.25, side: THREE.DoubleSide })); bore.rotation.x = PI / 2; add(S, bore);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.35, 16, 48), T.mat(0x6b7a70)); add(S, ring).position.z = -3; add(S, ring.clone()).position.z = 3;
      for (var i = 0; i < 40; i++) { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.14, 24), T.mat(0xd9b38c)); m.rotation.x = PI / 2; m.position.set(0, -0.6, -2.85 + i * 0.15); add(S, m); st.slices.push(m); }
      add(S, T.sphere(0.65, 0xd9b38c)).position.set(0, -0.5, 3.5);
      add(S, new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 9), T.mat(0x56655b))).position.set(0, -1.7, 0.5);
      var b = T.arrow(S.scene, '#1565c0'); T.setArrow(b, [3.6, 1.5, -3], [0, 0, 6], 0.5); T.label(S.scene, 'B₀', '#1565c0', 1).position.set(3.6, 2.2, 0);
      st.spins = []; for (var k = 0; k < 6; k++) st.spins.push(T.arrow(S.scene, '#ffb300'));
    },
    draw: function (S) {
      var st = S.st, p = S.p, G = p.G * 1e-3, gam = 42.58, mPerU = 0.3, f0 = gam * st.B0, hits = [];
      st.slices.forEach(function (m) {
        var z = m.position.z * mPerU, df = gam * G * z * 1000, on = G === 0 ? Math.abs(p.rf) <= p.bw / 2 : Math.abs(df - p.rf) <= Math.max(p.bw / 2, gam * G * 0.045 * 1000 / 2);
        m.material.color.set(on ? 0xffb300 : 0xd9b38c); if (on) hits.push(m.position.z);
      });
      var zc = hits.length ? hits.reduce(function (a, b) { return a + b; }, 0) / hits.length : null;
      st.spins.forEach(function (a, i) { a.visible = zc !== null; if (zc === null) return; var ang = S.t * 4 + i * PI / 3; T.setArrow(a, [0.55 * Math.cos(i * PI / 3), 0.3 + 0.55 * Math.sin(i * PI / 3), zc], [0.6 * Math.cos(ang), 0.6 * Math.sin(ang), 0.15], 0.15); });
      S.set('f0', f(f0, 4) + ' MHz');
      S.set('z', zc === null ? 'nothing (no slice matches)' : G === 0 ? 'the whole body at once' : f(zc * mPerU * 100, 3) + ' cm from centre');
      S.set('th', G > 0 ? f(p.bw * 1000 / (gam * 1e6 * G) * 1000, 3) + ' mm' : 'no gradient: no slice');
    }
  });

  /* ================= OPTICS ================= */

  /* Lens bending a bundle of rays (lensmaker's equation) */
  Sim.make('sim-lens3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.9, ph: 1.2, r: 15, target: [1, 0, 0] },
    controls: [
      { k: 'n', label: 'Refractive index of the lens n', min: 1.3, max: 1.9, step: 0.02, v: 1.5 },
      { k: 'R', label: 'Curvature radius of each face R', min: 2, max: 10, step: 0.25, v: 4, unit: 'cm' },
      { k: 'w', label: 'Beam radius', min: 0.4, max: 2, step: 0.1, v: 1.5, unit: 'cm' }
    ],
    buttons: [{ label: 'Converging (convex)', group: 't', on: true, click: function (S) { S.st.div = false; } }, { label: 'Diverging (concave)', group: 't', click: function (S) { S.st.div = true; } }],
    reads: [{ k: 'f', label: 'Focal length f = R / 2(n &minus; 1)', big: true }, { k: 'P', label: 'Power P = 1/f' }, { k: 'na', label: 'Cone half-angle' }],
    init: function (S) {
      var st = S.st; st.div = false;
      st.lens = add(S, T.sphere(2.4, 0x5aa0dc, { opacity: 0.28 }));
      st.rays = []; for (var i = 0; i < 26; i++) st.rays.push(T.line(S.scene, i < 13 ? 0xc62828 : 0xe09b3d, 3));
      st.F = add(S, T.sphere(0.12, 0x1e4d2b)); st.lab = T.label(S.scene, 'F', '#1e4d2b', 0.8);
      var ax = T.line(S.scene, 0x88998c, 2); T.setLine(ax, [[-7, 0, 0], [12, 0, 0]]);
    },
    draw: function (S) {
      var st = S.st, p = S.p, fcm = p.R / (2 * (p.n - 1)), fd = Math.min(10, fcm * 0.8), n = 0, sgn = st.div ? -1 : 1;
      st.lens.scale.set(0.08 + 0.6 / p.R * (st.div ? 0.5 : 1), 1, 1);
      [p.w, p.w * 0.5].forEach(function (r) {
        for (var i = 0; i < 13; i++) {
          var a = 2 * PI * i / 13, y = r * Math.cos(a), z = r * Math.sin(a), end = 11;
          T.setLine(st.rays[n++], [[-7, y, z], [0, y, z], [end, y * (1 - sgn * end / fd), z * (1 - sgn * end / fd)]]);
        }
      });
      st.F.position.set(sgn * fd, 0, 0); st.lab.position.set(sgn * fd, -0.6, 0);
      S.set('f', (st.div ? '−' : '') + f(fcm, 3) + ' cm'); S.set('P', (st.div ? '−' : '+') + f(100 / fcm, 3) + ' D'); S.set('na', f(Math.atan(p.w / fcm) * 180 / PI, 3) + '°');
    }
  });

  /* The human eye: focusing, myopia, hyperopia and glasses */
  Sim.make('sim-eye3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.95, ph: 1.25, r: 13, target: [-1.5, 0, 0] },
    controls: [
      { k: 'do', label: 'Object distance', min: -1.4, max: 1.3, step: 0.02, v: 1.3, map: function (x) { return Math.pow(10, x); }, show: function (v) { return v >= 19 ? 'very far (∞)' : v >= 1 ? f(v, 3) + ' m' : f(v * 100, 3) + ' cm'; } },
      { k: 'len', label: 'Eyeball length', min: 22, max: 26, step: 0.1, v: 24, unit: 'mm' },
      { k: 'acc', label: 'Focusing power of the eye’s lens (accommodation)', min: 0, max: 8, step: 0.25, v: 0, unit: 'D' },
      { k: 'gl', label: 'Glasses', min: -6, max: 6, step: 0.25, v: 0, unit: 'D' }
    ],
    buttons: [{ k: 'auto', label: 'Eye focuses by itself', click: function (S, b) { S.st.auto = !S.st.auto; b.classList.toggle('on', S.st.auto); } }],
    reads: [{ k: 'fo', label: 'Image forms', big: true }, { k: 'blur', label: 'Blur on the retina' }, { k: 'dx', label: 'Diagnosis' }],
    init: function (S) {
      var st = S.st; st.auto = false;
      st.eye = add(S, T.sphere(2, 0xffffff, { opacity: 0.18 }));
      st.lensM = add(S, T.sphere(0.8, 0x5aa0dc, { opacity: 0.5 })); st.lensM.scale.set(0.35, 1, 1);
      st.ret = add(S, new THREE.Mesh(new THREE.SphereGeometry(2.02, 32, 20, 0, PI * 2, 0, PI * 0.35), T.mat(0xc0392b, { opacity: 0.5, side: THREE.DoubleSide }))); st.ret.rotation.z = -PI / 2;
      st.gl = add(S, T.sphere(1.1, 0x9aa5a0, { opacity: 0.35 })); st.gl.scale.set(0.08, 1, 1);
      st.obj = add(S, T.sphere(0.15, 0x2e7d32));
      st.rays = []; for (var i = 0; i < 16; i++) st.rays.push(T.line(S.scene, 0xffb300, 5));
      st.spot = add(S, new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0xffb300, transparent: true, opacity: 0.6, side: THREE.DoubleSide }))); st.spot.rotation.y = PI / 2;
      T.label(S.scene, 'retina', '#c0392b', 0.9).position.set(2.4, 1.6, 0);
    },
    draw: function (S) {
      var st = S.st, p = S.p, n = 1.336, L = p.len / 1000, mmU = 4 / 24, lensX = -2 + 0.35;
      var Vobj = p.do >= 19 ? 0 : -1 / p.do, Vin = Vobj + p.gl, Pbase = n / 0.0240, acc = p.acc;
      if (st.auto) acc = clamp(n / L - Pbase - Vin, 0, 8);
      var Vout = Vin + Pbase + acc, di = Vout > 0 ? n / Vout : Infinity;
      var retX = lensX + L * 1000 * mmU, imgX = lensX + Math.min(di, 0.1) * 1000 * mmU;
      st.eye.scale.set(p.len / 24, 1, 1); st.eye.position.x = (lensX + retX) / 2;
      st.ret.position.x = retX - 2.02;
      st.lensM.scale.set(0.3 + acc * 0.04, 1, 1);
      st.gl.visible = p.gl !== 0; st.gl.position.x = lensX - 2.6; st.gl.scale.set(0.05 + Math.abs(p.gl) * 0.02, 1, 1); st.gl.material.color.setHex(p.gl > 0 ? 0x2e7d32 : 0x7c3aed);
      var objX = p.do >= 19 ? -9 : Math.max(-9, lensX - 2.2 - Math.log10(p.do * 100) * 2.4); st.obj.position.set(objX, 0, 0); st.obj.visible = p.do < 19;
      var blur = isFinite(di) ? Math.abs(di - L) / di * 0.003 : 0.003, bU = Math.min(1.6, blur * 1000 * mmU * 2);
      for (var i = 0; i < 16; i++) {
        var a = 2 * PI * i / 16, ay = 0.55 * Math.cos(a), az = 0.55 * Math.sin(a);
        var start = p.do >= 19 ? [-9, ay, az] : [objX, 0, 0];
        var hitY = ay * (1 - (retX - lensX) / (imgX - lensX)), hitZ = az * (1 - (retX - lensX) / (imgX - lensX));
        if (!isFinite(di)) { hitY = ay * 1.2; hitZ = az * 1.2; }
        T.setLine(st.rays[i], [start, [lensX - 2.6, start === null ? 0 : ay * (p.do >= 19 ? 1 : (lensX - 2.6 - objX) / (lensX - objX)), az * (p.do >= 19 ? 1 : (lensX - 2.6 - objX) / (lensX - objX))], [lensX, ay, az], [retX, clamp(hitY, -1.9, 1.9), clamp(hitZ, -1.9, 1.9)]]);
      }
      st.spot.position.set(retX - 0.02, 0, 0); st.spot.scale.setScalar(Math.max(0.05, bU));
      var off = isFinite(di) ? (di - L) * 1000 : Infinity;
      S.set('fo', !isFinite(off) ? 'nowhere (rays spread)' : Math.abs(off) < 0.1 ? 'on the retina' : f(Math.abs(off), 3) + ' mm ' + (off < 0 ? 'in front of' : 'behind') + ' the retina');
      S.set('blur', Math.abs(off) < 0.1 ? 'sharp' : 'blur circle about ' + f(bU / mmU / 2, 2) + ' mm');
      S.set('dx', p.len > 24.3 ? 'long eyeball: short-sighted (myopia), needs −D glasses' : p.len < 23.7 ? 'short eyeball: long-sighted (hyperopia), needs +D glasses' : 'normal eye length');
    }
  });

  /* Compound microscope */
  Sim.make('sim-microscope3d', {
    webgl: true, aspect: 0.5, camera: { th: 1.05, ph: 1.25, r: 17, target: [4, 0, 0] },
    controls: [
      { k: 'do', label: 'Specimen distance (&times; f<sub>o</sub>)', min: 1.02, max: 2, step: 0.005, v: 1.1 },
      { k: 'fo', label: 'Objective focal length f<sub>o</sub>', min: 2, max: 16, step: 1, v: 4, unit: 'mm' },
      { k: 'fe', label: 'Eyepiece focal length f<sub>e</sub>', min: 10, max: 50, step: 5, v: 25, unit: 'mm' }
    ],
    reads: [{ k: 'mo', label: 'Objective magnification d<sub>i</sub>/d<sub>o</sub>' }, { k: 'me', label: 'Eyepiece 250 mm / f<sub>e</sub>' }, { k: 'M', label: 'Total magnification', big: true }],
    init: function (S) {
      var st = S.st;
      st.obj = add(S, T.sphere(0.8, 0x5aa0dc, { opacity: 0.35 })); st.eye = add(S, T.sphere(1.0, 0x5aa0dc, { opacity: 0.35 }));
      st.tube = add(S, cyl(1.15, 0x9aa5a0, { opacity: 0.12, side: THREE.DoubleSide }));
      st.oA = T.arrow(S.scene, '#2e7d32'); st.iA = T.arrow(S.scene, '#c2410c');
      st.rays = []; for (var i = 0; i < 24; i++) st.rays.push(T.line(S.scene, i < 12 ? 0xc62828 : 0xe09b3d, 3));
      st.il = T.label(S.scene, 'real image', '#c2410c', 0.9); st.el = T.label(S.scene, 'eyepiece', '#2f6690', 0.9);
      T.label(S.scene, 'objective', '#2f6690', 0.9).position.set(0, 1.4, 0);
    },
    draw: function (S) {
      var st = S.st, p = S.p, fo = 1.2, d0 = p.do * fo, di = Math.min(9, 1 / (1 / fo - 1 / d0)), fe = 0.5 + p.fe / 25, h = 0.35, hi = -h * di / d0, xe = di + fe;
      st.obj.scale.set(0.12 + 0.6 / p.fo, 1, 1); st.eye.scale.set(0.1 + 1.5 / p.fe, 1, 1);
      st.eye.position.x = xe; st.el.position.set(xe, 1.6, 0); st.il.position.set(di, hi - 0.5, 0);
      span(st.tube, [0, 0, 0], [xe, 0, 0]);
      T.setArrow(st.oA, [-d0, 0, 0], [0, h, 0], 0.15); T.setArrow(st.iA, [di, 0, 0], [0, hi, 0], 0.2);
      for (var i = 0; i < 12; i++) {
        var a = 2 * PI * i / 12, ly = 0.55 * Math.cos(a), lz = 0.55 * Math.sin(a);
        T.setLine(st.rays[i], [[-d0, h, 0], [0, ly, lz], [di, hi, 0]]);
        var ey = hi + 0.7 * Math.cos(a), ez = 0.7 * Math.sin(a), dx = xe - di, dy = -hi, L = Math.hypot(dx, dy);
        T.setLine(st.rays[12 + i], [[di, hi, 0], [xe, ey, ez], [xe + dx / L * 3, ey + dy / L * 3, ez]]);
      }
      var mo = 1 / (p.do - 1), me = 250 / p.fe;
      S.set('mo', f(mo, 3) + '×'); S.set('me', f(me, 3) + '×'); S.set('M', f(mo * me, 3) + '×');
    }
  });

  /* Ripple tank */
  Sim.make('sim-ripple3d', {
    webgl: true, aspect: 0.55, camera: { th: 0, ph: 0.8, r: 21 },
    controls: [
      { k: 'lam', label: 'Wavelength &lambda;', min: 0.8, max: 2.5, step: 0.05, v: 1.2 },
      { k: 'd', label: 'Source separation d', min: 1, max: 5, step: 0.1, v: 3 },
      { k: 'ph', label: 'Phase difference between sources', min: 0, max: 360, step: 15, v: 0, unit: '°' },
      { k: 'a2', label: 'Strength of source 2', min: 0, max: 1, step: 0.05, v: 1, show: function (v) { return Math.round(v * 100) + '%'; } }
    ],
    reads: [{ k: 'ang', label: 'First bright line at sin&theta; = &lambda;/d', big: true }, { k: 'n', label: 'Bright lines on each side' }],
    init: function (S) {
      var st = S.st, geo = new THREE.PlaneGeometry(14, 14, 110, 110); geo.rotateX(-PI / 2);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
      st.geo = geo; add(S, new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      st.s1 = add(S, T.sphere(0.2, 0xc62828)); st.s2 = add(S, T.sphere(0.2, 0xc62828)); st.wt = 0;
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, ps = st.geo.attributes.position, col = st.geo.attributes.color, k = 2 * PI / p.lam, hd = p.d / 2, phi = p.ph * PI / 180;
      st.wt += dt * 4;
      st.s1.position.set(-hd, 0.3, 6.5); st.s2.position.set(hd, 0.3, 6.5); st.s2.visible = p.a2 > 0;
      for (var i = 0; i < ps.count; i++) {
        var x = ps.getX(i), z = ps.getZ(i), r1 = Math.hypot(x + hd, z - 6.5), r2 = Math.hypot(x - hd, z - 6.5);
        var y = 0.45 * (Math.sin(k * r1 - st.wt) / Math.sqrt(r1 + 0.6) + p.a2 * Math.sin(k * r2 - st.wt + phi) / Math.sqrt(r2 + 0.6));
        ps.setY(i, y); var s = clamp(0.5 + y, 0, 1); col.setXYZ(i, 0.1 + 0.85 * s, 0.35 + 0.6 * s, 0.6 + 0.4 * s);
      }
      ps.needsUpdate = true; col.needsUpdate = true;
      var sn = p.lam / p.d;
      S.set('ang', sn <= 1 ? f(Math.asin(sn) * 180 / PI, 3) + '°' : 'none'); S.set('n', String(Math.floor(p.d / p.lam)));
      S.msg(p.ph ? 'A phase difference shifts the whole pattern sideways.' : p.a2 < 1 ? 'Unequal sources: the dark lines are no longer completely dark.' : '');
    }
  });

  /* Bragg reflection from a crystal */
  Sim.make('sim-crystal3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.2, ph: 1.25, r: 15, target: [0, 1, 0] },
    controls: [
      { k: 'th', label: 'Glancing angle &theta;', min: 5, max: 60, step: 0.5, v: 22.5, unit: '°' },
      { k: 'd', label: 'Layer spacing d', min: 0.15, max: 0.4, step: 0.01, v: 0.2, unit: 'nm' },
      { k: 'lam', label: 'X-ray wavelength &lambda;', min: 0.05, max: 0.3, step: 0.002, v: 0.154, unit: 'nm' }
    ],
    buttons: [{ k: 'sweep', label: 'Sweep the angle', click: function (S, b) { S.st.sweep = !S.st.sweep; b.classList.toggle('on', S.st.sweep); } }],
    reads: [{ k: 'thn', label: 'Angle now' }, { k: 'n', label: '2d sin&theta; / &lambda;', big: true }, { k: 'I', label: 'Reflected beam' }],
    init: function (S) {
      var st = S.st, n = 0, m4 = new THREE.Matrix4(); st.sweep = false; st.ang = 22.5;
      st.atoms = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 12, 8), T.mat(0x2f6690), 7 * 4 * 5));
      for (var i = 0; i < 7; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < 5; k++) { m4.makeTranslation(-3 + i, -j, -2 + k); st.atoms.setMatrixAt(n++, m4); }
      st.inB = add(S, cyl(0.08, 0x7c3aed)); st.outB = add(S, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 12), new THREE.MeshPhongMaterial({ color: 0xffb300, transparent: true })));
      st.det = add(S, T.sphere(0.45, 0xffb300, { opacity: 1 }));
      T.label(S.scene, 'X-rays in', '#7c3aed', 1.1).position.set(-3.2, 3.9, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p;
      if (st.sweep) { st.ang += dt * 6; if (st.ang > 60) st.ang = 5; } else st.ang = p.th;
      var th = st.ang * PI / 180, N = 10, ph = 2 * PI * 2 * p.d * Math.sin(th) / p.lam;
      var I = Math.abs(Math.sin(ph / 2)) < 1e-6 ? 1 : Math.pow(Math.sin(N * ph / 2) / (N * Math.sin(ph / 2)), 2);
      var L = 6; st.atoms.scale.set(1, 0.8 + (p.d - 0.15) * 3, 1);
      span(st.inB, [-L * Math.cos(th), L * Math.sin(th), 0], [0, 0, 0]);
      span(st.outB, [0, 0, 0], [L * Math.cos(th), L * Math.sin(th), 0]); st.outB.material.opacity = 0.08 + 0.92 * I;
      st.det.position.set((L + 0.5) * Math.cos(th), (L + 0.5) * Math.sin(th), 0); st.det.material.opacity = 0.2 + 0.8 * I; st.det.scale.setScalar(0.6 + 0.8 * I);
      S.set('thn', f(st.ang, 3) + '°'); S.set('n', f(2 * p.d * Math.sin(th) / p.lam, 3)); S.set('I', I > 0.5 ? 'bright: Bragg condition met' : I > 0.05 ? 'weak' : 'dark: waves cancel');
    }
  });
})();
