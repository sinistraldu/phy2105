/* PHY1103 Unit 3: magnetism and induction simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp, mu0 = 4e-7 * Math.PI;

  /* ---------- 2D: velocity selector ---------- */
  Sim.make('sim-selector', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'E', label: 'Electric field E', min: 0.5, max: 5, step: 0.1, v: 2, show: function (v) { return f(v * 1e4, 3) + ' V/m'; } },
      { k: 'B', label: 'Magnetic field B (into screen)', min: 0.05, max: 0.5, step: 0.01, v: 0.1, unit: 'T' },
      { k: 'v', label: 'Particle speed v', min: 0.5, max: 5, step: 0.05, v: 1.5, show: function (v) { return f(v * 1e5, 3) + ' m/s'; } }
    ],
    buttons: [{ label: 'Positive charge', group: 'q', on: true, click: function (S) { S.st.q = 1; } }, { label: 'Negative charge', group: 'q', click: function (S) { S.st.q = -1; } }],
    reads: [{ k: 'Fe', label: 'Electric force qE (per e)' }, { k: 'Fb', label: 'Magnetic force qvB (per e)' }, { k: 'sel', label: 'Selected speed E/B', big: true }, { k: 'res', label: 'Result' }],
    init: function (S) { S.st.q = 1; S.st.x = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), E = p.E * 1e4, v = p.v * 1e5, B = p.B, q = S.st.q, ay = q * (v * B - E); // + up
      S.st.x += dt * 0.35; if (S.st.x > 1.15) S.st.x = 0;
      D.clear(c, W, H);
      var x0 = W * 0.08, x1 = W * 0.82, yT = H * 0.18, yB = H * 0.82, cy = H * 0.5;
      D.rect(c, x0, yT - 10, x1 - x0, 10, K.pos, null, 2); D.rect(c, x0, yB, x1 - x0, 10, K.neg, null, 2);
      D.text(c, '+ + + + + +', (x0 + x1) / 2, yT - 18, { align: 'center', color: K.pos, weight: 700 }); D.text(c, '− − − − −', (x0 + x1) / 2, yB + 22, { align: 'center', color: K.neg, weight: 700 });
      for (var gx = x0 + 30; gx < x1; gx += 50) for (var gy = yT + 25; gy < yB; gy += 50) { D.circle(c, gx, gy, 5, null, K.faint, 1); D.line(c, gx - 3, gy - 3, gx + 3, gy + 3, K.faint, 1); D.line(c, gx - 3, gy + 3, gx + 3, gy - 3, K.faint, 1); }
      D.rect(c, x1 + 20, yT, 8, cy - 8 - yT, K.ink, null, 0); D.rect(c, x1 + 20, cy + 8, 8, yB - cy - 8, K.ink, null, 0);
      var k = 120 / 1e4, pts = [], hitY = null;
      for (var s = 0; s <= Math.min(S.st.x, 1.15) + 1e-6; s += 0.01) { var xx = x0 + s * (x1 - x0 + 30), dy = 0.5 * ay * k * s * s * (x1 - x0) / 100; var yy = cy - dy; pts.push([xx, yy]); if (yy < yT || yy > yB) { hitY = yy; break; } }
      D.poly(c, pts, q > 0 ? K.pos : K.neg, 2.5);
      var last = pts[pts.length - 1]; D.circle(c, last[0], last[1], 7, q > 0 ? K.pos : K.neg);
      var fe = q * E, fb = q * v * B; // signs: fe down(+q), fb up(+q)
      D.arrow(c, last[0], last[1], last[0], last[1] + clamp(fe / 1e3, -60, 60), K.c2, 3); D.arrow(c, last[0], last[1], last[0], last[1] - clamp(fb / 1e3, -60, 60), K.c4, 3);
      D.text(c, 'qE', last[0] + 8, last[1] + clamp(fe / 1e3, -60, 60), { size: 12, weight: 700, color: K.c2 }); D.text(c, 'qvB', last[0] + 8, last[1] - clamp(fb / 1e3, -60, 60), { size: 12, weight: 700, color: K.c4 });
      var ok = Math.abs(v * B - E) / E < 0.04;
      S.set('Fe', f(E * 1.6e-19, 3) + ' N'); S.set('Fb', f(v * B * 1.6e-19, 3) + ' N'); S.set('sel', f(E / B, 3) + ' m/s');
      S.set('res', ok ? 'passes straight through' : v > E / B ? 'too fast: bent by the magnetic force' : 'too slow: bent by the electric force');
    }
  });

  /* ---------- 3D: charge in E and B ---------- */
  Sim.make('sim-lorentz3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.15, r: 17 },
    controls: [
      { k: 'B', label: 'Magnetic field B (vertical)', min: 0.3, max: 2, step: 0.1, v: 1 },
      { k: 'E', label: 'Electric field E (⊥ B)', min: 0, max: 1, step: 0.05, v: 0 },
      { k: 'v', label: 'Launch speed v', min: 0.3, max: 2, step: 0.1, v: 1.2 },
      { k: 'ang', label: 'Angle between v and B', min: 5, max: 90, step: 5, v: 70, unit: '°' }
    ],
    buttons: [{ label: 'Positive', group: 'q', on: true, click: function (S) { S.st.q = 1; S.st.reset(); } }, { label: 'Negative', group: 'q', click: function (S) { S.st.q = -1; S.st.reset(); } }, { label: 'Relaunch', click: function (S) { S.st.reset(); } }],
    reads: [{ k: 'r', label: 'Radius mv&perp;/qB' }, { k: 'T', label: 'Period 2&pi;m/qB' }, { k: 'drift', label: 'Drift speed E/B', big: true }],
    init: function (S) {
      var st = S.st; st.q = 1;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#4338ca'); T.setArrow(a, [i * 4, -4, j * 4], [0, 8, 0], 0.4); }
      T.label(S.scene, 'B', '#4338ca', 1).position.set(4, 4.5, 4);
      st.Ea = T.arrow(S.scene, '#c2410c'); st.El = T.label(S.scene, 'E', '#c2410c', 1);
      st.dot = T.sphere(0.2, 0xc62828); S.scene.add(st.dot); st.line = T.line(S.scene, 0xc62828, 3000);
      st.reset = function () { var th = S.p.ang * PI / 180; st.pos = new THREE.Vector3(0, -3.5, 0); st.vel = new THREE.Vector3(S.p.v * Math.sin(th), S.p.v * Math.cos(th), 0); st.trail = []; };
      st.reset();
    },
    onChange: function (S) { S.st.reset(); },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, q = st.q, sub = 12, h = dt * 2 / sub, Bv = new THREE.Vector3(0, p.B, 0), Ev = new THREE.Vector3(0, 0, p.E);
      T.setArrow(st.Ea, [-6, 3, -3], [0, 0, p.E * 4], 0.4); st.Ea.visible = p.E > 0; st.El.position.set(-6, 3.6, -3 + p.E * 4); st.El.visible = p.E > 0;
      for (var i = 0; i < sub; i++) { var acc = Ev.clone().add(st.vel.clone().cross(Bv)).multiplyScalar(q); st.vel.addScaledVector(acc, h); st.pos.addScaledVector(st.vel, h); }
      if (st.pos.length() > 9 || st.pos.y > 4.2) st.reset();
      st.trail.push([st.pos.x, st.pos.y, st.pos.z]); if (st.trail.length > 3000) st.trail.shift();
      st.dot.position.copy(st.pos); st.dot.material.color.setHex(q > 0 ? 0xc62828 : 0x1d4ed8); T.setLine(st.line, st.trail);
      var th = p.ang * PI / 180;
      S.set('r', f(p.v * Math.sin(th) / p.B, 3) + ' (units)'); S.set('T', f(2 * PI / p.B, 3) + ' (units)'); S.set('drift', p.E > 0 ? f(p.E / p.B, 3) + ' along E×B' : 'none (E = 0)');
    }
  });

  /* ---------- 2D: Hall effect ---------- */
  function resetHall(S) { S.st.c = []; for (var i = 0; i < 60; i++) S.st.c.push({ x: Math.random(), y: Math.random() }); S.st.build = 0; }
  Sim.make('sim-hall', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'I', label: 'Current I', min: 0.5, max: 10, step: 0.5, v: 5, unit: 'A' },
      { k: 'B', label: 'Field B (into screen)', min: 0, max: 2, step: 0.05, v: 1, unit: 'T' },
      { k: 't', label: 'Thickness t', min: 0.01, max: 1, step: 0.01, v: 0.1, unit: 'mm' },
      { k: 'n', label: 'Carrier density n', min: 20, max: 29, step: 0.1, v: 28.9, map: function (x) { return Math.pow(10, x); }, show: function (v) { return f(v, 3) + ' m⁻³'; } }
    ],
    buttons: [{ label: 'Electrons (metal, n-type)', group: 'c', on: true, click: function (S) { S.st.q = -1; resetHall(S); } }, { label: 'Holes (p-type)', group: 'c', click: function (S) { S.st.q = 1; resetHall(S); } }],
    reads: [{ k: 'vd', label: 'Drift speed (width 1 cm)' }, { k: 'VH', label: 'V<sub>H</sub> = IB/(nqt)', big: true }, { k: 'RH', label: 'Hall coefficient 1/(nq)' }, { k: 'side', label: 'Higher-potential edge' }],
    init: function (S) { S.st.q = -1; resetHall(S); },
    onChange: function (S) { S.st.build = 0; },
    draw: function (S, c, W, H, dt) {
      var p = S.p, K = C(), st = S.st, q = st.q, x0 = W * 0.08, x1 = W * 0.72, yT = H * 0.18, yB = H * 0.82;
      st.build = Math.min(1, st.build + dt * 0.8);
      D.clear(c, W, H);
      D.rect(c, x0, yT, x1 - x0, yB - yT, 'rgba(201,138,58,0.25)', K.ink, 4, 1.5);
      for (var gx = x0 + 25; gx < x1; gx += 45) for (var gy = yT + 20; gy < yB; gy += 45) { D.circle(c, gx, gy, 5, null, K.faint, 1); D.line(c, gx - 3, gy - 3, gx + 3, gy + 3, K.faint, 1); D.line(c, gx - 3, gy + 3, gx + 3, gy - 3, K.faint, 1); }
      D.arrow(c, x0 - 30, (yT + yB) / 2, x0 - 4, (yT + yB) / 2, K.c2, 3); D.text(c, 'I', x0 - 36, (yT + yB) / 2 - 14, { weight: 700, color: K.c2 });
      var defl = p.B > 0 ? (1 - st.build) : 0, vx = q < 0 ? -1 : 1;
      st.c.forEach(function (o) {
        o.x += vx * dt * 0.12 * p.I / 5; if (o.x > 1) o.x -= 1; if (o.x < 0) o.x += 1;
        o.y = Math.max(0.05, o.y - dt * 0.4 * defl * p.B); // both carrier types pushed to the top edge
        D.circle(c, x0 + o.x * (x1 - x0), yT + o.y * (yB - yT), 4, q < 0 ? K.neg : K.pos);
      });
      var n = Math.round(st.build * 14 * Math.min(1, p.B));
      for (var i = 0; i < n; i++) { var xx = x0 + (i + 0.5) * (x1 - x0) / 14; D.text(c, q < 0 ? '−' : '+', xx, yT + 10, { align: 'center', weight: 700, color: q < 0 ? K.neg : K.pos }); D.text(c, q < 0 ? '+' : '−', xx, yB - 10, { align: 'center', weight: 700, color: q < 0 ? K.pos : K.neg }); }
      var VH = p.I * p.B / (p.n * 1.6e-19 * p.t * 1e-3), vd = p.I / (p.n * 1.6e-19 * 0.01 * p.t * 1e-3);
      var mx = W * 0.86, my = H * 0.5; D.circle(c, mx, my, 34, K.surface, K.ink, 2); var ang = clamp(st.build * (q < 0 ? -1 : 1) * Math.log10(1 + VH * 1e6) / 6, -1.2, 1.2);
      D.line(c, mx, my + 10, mx + 26 * Math.sin(ang), my + 10 - 26 * Math.cos(ang), K.pos, 2.5); D.text(c, 'Vₕ', mx, my + 24, { align: 'center', size: 11, weight: 700 });
      D.line(c, x1 - 20, yT, mx - 20, my - 25, K.muted, 1, [3, 3]); D.line(c, x1 - 20, yB, mx - 20, my + 25, K.muted, 1, [3, 3]);
      S.set('vd', f(vd, 3) + ' m/s'); S.set('VH', VH >= 1 ? f(VH, 3) + ' V' : VH >= 1e-3 ? f(VH * 1e3, 3) + ' mV' : f(VH * 1e6, 3) + ' µV'); S.set('RH', (q < 0 ? '−' : '+') + f(1 / (p.n * 1.6e-19), 3) + ' m³/C');
      S.set('side', p.B === 0 ? 'none (B = 0)' : q < 0 ? 'bottom edge' : 'top edge');
    }
  });

  /* ---------- 3D: torque on a current loop ---------- */
  Sim.make('sim-motor3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.05, r: 13 },
    controls: [
      { k: 'I', label: 'Current I', min: 0, max: 5, step: 0.25, v: 2, unit: 'A' },
      { k: 'N', label: 'Turns N', min: 1, max: 50, step: 1, v: 20 },
      { k: 's', label: 'Loop side', min: 2, max: 10, step: 0.5, v: 6, unit: 'cm' },
      { k: 'B', label: 'Field B', min: 0.05, max: 1, step: 0.05, v: 0.4, unit: 'T' }
    ],
    buttons: [{ k: 'com', label: 'Commutator (keeps it spinning)', click: function (S, b) { S.st.com = !S.st.com; b.classList.toggle('on', S.st.com); } }, { label: 'Reset', click: function (S) { S.st.phi = 0.4; S.st.w = 0; } }],
    reads: [{ k: 'mu', label: '&mu; = NIA' }, { k: 'tau', label: '&tau; = &mu;B sin&phi;', big: true }, { k: 'phi', label: 'Angle between &mu; and B' }, { k: 'w', label: 'Spin rate' }],
    init: function (S) {
      var st = S.st; st.phi = 0.4; st.w = 0; st.com = false;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#9aa0b8'); T.setArrow(a, [-6, i * 1.6, j * 1.6], [12, 0, 0], 0.4); }
      var nm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 3.5), T.mat(0xc62828)); nm.position.x = -6.8; S.scene.add(nm); var sm = nm.clone(); sm.material = T.mat(0x1d4ed8); sm.position.x = 6.8; S.scene.add(sm);
      T.label(S.scene, 'N', '#ffffff', 1).position.set(-6.8, 0, 1.8); T.label(S.scene, 'S', '#ffffff', 1).position.set(6.8, 0, 1.8);
      st.g = new THREE.Group(); S.scene.add(st.g);
      st.loop = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 4), T.mat(0xc2410c)); st.loop.rotation.y = PI / 2; st.loop.rotation.x = PI / 4; st.g.add(st.loop);
      var ax = T.cyl(0.04, 0x888888); ax.scale.y = 6; S.scene.add(ax);
      st.mu = T.arrow(S.scene, '#9333ea'); st.ml = T.label(S.scene, 'μ', '#9333ea', 1);
      st.F1 = T.arrow(S.scene, '#15803d'); st.F2 = T.arrow(S.scene, '#15803d');
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, A = Math.pow(p.s / 100, 2), mu = p.N * p.I * A, I0 = 2e-4 * p.N * A * 100 + 1e-4;
      var cs = st.com ? (Math.sin(st.phi) >= 0 ? 1 : -1) : 1, tau = cs * mu * p.B * Math.sin(st.phi);
      var sub = 6; for (var i = 0; i < sub; i++) { var h = dt / sub; st.w += (tau / I0 - 0.6 * st.w) * h; st.phi += st.w * h; tau = (st.com ? (Math.sin(st.phi) >= 0 ? 1 : -1) : 1) * mu * p.B * Math.sin(st.phi); }
      var sd = p.s * 0.35; st.g.rotation.y = st.phi;
      st.loop.scale.set(sd * 0.7071, sd * 0.7071, 1);
      var md = new THREE.Vector3(-Math.cos(st.phi), 0, Math.sin(st.phi)); // mu is opposite to the loop's local normal here
      var L = 1.5 + mu * 3; T.setArrow(st.mu, [0, 0, 0], [md.x * L, 0, md.z * L], 0.35); st.ml.position.set(md.x * (L + 0.4), 0.4, md.z * (L + 0.4));
      var hz = sd * 0.5, s1 = [hz * Math.sin(st.phi), 0, hz * Math.cos(st.phi)], fl = Math.min(2.5, p.N * p.I * (p.s / 100) * p.B * 3) * cs;
      T.setArrow(st.F1, s1, [0, 0, -fl], 0.3); T.setArrow(st.F2, [-s1[0], 0, -s1[2]], [0, 0, fl], 0.3); st.F1.visible = st.F2.visible = p.I > 0;
      var ang = Math.abs(((Math.atan2(md.z, md.x) * 180 / PI) + 360) % 360); if (ang > 180) ang = 360 - ang;
      S.set('mu', f(mu, 3) + ' A·m²'); S.set('tau', f(Math.abs(mu * p.B * Math.sin(st.phi)), 3) + ' N·m'); S.set('phi', f(ang, 3) + '°'); S.set('w', f(st.w / (2 * PI), 3) + ' rev/s');
    }
  });

  /* ---------- 3D: Biot-Savart ---------- */
  function bsLoop(R, I, P, nseg) {
    var B = [0, 0, 0], dl, r, c = mu0 * I / (4 * PI);
    for (var i = 0; i < nseg; i++) {
      var a = 2 * PI * (i + 0.5) / nseg, x = R * Math.cos(a), y = R * Math.sin(a); dl = [-Math.sin(a) * 2 * PI * R / nseg, Math.cos(a) * 2 * PI * R / nseg, 0];
      r = [P[0] - x, P[1] - y, P[2]]; var r3 = Math.pow(r[0] * r[0] + r[1] * r[1] + r[2] * r[2], 1.5) + 1e-12;
      B[0] += c * (dl[1] * r[2] - dl[2] * r[1]) / r3; B[1] += c * (dl[2] * r[0] - dl[0] * r[2]) / r3; B[2] += c * (dl[0] * r[1] - dl[1] * r[0]) / r3;
    }
    return B;
  }
  Sim.make('sim-biot3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.9, ph: 1.15, r: 14 },
    controls: [
      { k: 'I', label: 'Current I', min: 1, max: 20, step: 1, v: 10, unit: 'A' },
      { k: 'R', label: 'Loop radius R (or probe distance for a wire)', min: 2, max: 10, step: 0.5, v: 5, unit: 'cm' },
      { k: 'z', label: 'Probe position on the axis z', min: -15, max: 15, step: 0.5, v: 0, unit: 'cm' }
    ],
    buttons: [{ label: 'Circular loop', group: 'g', on: true, click: function (S) { S.st.wire = false; S.st.key = ''; } }, { label: 'Straight wire', group: 'g', click: function (S) { S.st.wire = true; S.st.key = ''; } },
      { k: 'sw', label: 'Sweep a current element', click: function (S, b) { S.st.sweep = !S.st.sweep; b.classList.toggle('on', S.st.sweep); S.st.acc = [0, 0, 0]; S.st.i = 0; } }],
    reads: [{ k: 'Bn', label: 'B at the probe (numerical sum)', big: true }, { k: 'Bf', label: 'Formula' }],
    init: function (S) {
      var st = S.st; st.wire = false; st.key = ''; st.sweep = false; st.i = 0; st.acc = [0, 0, 0];
      st.loop = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 80), T.mat(0xc2410c)); S.scene.add(st.loop);
      st.wireM = T.cyl(0.07, 0xc2410c); st.wireM.rotation.x = PI / 2; st.wireM.scale.y = 14; S.scene.add(st.wireM);
      st.field = []; for (var i = 0; i < 70; i++) st.field.push(T.arrow(S.scene, '#4338ca'));
      st.probe = T.sphere(0.15, 0x15803d); S.scene.add(st.probe); st.Bp = T.arrow(S.scene, '#15803d');
      st.dl = T.arrow(S.scene, '#c2410c'); st.dB = T.arrow(S.scene, '#9333ea'); st.sum = T.arrow(S.scene, '#9333ea');
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, R = p.R / 100, sc = 0.25 / 0.01 * 0.01 * 100 / 4, u = 0.3; // 1 cm = 0.3 units
      st.loop.visible = !st.wire; st.wireM.visible = st.wire; st.loop.scale.set(p.R * u, p.R * u, 1);
      var probeU = st.wire ? [p.R * u, 0, p.z * u] : [0, 0, p.z * u]; st.probe.position.set(probeU[0], probeU[1], probeU[2]);
      var Bfun = function (P) { if (st.wire) { var rr = Math.hypot(P[0], P[1]) + 1e-6, b = mu0 * p.I / (2 * PI * rr); return [-b * P[1] / rr, b * P[0] / rr, 0]; } return bsLoop(R, p.I, P, 48); };
      var key = [st.wire, p.I, p.R].join();
      if (key !== st.key) {
        st.key = key; var n = 0;
        for (var a = -3; a <= 3; a++) for (var b = -4; b <= 4; b++) {
          if (n >= 70) break; var P = st.wire ? [a * 2 / u / 100 * 1.0 * 0.6, b * 1.5 / u / 100 * 0.6, 0] : [a * 2.2 / u / 100 * 0.7, 0, b * 1.8 / u / 100 * 0.7];
          var Bv = Bfun(P), m = Math.hypot(Bv[0], Bv[1], Bv[2]), L = Math.min(1.2, 0.15 + Math.sqrt(m / (mu0 * p.I / (2 * R))) * 0.8);
          var near = st.wire ? Math.hypot(P[0], P[1]) < 0.01 : Math.abs(Math.hypot(P[0], P[1]) - R) < 0.008 && Math.abs(P[2]) < 0.008;
          var arw = st.field[n++]; T.setArrow(arw, [P[0] * 100 * u - Bv[0] / m * L / 2, P[1] * 100 * u - Bv[1] / m * L / 2, P[2] * 100 * u - Bv[2] / m * L / 2], [Bv[0] / m * L, Bv[1] / m * L, Bv[2] / m * L], 0.18); arw.visible = !near && m > 0;
        }
        for (; n < 70; n++) st.field[n].visible = false;
      }
      var Pm = [probeU[0] / u / 100, probeU[1] / u / 100, probeU[2] / u / 100], Bp = Bfun(Pm), Bm = Math.hypot(Bp[0], Bp[1], Bp[2]);
      var Bref = mu0 * p.I / (2 * R), bl = 2.5 * Bm / Bref; T.setArrow(st.Bp, probeU, [Bp[0] / (Bm || 1) * bl, Bp[1] / (Bm || 1) * bl, Bp[2] / (Bm || 1) * bl], 0.3);
      st.dl.visible = st.dB.visible = st.sum.visible = st.sweep && !st.wire;
      if (st.sweep && !st.wire) {
        st.i = (st.i + dt * 12) % 48; var k = Math.floor(st.i), aa = 2 * PI * (k + 0.5) / 48, ex = R * Math.cos(aa), ey = R * Math.sin(aa);
        T.setArrow(st.dl, [ex * 100 * u, ey * 100 * u, 0], [-Math.sin(aa) * 0.8, Math.cos(aa) * 0.8, 0], 0.2);
        var dlv = [-Math.sin(aa), Math.cos(aa), 0], r = [Pm[0] - ex, Pm[1] - ey, Pm[2]], r3 = Math.pow(r[0] * r[0] + r[1] * r[1] + r[2] * r[2], 1.5), cr = [dlv[1] * r[2] - dlv[2] * r[1], dlv[2] * r[0] - dlv[0] * r[2], dlv[0] * r[1] - dlv[1] * r[0]];
        var dB = [cr[0] / r3, cr[1] / r3, cr[2] / r3], dm = Math.hypot(dB[0], dB[1], dB[2]) || 1;
        T.setArrow(st.dB, probeU, [dB[0] / dm * 1.2, dB[1] / dm * 1.2, dB[2] / dm * 1.2], 0.2);
        if (k === 0) st.acc = [0, 0, 0]; st.acc[0] += dB[0] * dt; st.acc[1] += dB[1] * dt; st.acc[2] += dB[2] * dt;
      }
      var form = st.wire ? mu0 * p.I / (2 * PI * R) : mu0 * p.I * R * R / (2 * Math.pow(R * R + Math.pow(p.z / 100, 2), 1.5));
      S.set('Bn', f(Bm, 3) + ' T');
      S.set('Bf', f(form, 3) + ' T (' + (st.wire ? 'μ₀I/2πR' : 'μ₀IR²/2(R²+z²)^1.5') + ')');
      S.msg(st.sweep && !st.wire ? 'Orange: current element dℓ. Purple at the probe: its contribution dB (perpendicular to dℓ and r̂).' : '');
    }
  });

  /* ---------- 3D: solenoid and Ampere's law ---------- */
  Sim.make('sim-solenoid3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.2, r: 15 },
    controls: [
      { k: 'N', label: 'Number of turns N', min: 4, max: 40, step: 1, v: 20 },
      { k: 'L', label: 'Length L', min: 10, max: 40, step: 1, v: 25, unit: 'cm' },
      { k: 'I', label: 'Current I', min: 0, max: 5, step: 0.25, v: 2, unit: 'A' },
      { k: 'x', label: 'Amp&egrave;rian rectangle position', min: -1, max: 3, step: 0.05, v: 0.2, show: function (v) { return v < 0.2 ? 'fully inside' : v < 1.5 ? 'straddles the wall' : 'fully outside'; } }
    ],
    reads: [{ k: 'n', label: 'n = N/L' }, { k: 'B', label: 'B inside = &mu;<sub>0</sub>nI', big: true }, { k: 'enc', label: 'Current through the rectangle' }, { k: 'circ', label: '&oint;B&middot;dl = &mu;<sub>0</sub>I<sub>enc</sub>' }],
    init: function (S) { var st = S.st; st.key = ''; st.ar = []; for (var i = 0; i < 60; i++) st.ar.push(T.arrow(S.scene, '#4338ca')); st.rect = T.line(S.scene, 0x15803d, 5); },
    draw: function (S) {
      var st = S.st, p = S.p, len = p.L * 0.25, key = [p.N, p.L, p.I].join();
      if (key !== st.key) {
        st.key = key; if (st.coil) { S.scene.remove(st.coil); st.coil.geometry.dispose(); }
        var pts = []; for (var i = 0; i <= p.N * 40; i++) { var t = i / (p.N * 40), a = t * p.N * 2 * PI; pts.push(new THREE.Vector3(-len / 2 + t * len, Math.cos(a), Math.sin(a))); }
        st.coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), p.N * 40, 0.05, 6, false), T.mat(0xc2410c)); S.scene.add(st.coil);
        var n = 0, nI = p.N / (p.L / 100) * p.I;
        for (var xi = -4; xi <= 4; xi++) for (var yi = -3; yi <= 3; yi++) {
          if (n >= 60) break; var x = xi * len / 7, y = yi * 0.55, inside = Math.abs(y) < 0.95;
          var a1 = Math.atan2(1, len / 2 - x), a2 = Math.atan2(1, -len / 2 - x), Bax = 0.5 * (Math.cos(a1) - Math.cos(a2));
          var Bv = inside ? Bax : Bax * 0.08 * (Math.abs(x) < len / 2 ? -1 : 1);
          var Ld = clamp(Math.abs(Bv) * 2.4 * nI / 400, 0, 1.4); var ar = st.ar[n++]; T.setArrow(ar, [x - Math.sign(Bv) * Ld / 2, y, 0], [Math.sign(Bv) * Ld, 0, 0], 0.18); ar.visible = Ld > 0.03 && p.I > 0;
        }
        for (; n < 60; n++) st.ar[n].visible = false;
      }
      var x0 = p.x, h = len * 0.5, w = 1.2, y0 = 0.4 + x0; // rectangle in the xy-plane, from y0 to y0 + w
      T.setLine(st.rect, [[-h / 2, y0, 0], [h / 2, y0, 0], [h / 2, y0 + w, 0], [-h / 2, y0 + w, 0], [-h / 2, y0, 0]]);
      var crosses = y0 < 1 && y0 + w > 1, nper = p.N / len, Ienc = crosses ? nper * h * p.I : 0;
      var nI = p.N / (p.L / 100);
      S.set('n', f(nI, 3) + ' turns/m'); S.set('B', f(mu0 * nI * p.I * 1000, 3) + ' mT'); S.set('enc', f(Ienc, 3) + ' A (' + (crosses ? Math.round(nper * h) + ' wires × I' : 'no wires') + ')');
      S.set('circ', crosses ? 'B·h = μ₀(nh)I ⇒ B = μ₀nI' : 'both long sides see the same B: net 0');
    }
  });

  /* ---------- 2D: hysteresis loop ---------- */
  var matsH = [['Soft iron', 80, 60, 1.6], ['Ferrite', 300, 300, 0.45], ['Hard steel', 4000, 2500, 1.1]];
  Sim.make('sim-hyst', {
    aspect: 0.55, animate: true,
    controls: [{ k: 'A', label: 'Drive amplitude H<sub>0</sub> (&times; coercivity)', min: 0.3, max: 6, step: 0.1, v: 4 }, { k: 'sp', label: 'Drive speed', min: 0.2, max: 2, step: 0.1, v: 1 }],
    buttons: matsH.map(function (m, i) { return { label: m[0], group: 'm', on: i === 0, click: function (S) { S.st.m = i; S.st.reset(); } }; }),
    reads: [{ k: 'H', label: 'H now' }, { k: 'B', label: 'B now' }, { k: 'Br', label: 'Retentivity B<sub>r</sub> (B at H = 0)', big: true }, { k: 'Hc', label: 'Coercivity H<sub>c</sub> (H at B = 0)' }],
    init: function (S) { var st = S.st; st.m = 0; st.reset = function () { st.ph = 0; st.M = 0; st.virgin = true; st.Hp = 0; st.pts = []; st.Br = null; st.Hc = null; }; st.reset(); },
    onChange: function (S) { S.st.reset(); },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, K = C(), m = matsH[st.m], Hc = m[1], a = m[2], Bs = m[3], Hmax = 6 * Hc + 2 * a, H0 = p.A * Hc + (p.A > 1 ? a : 0);
      for (var s = 0; s < 6; s++) {
        st.ph += dt * p.sp * 1.4 / 6; var Hn = H0 * Math.sin(st.ph), dH = Hn - st.Hp, sg = dH >= 0 ? 1 : -1;
        if (st.ph > PI / 2) st.virgin = false;
        var tgt = st.virgin ? Bs * Math.tanh(Hn / (a + Hc)) : Bs * Math.tanh((Hn - sg * Hc) / a), rate = Math.min(1, Math.abs(dH) / (a * 0.6)); var Bold = st.M; st.M += (tgt - st.M) * rate;
        if ((st.Hp < 0) !== (Hn < 0) && st.pts.length) st.Br = st.M; if ((Bold < 0) !== (st.M < 0)) st.Hc = Math.abs(Hn);
        st.Hp = Hn; st.pts.push([Hn, st.M]); if (st.pts.length > 900) st.pts.shift();
      }
      D.clear(c, W, H);
      var box = { x: W * 0.1, y: H * 0.06, w: W * 0.84, h: H * 0.82 };
      var g = D.graph(c, box, { x0: -Hmax, x1: Hmax, y0: -Bs * 1.15, y1: Bs * 1.15, xl: 'H (A/m) →', yl: 'B (T)', dots: [{ x: st.Hp, y: st.M, color: K.c2, r: 6 }] }, [{ pts: st.pts, color: K.c1, w: 2.5 }]);
      D.line(c, g.px(0), box.y, g.px(0), box.y + box.h, K.faint, 1);
      [-Hmax, -Hmax / 2, Hmax / 2, Hmax].forEach(function (u) { D.text(c, f(u, 2), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      [-Bs, Bs].forEach(function (u) { D.text(c, f(u, 2), box.x - 4, g.py(u), { size: 10, align: 'right', color: K.faint }); });
      S.set('H', f(st.Hp, 3) + ' A/m'); S.set('B', f(st.M, 3) + ' T'); S.set('Br', st.Br === null ? '–' : f(Math.abs(st.Br), 3) + ' T'); S.set('Hc', st.Hc === null ? '–' : f(st.Hc, 3) + ' A/m');
    }
  });

  /* ---------- 2D: magnet through a coil (Faraday) ---------- */
  Sim.make('sim-faraday', {
    aspect: 0.6, animate: true, maxH: 520,
    controls: [
      { k: 'v', label: 'Magnet speed', min: 0.2, max: 3, step: 0.1, v: 1, unit: 'm/s' },
      { k: 'B', label: 'Magnet strength (peak flux per turn)', min: 0.2, max: 2, step: 0.1, v: 1, unit: 'mWb' },
      { k: 'N', label: 'Turns N', min: 10, max: 500, step: 10, v: 100 }
    ],
    buttons: [{ label: 'Push magnet', click: function (S) { S.st.x = -0.35; S.st.go = true; S.st.h = []; S.st.t = 0; } }, { k: 'flip', label: 'Flip magnet', click: function (S) { S.st.s = -S.st.s; } }],
    reads: [{ k: 'phi', label: 'Flux per turn &Phi;' }, { k: 'emf', label: 'EMF = &minus;N d&Phi;/dt', big: true }, { k: 'lenz', label: 'Lenz' }],
    init: function (S) { S.st.x = -0.35; S.st.go = false; S.st.h = []; S.st.s = 1; S.st.t = 0; },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, K = C(), l = 0.05, Phi = function (x) { return st.s * p.B * 1e-3 / Math.pow(1 + (x / l) * (x / l), 1.5); };
      var dPhidx = (Phi(st.x + 1e-5) - Phi(st.x - 1e-5)) / 2e-5, emf = 0;
      if (st.go) { st.x += p.v * dt * 0.25; st.t += dt * 0.25; emf = -p.N * dPhidx * p.v; st.h.push([st.t, Phi(st.x), emf]); if (st.x > 0.35) st.go = false; }
      D.clear(c, W, H);
      var cy = H * 0.22, cx = W * 0.5, sc = W * 0.9 / 0.7;
      for (var i = -5; i <= 5; i++) { c.save(); c.strokeStyle = K.c2; c.lineWidth = 2.5; c.beginPath(); c.ellipse(cx + i * 7, cy, 6, 40, 0, 0, 2 * PI); c.stroke(); c.restore(); }
      var mx = cx + st.x * sc; D.rect(c, mx - 50, cy - 14, 50, 28, st.s > 0 ? K.neg : K.pos, null, 3); D.rect(c, mx, cy - 14, 50, 28, st.s > 0 ? K.pos : K.neg, null, 3);
      D.text(c, st.s > 0 ? 'S' : 'N', mx - 25, cy, { align: 'center', weight: 700, color: '#fff' }); D.text(c, st.s > 0 ? 'N' : 'S', mx + 25, cy, { align: 'center', weight: 700, color: '#fff' });
      if (Math.abs(emf) > 1e-6) { var sg = emf > 0 ? 1 : -1; D.arrow(c, cx - 30 * sg, cy - 52, cx + 30 * sg, cy - 52, K.c3, 3); D.text(c, 'induced current', cx, cy - 66, { align: 'center', size: 11, color: K.c3 }); }
      var b1 = { x: W * 0.08, y: H * 0.42, w: W * 0.88, h: H * 0.24 }, b2 = { x: W * 0.08, y: H * 0.72, w: W * 0.88, h: H * 0.24 };
      var em = p.N * p.B * 1e-3 * 0.86 / l * p.v * 1.2;
      D.graph(c, b1, { x0: 0, x1: 0.7 / p.v, y0: -2.2e-3, y1: 2.2e-3, yl: 'Φ (Wb)' }, [{ pts: st.h.map(function (q) { return [q[0] * 4 / 4, q[1]]; }), color: K.c1, w: 2.5 }]);
      D.graph(c, b2, { x0: 0, x1: 0.7 / p.v, y0: -em, y1: em, xl: 'time →', yl: 'EMF (V)' }, [{ pts: st.h.map(function (q) { return [q[0], q[2]]; }), color: K.c2, w: 2.5 }]);
      var approaching = st.x < 0;
      S.set('phi', f(Phi(st.x) * 1000, 3) + ' mWb'); S.set('emf', f(emf, 3) + ' V');
      S.set('lenz', !st.go ? '–' : approaching ? 'induced current repels the approaching magnet' : 'induced current attracts the leaving magnet');
    }
  });

  /* ---------- 3D: AC generator ---------- */
  Sim.make('sim-generator3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.45, ph: 1.1, r: 15 },
    controls: [
      { k: 'f', label: 'Rotation frequency', min: 0.2, max: 2, step: 0.1, v: 0.5, show: function (v) { return f(v * 100, 3) + ' Hz (shown slowed)'; } },
      { k: 'B', label: 'Field B', min: 0.05, max: 1, step: 0.05, v: 0.2, unit: 'T' },
      { k: 'A', label: 'Coil area A', min: 20, max: 200, step: 10, v: 100, unit: 'cm²' },
      { k: 'N', label: 'Turns N', min: 10, max: 200, step: 10, v: 100 }
    ],
    reads: [{ k: 'phi', label: 'Flux N&Phi; now' }, { k: 'emf', label: 'EMF now', big: true }, { k: 'pk', label: 'Peak NBA&omega;' }],
    init: function (S) {
      var st = S.st; st.ang = 0; st.hist = [];
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = T.arrow(S.scene, '#9aa0b8'); T.setArrow(a, [-6, i * 1.6, j * 1.6], [12, 0, 0], 0.4); }
      var nm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 3.5), T.mat(0xc62828)); nm.position.x = -6.8; S.scene.add(nm); var sm = nm.clone(); sm.material = T.mat(0x1d4ed8); sm.position.x = 6.8; S.scene.add(sm);
      st.coil = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 4), T.mat(0xc2410c)); st.g = new THREE.Group(); st.coil.rotation.y = PI / 2; st.coil.rotation.x = PI / 4; st.g.add(st.coil); S.scene.add(st.g);
      st.n = T.arrow(S.scene, '#9333ea');
      st.graph = T.line(S.scene, 0x15803d, 400); var ax = T.line(S.scene, 0x9aa0b8, 2); T.setLine(ax, [[-5, -3.6, -3], [5, -3.6, -3]]);
      T.label(S.scene, 'EMF vs time', '#15803d', 1).position.set(-4, -2.2, -3);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, w = 2 * PI * p.f; st.ang += w * dt;
      var s = Math.sqrt(p.A) * 0.2; st.g.rotation.y = st.ang; st.coil.scale.set(s, s, 1);
      var n = [Math.cos(st.ang), 0, -Math.sin(st.ang)]; T.setArrow(st.n, [0, 0, 0], [n[0] * 2, 0, n[2] * 2], 0.3);
      var wr = 2 * PI * p.f * 100, Ar = p.A * 1e-4, emf0 = p.N * p.B * Ar * wr, emf = emf0 * Math.sin(st.ang), fl = p.N * p.B * Ar * Math.cos(st.ang);
      st.hist.push(emf / 200); if (st.hist.length > 400) st.hist.shift();
      T.setLine(st.graph, st.hist.map(function (v, i) { return [-5 + 10 * i / 400, -3.6 + clamp(v, -1.5, 1.5), -3]; }));
      S.set('phi', f(fl, 3) + ' Wb'); S.set('emf', f(emf, 3) + ' V'); S.set('pk', f(emf0, 3) + ' V');
    }
  });

  /* ---------- 2D: RL circuit ---------- */
  Sim.make('sim-rl', {
    aspect: 0.48, animate: true,
    controls: [{ k: 'L', label: 'Inductance L', min: 0.1, max: 4, step: 0.1, v: 1, unit: 'H' }, { k: 'R', label: 'Resistance R', min: 1, max: 20, step: 0.5, v: 4, unit: 'Ω' }],
    buttons: [{ label: 'Close switch', click: function (S) { S.st.mode = 1; S.st.t0 = S.t; S.st.I0 = S.st.I; S.st.tr = []; } }, { label: 'Open switch', click: function (S) { S.st.mode = -1; S.st.t0 = S.t; S.st.I0 = S.st.I; S.st.tr = []; } }],
    reads: [{ k: 'tau', label: '&tau; = L/R' }, { k: 'I', label: 'Current I', big: true }, { k: 'emf', label: 'Back-EMF L dI/dt' }, { k: 'U', label: 'Energy &frac12;LI&sup2;' }],
    init: function (S) { S.st.mode = 0; S.st.I = 0; S.st.tr = []; S.st.t0 = 0; S.st.I0 = 0; },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, K = C(), E = 12, tau = p.L / p.R, ts = S.t - st.t0, If = E / p.R, Tm = 5;
      if (st.mode === 1) st.I = If + (st.I0 - If) * Math.exp(-ts / tau);
      if (st.mode === -1) st.I = st.I0 * Math.exp(-ts / tau);
      if (st.mode && ts < Tm) st.tr.push([ts, st.I]);
      var dIdt = st.mode === 1 ? (If - st.I) / tau : st.mode === -1 ? -st.I / tau : 0;
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.08, w: W * 0.88, h: H * 0.76 };
      var g = D.graph(c, box, { x0: 0, x1: Tm, y0: 0, y1: 12.5, xl: 'time since switching (s) →', yl: 'I (A)', vlines: [{ x: tau, label: 't = τ', color: K.c2 }], hlines: [{ y: If, label: 'E/R', color: K.faint }] }, [{ pts: st.tr, color: K.c1, w: 3 }]);
      [0, 1, 2, 3, 4, 5].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('tau', f(tau, 3) + ' s'); S.set('I', f(st.I, 3) + ' A'); S.set('emf', f(Math.abs(p.L * dIdt), 3) + ' V'); S.set('U', f(0.5 * p.L * st.I * st.I, 3) + ' J');
      S.msg(st.mode === 0 ? 'Press Close switch (12 V battery).' : '');
    }
  });
})();
