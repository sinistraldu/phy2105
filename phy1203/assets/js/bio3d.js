/* PHY1203 3D simulations (part 1: rotation, fluids, sound).
   Every view can be dragged to rotate and has a toolbar (pause, slow motion, auto-rotate, zoom, reset).
   Each one only starts if its placeholder exists on the page. */
(function () {
  if (!window.Sim || !window.THREE) return;
  var T = Sim.T3, f = Sim.fmt, PI = Math.PI, V3 = THREE.Vector3, Y = new THREE.Vector3(0, 1, 0), clamp = Sim.clamp;

  function span(mesh, a, b) {
    var A = new V3(a[0], a[1], a[2]), B = new V3(b[0], b[1], b[2]), d = B.clone().sub(A), L = d.length();
    mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.scale.set(mesh.scale.x, Math.max(L, 1e-3), mesh.scale.z);
    if (L > 1e-6) mesh.quaternion.setFromUnitVectors(Y, d.normalize());
  }
  function cyl(r, color, o) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 20), T.mat(color, o)); }
  function add(S, m) { S.scene.add(m); return m; }
  window.Bio3D = { span: span, cyl: cyl, add: add };

  /* ================= ROTATION ================= */

  /* Spinning wheel: torque changes angular momentum */
  Sim.make('sim-wheel3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.7, ph: 1.1, r: 8, target: [0, 0.6, 0] },
    controls: [
      { k: 'tau', label: 'Torque applied &tau; (sign = direction)', min: -1, max: 1, step: 0.05, v: 0.3, unit: 'N·m' },
      { k: 'M', label: 'Mass M', min: 0.5, max: 5, step: 0.5, v: 2, unit: 'kg' },
      { k: 'R', label: 'Radius R', min: 0.1, max: 0.5, step: 0.05, v: 0.3, unit: 'm' }
    ],
    buttons: [
      { label: 'Solid disc', group: 's', on: true, click: function (S) { S.st.ring = false; } },
      { label: 'Ring', group: 's', click: function (S) { S.st.ring = true; } },
      { label: 'Stop the wheel', click: function (S) { S.st.w = 0; } }
    ],
    reads: [{ k: 'I', label: 'I (disc &frac12;MR&sup2;, ring MR&sup2;)' }, { k: 'a', label: '&alpha; = &tau;/I' }, { k: 'w', label: '&omega; now', big: true }, { k: 'L', label: 'L = I&omega;' }, { k: 'K', label: 'K = &frac12;I&omega;&sup2;' }],
    init: function (S) {
      var st = S.st; st.ring = false; st.w = 0; st.th = 0;
      st.g = add(S, new THREE.Group());
      st.disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.16, 48), T.mat(0x2d6a3e)); st.g.add(st.disc);
      st.torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 14, 60), T.mat(0x2d6a3e)); st.torus.rotation.x = PI / 2; st.g.add(st.torus);
      st.spokes = []; for (var i = 0; i < 6; i++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.04), T.mat(0xc2410c)); st.g.add(sp); st.spokes.push(sp); }
      st.mark = T.sphere(0.1, 0xc2410c); st.g.add(st.mark);
      add(S, cyl(0.05, 0x888888)).scale.y = 1.6;
      st.L = T.arrow(S.scene, '#7c3aed'); st.Llab = T.label(S.scene, 'L', '#7c3aed', 0.8);
      st.Fa = T.arrow(S.scene, '#c62828'); st.Flab = T.label(S.scene, 'F (torque)', '#c62828', 0.8);
      T.grid(S.scene, 8, -0.8);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, I = (st.ring ? 1 : 0.5) * p.M * p.R * p.R, a = p.tau / I, Rd = p.R * 5;
      st.w = clamp(st.w + a * dt, -40, 40); st.th += st.w * dt * 0.35;
      st.g.rotation.y = st.th; st.disc.visible = !st.ring; st.torus.visible = st.ring;
      st.disc.scale.set(Rd, 1, Rd); st.torus.scale.set(Rd, Rd, 1);
      st.spokes.forEach(function (sp, i) { sp.visible = st.ring; sp.scale.x = Rd; sp.position.set(Rd / 2 * Math.cos(i * PI / 3), 0, Rd / 2 * Math.sin(i * PI / 3)); sp.rotation.y = -i * PI / 3; });
      st.mark.position.set(Rd * 0.92, 0.1, 0);
      var Lv = I * st.w, Ld = clamp(Lv * 0.6, -3.5, 3.5);
      T.setArrow(st.L, [0, 0.1, 0], [0, Ld, 0], 0.3); st.Llab.position.set(0.35, Ld + (Ld >= 0 ? 0.4 : -0.3), 0); st.Llab.visible = Math.abs(Ld) > 0.05;
      T.setArrow(st.Fa, [Rd * 1.02, 0.25, -0.9 * Math.sign(p.tau || 1)], [0, 0, 1.2 * Math.sign(p.tau)], 0.25); st.Fa.visible = p.tau !== 0;
      st.Flab.position.set(Rd + 0.6, 0.7, 0); st.Flab.visible = p.tau !== 0;
      S.set('I', f(I, 3) + ' kg·m²'); S.set('a', f(a, 3) + ' rad/s²'); S.set('w', f(st.w, 3) + ' rad/s'); S.set('L', f(Lv, 3) + ' kg·m²/s'); S.set('K', f(0.5 * I * st.w * st.w, 3) + ' J');
      S.msg(Math.abs(st.w) >= 40 ? 'Top speed reached (40 rad/s). Reverse the torque to slow it down.' : '');
    }
  });

  /* Forearm lever */
  Sim.make('sim-arm3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.35, ph: 1.25, r: 11, target: [1.5, 1.2, 0] },
    controls: [
      { k: 'm', label: 'Dumbbell mass m', min: 0, max: 10, step: 0.5, v: 2, unit: 'kg' },
      { k: 'd', label: 'Tendon distance from elbow d', min: 2, max: 8, step: 0.5, v: 4, unit: 'cm' },
      { k: 'x', label: 'Hand distance from elbow x', min: 25, max: 40, step: 1, v: 32, unit: 'cm' },
      { k: 'phi', label: 'Forearm angle (when not curling)', min: -40, max: 70, step: 5, v: 0, unit: '°' }
    ],
    buttons: [
      { k: 'curl', label: 'Do biceps curls', click: function (S, b) { S.st.curl = !S.st.curl; b.classList.toggle('on', S.st.curl); } },
      { k: 'fw', label: 'Include forearm weight (1.5 kg)', click: function (S, b) { S.st.fw = !S.st.fw; b.classList.toggle('on', S.st.fw); } }
    ],
    reads: [{ k: 'ang', label: 'Forearm angle now' }, { k: 'tw', label: 'Load torque' }, { k: 'F', label: 'Biceps force', big: true }, { k: 'r', label: 'Force &divide; dumbbell weight' }],
    init: function (S) {
      var st = S.st; st.curl = false; st.fw = false; st.ph = 0; st.tc = 0;
      var ua = add(S, cyl(0.32, 0xd9b38c)); ua.position.set(0, 1.5, 0); ua.scale.y = 3;
      add(S, T.sphere(0.42, 0xd9b38c)).position.set(0, 3, 0); add(S, T.sphere(0.36, 0x8a6a4f));
      st.fore = add(S, new THREE.Group());
      st.fa = cyl(0.28, 0xd9b38c); st.fa.rotation.z = PI / 2; st.fore.add(st.fa);
      st.hand = T.sphere(0.33, 0xd9b38c); st.fore.add(st.hand);
      st.db = new THREE.Group(); st.fore.add(st.db);
      var bar = cyl(0.05, 0x444444); bar.rotation.x = PI / 2; bar.scale.y = 1.4; st.db.add(bar);
      st.plates = [-0.65, 0.65].map(function (z) { var p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 24), T.mat(0x555555)); p.rotation.x = PI / 2; p.position.z = z; st.db.add(p); return p; });
      st.muscle = add(S, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1, 20), T.mat(0xc0392b)));
      st.Farrow = T.arrow(S.scene, '#c62828'); st.Warrow = T.arrow(S.scene, '#1565c0');
      st.Flab = T.label(S.scene, 'F', '#c62828', 0.9); st.Wlab = T.label(S.scene, 'W', '#1565c0', 0.9);
      T.grid(S.scene, 10, -2.5);
    },
    draw: function (S, c, W, H, dt) {
      var p = S.p, st = S.st, sc = 10, g = 9.8, x = p.x / 100;
      if (st.curl) { st.tc += dt; st.ph = (15 - 55 * Math.cos(st.tc * 1.6)) * PI / 180; } else st.ph = p.phi * PI / 180;
      var ph = st.ph, Wd = p.m * g, cph = Math.cos(ph);
      st.fore.rotation.z = ph; st.fa.scale.y = x * sc; st.fa.position.x = x * sc / 2; st.hand.position.x = x * sc; st.db.position.x = x * sc; st.db.visible = p.m > 0;
      var s = 0.12 + 0.04 * Math.sqrt(p.m); st.plates.forEach(function (q) { q.scale.set(s * 2.4, 1, s * 2.4); });
      var ins = [p.d / 100 * cph, p.d / 100 * Math.sin(ph)], sh = [0.02, 0.29];
      var u = [sh[0] - ins[0], sh[1] - ins[1]], Lu = Math.hypot(u[0], u[1]); u = [u[0] / Lu, u[1] / Lu];
      var lever = Math.abs(ins[0] * u[1] - ins[1] * u[0]), tw = Wd * x * cph + (st.fw ? 1.5 * g * x / 2 * cph : 0), F = Math.max(0, tw / lever);
      span(st.muscle, [ins[0] * sc, ins[1] * sc, 0.3], [sh[0] * sc, sh[1] * sc - 0.3, 0.3]);
      var kF = Math.min(4.5, F * 0.01);
      T.setArrow(st.Farrow, [ins[0] * sc, ins[1] * sc, 0.6], [u[0] * kF, u[1] * kF, 0], 0.35);
      st.Flab.position.set(ins[0] * sc + u[0] * kF + 0.4, ins[1] * sc + u[1] * kF, 0.6);
      var hx = x * sc * cph, hy = x * sc * Math.sin(ph);
      T.setArrow(st.Warrow, [hx, hy - 0.3, 1.1], [0, -Math.max(0.01, Wd * 0.012), 0], 0.3); st.Warrow.visible = p.m > 0; st.Wlab.visible = p.m > 0;
      st.Wlab.position.set(hx + 0.4, hy - 0.6 - Wd * 0.012, 1.1);
      S.set('ang', f(ph * 180 / PI, 3) + '°'); S.set('tw', f(tw, 3) + ' N·m'); S.set('F', f(F, 3) + ' N'); S.set('r', Wd > 0 ? f(F / Wd, 3) + ' ×' : '–');
    }
  });

  /* Tuck and spin */
  Sim.make('sim-tuck3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.2, r: 13, target: [0, -0.5, 0] },
    controls: [
      { k: 's', label: 'Body: tucked &larr; &rarr; spread out', min: 0, max: 1, step: 0.01, v: 1, show: function (v) { return Math.round(v * 100) + '% spread'; } },
      { k: 'w0', label: 'Spin rate when spread out', min: 0.3, max: 2, step: 0.1, v: 1, unit: 'rev/s' },
      { k: 'ma', label: 'Mass of each arm', min: 2, max: 8, step: 0.5, v: 3.5, unit: 'kg' }
    ],
    buttons: [{ k: 'auto', label: 'Tuck and open automatically', click: function (S, b) { S.st.auto = !S.st.auto; b.classList.toggle('on', S.st.auto); } }],
    reads: [{ k: 'I', label: 'Moment of inertia I' }, { k: 'w', label: 'Spin rate', big: true }, { k: 'L', label: 'L = I&omega; (stays the same)' }, { k: 'K', label: 'Kinetic energy &frac12;I&omega;&sup2;' }],
    init: function (S) {
      var st = S.st, skin = 0xd9b38c; st.auto = false; st.ta = 0; st.th = 0;
      st.body = add(S, new THREE.Group());
      st.body.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.6), T.mat(0x2d6a3e)));
      var head = T.sphere(0.45, skin); head.position.y = 1.4; st.body.add(head);
      st.limbs = [0, 1, 2, 3].map(function (i) { var m = cyl(i < 2 ? 0.16 : 0.22, i < 2 ? skin : 0x1e3a5f); st.body.add(m); return m; });
      st.ends = [0, 1, 2, 3].map(function () { var m = T.sphere(0.2, 0xc2410c); st.body.add(m); return m; });
      var ax = T.line(S.scene, 0x888888, 2); T.setLine(ax, [[0, -4.5, 0], [0, 3.5, 0]]);
      T.grid(S.scene, 10, -4);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, s = p.s;
      if (st.auto) { st.ta += dt; s = 0.5 + 0.5 * Math.cos(st.ta * 0.9); }
      var hands = [[-0.5 - 1.7 * s, 0.6 - 0.2 * (1 - s), 0.35 * (1 - s)], [0.5 + 1.7 * s, 0.6 - 0.2 * (1 - s), 0.35 * (1 - s)]];
      var feet = [[-0.3 - 1.3 * s, -2.8 + 1.1 * (1 - s), 0.9 * (1 - s)], [0.3 + 1.3 * s, -2.8 + 1.1 * (1 - s), 0.9 * (1 - s)]];
      span(st.limbs[0], [-0.5, 0.7, 0], hands[0]); span(st.limbs[1], [0.5, 0.7, 0], hands[1]);
      span(st.limbs[2], [-0.25, -0.9, 0], feet[0]); span(st.limbs[3], [0.25, -0.9, 0], feet[1]);
      hands.concat(feet).forEach(function (q, i) { st.ends[i].position.set(q[0], q[1], q[2]); });
      var m = 0.45, r = function (q) { return Math.hypot(q[0], q[2]) * m; };
      var Ifn = function (h, ft) { return 0.9 + 2 * p.ma * Math.pow(r(h) * 0.6, 2) + 2 * 11 * Math.pow(r(ft) * 0.55, 2); };
      var I = Ifn(hands[0], feet[0]), Iout = Ifn([2.2, 0, 0], [1.6, 0, 0]), L = Iout * p.w0 * 2 * PI, w = L / I;
      st.th += w * dt * 0.25; st.body.rotation.y = st.th;
      S.set('I', f(I, 3) + ' kg·m²'); S.set('w', f(w / (2 * PI), 3) + ' rev/s'); S.set('L', f(L, 3) + ' kg·m²/s'); S.set('K', f(0.5 * I * w * w, 3) + ' J');
      S.msg('Shown 4&times; slower than real.');
    }
  });

  /* Lab centrifuge */
  var samples = [['Blood', 1e-4, 0xb71c1c, 0xf2c94c, 0.45], ['Bacteria culture', 1.2e-5, 0xd9c27a, 0xf3e7b0, 0.12], ['Cell organelles', 2.5e-6, 0x8e6bbf, 0xe8def8, 0.08]];
  Sim.make('sim-centrifuge3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.4, ph: 0.95, r: 12 },
    controls: [
      { k: 'rpm', label: 'Speed', min: 0, max: 20000, step: 250, v: 3000, show: function (v) { return Math.round(v).toLocaleString('en-US') + ' rpm'; } },
      { k: 'r', label: 'Tube distance from axis r', min: 5, max: 15, step: 0.5, v: 10, unit: 'cm' }
    ],
    buttons: samples.map(function (q, i) { return { label: q[0], group: 's', on: i === 0, click: function (S) { S.st.smp = i; S.st.prog = 0; S.st.time = 0; } }; })
      .concat([{ label: 'Fresh samples', click: function (S) { S.st.prog = 0; S.st.time = 0; } }]),
    reads: [{ k: 'rcf', label: 'RCF = &omega;&sup2;r/g', big: true }, { k: 'sep', label: 'Separation' }, { k: 'tm', label: 'Time spinning' }],
    init: function (S) {
      var st = S.st; st.prog = 0; st.time = 0; st.ang = 0; st.smp = 0;
      add(S, new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.5, 48), T.mat(0x9aa5a0))).position.y = -0.6;
      st.rotor = add(S, new THREE.Group()); st.tubes = [];
      for (var i = 0; i < 6; i++) {
        var g = new THREE.Group(), glass = cyl(0.26, 0xffffff, { opacity: 0.25 }); glass.scale.y = 2.4; g.add(glass);
        var bot = cyl(0.22, 0xb71c1c), top = cyl(0.22, 0xf2c94c, { opacity: 0.85 }); g.add(bot); g.add(top);
        st.rotor.add(g); st.tubes.push({ g: g, a: i * PI / 3, bot: bot, top: top });
      }
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, sm = samples[st.smp], w = S.p.rpm * 2 * PI / 60, rcf = w * w * S.p.r / 100 / 9.8;
      if (S.p.rpm > 0) st.time += dt;
      st.prog = Math.min(1, st.prog + dt * rcf * sm[1]);
      st.ang += Math.min(w, 25) * dt * 0.25; st.rotor.rotation.y = st.ang;
      var L = 2.3, pel = sm[4], botL = L * (1 - (1 - pel) * st.prog), topL = L - botL, rr = 0.6 + (S.p.r - 5) / 10 * 2.4;
      st.tubes.forEach(function (t) {
        t.g.position.set(rr * Math.cos(t.a), 0.6, rr * Math.sin(t.a));
        t.g.quaternion.setFromUnitVectors(Y, new V3(-Math.cos(t.a) * 0.707, 0.707, -Math.sin(t.a) * 0.707));
        t.bot.scale.y = botL; t.bot.position.y = -L / 2 + botL / 2; t.top.scale.y = Math.max(0.001, topL); t.top.position.y = L / 2 - topL / 2; t.top.visible = topL > 0.01;
        t.bot.material.color.setHex(sm[2]); t.top.material.color.setHex(sm[3]);
        t.bot.material.opacity = 1;
      });
      S.set('rcf', f(rcf, 3) + ' × g'); S.set('sep', Math.round(st.prog * 100) + '%'); S.set('tm', st.time.toFixed(1) + ' s');
      S.msg(st.prog < 1 && rcf > 0 && rcf * sm[1] < 0.004 ? 'Too slow for these particles: raise the speed.' : '');
    }
  });

  /* ================= FLUIDS ================= */

  /* Standing vs lying: hydrostatic blood pressure */
  Sim.make('sim-bp3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.2, r: 15, target: [0, 1, 0] },
    controls: [
      { k: 'P', label: 'Pressure at the heart (mean)', min: 70, max: 130, step: 5, v: 95, unit: 'mmHg' },
      { k: 'h', label: 'Body height', min: 1.4, max: 2.1, step: 0.05, v: 1.75, unit: 'm' }
    ],
    buttons: [
      { label: 'Standing', group: 'p', on: true, click: function (S) { S.st.goal = 0; } },
      { label: 'Lying down', group: 'p', click: function (S) { S.st.goal = 1; } },
      { label: 'Giraffe (5 m)', click: function (S) { S.setControl('h', 2.1); S.st.giraffe = !S.st.giraffe; } }
    ],
    reads: [{ k: 'head', label: 'Head (brain)' }, { k: 'heart', label: 'Heart' }, { k: 'feet', label: 'Feet', big: true }],
    init: function (S) {
      var st = S.st, skin = 0xd9b38c; st.goal = 0; st.lie = 0; st.giraffe = false;
      st.g = add(S, new THREE.Group());
      st.torso = cyl(0.45, 0x2d6a3e); st.g.add(st.torso); st.head = T.sphere(0.4, skin); st.g.add(st.head);
      st.legs = [cyl(0.2, 0x1e3a5f), cyl(0.2, 0x1e3a5f)]; st.legs.forEach(function (l) { st.g.add(l); });
      st.heart = T.sphere(0.2, 0xc62828); st.g.add(st.heart);
      st.vessel = cyl(0.06, 0xc62828, { opacity: 0.9 }); st.g.add(st.vessel);
      st.bars = [0, 1, 2].map(function (i) { var b = cyl(0.18, [0x7c3aed, 0xc62828, 0x1565c0][i]); add(S, b); return b; });
      st.labs = ['head', 'heart', 'feet'].map(function (n, i) { return T.label(S.scene, n, ['#7c3aed', '#c62828', '#1565c0'][i], 0.8); });
      T.grid(S.scene, 12, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, hgt = st.giraffe ? 5 : p.h, u = 4.2 / Math.max(2.1, hgt);
      st.lie += clamp(st.goal - st.lie, -dt * 1.5, dt * 1.5);
      var legL = hgt * 0.5 * u, torL = hgt * 0.32 * u, headY = legL + torL + 0.45, heartY = legL + torL * 0.7;
      st.legs.forEach(function (l, i) { l.scale.y = legL; l.position.set(i ? 0.22 : -0.22, legL / 2, 0); });
      st.torso.scale.y = torL; st.torso.position.y = legL + torL / 2; st.head.position.y = headY; st.heart.position.set(0.15, heartY, 0.35);
      st.vessel.scale.y = headY; st.vessel.position.set(0, headY / 2, 0.45);
      st.g.rotation.z = -st.lie * PI / 2; st.g.position.set(st.lie * 0.5, st.lie * 0.5, 0);
      var dy = function (y) { return (y - heartY) * Math.cos(st.lie * PI / 2) / u; }; // metres above heart
      var Ph = p.P - 1060 * 9.8 * dy(headY) / 133.3, Pf = p.P - 1060 * 9.8 * dy(0) / 133.3;
      [[Ph, headY], [p.P, heartY], [Pf, 0.1]].forEach(function (q, i) {
        var bh = Math.max(0.02, q[0] / 60), x = 3 + i * 1.1; st.bars[i].scale.y = bh; st.bars[i].position.set(x, bh / 2, -1.5);
        st.labs[i].position.set(x, bh + 0.4, -1.5);
      });
      S.set('head', f(Ph, 3) + ' mmHg'); S.set('heart', f(p.P, 3) + ' mmHg'); S.set('feet', f(Pf, 3) + ' mmHg');
      S.msg(st.giraffe ? 'A giraffe’s heart must pump at about 200 mmHg to get blood up a 2 m neck.' : Ph < 40 ? 'Very low pressure at the brain: this is why you can feel dizzy standing up fast.' : '');
    }
  });

  /* Fish and swim bladder */
  Sim.make('sim-fish3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.25, r: 13 },
    controls: [
      { k: 'rho', label: 'Fish average density', min: 950, max: 1060, step: 1, v: 1015, unit: 'kg/m³' },
      { k: 'vol', label: 'Fish volume', min: 0.2, max: 3, step: 0.1, v: 1, unit: 'L' }
    ],
    buttons: [{ label: 'Fresh water (1000)', group: 'w', on: true, click: function (S) { S.st.rw = 1000; } }, { label: 'Sea water (1025)', group: 'w', click: function (S) { S.st.rw = 1025; } }],
    reads: [{ k: 'W', label: 'Weight' }, { k: 'B', label: 'Buoyancy when under water' }, { k: 'net', label: 'Net force', big: true }, { k: 'st', label: 'What happens' }],
    init: function (S) {
      var st = S.st; st.rw = 1000;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 5, 4), T.mat(0x5aa0dc, { opacity: 0.16 }))).position.y = -0.5;
      var surf = add(S, new THREE.Mesh(new THREE.PlaneGeometry(10, 4), T.mat(0x2f80c0, { opacity: 0.35, side: THREE.DoubleSide }))); surf.rotation.x = -PI / 2; surf.position.y = 2;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), T.mat(0xc9b38a))).position.y = -3.1;
      st.fish = add(S, new THREE.Group());
      var b = T.sphere(1, 0xe08a2e); b.scale.set(1.2, 0.5, 0.4); st.fish.add(b);
      var tail = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 16), T.mat(0xe08a2e)); tail.rotation.z = PI / 2; tail.position.x = -1.45; st.fish.add(tail); st.tail = tail;
      var eye = T.sphere(0.09, 0x111111); eye.position.set(0.85, 0.12, 0.3); st.fish.add(eye);
      st.bladder = T.sphere(0.35, 0xffffff, { opacity: 0.6 }); st.fish.add(st.bladder);
      st.y = 0; st.x = 0; st.dir = 1; st.vy = 0;
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, rho = p.rho, rw = st.rw, g = 9.8, V = p.vol / 1000, sc = Math.cbrt(p.vol), half = 0.5 * sc, top = 2, bot = -3 + half;
      var sub = clamp((top - (st.y - half)) / (2 * half), 0, 1), net = rw * g * V * sub - rho * g * V;
      st.vy += (net / (rho * V)) * dt * 0.6 - st.vy * dt * 2.5; st.y += st.vy * dt;
      if (st.y < bot) { st.y = bot; st.vy = 0; } if (st.y > top + half) { st.y = top + half; st.vy = 0; }
      st.x += st.dir * dt * 0.6; if (Math.abs(st.x) > 3) st.dir *= -1;
      st.fish.position.set(st.x, st.y, 0); st.fish.rotation.y = st.dir > 0 ? 0 : PI; st.fish.scale.setScalar(sc);
      st.tail.rotation.y = Math.sin(S.t * 8) * 0.4;
      var bs = clamp((1070 - rho) / 110, 0.05, 1); st.bladder.scale.set(1.3 * bs + 0.1, 0.6 * bs + 0.05, 0.6 * bs + 0.05);
      S.set('W', f(rho * g * V, 3) + ' N'); S.set('B', f(rw * g * V, 3) + ' N'); S.set('net', (net >= 0 ? '+' : '') + f(net, 3) + ' N');
      S.set('st', Math.abs(rho - rw) <= 0.5 ? 'hovers (neutral buoyancy)' : rho < rw ? 'rises and floats' : 'sinks to the bottom');
    }
  });

  /* Poiseuille flow inside a vessel */
  Sim.make('sim-vessel3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.9, ph: 1.2, r: 11.5 },
    controls: [
      { k: 'R', label: 'Vessel radius (% of 2 mm)', min: 40, max: 120, step: 5, v: 100, show: function (v) { return v + '%'; } },
      { k: 'dP', label: 'Pressure drop &Delta;P', min: 300, max: 3000, step: 100, v: 1200, unit: 'Pa' },
      { k: 'eta', label: 'Blood viscosity &eta;', min: 2, max: 8, step: 0.5, v: 4, unit: 'mPa·s' }
    ],
    buttons: [{ k: 'beat', label: 'Heartbeat (pulsing flow)', click: function (S, b) { S.st.beat = !S.st.beat; b.classList.toggle('on', S.st.beat); } }],
    reads: [{ k: 'vm', label: 'Centre speed v<sub>max</sub>' }, { k: 'Q', label: 'Flow rate Q = &pi;R<sup>4</sup>&Delta;P/8&eta;L', big: true }, { k: 'Rf', label: 'Flow resistance (vs normal)' }],
    init: function (S) {
      var st = S.st, N = 420, LEN = 8; st.LEN = LEN; st.beat = false;
      st.tube = add(S, new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, LEN, 40, 1, true), T.mat(0xc62828, { opacity: 0.18, side: THREE.DoubleSide }))); st.tube.rotation.z = PI / 2;
      st.mesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), N));
      st.pts = []; for (var i = 0; i < N; i++) st.pts.push({ x: Math.random() * LEN - LEN / 2, r: Math.sqrt(Math.random()), a: Math.random() * 6.283 });
      st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
      st.arrows = []; for (var j = -4; j <= 4; j++) st.arrows.push(T.arrow(S.scene, '#2f6690'));
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, s = p.R / 100, R = 1.5 * s, beat = st.beat ? Math.max(0.15, 1 + 0.8 * Math.sin(2 * PI * 1.2 * S.t)) : 1;
      var Rm = 0.002 * s, L = 0.2, eta = p.eta * 1e-3, dP = p.dP * beat, vmax = dP * Rm * Rm / (4 * eta * L), Q = PI * Math.pow(Rm, 4) * dP / (8 * eta * L);
      var vis = vmax / 1.5;
      st.tube.scale.set(s, 1, s);
      st.pts.forEach(function (q, i) {
        var v = (1 - q.r * q.r) * vis; q.x += v * dt * 2.2; if (q.x > st.LEN / 2) q.x -= st.LEN;
        st.m4.makeTranslation(q.x, q.r * R * 0.95 * Math.cos(q.a), q.r * R * 0.95 * Math.sin(q.a)); st.mesh.setMatrixAt(i, st.m4);
        st.col.setHSL(0.13 * (1 - q.r * q.r), 0.85, 0.35 + 0.3 * (1 - q.r * q.r)); st.mesh.setColorAt(i, st.col);
      });
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      st.arrows.forEach(function (a, j) { var y = (j - 4) / 4 * R * 0.95, v = (1 - (y / R) * (y / R)) * vis; T.setArrow(a, [-1, y, 0], [Math.min(4, v * 2), 0, 0], 0.25); });
      S.set('vm', f(vmax, 3) + ' m/s'); S.set('Q', f(Q * 1e6, 3) + ' mL/s'); S.set('Rf', f((p.eta / 4) / Math.pow(s, 4), 3) + ' ×');
    }
  });

  /* Plaque narrowing an artery */
  function arteryProfile(k, y) { var R1 = 1.3, R2 = R1 * Math.sqrt(k); return R1 + (R2 - R1) * Math.exp(-Math.pow(y / 1.7, 4)); }
  Sim.make('sim-artery3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.75, ph: 1.15, r: 13 },
    controls: [
      { k: 'k', label: 'Narrowest area (% of normal)', min: 15, max: 100, step: 5, v: 40, map: function (v) { return v / 100; }, show: function (v) { return Math.round(v * 100) + '%'; } },
      { k: 'v1', label: 'Blood speed before the plaque v<sub>1</sub>', min: 0.1, max: 0.8, step: 0.05, v: 0.3, unit: 'm/s' }
    ],
    buttons: [{ k: 'beat', label: 'Heartbeat (pulsing flow)', click: function (S, b) { S.st.beat = !S.st.beat; b.classList.toggle('on', S.st.beat); } }],
    reads: [{ k: 'v', label: 'Speed in narrow part v<sub>2</sub>', big: true }, { k: 'dp', label: 'Pressure drop &frac12;&rho;(v<sub>2</sub>&sup2; &minus; v<sub>1</sub>&sup2;)' }, { k: 're', label: 'Re in the narrow part' }],
    init: function (S) {
      var st = S.st; st.k = -1; st.pts = []; st.beat = false;
      st.mesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), 360));
      for (var i = 0; i < 360; i++) st.pts.push({ x: Math.random() * 12 - 6, q: Math.sqrt(Math.random()) * 0.92, a: Math.random() * 2 * PI, j: Math.random() * 6 });
      st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
      st.plaque = add(S, T.sphere(0.55, 0xf2c94c));
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, k = S.p.k, beat = st.beat ? Math.max(0.2, 1 + 0.7 * Math.sin(2 * PI * 1.2 * S.t)) : 1, v1 = S.p.v1 * beat;
      if (st.k !== k) {
        st.k = k; if (st.wall) { S.scene.remove(st.wall); st.wall.geometry.dispose(); }
        var pr = []; for (var y = -6; y <= 6.001; y += 0.2) pr.push(new THREE.Vector2(arteryProfile(k, y), y));
        st.wall = add(S, new THREE.Mesh(new THREE.LatheGeometry(pr, 40), T.mat(0xc62828, { opacity: 0.2, side: THREE.DoubleSide }))); st.wall.rotation.z = PI / 2;
        st.plaque.position.set(0, arteryProfile(k, 0) + 0.15, 0); st.plaque.visible = k < 0.95; st.plaque.scale.set(2.4, 0.2 + 0.6 * (1 - k), 0.9);
      }
      var v2 = v1 / k, Re = 1060 * v2 * 0.005 * Math.sqrt(k) / 0.0035, turb = clamp((Re - 2000) / 2000, 0, 1);
      st.pts.forEach(function (q, i) {
        var R = arteryProfile(k, q.x), v = Math.pow(1.3 / R, 2);
        q.x += dt * 3 * v1 * v; if (q.x > 6) q.x -= 12;
        var jit = turb * (q.x > 0 ? Math.min(1, q.x / 2) : 0) * 0.5, qq = clamp(q.q + jit * Math.sin(S.t * 9 + q.j), 0, 0.95), aa = q.a + jit * 2 * Math.cos(S.t * 7 + q.j);
        st.m4.makeTranslation(q.x, qq * R * Math.cos(aa), qq * R * Math.sin(aa)); st.mesh.setMatrixAt(i, st.m4);
        var h = clamp((v - 1) / 4, 0, 1); st.col.setHSL(0.13 * h, 0.85, 0.38 + 0.25 * h); st.mesh.setColorAt(i, st.col);
      });
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      S.set('v', f(v2, 3) + ' m/s'); S.set('dp', f(0.5 * 1060 * (v2 * v2 - v1 * v1), 3) + ' Pa'); S.set('re', f(Re, 3) + (Re > 2000 ? ' (turbulent after the plaque)' : ' (laminar)'));
    }
  });

  /* Laminar vs turbulent pipe flow */
  Sim.make('sim-pipe3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.6, ph: 1.15, r: 14 },
    controls: [
      { k: 'v', label: 'Mean speed v', min: 0.05, max: 1.2, step: 0.05, v: 0.3, unit: 'm/s' },
      { k: 'D', label: 'Vessel diameter D', min: 2, max: 30, step: 1, v: 10, unit: 'mm' },
      { k: 'eta', label: 'Viscosity &eta;', min: 1, max: 6, step: 0.5, v: 3.5, unit: 'mPa·s' }
    ],
    reads: [{ k: 're', label: 'Re = &rho;vD/&eta;', big: true }, { k: 'reg', label: 'Flow type' }],
    init: function (S) {
      var st = S.st, N = 600; st.N = N;
      var tube = add(S, new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 12, 40, 1, true), T.mat(0xc62828, { opacity: 0.12, side: THREE.DoubleSide }))); tube.rotation.z = PI / 2;
      st.mesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), N));
      st.cols = [0x2f6690, 0x2e7d32, 0x7c3aed, 0xc2410c, 0xb45309].map(function (h) { return new THREE.Color(h); });
      st.p = []; for (var i = 0; i < N; i++) { var s = i % 5, a = s * 2 * PI / 5; st.p.push({ s: s, x: -6 + Math.random() * 12, y0: 0.8 * Math.cos(a) * (s ? 1 : 0), z0: 0.8 * Math.sin(a) * (s ? 1 : 0), dy: 0, dz: 0 }); }
      for (var j = 0; j < N; j++) st.mesh.setColorAt(j, st.cols[st.p[j].s]);
      st.m4 = new THREE.Matrix4();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, Re = 1060 * p.v * p.D / 1000 / (p.eta / 1000), turb = clamp((Re - 1800) / 2500, 0, 1);
      st.p.forEach(function (q, i) {
        var r = Math.hypot(q.y0 + q.dy, q.z0 + q.dz) / 1.6, vx = (2 * (1 - r * r) * (1 - turb) + 1.2 * turb) * p.v * 3;
        q.x += vx * dt;
        var u = (q.x + 6) / 12; if (turb > 0) { q.dy += (Math.random() - 0.5) * turb * u * 0.4; q.dz += (Math.random() - 0.5) * turb * u * 0.4; q.dy *= 0.97; q.dz *= 0.97; }
        if (q.x > 6) { q.x = -6; q.dy = 0; q.dz = 0; }
        var yy = q.y0 + q.dy, zz = q.z0 + q.dz, rr = Math.hypot(yy, zz); if (rr > 1.5) { yy *= 1.5 / rr; zz *= 1.5 / rr; }
        st.m4.makeTranslation(q.x, yy, zz); st.mesh.setMatrixAt(i, st.m4);
      });
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      S.set('re', f(Re, 3)); S.set('reg', Re < 2000 ? 'laminar: dye stays in neat lines' : Re < 4000 ? 'transitional: lines start to wander' : 'turbulent: dye mixes everywhere');
    }
  });

  /* Blood cells settling: ESR */
  var cells = [['platelets', 1.5, 0xf2c94c, 0.07], ['red cells', 3.5, 0xc62828, 0.16], ['white cells', 6, 0xe6e6e6, 0.26]];
  function stir(S) { S.st.c = []; for (var i = 0; i < 45; i++) { var t = i % 3; S.st.c.push({ t: t, x: (Math.random() - 0.5) * 1.6, z: (Math.random() - 0.5) * 1.6, y: 3.6 - Math.random() * 2.5 }); } }
  Sim.make('sim-sediment3d', {
    webgl: true, aspect: 0.6, maxH: 480, camera: { th: 0.4, ph: 1.4, r: 16 },
    controls: [
      { k: 'eta', label: 'Plasma viscosity (&times; normal)', min: 1, max: 3, step: 0.1, v: 1 },
      { k: 'cl', label: 'Red-cell clumping (inflammation)', min: 1, max: 3, step: 0.1, v: 1, show: function (v) { return 'radius ×' + v.toFixed(1); } },
      { k: 'dr', label: 'Cell density minus plasma &Delta;&rho;', min: 20, max: 120, step: 5, v: 75, unit: 'kg/m³' }
    ],
    buttons: [{ label: 'Stir the tube', click: stir }],
    reads: [{ k: 'p', label: 'Platelets' }, { k: 'r', label: 'Red cells (the ESR)', big: true }, { k: 'w', label: 'White cells' }],
    init: function (S) {
      var st = S.st; stir(S);
      var tube = cyl(1.1, 0xffffff, { opacity: 0.18, side: THREE.DoubleSide }); tube.scale.y = 8; add(S, tube);
      add(S, cyl(1.06, 0xf6e3a1, { opacity: 0.22 })).scale.y = 7.8;
      st.mesh = cells.map(function (q) { return add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), T.mat(q[2]), 15)); });
      st.m4 = new THREE.Matrix4();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, cnt = [0, 0, 0];
      var real = function (r) { return 2 * Math.pow(r * 1e-6, 2) * p.dr * 9.8 / (9 * 0.0012 * p.eta) * 3.6e6; };
      st.c.forEach(function (q) {
        var r = cells[q.t][1] * (q.t === 1 ? p.cl : 1), vis = cells[q.t][3] * (q.t === 1 ? p.cl : 1), v = 0.06 * Math.pow(r / 3.5, 2) * (p.dr / 75) / p.eta, bottom = -3.8 + vis;
        q.y = Math.max(bottom, q.y - v * dt * 3);
        st.m4.makeScale(vis, vis, vis).setPosition(q.x, q.y, q.z); st.mesh[q.t].setMatrixAt(cnt[q.t]++, st.m4);
      });
      st.mesh.forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
      S.set('p', f(real(1.5), 3) + ' mm/h'); S.set('r', f(real(3.5 * p.cl), 3) + ' mm/h'); S.set('w', f(real(6), 3) + ' mm/h');
      S.msg(p.cl > 1.6 ? 'Clumped red cells (rouleaux) fall much faster: a high ESR is a sign of inflammation.' : '');
    }
  });

  /* 3D diffusion */
  function resetWalk(S) { S.st.a = []; S.st.b = []; S.st.tt = 0; for (var i = 0; i < 150; i++) { S.st.a.push([0, 0, 0]); S.st.b.push([0, 0, 0]); } }
  Sim.make('sim-diffuse3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.2, ph: 1.15, r: 15 },
    controls: [
      { k: 'rb', label: 'Protein radius', min: 0.5, max: 5, step: 0.1, v: 3.5, unit: 'nm' },
      { k: 'T', label: 'Temperature T', min: 275, max: 320, step: 1, v: 310, unit: 'K' },
      { k: 'eta', label: 'Viscosity (&times; water)', min: 1, max: 5, step: 0.25, v: 1 }
    ],
    buttons: [{ label: 'Restart', click: resetWalk }],
    reads: [{ k: 'Da', label: 'D small molecule (0.14 nm)' }, { k: 'Db', label: 'D protein', big: true }, { k: 'ratio', label: 'D<sub>small</sub> / D<sub>protein</sub>' }],
    init: function (S) {
      var st = S.st; resetWalk(S);
      [-3.4, 3.4].forEach(function (x, i) { var b = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.6, 5.6), new THREE.MeshBasicMaterial({ color: i ? 0x7c3aed : 0x2e7d32, wireframe: true, transparent: true, opacity: 0.25 })); b.position.x = x; add(S, b); });
      st.ma = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), T.mat(0x2e7d32), 150));
      st.mb = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), T.mat(0x7c3aed), 150));
      T.label(S.scene, 'small molecule', '#2e7d32', 1).position.set(-3.4, 3.4, 0); T.label(S.scene, 'protein', '#7c3aed', 1).position.set(3.4, 3.4, 0);
      st.m4 = new THREE.Matrix4();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, kB = 1.38e-23, D = function (r) { return kB * p.T / (6 * PI * p.eta * 1e-3 * r * 1e-9); }, Da = D(0.14), Db = D(p.rb), ref = D(0.14) / (p.T / 310) * p.eta;
      var vr = 0.05 + p.rb * 0.035;
      [[st.a, st.ma, Da, -3.4, 1], [st.b, st.mb, Db, 3.4, vr]].forEach(function (g) {
        var sig = Math.sqrt(2 * (g[2] / ref) * 7 * dt) * 0.55;
        g[0].forEach(function (q, i) {
          for (var j = 0; j < 3; j++) { q[j] += (Math.random() * 2 - 1) * sig * 1.7; if (Math.abs(q[j]) > 2.7) q[j] = Math.sign(q[j]) * (5.4 - Math.abs(q[j])); }
          if (g[4] === 1) st.m4.makeTranslation(g[3] + q[0], q[1], q[2]); else st.m4.makeScale(g[4], g[4], g[4]).setPosition(g[3] + q[0], q[1], q[2]);
          g[1].setMatrixAt(i, st.m4);
        });
        g[1].instanceMatrix.needsUpdate = true;
      });
      S.set('Da', f(Da, 3) + ' m²/s'); S.set('Db', f(Db, 3) + ' m²/s'); S.set('ratio', f(Da / Db, 3));
    }
  });

  /* ================= SOUND ================= */

  /* Block of air carrying a sound wave */
  var media = [['Air', 343, 1.4], ['Water', 1480, 2.6], ['Soft tissue', 1540, 2.7], ['Bone', 4000, 4.2]];
  Sim.make('sim-sound3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.55, ph: 1.15, r: 14, target: [0.5, 0, 0] },
    controls: [
      { k: 'f', label: 'Frequency f', min: 0.3, max: 2, step: 0.05, v: 0.8, show: function (v) { return f(v, 3) + ' kHz'; } },
      { k: 'A', label: 'Loudness (amplitude)', min: 0, max: 0.3, step: 0.02, v: 0.16 }
    ],
    buttons: media.map(function (m, i) { return { label: m[0], group: 'm', on: i === 0, click: function (S) { S.st.m = i; } }; }),
    reads: [{ k: 'v', label: 'Speed of sound v' }, { k: 'lam', label: 'Wavelength &lambda; = v/f', big: true }, { k: 'T', label: 'Period T = 1/f' }],
    init: function (S) {
      var st = S.st, NX = 40, NY = 6, NZ = 6; st.m = 0; st.NX = NX; st.NY = NY; st.NZ = NZ;
      st.mesh = add(S, new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), NX * NY * NZ));
      st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
      st.cone = add(S, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.1, 0.5, 32, 1, true), T.mat(0x444444, { side: THREE.DoubleSide }))); st.cone.rotation.z = -PI / 2;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 2.4), T.mat(0x2d3a32))).position.x = -5.6;
      T.label(S.scene, 'speaker', '#56655b', 0.9).position.set(-5.6, 1.7, 0);
      st.ph = 0;
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, md = media[st.m], vd = md[2], lam = vd / p.f, k = 2 * PI / lam, i = 0;
      st.ph += 2 * PI * p.f * dt;
      st.cone.position.x = -4.95 + p.A * Math.sin(-st.ph);
      for (var a = 0; a < st.NX; a++) {
        var xr = a * 0.26, ph = k * xr - st.ph, disp = p.A * Math.sin(ph), comp = p.A > 0 ? -Math.cos(ph) : 0;
        st.col.setHSL(comp > 0 ? 0.0 : 0.58, 0.75, 0.55 - 0.18 * Math.abs(comp));
        for (var b = 0; b < st.NY; b++) for (var d = 0; d < st.NZ; d++) { st.m4.makeTranslation(-5 + xr + disp, (b - 2.5) * 0.4, (d - 2.5) * 0.4); st.mesh.setMatrixAt(i, st.m4); st.mesh.setColorAt(i, st.col); i++; }
      }
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      var lr = md[1] / (p.f * 1000);
      S.set('v', md[1] + ' m/s'); S.set('lam', lr >= 1 ? f(lr, 3) + ' m' : f(lr * 100, 3) + ' cm'); S.set('T', f(1 / p.f, 3) + ' ms');
      S.msg('Shown hugely slowed down. The wave speed is set by the medium; the frequency is set by the source.');
    }
  });

  /* Vibrating eardrum / drum membrane: normal modes */
  function besselJ(m, x) { var s = 0, t = Math.pow(x / 2, m); for (var k = 1; k <= m; k++) t /= k; for (var j = 0; j < 30; j++) { s += t; t *= -(x * x / 4) / ((j + 1) * (j + 1 + m)); } return s; }
  var modes = [['(0,1) basic', 0, 2.405], ['(1,1)', 1, 3.832], ['(2,1)', 2, 5.136], ['(0,2)', 0, 5.520], ['(1,2)', 1, 7.016]];
  Sim.make('sim-drum3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 0.95, r: 11 },
    controls: [
      { k: 'T', label: 'Membrane tension', min: 0.2, max: 3, step: 0.1, v: 1, show: function (v) { return f(v, 3) + ' ×'; } },
      { k: 'a', label: 'Membrane radius', min: 3, max: 6, step: 0.25, v: 4.5, unit: 'mm' },
      { k: 'A', label: 'Amplitude (loudness)', min: 0.1, max: 1, step: 0.05, v: 0.6 }
    ],
    buttons: modes.map(function (m, i) { return { label: 'Mode ' + m[0], group: 'md', on: i === 0, click: function (S) { S.st.md = i; } }; }),
    reads: [{ k: 'f', label: 'Frequency of this mode', big: true }, { k: 'ratio', label: 'Compared with the basic mode' }],
    init: function (S) {
      var st = S.st; st.md = 0; st.ph = 0;
      var geo, rings = 28, segs = 72, pos = [], idx = [];
      for (var r = 0; r <= rings; r++) for (var sgm = 0; sgm <= segs; sgm++) { var rr = 4 * r / rings, aa = 2 * PI * sgm / segs; pos.push(rr * Math.cos(aa), 0, rr * Math.sin(aa)); }
      for (r = 0; r < rings; r++) for (sgm = 0; sgm < segs; sgm++) { var i0 = r * (segs + 1) + sgm, i1 = i0 + segs + 1; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
      geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
      st.geo = geo; st.base = pos.slice(); st.rings = rings; st.segs = segs;
      add(S, new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
      var rim = new THREE.Mesh(new THREE.TorusGeometry(4, 0.12, 12, 80), T.mat(0x8a6a4f)); rim.rotation.x = PI / 2; add(S, rim);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, md = modes[st.md], fr = md[2] / modes[0][2] * 1000 * Math.sqrt(p.T) * (4.5 / p.a);
      st.ph += dt * 2 * PI * 0.6 * md[2] / 2.405 * Math.sqrt(p.T) * (4.5 / p.a);
      var ps = st.geo.attributes.position, cl = st.geo.attributes.color, amp = p.A * Math.cos(st.ph);
      for (var i = 0; i < ps.count; i++) {
        var x = st.base[i * 3], z = st.base[i * 3 + 2], r = Math.hypot(x, z) / 4, th = Math.atan2(z, x);
        var y = amp * besselJ(md[1], md[2] * r) * Math.cos(md[1] * th) * (md[1] ? 1.6 : 1);
        ps.setY(i, y); var s = clamp(0.5 + y, 0, 1); cl.setXYZ(i, 0.2 + 0.75 * s, 0.4 + 0.45 * s, 0.75 - 0.35 * s);
      }
      ps.needsUpdate = true; cl.needsUpdate = true;
      S.set('f', f(fr, 3) + ' Hz (example)'); S.set('ratio', f(md[2] / 2.405, 3) + ' × (not a whole number)');
    }
  });

  /* Spherical waves: inverse-square law */
  Sim.make('sim-soundsphere3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.6, ph: 1.05, r: 22, target: [2, 0, 0] },
    controls: [
      { k: 'P', label: 'Source power', min: -4, max: 0, step: 0.1, v: -2, map: function (x) { return Math.pow(10, x); }, show: function (v) { return f(v * 1000, 3) + ' mW'; } },
      { k: 'r', label: 'Listener distance r', min: 1, max: 10, step: 0.5, v: 3, unit: 'm' },
      { k: 'fq', label: 'Frequency (wavefront spacing)', min: 0.5, max: 3, step: 0.1, v: 1, show: function (v) { return f(v, 3) + ' kHz'; } }
    ],
    reads: [{ k: 'I', label: 'I = P / 4&pi;r&sup2;' }, { k: 'dB', label: 'Sound level &beta;', big: true }, { k: 'safe', label: 'Hearing' }],
    init: function (S) {
      var st = S.st; st.shells = []; st.ph = 0;
      for (var i = 0; i < 12; i++) st.shells.push(add(S, new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshPhongMaterial({ color: 0x2f80c0, transparent: true, opacity: 0.15, depthWrite: false }))));
      add(S, T.sphere(0.4, 0xc62828));
      st.ear = add(S, T.sphere(0.35, 0x2d6a3e)); st.lab = T.label(S.scene, 'listener', '#2d6a3e', 1);
      st.line = T.line(S.scene, 0x56655b, 2);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, sc = 0.8, Rmax = 6.5, sp = 1.6 / p.fq;
      st.ph += dt * 1.5;
      st.shells.forEach(function (m, i) { var n = Math.ceil(Rmax / sp); m.visible = i < n; var r = ((st.ph + i * sp) % (n * sp)) + 0.3; m.scale.setScalar(r); m.material.opacity = (0.22 + p.P * 0.3) * Math.pow(0.3 / r, 0.7) + 0.02; });
      st.ear.position.set(p.r * sc, 0, 0); st.lab.position.set(p.r * sc, 0.8, 0); T.setLine(st.line, [[0, 0, 0], [p.r * sc, 0, 0]]);
      var I = p.P / (4 * PI * p.r * p.r), dB = 10 * Math.log10(I / 1e-12);
      S.set('I', f(I, 3) + ' W/m²'); S.set('dB', f(dB, 3) + ' dB'); S.set('safe', dB > 85 ? 'too loud for long exposure' : dB > 40 ? 'clearly heard' : 'quiet');
    }
  });

  /* Ultrasound B-mode scan */
  function ellHit(ox, oy, dx, dy, cx, cy, a, b) {
    var px = ox - cx, py = oy - cy, A = dx * dx / (a * a) + dy * dy / (b * b), B = 2 * (px * dx / (a * a) + py * dy / (b * b)), Cq = px * px / (a * a) + py * py / (b * b) - 1, disc = B * B - 4 * A * Cq;
    if (disc < 0) return null; var s = Math.sqrt(disc); return [(-B - s) / (2 * A), (-B + s) / (2 * A)];
  }
  Sim.make('sim-ultrasound3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.35, ph: 1.2, r: 16, target: [2.5, 0, 0] },
    controls: [
      { k: 'd', label: 'Depth of the kidney', min: 3, max: 12, step: 0.5, v: 6, unit: 'cm' },
      { k: 'fq', label: 'Probe frequency', min: 2, max: 12, step: 0.5, v: 3.5, unit: 'MHz' },
      { k: 'sz', label: 'Kidney size', min: 0.6, max: 1.4, step: 0.05, v: 1, show: function (v) { return '×' + v.toFixed(2); } }
    ],
    buttons: [{ label: 'Gel on', group: 'g', on: true, click: function (S) { S.st.gel = true; } }, { label: 'Gel off', group: 'g', click: function (S) { S.st.gel = false; } }],
    reads: [{ k: 't', label: 'Echo time from top of kidney', big: true }, { k: 'loss', label: 'Round-trip loss to it' }, { k: 'res', label: 'Detail (&lambda;/2)' }],
    init: function (S) {
      var st = S.st; st.gel = true; st.line = 0; st.acc = 0;
      add(S, new THREE.Mesh(new THREE.BoxGeometry(8, 6, 4), T.mat(0xe8b89a, { opacity: 0.22 }))).position.y = -1;
      st.organ = add(S, T.sphere(1, 0x8e3b46, { opacity: 0.75 }));
      add(S, new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), T.mat(0x2d3a32))).position.y = 2.3;
      st.fan = []; for (var i = 0; i < 32; i++) st.fan.push(T.line(S.scene, 0x7fb3e6, 2));
      st.cv = document.createElement('canvas'); st.cv.width = 128; st.cv.height = 128; st.cx = st.cv.getContext('2d'); st.cx.fillStyle = '#000'; st.cx.fillRect(0, 0, 128, 128);
      st.tex = new THREE.CanvasTexture(st.cv);
      var scr = add(S, new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), new THREE.MeshBasicMaterial({ map: st.tex }))); scr.position.set(7, 0, 0); scr.rotation.y = -0.35;
      T.label(S.scene, 'scanner screen', '#56655b', 1).position.set(7, 2.7, 0);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, apex = [0, 2, 0], du = 6 / 14, a = 1.5 * p.sz, b = 0.8 * p.sz, cy = 2 - p.d * du - b;
      st.organ.position.set(0.3, cy, 0); st.organ.scale.set(a, b, 1.1 * p.sz);
      st.acc += dt; var step = st.acc > 0.03; if (step) { st.acc = 0; st.line = (st.line + 1) % 32; }
      for (var i = 0; i < 32; i++) {
        var an = (-30 + 60 * i / 31) * PI / 180, dx = Math.sin(an), dy = -Math.cos(an), L = 6 / Math.cos(an);
        T.setLine(st.fan[i], [apex, [apex[0] + dx * L, apex[1] + dy * L, 0]]);
        st.fan[i].material.color.set(i === st.line ? (st.gel ? 0xffd54f : 0x666666) : 0x7fb3e6);
      }
      var lossTo = function (depthCm) { return 0.5 * p.fq * 2 * depthCm; }, gain = function (depthCm) { return Math.pow(10, -lossTo(depthCm) / 20 / 3); };
      if (step) {
        var j = st.line, a2 = (-30 + 60 * j / 31) * PI / 180, ddx = Math.sin(a2), ddy = -Math.cos(a2), x = 4 + j * 120 / 31, cx = st.cx, thick = 1 + 6 / p.fq;
        cx.fillStyle = '#000'; cx.fillRect(x - 2, 0, 5, 128);
        if (st.gel) {
          for (var k = 0; k < 40; k++) { var yy = 6 + Math.random() * 120, dcm = (yy - 4) / 124 * 14, g = (20 + Math.random() * 40) * gain(dcm); cx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'; cx.fillRect(x - 1, yy, 3, 2); }
          var hit = ellHit(apex[0], apex[1], ddx, ddy, 0.3, cy, a, b);
          if (hit) [0, 1].forEach(function (n) { var py = 4 + hit[n] / 6.4 * 124, dcm = hit[n] / du, br = Math.round(255 * clamp(gain(dcm) * 1.6, 0, 1) * (n ? 0.75 : 1)); cx.fillStyle = 'rgb(' + br + ',' + br + ',' + br + ')'; cx.fillRect(x - 2, py - thick / 2, 5, thick); });
          cx.fillStyle = '#ddd'; cx.fillRect(x - 2, 2, 5, 2);
        } else { cx.fillStyle = '#fff'; cx.fillRect(x - 2, 2, 5, 4); }
        st.tex.needsUpdate = true;
      }
      S.set('t', f(2 * p.d / 100 / 1540 * 1e6, 3) + ' µs'); S.set('loss', f(lossTo(p.d), 3) + ' dB'); S.set('res', f(1540 / (p.fq * 1e6) / 2 * 1000, 3) + ' mm');
      S.msg(!st.gel ? 'No gel: the air gap reflects 99.9% of the sound at the skin.' : lossTo(p.d) > 60 ? 'Too deep for this frequency: the echo is lost. Lower the frequency.' : '');
    }
  });
})();
