/* PHY1201 Unit 7: temperature and kinetic theory simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp, kB = 1.381e-23, R = 8.314;
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }

  /* ---------- 2D: temperature scales ---------- */
  Sim.make('sim-scales', {
    aspect: 0.5,
    controls: [{ k: 'C', label: 'Temperature', min: -273.15, max: 500, step: 0.05, v: 37, show: function (v) { return f(v, 4) + ' °C'; } }],
    reads: [{ k: 'c', label: 'Celsius' }, { k: 'f', label: 'Fahrenheit 9C/5 + 32', big: true }, { k: 'k', label: 'Kelvin C + 273.15' }, { k: 'r', label: 'Rankine F + 459.67' }],
    draw: function (S, c, W, H) {
      var K = C(), t = S.p.C, F = t * 9 / 5 + 32, Kv = t + 273.15, Rk = F + 459.67, vals = [t, F, Kv, Rk], names = ['°C', '°F', 'K', '°R'], lo = [-273.15, -459.67, 0, 0], hi = [500, 932, 773.15, 1391.67];
      D.clear(c, W, H);
      var top = H * 0.1, bot = H * 0.86, frac = (t + 273.15) / 773.15;
      for (var i = 0; i < 4; i++) {
        var x = W * (0.1 + i * 0.13);
        D.rect(c, x - 9, top, 18, bot - top, K.surface, K.ink, 9, 1.5); D.circle(c, x, bot + 8, 14, K.pos);
        D.rect(c, x - 5, top + (bot - top) * (1 - frac), 10, (bot - top) * frac + 4, K.pos, null, 4);
        D.text(c, names[i], x, top - 12, { align: 'center', weight: 700 }); D.text(c, f(vals[i], 4), x, bot + 30, { align: 'center', size: 12, color: K.c1, weight: 600 });
        [0, 0.5, 1].forEach(function (u) { var y = top + (bot - top) * (1 - u); D.line(c, x + 10, y, x + 16, y, K.muted, 1); D.text(c, f(lo[i] + u * (hi[i] - lo[i]), 3), x + 18, y, { size: 9.5, color: K.faint }); });
      }
      var box = { x: W * 0.62, y: H * 0.1, w: W * 0.34, h: H * 0.7 }, pts = [];
      for (var cc = -100; cc <= 200; cc += 5) pts.push([cc, cc * 9 / 5 + 32]);
      var g = D.graph(c, box, { x0: -100, x1: 200, y0: -150, y1: 400, xl: '°C →', yl: '°F', dots: [{ x: clamp(t, -100, 200), y: clamp(F, -150, 400), color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c1, w: 2.5 }, { pts: [[-100, -100], [200, 200]], color: K.faint, w: 1.2 }]);
      D.text(c, 'grey: F = C line, crosses at −40', box.x + 4, box.y + box.h + 14, { size: 10.5, color: K.muted });
      S.set('c', f(t, 4) + ' °C'); S.set('f', f(F, 4) + ' °F'); S.set('k', f(Kv, 4) + ' K'); S.set('r', f(Rk, 4) + ' °R');
    }
  });

  /* ---------- 2D: three thermometers ---------- */
  Sim.make('sim-thermo', {
    aspect: 0.5,
    controls: [
      { k: 'T', label: 'Temperature of the hot body', min: 0, max: 1500, step: 5, v: 300, unit: '°C' },
      { k: 'a', label: 'Thermocouple a', min: 10, max: 60, step: 1, v: 40, unit: 'µV/°C' },
      { k: 'b', label: 'Thermocouple b', min: -0.2, max: -0.02, step: 0.005, v: -0.08, unit: 'µV/°C²' }
    ],
    buttons: [{ label: 'Pt resistance', group: 't', on: true, click: function (S) { S.st.m = 0; } }, { label: 'Thermocouple', group: 't', click: function (S) { S.st.m = 1; } }, { label: 'Radiation pyrometer', group: 't', click: function (S) { S.st.m = 2; } }],
    reads: [{ k: 'r', label: 'Reading', big: true }, { k: 'x', label: 'Notes' }],
    init: function (S) { S.st.m = 0; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, m = S.st.m, fn, ylab, ymax, xmax = 1500, pts = [];
      if (m === 0) { fn = function (t) { return 100 * (1 + 3.908e-3 * t - 5.775e-7 * t * t); }; ylab = 'R (Ω)'; ymax = 450; }
      else if (m === 1) { fn = function (t) { return (p.a * t + 0.5 * p.b * t * t) / 1000; }; ylab = 'EMF (mV)'; ymax = Math.max(5, -p.a * p.a / (2 * p.b) / 1000 * 1.2); }
      else { fn = function (t) { return 5.67e-8 * Math.pow(t + 273.15, 4) / 1000; }; ylab = 'radiated P/A (kW/m²)'; ymax = 5.67e-8 * Math.pow(1773, 4) / 1000; }
      D.clear(c, W, H);
      for (var t = 0; t <= xmax; t += 10) pts.push([t, fn(t)]);
      var box = { x: W * 0.36, y: H * 0.08, w: W * 0.6, h: H * 0.78 }, vl = [];
      if (m === 1) { var Tn = -p.a / p.b; vl = [{ x: Tn, label: 'Tₙ', color: K.c2 }, { x: 2 * Tn, label: 'Tᵢ', color: K.c4 }]; }
      var g = D.graph(c, box, { x0: 0, x1: xmax, y0: m === 1 ? -ymax * 0.3 : 0, y1: ymax, xl: 'T (°C) →', yl: ylab, vlines: vl, dots: [{ x: p.T, y: fn(p.T), color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [0, 500, 1000, 1500].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      // picture of the hot body
      var glow = clamp((p.T - 450) / 1000, 0, 1), cx = W * 0.16, cy = H * 0.5;
      D.circle(c, cx, cy, 46, 'rgb(' + Math.round(120 + 135 * glow) + ',' + Math.round(110 + 100 * glow * glow) + ',' + Math.round(100 + 60 * Math.pow(glow, 3)) + ')', K.ink, 1.5);
      if (m === 0) { for (var i = 0; i < 6; i++) D.line(c, cx - 20, cy - 25 + i * 10, cx + 20, cy - 20 + i * 10, K.ink, 1.5); D.text(c, 'Pt coil', cx, cy + 62, { align: 'center', size: 12 }); }
      if (m === 1) { D.line(c, cx, cy, cx - 50, cy + 70, K.c2, 3); D.line(c, cx, cy, cx + 50, cy + 70, K.c1, 3); D.circle(c, cx, cy, 5, K.ink); D.text(c, 'hot junction', cx, cy - 60, { align: 'center', size: 12 }); }
      if (m === 2) { for (var j = 0; j < 5; j++) D.arrow(c, cx + 50, cy - 20 + j * 10, cx + 95, cy - 30 + j * 15, 'rgba(194,65,12,' + (0.2 + 0.8 * glow) + ')', 2, 7); D.text(c, 'radiation to detector', cx, cy + 62, { align: 'center', size: 12 }); }
      if (m === 0) { S.set('r', f(fn(p.T), 4) + ' Ω'); S.set('x', 'R₀ = 100 Ω at 0 °C'); }
      if (m === 1) { S.set('r', f(fn(p.T), 3) + ' mV'); S.set('x', 'Tₙ = ' + f(-p.a / p.b, 3) + ' °C, Tᵢ = ' + f(-2 * p.a / p.b, 3) + ' °C'); }
      if (m === 2) { S.set('r', f(fn(p.T), 3) + ' kW/m²'); S.set('x', 'λ_max = ' + f(2.898e-3 / (p.T + 273.15) * 1e6, 3) + ' µm'); }
    }
  });

  /* ---------- 3D: gas in a box ---------- */
  Sim.make('sim-gasbox3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.15, r: 15 },
    controls: [
      { k: 'T', label: 'Temperature T', min: 100, max: 1000, step: 10, v: 300, unit: 'K' },
      { k: 'N', label: 'Number of molecules (&times;10<sup>19</sup>)', min: 20, max: 300, step: 10, v: 120 },
      { k: 'L', label: 'Volume (move the piston)', min: 3, max: 9, step: 0.25, v: 6, show: function (v) { return f(v * 16, 3) + ' cm\u00B3'; } }
    ],
    reads: [{ k: 'Pm', label: 'Pressure measured from wall hits', big: true }, { k: 'Pt', label: 'Theory P = NkT/V' }, { k: 'c', label: 'c<sub>rms</sub> (N&#8322;)' }],
    init: function (S) {
      var st = S.st, M = 300; st.mol = []; st.imp = 0; st.tt = 0; st.Pm = 0;
      for (var i = 0; i < M; i++) st.mol.push({ p: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3.8, (Math.random() - 0.5) * 3.8), v: new THREE.Vector3(gauss(), gauss(), gauss()) });
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), M); S.scene.add(st.mesh);
      st.box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 4, 4)), new THREE.LineBasicMaterial({ color: 0x59606a })); S.scene.add(st.box);
      st.pist = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 4), T.mat(0x9aa0b8, { opacity: 0.7 })); S.scene.add(st.pist);
      st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
      for (var j = 0; j < M; j++) st.mesh.setColorAt(j, st.col.setHSL(0.6, 0.7, 0.5));
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, L = p.L, hx = L / 2, sig = 0.9 * Math.sqrt(p.T / 300), N = p.N, imp = 0;
      st.box.scale.set(L, 1, 1); st.pist.position.x = hx + 0.1;
      st.mesh.count = N;
      for (var i = 0; i < N; i++) {
        var o = st.mol[i], sp = o.v.length(); o.v.multiplyScalar(1 + ((sig * 1.6) / (sp + 1e-6) - 1) * 0.02 * (Math.random())); // gently relax to the new temperature
        o.p.addScaledVector(o.v, dt * 2);
        if (o.p.x > hx) { o.p.x = 2 * hx - o.p.x; o.v.x = -Math.abs(o.v.x); imp += 2 * Math.abs(o.v.x); } if (o.p.x < -hx) { o.p.x = -2 * hx - o.p.x; o.v.x = Math.abs(o.v.x); imp += 2 * Math.abs(o.v.x); }
        if (o.p.y > 2) { o.p.y = 4 - o.p.y; o.v.y = -Math.abs(o.v.y); imp += 2 * Math.abs(o.v.y); } if (o.p.y < -2) { o.p.y = -4 - o.p.y; o.v.y = Math.abs(o.v.y); imp += 2 * Math.abs(o.v.y); }
        if (o.p.z > 2) { o.p.z = 4 - o.p.z; o.v.z = -Math.abs(o.v.z); imp += 2 * Math.abs(o.v.z); } if (o.p.z < -2) { o.p.z = -4 - o.p.z; o.v.z = Math.abs(o.v.z); imp += 2 * Math.abs(o.v.z); }
        st.m4.makeTranslation(o.p.x, o.p.y, o.p.z); st.mesh.setMatrixAt(i, st.m4);
        st.mesh.setColorAt(i, st.col.setHSL(0.66 - 0.66 * clamp(o.v.length() / (sig * 3.2), 0, 1), 0.8, 0.5));
      }
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      if (dt > 0) { st.imp += imp; st.tt += dt * 2; if (st.tt > 1.5) { st.Pm = st.imp / st.tt / (2 * (L * 4) * 2 + 2 * 16); st.imp = 0; st.tt = 0; } }
      var V = L * 16 * 1e-6, Pth = N * 1e19 * kB * p.T / V, Pdisp = N * sig * sig / (L * 16); // theory in display units: N sigma^2 / V
      var ratio = st.Pm > 0 ? st.Pm / Pdisp : 1;
      S.set('Pm', f(Pth * ratio / 1000, 3) + ' kPa'); S.set('Pt', f(Pth / 1000, 3) + ' kPa'); S.set('c', f(Math.sqrt(3 * R * p.T / 0.028), 3) + ' m/s');
      S.msg('Colour shows speed (blue slow, red fast). Measured pressure is averaged over the last moments, so it jitters around the theory.');
    }
  });

  /* ---------- 2D: Maxwell distribution ---------- */
  var gases = [['H₂', 2], ['He', 4], ['N₂', 28], ['O₂', 32], ['CO₂', 44]];
  Sim.make('sim-maxwell', {
    aspect: 0.5,
    controls: [{ k: 'T', label: 'Temperature T', min: 50, max: 2000, step: 10, v: 300, unit: 'K' }],
    buttons: gases.map(function (g, i) { return { label: g[0], group: 'g', on: i === 2, click: function (S) { S.st.g = i; } }; }),
    reads: [{ k: 'vp', label: 'Most probable v<sub>p</sub>' }, { k: 'va', label: 'Average v&#772;' }, { k: 'vr', label: 'v<sub>rms</sub>', big: true }],
    init: function (S) { S.st.g = 2; },
    draw: function (S, c, W, H) {
      var K = C(), Tm = S.p.T, M = gases[S.st.g][1] / 1000, m = M / 6.022e23, a = m / (2 * kB * Tm), vmax = 4000;
      var fv = function (v) { return 4 * PI * Math.pow(a / PI, 1.5) * v * v * Math.exp(-a * v * v); };
      var vp = Math.sqrt(2 * kB * Tm / m), va = Math.sqrt(8 * kB * Tm / (PI * m)), vr = Math.sqrt(3 * kB * Tm / m), pts = [];
      for (var v = 0; v <= vmax; v += 10) pts.push([v, fv(v)]);
      var ref = 4 * PI * Math.pow(m / (2 * kB * 300 * PI), 1.5) * Math.pow(Math.sqrt(2 * kB * 300 / m), 2) * Math.exp(-1);
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.08, w: W * 0.88, h: H * 0.78 };
      var g = D.graph(c, box, { x0: 0, x1: vmax, y0: 0, y1: Math.max(fv(vp), ref) * 1.1, xl: 'speed v (m/s) →', yl: 'f(v)', vlines: [{ x: vp, label: 'vₚ', color: K.c3 }, { x: va, label: 'v̄', color: K.c5 }, { x: vr, label: 'v_rms', color: K.c2 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [0, 1000, 2000, 3000, 4000].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      S.set('vp', f(vp, 3) + ' m/s'); S.set('va', f(va, 3) + ' m/s'); S.set('vr', f(vr, 3) + ' m/s');
    }
  });

  /* ---------- 3D: degrees of freedom ---------- */
  Sim.make('sim-dof3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.6, ph: 1.15, r: 10 },
    controls: [{ k: 'T', label: 'Temperature T', min: 50, max: 1500, step: 10, v: 300, unit: 'K' }],
    buttons: [{ label: 'Monatomic (He)', group: 'm', on: true, click: function (S) { S.st.m = 0; S.st.build(); } }, { label: 'Diatomic (N₂)', group: 'm', click: function (S) { S.st.m = 1; S.st.build(); } }, { label: 'Polyatomic (H₂O)', group: 'm', click: function (S) { S.st.m = 2; S.st.build(); } },
      { k: 'vib', label: 'Vibration on (hot)', click: function (S, b) { S.st.vib = !S.st.vib; b.classList.toggle('on', S.st.vib); } }],
    reads: [{ k: 'f', label: 'Degrees of freedom f', big: true }, { k: 'list', label: 'Made of' }, { k: 'U', label: 'Energy per molecule (f/2)kT' }, { k: 'g', label: 'C<sub>V</sub>, &gamma;' }],
    init: function (S) {
      var st = S.st; st.m = 0; st.vib = false; st.t = 0; st.g = new THREE.Group(); S.scene.add(st.g);
      T.grid(S.scene, 10, -2.5);
      st.build = function () {
        while (st.g.children.length) st.g.remove(st.g.children[0]);
        st.atoms = [];
        var add = function (r, col, pos) { var a = T.sphere(r, col); a.position.set(pos[0], pos[1], pos[2]); st.g.add(a); st.atoms.push({ a: a, p: pos }); };
        if (st.m === 0) add(0.6, 0x9333ea, [0, 0, 0]);
        if (st.m === 1) { add(0.5, 0x1d4ed8, [-0.8, 0, 0]); add(0.5, 0x1d4ed8, [0.8, 0, 0]); st.bond = T.cyl(0.08, 0x9aa0b8); st.bond.rotation.z = PI / 2; st.g.add(st.bond); }
        if (st.m === 2) { add(0.6, 0xc62828, [0, 0.2, 0]); add(0.38, 0xe8e4dd, [-0.8, -0.45, 0]); add(0.38, 0xe8e4dd, [0.8, -0.45, 0]); }
      };
      st.build();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, sp = Math.sqrt(S.p.T / 300); st.t += dt * sp;
      st.g.position.set(1.5 * Math.sin(st.t * 0.9), 0.6 * Math.sin(st.t * 1.3), 1.2 * Math.cos(st.t * 0.7));
      if (st.m >= 1) { st.g.rotation.y = st.t * 1.4; st.g.rotation.z = st.m === 2 ? st.t * 0.8 : Math.sin(st.t * 0.6) * 0.8; if (st.m === 2) st.g.rotation.x = st.t * 0.5; }
      if (st.m === 1) { var s = st.vib ? 1 + 0.25 * Math.sin(st.t * 12) : 1; st.atoms[0].a.position.x = -0.8 * s; st.atoms[1].a.position.x = 0.8 * s; st.bond.scale.y = 1.6 * s; }
      if (st.m === 2 && st.vib) { var s2 = 1 + 0.18 * Math.sin(st.t * 12); st.atoms[1].a.position.set(-0.8 * s2, -0.45 * s2, 0); st.atoms[2].a.position.set(0.8 * s2, -0.45 * s2, 0); }
      var tr = 3, rot = st.m === 0 ? 0 : st.m === 1 ? 2 : 3, vib = st.vib && st.m > 0 ? (st.m === 1 ? 2 : 6) : 0, fd = tr + rot + vib;
      S.set('f', String(fd)); S.set('list', tr + ' translation + ' + rot + ' rotation' + (vib ? ' + ' + vib + ' vibration' : ''));
      S.set('U', f(fd / 2 * kB * S.p.T, 3) + ' J'); S.set('g', f(fd / 2 * R, 3) + ' J/mol·K, ' + f(1 + 2 / fd, 3));
    }
  });

  /* ---------- 3D: mean free path ---------- */
  function rebuildMfp(S) {
    var st = S.st, n = Math.round(S.p.n), L = 10; st.c = [];
    for (var i = 0; i < n; i++) st.c.push(new THREE.Vector3((Math.random() - 0.5) * L, (Math.random() - 0.5) * L, (Math.random() - 0.5) * L));
    st.mesh.count = n; var m4 = new THREE.Matrix4(), r = S.p.d / 2;
    st.c.forEach(function (q, i) { m4.makeScale(r, r, r).setPosition(q.x, q.y, q.z); st.mesh.setMatrixAt(i, m4); });
    st.mesh.instanceMatrix.needsUpdate = true;
    st.pos = new THREE.Vector3(0, 0, 0); st.dir = new THREE.Vector3(1, 0.3, 0.2).normalize(); st.run = 0; st.runs = []; st.trail = [[0, 0, 0]]; st.last = -1;
  }
  Sim.make('sim-mfp3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 1.15, r: 21 },
    controls: [
      { k: 'n', label: 'Number of molecules in the box', min: 50, max: 400, step: 10, v: 150 },
      { k: 'd', label: 'Molecular diameter d', min: 0.2, max: 0.8, step: 0.05, v: 0.45 }
    ],
    buttons: [{ label: 'Restart', click: rebuildMfp }],
    reads: [{ k: 'cnt', label: 'Collisions so far' }, { k: 'meas', label: 'Measured mean free path', big: true }, { k: 'th', label: 'Theory 1/(&pi;d&sup2;n)' }],
    init: function (S) {
      var st = S.st;
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), T.mat(0x9aa0b8, { opacity: 0.7 }), 400); S.scene.add(st.mesh);
      S.scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 10, 10)), new THREE.LineBasicMaterial({ color: 0x59606a })));
      st.me = T.sphere(0.2, 0x2f5d78); S.scene.add(st.me); st.tr = T.line(S.scene, 0x2f5d78, 400);
      rebuildMfp(S);
    },
    onChange: function (S) { rebuildMfp(S); },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, sp = 3, step = sp * dt / 4;
      for (var s = 0; s < 4; s++) {
        st.pos.addScaledVector(st.dir, step); st.run += step;
        ['x', 'y', 'z'].forEach(function (a) { if (st.pos[a] > 5) st.pos[a] -= 10; if (st.pos[a] < -5) st.pos[a] += 10; });
        for (var i = 0; i < st.c.length; i++) {
          if (i === st.last) continue;
          if (st.pos.distanceTo(st.c[i]) < p.d) { st.runs.push(st.run); st.run = 0; st.last = i; st.dir.set(gauss(), gauss(), gauss()).normalize(); st.trail.push([st.pos.x, st.pos.y, st.pos.z]); if (st.trail.length > 400) st.trail.shift(); break; }
        }
      }
      st.me.position.copy(st.pos); T.setLine(st.tr, st.trail.concat([[st.pos.x, st.pos.y, st.pos.z]]));
      var nden = p.n / 1000, th = 1 / (PI * p.d * p.d * nden), mean = st.runs.length ? st.runs.reduce(function (a, b) { return a + b; }, 0) / st.runs.length : 0;
      S.set('cnt', String(st.runs.length)); S.set('meas', st.runs.length ? f(mean, 3) + ' (units)' : '–'); S.set('th', f(th, 3) + ' (units)');
      S.msg('Here the other molecules stand still, so the formula has no √2. With all molecules moving, λ = 1/(√2πd²n).');
    }
  });


  /* ---------- 3D: Brownian motion ---------- */
  function resetBrown(S) { var st = S.st; st.pos = new THREE.Vector3(); st.track = [[0, 0, 0]]; st.t = 0; st.acc = 0; }
  Sim.make('sim-brownian3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.1, r: 21 },
    controls: [
      { k: 'T', label: 'Temperature T', min: 273, max: 373, step: 1, v: 300, unit: 'K' },
      { k: 'r', label: 'Grain radius r', min: 0.2, max: 2, step: 0.05, v: 0.5, unit: 'µm' },
      { k: 'eta', label: 'Viscosity &eta; (water = 1)', min: 0.3, max: 10, step: 0.1, v: 1, unit: 'mPa s' }
    ],
    buttons: [{ label: 'Clear track', click: resetBrown }],
    reads: [{ k: 'D', label: 'D = kT / 6&pi;&eta;r', big: true }, { k: 'msd', label: 'Measured r&sup2; now vs theory 6Dt' }, { k: 't', label: 'Time watched' }],
    init: function (S) {
      var st = S.st, m4 = new THREE.Matrix4();
      st.grain = T.sphere(1, 0xb7791f); S.scene.add(st.grain);
      st.tr = T.line(S.scene, 0xb4441f, 4000);
      st.mol = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), T.mat(0x2f5d78), 400); st.m4 = m4; st.mp = [];
      for (var i = 0; i < 400; i++) { st.mp.push(new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)); st.mol.setColorAt(i, new THREE.Color(0x2f5d78)); }
      S.scene.add(st.mol);
      var box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 11, 11)), new THREE.LineBasicMaterial({ color: 0xc9c2b6 })); S.scene.add(box);
      st.lb = T.label(S.scene, 'water molecules (not to scale)', '#2f5d78', 0.9); st.lb.position.set(0, -6.3, 0);
      resetBrown(S);
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p, D = kB * p.T / (6 * PI * p.eta * 1e-3 * p.r * 1e-6) * 1e12, tf = 8;
      st.grain.scale.setScalar(p.r);
      if (dt > 0) {
        var h = dt * tf; st.t += h; var s = Math.sqrt(2 * D * h);
        st.pos.x += s * gauss(); st.pos.y += s * gauss(); st.pos.z += s * gauss();
        ['x', 'y', 'z'].forEach(function (a) { if (Math.abs(st.pos[a]) > 5) st.pos[a] = Math.sign(st.pos[a]) * 10 - st.pos[a]; });
        st.acc += h; if (st.acc > 0.05) { st.acc = 0; st.track.push([st.pos.x, st.pos.y, st.pos.z]); if (st.track.length > 4000) st.track.shift(); }
      }
      st.grain.position.copy(st.pos); T.setLine(st.tr, st.track);
      for (var i = 0; i < 400; i++) { var q = st.mp[i]; q.x += gauss() * 0.15; q.y += gauss() * 0.15; q.z += gauss() * 0.15; var d = q.clone(); if (d.length() > 3.2) q.multiplyScalar(0.5); if (d.length() < p.r + 0.1) q.setLength(p.r + 0.15); st.m4.makeTranslation(st.pos.x + q.x, st.pos.y + q.y, st.pos.z + q.z); st.mol.setMatrixAt(i, st.m4); }
      st.mol.instanceMatrix.needsUpdate = true;
      var r2 = st.pos.lengthSq();
      S.set('D', f(D, 3) + ' µm²/s'); S.set('msd', f(r2, 3) + ' vs ' + f(6 * D * st.t, 3) + ' µm²'); S.set('t', f(st.t, 3) + ' s (8× speed)');
    }
  });
})();
