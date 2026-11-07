/* Extra 3D simulations with a biology focus, shared by all unit pages.
   Each one only starts if its placeholder exists on the page. Drag any view to rotate it. */
(function () {
  if (!window.Sim || !window.THREE) return;
  var T = Sim.T3, f = Sim.fmt, PI = Math.PI, V3 = THREE.Vector3, Y = new THREE.Vector3(0, 1, 0);

  /* place a unit-height cylinder (or any y-aligned mesh) between two points */
  function span(mesh, a, b) {
    var A = new V3(a[0], a[1], a[2]), B = new V3(b[0], b[1], b[2]), d = B.clone().sub(A), L = d.length();
    mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.scale.set(1, Math.max(L, 1e-3), 1);
    if (L > 1e-6) mesh.quaternion.setFromUnitVectors(Y, d.normalize());
  }
  function cyl(r, color, o) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 20), T.mat(color, o)); }
  function add(S, m) { S.scene.add(m); return m; }
  function spikeShape(u) { if (u < 0) return -70; if (u < 0.5) return -55 + 85 * (u / 0.5); if (u < 2) return 30 - 110 * ((u - 0.5) / 1.5); if (u < 8) return -80 + 10 * (1 - Math.exp(-(u - 2) / 1.8)); return -70; }
  function vColor(col, v) { var s = Sim.clamp((v + 80) / 110, 0, 1); col.setHSL(0.62 - 0.62 * s, 0.85, 0.45 + 0.15 * s); return col; }

  /* ================= ROTATION ================= */

  /* Forearm lever: biceps force for any elbow angle */
  Sim.make('sim-arm3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.35, ph: 1.25, r: 11, target: [1.5, 1.2, 0] },
    controls: [
      { k: 'm', label: 'Dumbbell mass m', min: 1, max: 10, step: 0.5, v: 2, unit: 'kg' },
      { k: 'd', label: 'Tendon distance from elbow d', min: 2, max: 8, step: 0.5, v: 4, unit: 'cm' },
      { k: 'phi', label: 'Forearm angle above horizontal', min: -30, max: 60, step: 5, v: 0, unit: '°' }
    ],
    reads: [{ k: 'W', label: 'Weight W = mg' }, { k: 'tw', label: 'Load torque' }, { k: 'F', label: 'Biceps force', big: true }, { k: 'r', label: 'F / W' }],
    init: function (S) {
      var st = S.st;
      add(S, cyl(0.32, 0xd9b38c)).position.set(0, 1.5, 0); S.scene.children[S.scene.children.length - 1].scale.y = 3;
      add(S, T.sphere(0.42, 0xd9b38c)).position.set(0, 3, 0);
      add(S, T.sphere(0.36, 0x8a6a4f));
      st.fore = add(S, new THREE.Group());
      var fa = cyl(0.28, 0xd9b38c); fa.rotation.z = PI / 2; fa.scale.y = 3.5; fa.position.x = 1.75; st.fore.add(fa);
      var hand = T.sphere(0.33, 0xd9b38c); hand.position.x = 3.5; st.fore.add(hand);
      st.db = new THREE.Group(); st.fore.add(st.db);
      var bar = cyl(0.05, 0x444444); bar.rotation.x = PI / 2; bar.scale.y = 1.4; st.db.add(bar);
      st.plates = [-0.65, 0.65].map(function (z) { var p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 24), T.mat(0x555555)); p.rotation.x = PI / 2; p.position.z = z; st.db.add(p); return p; });
      st.muscle = add(S, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1, 20), T.mat(0xc0392b)));
      st.Farrow = T.arrow(S.scene, '#c62828'); st.Warrow = T.arrow(S.scene, '#1565c0');
      st.Flab = T.label(S.scene, 'F', '#c62828', 0.9); st.Wlab = T.label(S.scene, 'W', '#1565c0', 0.9);
      T.grid(S.scene, 10, -2.5);
    },
    draw: function (S) {
      var p = S.p, st = S.st, ph = p.phi * PI / 180, x = 0.32, g = 9.8, W = p.m * g, sc = 10;
      st.fore.rotation.z = ph; st.db.position.x = x * sc;
      var s = 0.12 + 0.04 * Math.sqrt(p.m); st.plates.forEach(function (q) { q.scale.set(s * 2.4, 1, s * 2.4); });
      var ins = [p.d / 100 * Math.cos(ph), p.d / 100 * Math.sin(ph)], sh = [0.02, 0.29];
      var u = [sh[0] - ins[0], sh[1] - ins[1]], Lu = Math.hypot(u[0], u[1]); u = [u[0] / Lu, u[1] / Lu];
      var lever = Math.abs(ins[0] * u[1] - ins[1] * u[0]), tw = W * x * Math.cos(ph), F = tw / lever;
      span(st.muscle, [ins[0] * sc, ins[1] * sc, 0.3], [sh[0] * sc, sh[1] * sc - 0.3, 0.3]);
      var kF = Math.min(4, F * 0.012);
      T.setArrow(st.Farrow, [ins[0] * sc, ins[1] * sc, 0.6], [u[0] * kF, u[1] * kF, 0], 0.35);
      st.Flab.position.set(ins[0] * sc + u[0] * kF + 0.4, ins[1] * sc + u[1] * kF, 0.6);
      var hx = x * sc * Math.cos(ph), hy = x * sc * Math.sin(ph);
      T.setArrow(st.Warrow, [hx, hy - 0.3, 1.1], [0, -Math.max(0.4, W * 0.012), 0], 0.3);
      st.Wlab.position.set(hx + 0.4, hy - 0.6 - W * 0.012, 1.1);
      S.set('W', f(W, 3) + ' N'); S.set('tw', f(tw, 3) + ' N·m'); S.set('F', f(F, 3) + ' N'); S.set('r', f(F / W, 3) + ' ×');
    }
  });

  /* Tuck and spin: moment of inertia of a body */
  Sim.make('sim-tuck3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.5, ph: 1.2, r: 13, target: [0, -0.5, 0] },
    controls: [{ k: 's', label: 'Body: tucked &larr; &rarr; spread out', min: 0, max: 1, step: 0.01, v: 1, show: function (v) { return Math.round(v * 100) + '% spread'; } }],
    reads: [{ k: 'I', label: 'Moment of inertia I' }, { k: 'w', label: 'Spin rate', big: true }, { k: 'L', label: 'L = I&omega; (constant)' }],
    init: function (S) {
      var st = S.st, skin = 0xd9b38c;
      st.body = add(S, new THREE.Group());
      var torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.6), T.mat(0x2d6a3e)); st.body.add(torso);
      var head = T.sphere(0.45, skin); head.position.y = 1.4; st.body.add(head);
      st.limbs = [0, 1, 2, 3].map(function (i) { var m = cyl(i < 2 ? 0.16 : 0.22, i < 2 ? skin : 0x1e3a5f); st.body.add(m); return m; });
      st.ends = [0, 1, 2, 3].map(function () { var m = T.sphere(0.2, 0xc2410c); st.body.add(m); return m; });
      var ax = T.line(S.scene, 0x888888, 2); T.setLine(ax, [[0, -4.5, 0], [0, 3.5, 0]]);
      st.th = 0;
      T.grid(S.scene, 10, -4);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, s = S.p.s;
      var hands = [[-0.5 - 1.7 * s, 0.6 - 0.2 * (1 - s), 0.35 * (1 - s)], [0.5 + 1.7 * s, 0.6 - 0.2 * (1 - s), 0.35 * (1 - s)]];
      var feet = [[-0.3 - 1.3 * s, -2.8 + 1.1 * (1 - s), 0.9 * (1 - s)], [0.3 + 1.3 * s, -2.8 + 1.1 * (1 - s), 0.9 * (1 - s)]];
      span(st.limbs[0], [-0.5, 0.7, 0], hands[0]); span(st.limbs[1], [0.5, 0.7, 0], hands[1]);
      span(st.limbs[2], [-0.25, -0.9, 0], feet[0]); span(st.limbs[3], [0.25, -0.9, 0], feet[1]);
      hands.concat(feet).forEach(function (q, i) { st.ends[i].position.set(q[0], q[1], q[2]); });
      var m = 0.45, r = function (q) { return Math.hypot(q[0], q[2]) * m; };
      var I = 0.9 + 2 * 3.5 * Math.pow(r(hands[0]) * 0.6, 2) + 2 * 11 * Math.pow(r(feet[0]) * 0.55, 2);
      var Iout = 0.9 + 2 * 3.5 * Math.pow(2.2 * m * 0.6, 2) + 2 * 11 * Math.pow(1.6 * m * 0.55, 2), L = Iout * 1.0 * 2 * PI, w = L / I;
      st.th += w * dt * 0.25; st.body.rotation.y = st.th;
      S.set('I', f(I, 3) + ' kg·m²'); S.set('w', f(w / (2 * PI), 3) + ' rev/s (shown 4× slower)'); S.set('L', f(L, 3) + ' kg·m²/s');
    }
  });

  /* Fixed-angle centrifuge separating blood */
  Sim.make('sim-centrifuge3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.4, ph: 0.95, r: 12 },
    controls: [{ k: 'rpm', label: 'Speed', min: 0, max: 12000, step: 250, v: 3000, show: function (v) { return Math.round(v).toLocaleString('en-US') + ' rpm'; } }],
    buttons: [{ label: 'Fresh blood samples', click: function (S) { S.st.prog = 0; S.st.time = 0; } }],
    reads: [{ k: 'rcf', label: 'RCF at r = 10 cm', big: true }, { k: 'sep', label: 'Separation' }, { k: 'tm', label: 'Time spinning' }],
    init: function (S) {
      var st = S.st; st.prog = 0; st.time = 0; st.ang = 0;
      add(S, new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.5, 48), T.mat(0x9aa5a0))).position.y = -0.6;
      st.rotor = add(S, new THREE.Group());
      st.tubes = [];
      for (var i = 0; i < 6; i++) {
        var a = i * PI / 3, g = new THREE.Group(), tilt = PI / 4;
        g.position.set(2.0 * Math.cos(a), 0.6, 2.0 * Math.sin(a));
        g.quaternion.setFromUnitVectors(Y, new V3(-Math.cos(a) * Math.sin(tilt), Math.cos(tilt), -Math.sin(a) * Math.sin(tilt)));
        var glass = cyl(0.26, 0xffffff, { opacity: 0.25 }); glass.scale.y = 2.4; g.add(glass);
        var red = cyl(0.22, 0xb71c1c), yel = cyl(0.22, 0xf2c94c, { opacity: 0.85 }); g.add(red); g.add(yel);
        st.rotor.add(g); st.tubes.push({ red: red, yel: yel });
      }
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, w = S.p.rpm * 2 * PI / 60, rcf = w * w * 0.1 / 9.8;
      if (S.p.rpm > 0) st.time += dt;
      st.prog = Math.min(1, st.prog + dt * rcf * 0.0001);
      st.ang += Math.min(w, 25) * dt * 0.25; st.rotor.rotation.y = st.ang;
      var L = 2.3, redL = L * (1 - 0.55 * st.prog), yelL = L - redL;
      st.tubes.forEach(function (t) {
        t.red.scale.y = redL; t.red.position.y = -L / 2 + redL / 2;
        t.yel.scale.y = Math.max(0.001, yelL); t.yel.position.y = L / 2 - yelL / 2; t.yel.visible = yelL > 0.01;
        t.red.material.color.setHSL(0, 0.75, 0.32 + 0.12 * (1 - st.prog));
      });
      S.set('rcf', f(rcf, 3) + ' × g'); S.set('sep', Math.round(st.prog * 100) + '%'); S.set('tm', st.time.toFixed(1) + ' s');
    }
  });

  /* ================= FLUIDS ================= */

  /* Fish with a swim bladder: float, hover or sink */
  Sim.make('sim-fish3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.5, ph: 1.25, r: 13 },
    controls: [{ k: 'rho', label: 'Fish average density', min: 950, max: 1050, step: 1, v: 1015, unit: 'kg/m³' }],
    reads: [{ k: 'W', label: 'Weight (1 L fish)' }, { k: 'B', label: 'Buoyancy when under water' }, { k: 'net', label: 'Net force', big: true }, { k: 'st', label: 'What happens' }],
    init: function (S) {
      var st = S.st;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 5, 4), T.mat(0x5aa0dc, { opacity: 0.16 }))).position.y = -0.5;
      var surf = add(S, new THREE.Mesh(new THREE.PlaneGeometry(10, 4), T.mat(0x2f80c0, { opacity: 0.35, side: THREE.DoubleSide }))); surf.rotation.x = -PI / 2; surf.position.y = 2;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), T.mat(0xc9b38a))).position.y = -3.1;
      st.fish = add(S, new THREE.Group());
      var b = T.sphere(1, 0xe08a2e); b.scale.set(1.2, 0.5, 0.4); st.fish.add(b);
      var tail = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 16), T.mat(0xe08a2e)); tail.rotation.z = PI / 2; tail.position.x = -1.45; st.fish.add(tail);
      var eye = T.sphere(0.09, 0x111111); eye.position.set(0.85, 0.12, 0.3); st.fish.add(eye);
      var bl = T.sphere(0.35, 0xffffff, { opacity: 0.6 }); bl.scale.set(1.3, 0.6, 0.6); st.fish.add(bl); st.bladder = bl;
      st.y = 0; st.x = 0; st.dir = 1;
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, rho = S.p.rho, rw = 1000, g = 9.8, V = 0.001, top = 2, bot = -3 + 0.5;
      var sub = Sim.clamp((top - (st.y - 0.5)) / 1.0, 0, 1);
      var net = rw * g * V * sub - rho * g * V;
      var target = rho < rw - 0.5 ? top + 0.5 - rho / rw : rho > rw + 0.5 ? bot : st.y;
      st.y += Sim.clamp(target - st.y, -1, 1) * Math.min(1, dt * (0.4 + Math.abs(rho - rw) / 15));
      st.x += st.dir * dt * 0.6; if (Math.abs(st.x) > 3) st.dir *= -1;
      st.fish.position.set(st.x, st.y, 0); st.fish.rotation.y = st.dir > 0 ? 0 : PI;
      st.bladder.scale.set(1.3 * (1060 - rho) / 60 + 0.3, 0.6 * (1060 - rho) / 60 + 0.15, 0.6 * (1060 - rho) / 60 + 0.15);
      S.set('W', f(rho * g * V, 3) + ' N'); S.set('B', f(rw * g * V, 3) + ' N'); S.set('net', (net >= 0 ? '+' : '') + f(net, 3) + ' N');
      S.set('st', Math.abs(rho - rw) <= 0.5 ? 'hovers (neutral buoyancy)' : rho < rw ? 'floats up to the surface' : 'sinks to the bottom');
    }
  });

  /* Stenosis in 3D */
  function arteryProfile(k, y) { var R1 = 1.3, R2 = R1 * Math.sqrt(k); return R1 + (R2 - R1) * Math.exp(-Math.pow(y / 1.7, 4)); }
  Sim.make('sim-artery3d', {
    webgl: true, aspect: 0.5, animate: true, camera: { th: 0.75, ph: 1.15, r: 13 },
    controls: [{ k: 'k', label: 'Narrowest area (% of normal)', min: 20, max: 100, step: 5, v: 40, map: function (v) { return v / 100; }, show: function (v) { return Math.round(v * 100) + '%'; } }],
    reads: [{ k: 'v', label: 'Speed in narrow part', big: true }, { k: 'dp', label: 'Pressure drop (blood, v<sub>1</sub> = 0.4 m/s)' }],
    init: function (S) {
      var st = S.st; st.k = -1; st.pts = [];
      st.mesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), 360));
      for (var i = 0; i < 360; i++) st.pts.push({ x: Math.random() * 12 - 6, q: Math.sqrt(Math.random()) * 0.92, a: Math.random() * 2 * PI });
      st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
      var plaque = T.sphere(0.55, 0xf2c94c); plaque.scale.set(2.4, 0.6, 0.6); st.plaque = add(S, plaque);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, k = S.p.k;
      if (st.k !== k) {
        st.k = k; if (st.wall) { S.scene.remove(st.wall); st.wall.geometry.dispose(); }
        var pr = []; for (var y = -6; y <= 6.001; y += 0.2) pr.push(new THREE.Vector2(arteryProfile(k, y), y));
        st.wall = add(S, new THREE.Mesh(new THREE.LatheGeometry(pr, 40), T.mat(0xc62828, { opacity: 0.2, side: THREE.DoubleSide })));
        st.wall.rotation.z = PI / 2;
        st.plaque.position.set(0, arteryProfile(k, 0) + 0.15, 0); st.plaque.visible = k < 0.95; st.plaque.scale.set(2.4, 0.2 + 0.6 * (1 - k), 0.9);
      }
      st.pts.forEach(function (q, i) {
        var R = arteryProfile(k, q.x), v = Math.pow(1.3 / R, 2);
        q.x += dt * 1.2 * v; if (q.x > 6) q.x -= 12;
        st.m4.makeTranslation(q.x, q.q * R * Math.cos(q.a), q.q * R * Math.sin(q.a)); st.mesh.setMatrixAt(i, st.m4);
        st.col.setHSL(0.0 + 0.13 * Sim.clamp((v - 1) / 4, 0, 1), 0.85, 0.38 + 0.25 * Sim.clamp((v - 1) / 4, 0, 1)); st.mesh.setColorAt(i, st.col);
      });
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      var v2 = 0.4 / k;
      S.set('v', f(1 / k, 3) + ' × faster (' + f(v2, 3) + ' m/s)'); S.set('dp', f(0.5 * 1060 * (v2 * v2 - 0.16), 3) + ' Pa');
    }
  });

  /* Blood cells settling: the ESR test */
  var cells = [['platelets', 1.5, 0xf2c94c], ['red cells', 3.5, 0xc62828], ['white cells', 6, 0xe6e6e6]];
  function stir(S) { S.st.c = []; for (var i = 0; i < 45; i++) { var t = i % 3; S.st.c.push({ t: t, x: (Math.random() - 0.5) * 1.6, z: (Math.random() - 0.5) * 1.6, y: 3.6 - Math.random() * 2.5 }); } }
  Sim.make('sim-sediment3d', {
    webgl: true, aspect: 0.6, maxH: 480, animate: true, camera: { th: 0.4, ph: 1.4, r: 16 },
    controls: [{ k: 'eta', label: 'Plasma viscosity (&times; normal)', min: 1, max: 3, step: 0.1, v: 1 }],
    buttons: [{ label: 'Stir the tube', click: stir }],
    reads: [{ k: 'p', label: 'Platelets (r = 1.5 &micro;m)' }, { k: 'r', label: 'Red cells (r = 3.5 &micro;m)', big: true }, { k: 'w', label: 'White cells (r = 6 &micro;m)' }],
    init: function (S) {
      var st = S.st; stir(S);
      var tube = cyl(1.1, 0xffffff, { opacity: 0.18, side: THREE.DoubleSide }); tube.scale.y = 8; add(S, tube);
      add(S, cyl(1.06, 0xf6e3a1, { opacity: 0.22 })).scale.y = 7.8;
      st.mesh = cells.map(function (q, i) { var m = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry([0.07, 0.16, 0.26][i], 12, 8), T.mat(q[2]), 15)); return m; });
      st.m4 = new THREE.Matrix4();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, cnt = [0, 0, 0];
      st.c.forEach(function (q) {
        var r = cells[q.t][1], v = 0.06 * Math.pow(r / 3.5, 2) / S.p.eta, bottom = -3.8 + [0.07, 0.16, 0.26][q.t];
        q.y = Math.max(bottom, q.y - v * dt * 3);
        st.m4.makeTranslation(q.x, q.y, q.z); st.mesh[q.t].setMatrixAt(cnt[q.t]++, st.m4);
      });
      st.mesh.forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
      var real = function (r) { return 2 * Math.pow(r * 1e-6, 2) * 75 * 9.8 / (9 * 0.0012 * S.p.eta) * 3.6e6; }; // mm per hour
      S.set('p', f(real(1.5), 3) + ' mm/h'); S.set('r', f(real(3.5), 3) + ' mm/h'); S.set('w', f(real(6), 3) + ' mm/h');
    }
  });

  /* 3D random walk */
  function resetWalk(S) { S.st.a = []; S.st.b = []; for (var i = 0; i < 150; i++) { S.st.a.push([0, 0, 0]); S.st.b.push([0, 0, 0]); } }
  Sim.make('sim-diffuse3d', {
    webgl: true, aspect: 0.5, animate: true, camera: { th: 0.2, ph: 1.15, r: 15 },
    controls: [{ k: 'rb', label: 'Protein radius', min: 0.5, max: 5, step: 0.1, v: 3.5, unit: 'nm' }],
    buttons: [{ label: 'Restart', click: resetWalk }],
    reads: [{ k: 'ratio', label: 'D<sub>small</sub> / D<sub>protein</sub>', big: true }, { k: 'rms', label: 'Spread ratio after same time' }],
    init: function (S) {
      var st = S.st; resetWalk(S);
      [-3.4, 3.4].forEach(function (x, i) { var b = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.6, 5.6), new THREE.MeshBasicMaterial({ color: i ? 0x7c3aed : 0x2e7d32, wireframe: true, transparent: true, opacity: 0.25 })); b.position.x = x; add(S, b); });
      st.ma = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), T.mat(0x2e7d32), 150));
      st.mb = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), T.mat(0x7c3aed), 150));
      T.label(S.scene, 'small molecule', '#2e7d32', 1).position.set(-3.4, 3.4, 0); T.label(S.scene, 'protein', '#7c3aed', 1).position.set(3.4, 3.4, 0);
      st.m4 = new THREE.Matrix4();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, Da = 1 / 0.14, Db = 1 / S.p.rb, k = 0.06;
      [[st.a, st.ma, Da, -3.4], [st.b, st.mb, Db, 3.4]].forEach(function (g) {
        var sig = Math.sqrt(2 * g[2] * dt) * k * 3;
        g[0].forEach(function (q, i) {
          for (var j = 0; j < 3; j++) { q[j] += (Math.random() * 2 - 1) * sig * 1.7; if (Math.abs(q[j]) > 2.7) q[j] = Math.sign(q[j]) * (5.4 - Math.abs(q[j])); }
          st.m4.makeTranslation(g[3] + q[0], q[1], q[2]); g[1].setMatrixAt(i, st.m4);
        });
        g[1].instanceMatrix.needsUpdate = true;
      });
      S.set('ratio', f(Da / Db, 3)); S.set('rms', f(Math.sqrt(Da / Db), 3) + ' × wider (√D)');
    }
  });

  /* ================= SOUND ================= */

  /* Spherical waves and the inverse-square law */
  Sim.make('sim-soundsphere3d', {
    webgl: true, aspect: 0.5, animate: true, camera: { th: 0.6, ph: 1.05, r: 22, target: [2, 0, 0] },
    controls: [
      { k: 'P', label: 'Source power', min: -4, max: 0, step: 0.1, v: -2, map: function (x) { return Math.pow(10, x); }, show: function (v) { return f(v * 1000, 3) + ' mW'; } },
      { k: 'r', label: 'Listener distance r', min: 1, max: 10, step: 0.5, v: 3, unit: 'm' }
    ],
    reads: [{ k: 'I', label: 'I = P / 4&pi;r&sup2;' }, { k: 'dB', label: 'Sound level &beta;', big: true }, { k: 'tip', label: 'Double the distance' }],
    init: function (S) {
      var st = S.st; st.shells = [];
      for (var i = 0; i < 7; i++) st.shells.push(add(S, new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshPhongMaterial({ color: 0x2f80c0, transparent: true, opacity: 0.15, depthWrite: false }))));
      add(S, T.sphere(0.4, 0xc62828));
      st.ear = add(S, T.sphere(0.35, 0x2d6a3e)); st.lab = T.label(S.scene, 'listener', '#2d6a3e', 1);
      st.line = T.line(S.scene, 0x56655b, 2);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, sc = 0.8, Rmax = 6.5;
      st.shells.forEach(function (m, i) { var r = ((S.t * 1.5 + i * Rmax / 7) % Rmax) + 0.3; m.scale.set(r, r, r); m.material.opacity = 0.28 * Math.pow(0.3 / r, 0.6) + 0.02; });
      st.ear.position.set(S.p.r * sc, 0, 0); st.lab.position.set(S.p.r * sc, 0.8, 0); T.setLine(st.line, [[0, 0, 0], [S.p.r * sc, 0, 0]]);
      var I = S.p.P / (4 * PI * S.p.r * S.p.r), dB = 10 * Math.log10(I / 1e-12);
      S.set('I', f(I, 3) + ' W/m²'); S.set('dB', f(dB, 3) + ' dB'); S.set('tip', 'I falls to 1/4, about −6 dB');
    }
  });

  /* Ultrasound scanner building a B-mode image */
  function ellHit(ox, oy, dx, dy, cx, cy, a, b) { // ray-ellipse intersections, returns distances
    var px = ox - cx, py = oy - cy, A = dx * dx / (a * a) + dy * dy / (b * b), B = 2 * (px * dx / (a * a) + py * dy / (b * b)), Cq = px * px / (a * a) + py * py / (b * b) - 1, disc = B * B - 4 * A * Cq;
    if (disc < 0) return null; var s = Math.sqrt(disc); return [(-B - s) / (2 * A), (-B + s) / (2 * A)];
  }
  Sim.make('sim-ultrasound3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0.35, ph: 1.2, r: 16, target: [2.5, 0, 0] },
    controls: [{ k: 'd', label: 'Depth of the organ (kidney)', min: 3, max: 11, step: 0.5, v: 6, unit: 'cm' }],
    buttons: [{ label: 'Gel on', group: 'g', on: true, click: function (S) { S.st.gel = true; } }, { label: 'Gel off', group: 'g', click: function (S) { S.st.gel = false; } }],
    reads: [{ k: 't', label: 'Echo time from top of organ', big: true }, { k: 'img', label: 'Image' }],
    init: function (S) {
      var st = S.st; st.gel = true; st.line = 0; st.acc = 0;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), T.mat(0xe8b89a, { opacity: 0.22 }))).position.y = -1;
      st.organ = add(S, T.sphere(1, 0x8e3b46, { opacity: 0.75 })); st.organ.scale.set(1.5, 0.8, 1.1);
      add(S, new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), T.mat(0x2d3a32))).position.y = 2.3;
      st.fan = []; for (var i = 0; i < 32; i++) st.fan.push(T.line(S.scene, 0x7fb3e6, 2));
      st.cv = document.createElement('canvas'); st.cv.width = 128; st.cv.height = 128; st.cx = st.cv.getContext('2d');
      st.cx.fillStyle = '#000'; st.cx.fillRect(0, 0, 128, 128);
      st.tex = new THREE.CanvasTexture(st.cv);
      var scr = add(S, new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), new THREE.MeshBasicMaterial({ map: st.tex }))); scr.position.set(7, 0, 0); scr.rotation.y = -0.35;
      T.label(S.scene, 'scanner screen', '#56655b', 1).position.set(7, 2.7, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, apex = [0, 2, 0], depthU = 6 / 14, cy = 2 - S.p.d * depthU - 0.8 * 0.5;
      st.organ.position.set(0.3, cy, 0);
      st.acc += dt; var step = st.acc > 0.03; if (step) { st.acc = 0; st.line = (st.line + 1) % 32; }
      for (var i = 0; i < 32; i++) {
        var a = (-30 + 60 * i / 31) * PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = 6 / Math.cos(a);
        T.setLine(st.fan[i], [apex, [apex[0] + dx * L, apex[1] + dy * L, 0]]);
        st.fan[i].material.color.set(i === st.line ? (st.gel ? 0xffd54f : 0x666666) : 0x7fb3e6); st.fan[i].material.opacity = 1;
      }
      if (step) {
        var j = st.line, a2 = (-30 + 60 * j / 31) * PI / 180, ddx = Math.sin(a2), ddy = -Math.cos(a2), x = 4 + j * 120 / 31, cx = st.cx;
        cx.fillStyle = '#000'; cx.fillRect(x - 2, 0, 5, 128);
        if (st.gel) {
          for (var k = 0; k < 40; k++) { var yy = 6 + Math.random() * 120, g = 20 + Math.random() * 40; cx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'; cx.fillRect(x - 1, yy, 3, 2); }
          var hit = ellHit(apex[0], apex[1], ddx, ddy, 0.3, cy, 1.5, 0.8);
          if (hit) { [0, 1].forEach(function (n) { var py = 4 + hit[n] / 6.4 * 124; cx.fillStyle = n ? '#bbb' : '#fff'; cx.fillRect(x - 2, py - 1.5, 5, 3); }); }
          cx.fillStyle = '#ddd'; cx.fillRect(x - 2, 2, 5, 2);
        } else { cx.fillStyle = '#fff'; cx.fillRect(x - 2, 2, 5, 4); }
        st.tex.needsUpdate = true;
      }
      S.set('t', f(2 * S.p.d / 100 / 1540 * 1e6, 3) + ' µs'); S.set('img', st.gel ? 'kidney outline appears' : 'blank: air gap reflects 99.9%');
    }
  });

  /* ================= ELECTRICITY ================= */

  /* Cell membrane as a capacitor */
  Sim.make('sim-membrane3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.2, r: 12 },
    controls: [{ k: 'V', label: 'Membrane potential (inside &minus; outside)', min: -90, max: 40, step: 5, v: -70, unit: 'mV' }],
    reads: [{ k: 'E', label: 'Field in membrane E = V/d (d = 7 nm)', big: true }, { k: 'Q', label: 'Charge per area Q/A = CV/A' }, { k: 'n', label: 'Extra ions per &micro;m&sup2;' }],
    init: function (S) {
      var st = S.st, n = 0, m4 = new THREE.Matrix4();
      st.heads = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), T.mat(0x5d9c59), 2 * 14 * 9));
      for (var s = -1; s <= 1; s += 2) for (var i = 0; i < 14; i++) for (var j = 0; j < 9; j++) { m4.makeTranslation(-3.9 + i * 0.6, s * 0.75, -2.4 + j * 0.6); st.heads.setMatrixAt(n++, m4); }
      add(S, new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.3, 5.4), T.mat(0xf2d16b, { opacity: 0.45 })));
      var ch = cyl(0.45, 0x2f80c0, { opacity: 0.8 }); ch.scale.y = 2.0; add(S, ch);
      T.label(S.scene, 'outside the cell', '#56655b', 1.1).position.set(0, 2.5, -2.6);
      T.label(S.scene, 'inside (cytoplasm)', '#56655b', 1.1).position.set(0, -2.5, -2.6);
      T.label(S.scene, 'ion channel', '#2f80c0', 0.9).position.set(0, 1.4, 0.8);
      st.ionsTop = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), 40));
      st.ionsBot = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), 40));
      st.pos = []; for (var k = 0; k < 40; k++) st.pos.push([-3.8 + Math.random() * 7.6, -2.3 + Math.random() * 4.6]);
      st.ar = []; for (var a = 0; a < 6; a++) st.ar.push(T.arrow(S.scene, '#7c3aed'));
      st.m4 = m4;
    },
    draw: function (S) {
      var st = S.st, V = S.p.V, n = Math.round(Math.abs(V) / 90 * 40), red = new THREE.Color(0xc62828), blue = new THREE.Color(0x1565c0);
      var topCol = V <= 0 ? red : blue, botCol = V <= 0 ? blue : red;
      [[st.ionsTop, 1.15, topCol], [st.ionsBot, -1.15, botCol]].forEach(function (g) {
        g[0].count = n;
        for (var i = 0; i < n; i++) { st.m4.makeTranslation(st.pos[i][0], g[1], st.pos[i][1]); g[0].setMatrixAt(i, st.m4); g[0].setColorAt(i, g[2]); }
        g[0].instanceMatrix.needsUpdate = true; if (g[0].instanceColor) g[0].instanceColor.needsUpdate = true;
      });
      var L = Math.abs(V) / 90 * 1.1, dir = V <= 0 ? -1 : 1;
      st.ar.forEach(function (a, i) { T.setArrow(a, [-3 + (i % 3) * 3 + (i > 2 ? 1.5 : 0), -dir * L / 2, i > 2 ? 1.2 : -1.2], [0, dir * L, 0], 0.25); });
      var E = Math.abs(V) * 1e-3 / 7e-9, Q = 0.01 * Math.abs(V) * 1e-3;
      S.set('E', f(E, 3) + ' V/m'); S.set('Q', f(Q, 3) + ' C/m²'); S.set('n', f(Q * 1e-12 / 1.6e-19, 3));
    }
  });

  /* Action potential running along an axon, with and without myelin */
  Sim.make('sim-axon3d', {
    webgl: true, aspect: 0.45, animate: true, camera: { th: 0.25, ph: 1.15, r: 17 },
    buttons: [
      { label: 'Fire!', click: function (S) { S.st.t0 = S.t; } },
      { label: 'Unmyelinated', group: 'm', on: true, click: function (S) { S.st.my = false; S.st.t0 = -99; } },
      { label: 'Myelinated', group: 'm', click: function (S) { S.st.my = true; S.st.t0 = -99; } }
    ],
    reads: [{ k: 'v', label: 'Real conduction speed', big: true }, { k: 't', label: 'Time to travel 1 m' }, { k: 'st', label: 'Signal' }],
    init: function (S) {
      var st = S.st, N = 90; st.N = N; st.my = false; st.t0 = -99;
      st.seg = add(S, new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.18, 20), new THREE.MeshPhongMaterial({ color: 0xffffff }), N));
      var m4 = new THREE.Matrix4(), rot = new THREE.Matrix4().makeRotationZ(PI / 2);
      for (var i = 0; i < N; i++) { m4.makeTranslation(-8 + 16 * i / (N - 1), 0, 0).multiply(rot); st.seg.setMatrixAt(i, m4); }
      st.sheaths = []; for (var k = 0; k < 8; k++) { var sh = cyl(0.7, 0xf5f5f0, { opacity: 0.85 }); sh.rotation.z = PI / 2; sh.scale.y = 1.6; sh.position.x = -7 + k * 2; add(S, sh); st.sheaths.push(sh); }
      var soma = T.sphere(1.2, 0x8e6bbf); soma.position.x = -9.2; add(S, soma);
      st.col = new THREE.Color();
    },
    draw: function (S) {
      var st = S.st, el = S.t - st.t0, any = false;
      st.sheaths.forEach(function (s) { s.visible = st.my; });
      for (var i = 0; i < st.N; i++) {
        var x = -8 + 16 * i / (st.N - 1), ta = st.my ? Math.floor((x + 8) / 2 + 0.5) * 0.12 : (x + 8) / 2.2, V = spikeShape((el - ta) * 4);
        if (st.my) { var node = Math.abs(((x + 8) % 2) - 0) < 0.25 || Math.abs(((x + 8) % 2) - 2) < 0.25; if (!node && V > -70) V = -70 + (V + 70) * 0.35; }
        if (V > -60) any = true;
        st.seg.setColorAt(i, vColor(st.col, V));
      }
      if (st.seg.instanceColor) st.seg.instanceColor.needsUpdate = true;
      S.set('v', st.my ? 'about 50–100 m/s' : 'about 1 m/s'); S.set('t', st.my ? 'about 10–20 ms' : 'about 1 s');
      S.set('st', any ? 'spike travelling (red = +30 mV)' : 'at rest (blue = −70 mV); press Fire!');
    }
  });

  /* ================= MAGNETISM ================= */

  /* Field around a current-carrying wire, with compasses */
  Sim.make('sim-wire3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 0.8, r: 14 },
    controls: [{ k: 'I', label: 'Current I (sign = direction)', min: -20, max: 20, step: 1, v: 10, unit: 'A' }],
    reads: [{ k: 'B', label: 'B at 2 cm = &mu;<sub>0</sub>I/2&pi;r', big: true }, { k: 'cmp', label: 'Earth’s field' }, { k: 'dir', label: 'Field circles (seen from above)' }],
    init: function (S) {
      var st = S.st;
      var w = cyl(0.12, 0xc2410c); w.scale.y = 9; add(S, w);
      st.Iarrow = T.arrow(S.scene, '#c2410c');
      st.rings = []; [1, 2, 3.2].forEach(function (r) { [-2.5, 2.5].forEach(function (y) { var l = T.line(S.scene, 0x1565c0, 65), pts = []; for (var i = 0; i <= 64; i++) pts.push([r * Math.cos(i / 64 * 2 * PI), y, r * Math.sin(i / 64 * 2 * PI)]); T.setLine(l, pts); st.rings.push({ r: r, y: y, ar: T.arrow(S.scene, '#1565c0') }); }); });
      var plane = add(S, new THREE.Mesh(new THREE.PlaneGeometry(10, 10), T.mat(0xdfe8df, { opacity: 0.5, side: THREE.DoubleSide }))); plane.rotation.x = -PI / 2;
      st.needles = [];
      for (var a = -4; a <= 4; a += 1.6) for (var b = -4; b <= 4; b += 1.6) {
        if (Math.hypot(a, b) < 0.6) continue;
        var g = new THREE.Group(), n1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), T.mat(0xc62828)), n2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), T.mat(0xbbbbbb));
        n1.rotation.z = -PI / 2; n1.position.x = 0.3; n2.rotation.z = PI / 2; n2.position.x = -0.3; g.add(n1); g.add(n2); g.position.set(a, 0.1, b); add(S, g);
        st.needles.push(g);
      }
      T.label(S.scene, 'N (Earth)', '#56655b', 1).position.set(0, 0.4, -5.3);
    },
    draw: function (S) {
      var st = S.st, I = S.p.I, cmPerU = 1;
      T.setArrow(st.Iarrow, [0.5, I >= 0 ? -1.5 : 1.5, 0], [0, (I >= 0 ? 3 : -3) * (I === 0 ? 0 : 1), 0], 0.4);
      st.rings.forEach(function (q) { var s = I >= 0 ? 1 : -1, ang = 0.6; T.setArrow(q.ar, [q.r * Math.cos(ang), q.y, -q.r * Math.sin(ang)], [-Math.sin(ang) * s * 0.8, 0, -Math.cos(ang) * s * 0.8], 0.3); q.ar.visible = I !== 0; });
      var Be = 5e-5;
      st.needles.forEach(function (g) {
        var x = g.position.x, z = g.position.z, rr = Math.hypot(x, z), B = 2e-7 * I / (rr * cmPerU / 100);
        var Bx = B * z / rr, Bz = -B * x / rr - Be; // right-hand rule (y-hat x r-hat) plus Earth's field toward north (-z)
        g.rotation.y = Math.atan2(-Bz, Bx);
      });
      S.set('B', f(Math.abs(2e-7 * I / 0.02), 3) + ' T'); S.set('cmp', '5 × 10⁻⁵ T'); S.set('dir', I > 0 ? 'anticlockwise (current up)' : I < 0 ? 'clockwise (current down)' : 'none');
    }
  });

  /* MRI slice selection with a field gradient */
  Sim.make('sim-mri3d', {
    webgl: true, aspect: 0.5, camera: { th: 1.0, ph: 1.15, r: 15 },
    controls: [
      { k: 'G', label: 'Gradient strength G', min: 0, max: 20, step: 1, v: 10, unit: 'mT/m' },
      { k: 'rf', label: 'Radio frequency sent', min: 63.4, max: 64.4, step: 0.005, v: 63.87, unit: 'MHz', sig: 5 }
    ],
    reads: [{ k: 'fh', label: 'Larmor f at head / feet' }, { k: 'z', label: 'Slice excited at', big: true }, { k: 'th', label: 'Slice thickness (2 kHz pulse)' }],
    init: function (S) {
      var st = S.st;
      var bore = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 6, 48, 1, true), T.mat(0x9aa5a0, { opacity: 0.25, side: THREE.DoubleSide })); bore.rotation.x = PI / 2; add(S, bore);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.35, 16, 48), T.mat(0x6b7a70)); add(S, ring).position.z = -3; add(S, ring.clone()).position.z = 3;
      st.slices = [];
      for (var i = 0; i < 40; i++) { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.14, 24), T.mat(0xd9b38c)); m.rotation.x = PI / 2; m.position.set(0, -0.6, -2.85 + i * 0.15); add(S, m); st.slices.push(m); }
      var head = T.sphere(0.65, 0xd9b38c); head.position.set(0, -0.5, 3.5); add(S, head); st.head = head;
      var table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 9), T.mat(0x56655b)); table.position.set(0, -1.7, 0.5); add(S, table);
      var b = T.arrow(S.scene, '#1565c0'); T.setArrow(b, [3.6, 1.5, -3], [0, 0, 6], 0.5); T.label(S.scene, 'B₀ = 1.5 T', '#1565c0', 1).position.set(3.6, 2.2, 0);
    },
    draw: function (S) {
      var st = S.st, G = S.p.G * 1e-3, gam = 42.58, bw = 0.002, mPerU = 0.3, hits = [];
      st.slices.forEach(function (m, i) {
        var z = m.position.z * mPerU, fz = gam * (1.5 + G * z), on = Math.abs(fz - S.p.rf) < Math.max(bw / 2, gam * G * 0.15 * mPerU / 2);
        m.material.color.set(on ? 0xffb300 : 0xd9b38c); m.material.emissive = new THREE.Color(on ? 0x553300 : 0x000000); if (on) hits.push(z);
      });
      var zh = 3.5 * mPerU, zf = -2.85 * mPerU;
      S.set('fh', f(gam * (1.5 + G * zh), 5) + ' / ' + f(gam * (1.5 + G * zf), 5) + ' MHz');
      S.set('z', !hits.length ? 'nothing (off resonance)' : G === 0 ? 'the whole body at once' : f((hits.reduce(function (a, b) { return a + b; }, 0) / hits.length) * 100, 3) + ' cm from centre');
      S.set('th', G > 0 ? f(bw / (gam * G) * 1000, 3) + ' mm' : 'no gradient: no slice');
    }
  });

  /* ================= OPTICS ================= */

  /* Compound microscope ray bundle */
  Sim.make('sim-microscope3d', {
    webgl: true, aspect: 0.5, camera: { th: 1.05, ph: 1.25, r: 10.5, target: [2.5, 0, 0] },
    controls: [{ k: 'do', label: 'Specimen distance from objective', min: 1.45, max: 2.2, step: 0.01, v: 1.6, unit: '× f/1.2', show: function (v) { return f(v / 1.2, 3) + ' fₒ'; } }],
    reads: [{ k: 'mo', label: 'Objective magnification d<sub>i</sub>/d<sub>o</sub>' }, { k: 'me', label: 'Eyepiece (f = 2.5 cm)' }, { k: 'M', label: 'Total magnification', big: true }],
    init: function (S) {
      var st = S.st;
      st.obj = add(S, T.sphere(0.8, 0x5aa0dc, { opacity: 0.35 })); st.obj.scale.set(0.15, 1, 1);
      st.eye = add(S, T.sphere(1.0, 0x5aa0dc, { opacity: 0.35 })); st.eye.scale.set(0.15, 1, 1);
      st.tube = add(S, cyl(1.15, 0x9aa5a0, { opacity: 0.12, side: THREE.DoubleSide }));
      st.oA = T.arrow(S.scene, '#2e7d32'); st.iA = T.arrow(S.scene, '#c2410c');
      st.rays = []; for (var i = 0; i < 24; i++) st.rays.push(T.line(S.scene, i < 12 ? 0xc62828 : 0xe09b3d, 3));
      T.label(S.scene, 'specimen', '#2e7d32', 0.9).position.set(-2, 1.3, 0); st.il = T.label(S.scene, 'real image', '#c2410c', 0.9);
      T.label(S.scene, 'objective', '#2f6690', 0.9).position.set(0, 1.4, 0); st.el = T.label(S.scene, 'eyepiece', '#2f6690', 0.9);
    },
    draw: function (S) {
      var st = S.st, fo = 1.2, fe = 1.5, d0 = S.p.do, di = 1 / (1 / fo - 1 / d0), h = 0.35, hi = -h * di / d0, xe = di + fe;
      st.eye.position.x = xe; st.el.position.set(xe, 1.6, 0); st.il.position.set(di, hi - 0.5, 0);
      span(st.tube, [0, 0, 0], [xe, 0, 0]); st.tube.rotation.z = PI / 2;
      T.setArrow(st.oA, [-d0, 0, 0], [0, h, 0], 0.15); T.setArrow(st.iA, [di, 0, 0], [0, hi, 0], 0.2);
      for (var i = 0; i < 12; i++) {
        var a = 2 * PI * i / 12, ly = 0.55 * Math.cos(a), lz = 0.55 * Math.sin(a);
        T.setLine(st.rays[i], [[-d0, h, 0], [0, ly, lz], [di, hi, 0]]);
        var ey = hi + 0.7 * Math.cos(a), ez = 0.7 * Math.sin(a), dx = xe - di, dy = -hi, L = Math.hypot(dx, dy);
        T.setLine(st.rays[12 + i], [[di, hi, 0], [xe, ey, ez], [xe + dx / L * 3, ey + dy / L * 3, ez]]);
      }
      var mo = di / d0 * 10, me = 10;
      S.set('mo', f(mo, 3) + '× (scaled)'); S.set('me', '10×'); S.set('M', f(mo * me, 3) + '×');
    }
  });

  /* Ripple tank: two-source interference */
  Sim.make('sim-ripple3d', {
    webgl: true, aspect: 0.55, animate: true, camera: { th: 0, ph: 0.8, r: 21 },
    controls: [
      { k: 'lam', label: 'Wavelength &lambda;', min: 0.8, max: 2.5, step: 0.05, v: 1.2 },
      { k: 'd', label: 'Source separation d', min: 1, max: 5, step: 0.1, v: 3 }
    ],
    reads: [{ k: 'ang', label: 'First bright line at sin&theta; = &lambda;/d', big: true }, { k: 'n', label: 'Bright lines (each side)' }],
    init: function (S) {
      var st = S.st, geo = new THREE.PlaneGeometry(14, 14, 110, 110); geo.rotateX(-PI / 2);
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
      st.geo = geo; add(S, new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      st.s1 = add(S, T.sphere(0.2, 0xc62828)); st.s2 = add(S, T.sphere(0.2, 0xc62828));
    },
    draw: function (S) {
      var st = S.st, p = st.geo.attributes.position, col = st.geo.attributes.color, k = 2 * PI / S.p.lam, w = 4, t = S.t, hd = S.p.d / 2;
      st.s1.position.set(-hd, 0.3, 6.5); st.s2.position.set(hd, 0.3, 6.5);
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), z = p.getZ(i), r1 = Math.hypot(x + hd, z - 6.5), r2 = Math.hypot(x - hd, z - 6.5);
        var y = 0.45 * (Math.sin(k * r1 - w * t) / Math.sqrt(r1 + 0.6) + Math.sin(k * r2 - w * t) / Math.sqrt(r2 + 0.6));
        p.setY(i, y); var s = Sim.clamp(0.5 + y, 0, 1); col.setXYZ(i, 0.1 + 0.85 * s, 0.35 + 0.6 * s, 0.6 + 0.4 * s);
      }
      p.needsUpdate = true; col.needsUpdate = true;
      var sn = S.p.lam / S.p.d;
      S.set('ang', sn <= 1 ? f(Math.asin(sn) * 180 / PI, 3) + '°' : 'none'); S.set('n', String(Math.floor(S.p.d / S.p.lam)));
    }
  });

  /* Crystal lattice and Bragg reflection */
  Sim.make('sim-crystal3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.2, ph: 1.25, r: 15, target: [0, 1, 0] },
    controls: [
      { k: 'th', label: 'Glancing angle &theta;', min: 5, max: 60, step: 0.5, v: 22.5, unit: '°' },
      { k: 'd', label: 'Layer spacing d', min: 0.15, max: 0.4, step: 0.01, v: 0.2, unit: 'nm' }
    ],
    reads: [{ k: 'n', label: '2d sin&theta; / &lambda;', big: true }, { k: 'I', label: 'Reflected beam' }],
    init: function (S) {
      var st = S.st, n = 0, m4 = new THREE.Matrix4();
      st.atoms = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 12, 8), T.mat(0x2f6690), 7 * 4 * 5));
      for (var i = 0; i < 7; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < 5; k++) { m4.makeTranslation(-3 + i, -j, -2 + k); st.atoms.setMatrixAt(n++, m4); }
      st.inB = add(S, cyl(0.08, 0x7c3aed)); st.outB = add(S, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 12), new THREE.MeshPhongMaterial({ color: 0xffb300, transparent: true })));
      st.det = add(S, T.sphere(0.45, 0xffb300, { opacity: 1 }));
      T.label(S.scene, 'X-rays in', '#7c3aed', 1.1).position.set(-3.2, 3.9, 0);
      T.label(S.scene, 'detector', '#56655b', 0.9).position.set(5, 4.2, 0);
      st.m4 = m4;
    },
    draw: function (S) {
      var st = S.st, th = S.p.th * PI / 180, lam = 0.154, N = 10, ph = 2 * PI * 2 * S.p.d * Math.sin(th) / lam;
      var I = Math.abs(Math.sin(ph / 2)) < 1e-6 ? 1 : Math.pow(Math.sin(N * ph / 2) / (N * Math.sin(ph / 2)), 2);
      var L = 6; st.atoms.scale.set(1, 0.8 + (S.p.d - 0.15) * 3, 1);
      span(st.inB, [-L * Math.cos(th), L * Math.sin(th), 0], [0, 0, 0]);
      span(st.outB, [0, 0, 0], [L * Math.cos(th), L * Math.sin(th), 0]); st.outB.material.opacity = 0.08 + 0.92 * I;
      st.det.position.set((L + 0.5) * Math.cos(th), (L + 0.5) * Math.sin(th), 0); st.det.material.opacity = 0.2 + 0.8 * I; st.det.scale.setScalar(0.6 + 0.8 * I);
      S.set('n', f(2 * S.p.d * Math.sin(th) / lam, 3)); S.set('I', I > 0.5 ? 'bright: Bragg condition met' : I > 0.05 ? 'weak' : 'dark: waves cancel');
    }
  });
})();
