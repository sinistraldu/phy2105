/* PHY1201 Unit 8: thermodynamics simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp, R = 8.314;
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }

  /* ---------- 2D: P-V process explorer ---------- */
  var procs = ['Isothermal', 'Adiabatic', 'Isobaric', 'Isochoric'];
  Sim.make('sim-process', {
    aspect: 0.55,
    controls: [
      { k: 'x', label: 'Final volume V<sub>2</sub> (or final T for isochoric)', min: 3, max: 30, step: 0.5, v: 20, show: function (v) { return f(v, 3) + ' L / ' + f(v * 30, 3) + ' K'; } },
      { k: 'g', label: '&gamma; = C<sub>P</sub>/C<sub>V</sub>', min: 1.1, max: 1.67, step: 0.01, v: 1.4 }
    ],
    buttons: procs.map(function (n, i) { return { label: n, group: 'p', on: i === 0, click: function (S) { S.st.p = i; } }; }),
    reads: [{ k: 'W', label: 'Work by gas W', big: true }, { k: 'Q', label: 'Heat in Q' }, { k: 'U', label: '&Delta;U = nC<sub>V</sub>&Delta;T' }, { k: 'chk', label: 'Check Q = &Delta;U + W' }],
    init: function (S) { S.st.p = 0; },
    draw: function (S, c, W, H) {
      var K = C(), pr = S.st.p, g = S.p.g, Cv = R / (g - 1), V1 = 10, T1 = 300, P1 = R * T1 / (V1 * 1e-3), pts = [], V2, T2, Wk, Q;
      var PofV;
      if (pr === 0) { V2 = S.p.x; PofV = function (V) { return R * T1 / (V * 1e-3); }; T2 = T1; Wk = R * T1 * Math.log(V2 / V1); }
      else if (pr === 1) { V2 = S.p.x; PofV = function (V) { return P1 * Math.pow(V1 / V, g); }; T2 = T1 * Math.pow(V1 / V2, g - 1); Wk = Cv * (T1 - T2); }
      else if (pr === 2) { V2 = S.p.x; PofV = function () { return P1; }; T2 = T1 * V2 / V1; Wk = P1 * (V2 - V1) * 1e-3; }
      else { V2 = V1; T2 = S.p.x * 30; PofV = null; Wk = 0; }
      var dU = Cv * (T2 - T1); Q = dU + Wk;
      D.clear(c, W, H);
      var box = { x: W * 0.1, y: H * 0.06, w: W * 0.86, h: H * 0.8 }, Pmax = 700;
      var iso = function (Tt) { var a = []; for (var V = 2; V <= 30; V += 0.25) a.push([V, R * Tt / (V * 1e-3) / 1000]); return a; };
      var gp = D.graph(c, box, { x0: 0, x1: 30, y0: 0, y1: Pmax, xl: 'V (L) →', yl: 'P (kPa)' }, [{ pts: iso(150), color: K.grid, w: 1 }, { pts: iso(300), color: K.grid, w: 1 }, { pts: iso(600), color: K.grid, w: 1 }]);
      if (PofV) {
        var a = Math.min(V1, V2), b = Math.max(V1, V2);
        for (var V = a; V <= b + 1e-9; V += (b - a) / 120 || 1) pts.push([V, PofV(V) / 1000]);
        var poly = pts.map(function (q) { return [gp.px(q[0]), gp.py(Math.min(q[1], Pmax))]; }); poly.push([gp.px(b), gp.py(0)]); poly.push([gp.px(a), gp.py(0)]);
        D.poly(c, poly, null, 0, true, Wk >= 0 ? 'rgba(67,56,202,0.18)' : 'rgba(194,65,12,0.2)');
        D.poly(c, pts.map(function (q) { return [gp.px(q[0]), gp.py(Math.min(q[1], Pmax))]; }), K.c1, 3);
      } else { D.line(c, gp.px(V1), gp.py(P1 / 1000), gp.px(V1), gp.py(Math.min(R * T2 / (V1 * 1e-3) / 1000, Pmax)), K.c1, 3); }
      var P2 = PofV ? PofV(V2) : R * T2 / (V1 * 1e-3);
      D.circle(c, gp.px(V1), gp.py(P1 / 1000), 6, K.c3); D.text(c, '1', gp.px(V1) + 8, gp.py(P1 / 1000) - 10, { weight: 700 });
      D.circle(c, gp.px(V2), gp.py(Math.min(P2 / 1000, Pmax)), 6, K.c2); D.text(c, '2', gp.px(V2) + 8, gp.py(Math.min(P2 / 1000, Pmax)) - 10, { weight: 700 });
      [0, 10, 20, 30].forEach(function (u) { D.text(c, String(u), gp.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      D.text(c, '1 mol, start 10 L at 300 K  ·  grey: isotherms 150, 300, 600 K', box.x + 6, box.y + 14, { size: 11, color: K.muted });
      S.set('W', f(Wk, 3) + ' J'); S.set('Q', f(Q, 3) + ' J'); S.set('U', f(dU, 3) + ' J (T₂ = ' + f(T2, 3) + ' K)'); S.set('chk', f(dU, 3) + ' + ' + f(Wk, 3) + ' = ' + f(Q, 3) + ' J ✓');
    }
  });

  /* ---------- 3D: piston and processes ---------- */
  Sim.make('sim-piston3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.5, ph: 1.2, r: 13, target: [0, 1.5, 0] },
    controls: [{ k: 'g', label: '&gamma;', min: 1.1, max: 1.67, step: 0.01, v: 1.4 }],
    buttons: ['Isothermal expansion', 'Adiabatic expansion', 'Isobaric heating', 'Isochoric heating'].map(function (n, i) { return { label: n, group: 'p', on: i === 0, click: function (S) { S.st.p = i; S.st.s = 0; S.st.run = false; } }; })
      .concat([{ label: 'Run', click: function (S) { S.st.s = 0; S.st.run = true; } }]),
    reads: [{ k: 'V', label: 'V, T' }, { k: 'P', label: 'Pressure' }, { k: 'W', label: 'Work by gas so far' }, { k: 'Q', label: 'Heat in so far', big: true }],
    init: function (S) {
      var st = S.st; st.p = 0; st.s = 0; st.run = false; st.mol = [];
      var cylm = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 7, 40, 1, true), T.mat(0x9aa0b8, { opacity: 0.18, side: THREE.DoubleSide })); cylm.position.y = 2.5; S.scene.add(cylm);
      var base = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.3, 40), T.mat(0x59606a)); base.position.y = -1.15; S.scene.add(base);
      st.pist = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.3, 40), T.mat(0xb4441f)); S.scene.add(st.pist);
      st.rod = T.cyl(0.12, 0x59606a); S.scene.add(st.rod);
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff }), 80); S.scene.add(st.mesh);
      for (var i = 0; i < 80; i++) { st.mol.push({ p: new THREE.Vector3((Math.random() - 0.5) * 2.4, Math.random() * 2, (Math.random() - 0.5) * 2.4), v: new THREE.Vector3(gauss(), gauss(), gauss()) }); st.mesh.setColorAt(i, new THREE.Color(0xb4441f)); }
      st.heat = []; for (var h = 0; h < 4; h++) st.heat.push(T.arrow(S.scene, '#2f5d78')); st.m4 = new THREE.Matrix4(); st.col = new THREE.Color();
    },
    draw: function (S, c, W, H, dt) {
      var st = S.st, g = S.p.g, Cv = R / (g - 1), Cp = Cv + R;
      if (st.run) { st.s = Math.min(1, st.s + dt * 0.25); if (st.s >= 1) st.run = false; }
      var s = st.s, V = 1, Tt = 300, Wk = 0, Q = 0, dQ = 0;
      if (st.p === 0) { V = 1 + s; Tt = 300; Wk = R * 300 * Math.log(V); Q = Wk; dQ = 1; }
      if (st.p === 1) { V = 1 + s; Tt = 300 * Math.pow(V, 1 - g); Wk = Cv * (300 - Tt); Q = 0; dQ = 0; }
      if (st.p === 2) { V = 1 + s; Tt = 300 * V; Wk = R * 300 * (V - 1); Q = Cp * (Tt - 300); dQ = 1.5; }
      if (st.p === 3) { V = 1; Tt = 300 * (1 + s); Q = Cv * (Tt - 300); dQ = 1; }
      var h = 2 + 2.5 * (V - 1); st.pist.position.y = -1 + h; st.rod.scale.y = 4; st.rod.position.y = -1 + h + 2.1;
      var sp = Math.sqrt(Tt / 300) * 1.4;
      for (var i = 0; i < 80; i++) {
        var o = st.mol[i]; o.p.addScaledVector(o.v, dt * sp * (st.run ? 1 : 0.6));
        var rr = Math.hypot(o.p.x, o.p.z); if (rr > 1.85) { var nx = o.p.x / rr, nz = o.p.z / rr, vn = o.v.x * nx + o.v.z * nz; o.v.x -= 2 * vn * nx; o.v.z -= 2 * vn * nz; o.p.x *= 1.84 / rr; o.p.z *= 1.84 / rr; }
        if (o.p.y < -0.9) { o.p.y = -0.9; o.v.y = Math.abs(o.v.y); } if (o.p.y > h - 1.2) { o.p.y = h - 1.2; o.v.y = -Math.abs(o.v.y); }
        st.m4.makeTranslation(o.p.x, o.p.y, o.p.z); st.mesh.setMatrixAt(i, st.m4); st.mesh.setColorAt(i, st.col.setHSL(0.66 - 0.66 * clamp((Tt - 150) / 500, 0, 1), 0.8, 0.5));
      }
      st.mesh.instanceMatrix.needsUpdate = true; if (st.mesh.instanceColor) st.mesh.instanceColor.needsUpdate = true;
      st.heat.forEach(function (a, j) { var ang = j * PI / 2 + 0.4; T.setArrow(a, [2.9 * Math.cos(ang), -1.9, 2.9 * Math.sin(ang)], [-0.8 * Math.cos(ang), 0.8, -0.8 * Math.sin(ang)], 0.25); a.visible = st.run && dQ > 0; });
      S.set('V', f(V, 3) + ' L, ' + f(Tt, 3) + ' K'); S.set('P', f(R * Tt / (V * 1e-3) / 1000, 3) + ' kPa'); S.set('W', f(Wk, 3) + ' J'); S.set('Q', f(Q, 3) + ' J');
      S.msg(st.run ? '' : 'Press Run (1 mol, starting at 1 L and 300 K).');
    }
  });

  /* ---------- 2D: engine cycles ---------- */
  function cycleData(m, p) {
    var g = p.g, Cv = R / (g - 1), segs = [], Qin = 0, Wnet = 0, eta;
    var adi = function (V1, T1, V2) { return T1 * Math.pow(V1 / V2, g - 1); };
    var seg = function (type, Va, Ta, Vb, Tb) { var a = []; for (var i = 0; i <= 60; i++) { var u = i / 60, V = Va + (Vb - Va) * u, Tt; if (type === 'iso') Tt = Ta; else if (type === 'adi') Tt = adi(Va, Ta, V); else if (type === 'isoV') { V = Va; Tt = Ta + (Tb - Ta) * u; } else Tt = Ta * V / Va; a.push([V, R * Tt / (V * 1e-3) / 1000]); } return a; };
    if (m === 0) {
      var TH = p.TH, TC = Math.min(p.TC, TH - 10), V1 = 1, V2 = V1 * p.r, k = Math.pow(TH / TC, 1 / (g - 1)), V3 = V2 * k, V4 = V1 * k;
      segs = [seg('iso', V1, TH, V2), seg('adi', V2, TH, V3), seg('iso', V3, TC, V4), seg('adi', V4, TC, V1)];
      Qin = R * TH * Math.log(V2 / V1); Wnet = R * (TH - TC) * Math.log(V2 / V1); eta = 1 - TC / TH;
    } else if (m === 1) {
      var r = p.r * 3, Va = 1, Vb = Va / r, T1 = 300, T2 = T1 * Math.pow(r, g - 1), T3 = T2 + 1200, T4 = T3 / Math.pow(r, g - 1);
      segs = [seg('adi', Va, T1, Vb), seg('isoV', Vb, T2, Vb, T3), seg('adi', Vb, T3, Va), seg('isoV', Va, T4, Va, T1)];
      Qin = Cv * (T3 - T2); Wnet = Qin - Cv * (T4 - T1); eta = 1 - 1 / Math.pow(r, g - 1);
    } else {
      var rr = p.r * 4, rho = p.rho, Vx = 1, Vy = Vx / rr, Tx = 300, Ty = Tx * Math.pow(rr, g - 1), Vz = rho * Vy, Tz = Ty * rho, Tw = Tz * Math.pow(Vz / Vx, g - 1);
      segs = [seg('adi', Vx, Tx, Vy), seg('isoP', Vy, Ty, Vz), seg('adi', Vz, Tz, Vx), seg('isoV', Vx, Tw, Vx, Tx)];
      Qin = (Cv + R) * (Tz - Ty); Wnet = Qin - Cv * (Tw - Tx); eta = 1 - (1 / g) * Math.pow(rr, 1 - g) * (Math.pow(rho, g) - 1) / (rho - 1);
    }
    return { segs: segs, Qin: Qin, W: Wnet, eta: eta };
  }
  Sim.make('sim-cycle', {
    aspect: 0.55, animate: true,
    controls: [
      { k: 'TH', label: 'Hot reservoir T<sub>H</sub> (Carnot)', min: 400, max: 1200, step: 10, v: 600, unit: 'K' },
      { k: 'TC', label: 'Cold reservoir T<sub>C</sub> (Carnot)', min: 200, max: 500, step: 10, v: 300, unit: 'K' },
      { k: 'r', label: 'Ratio r (Carnot: isothermal V₂/V₁; Otto: &times;3; Diesel: &times;4)', min: 1.5, max: 6, step: 0.1, v: 2.5 },
      { k: 'rho', label: 'Cut-off ratio &rho; (Diesel)', min: 1.2, max: 4, step: 0.1, v: 2 },
      { k: 'g', label: '&gamma;', min: 1.2, max: 1.67, step: 0.01, v: 1.4 }
    ],
    buttons: ['Carnot', 'Otto', 'Diesel'].map(function (n, i) { return { label: n, group: 'c', on: i === 0, click: function (S) { S.st.m = i; } }; }),
    reads: [{ k: 'eta', label: 'Efficiency (formula)', big: true }, { k: 'num', label: 'Efficiency W/Q<sub>in</sub> (numerical)' }, { k: 'W', label: 'Net work per cycle (1 mol)' }, { k: 'cmp', label: 'Ratio used' }],
    init: function (S) { S.st.m = 0; S.st.u = 0; },
    draw: function (S, c, W, H, dt) {
      var K = C(), d = cycleData(S.st.m, S.p), all = [].concat.apply([], d.segs), Vmax = 0, Pmax = 0;
      all.forEach(function (q) { Vmax = Math.max(Vmax, q[0]); Pmax = Math.max(Pmax, q[1]); });
      S.st.u = (S.st.u + dt * 0.18) % 1;
      D.clear(c, W, H);
      var box = { x: W * 0.1, y: H * 0.06, w: W * 0.86, h: H * 0.8 };
      var gp = D.graph(c, box, { x0: 0, x1: Vmax * 1.1, y0: 0, y1: Pmax * 1.1, xl: 'V (L) →', yl: 'P (kPa)' }, []);
      D.poly(c, all.map(function (q) { return [gp.px(q[0]), gp.py(q[1])]; }), null, 0, true, 'rgba(67,56,202,0.16)');
      var cols = [K.c2, K.c1, K.c3, K.c4];
      d.segs.forEach(function (sg, i) { D.poly(c, sg.map(function (q) { return [gp.px(q[0]), gp.py(q[1])]; }), cols[i], 3); var mid = sg[30]; D.text(c, String(i + 1) + '→' + ((i + 1) % 4 + 1), gp.px(mid[0]) + 8, gp.py(mid[1]) - 8, { size: 11, weight: 700, color: cols[i] }); });
      var idx = Math.floor(S.st.u * all.length), pt = all[Math.min(idx, all.length - 1)]; D.circle(c, gp.px(pt[0]), gp.py(pt[1]), 7, K.ink);
      D.text(c, 'shaded area = net work', box.x + box.w - 6, box.y + 14, { align: 'right', size: 11, color: K.muted });
      S.set('eta', f(d.eta * 100, 3) + '%'); S.set('num', f(d.W / d.Qin * 100, 3) + '%'); S.set('W', f(d.W, 3) + ' J');
      S.set('cmp', S.st.m === 0 ? '1 − Tᶜ/Tᴴ' : S.st.m === 1 ? 'r = ' + f(S.p.r * 3, 3) : 'r = ' + f(S.p.r * 4, 3) + ', ρ = ' + S.p.rho);
    }
  });

  /* ---------- 2D: refrigerator / heat pump ---------- */
  Sim.make('sim-fridge', {
    aspect: 0.48,
    controls: [
      { k: 'Tc', label: 'Inside (cold) temperature', min: -30, max: 20, step: 1, v: 4, unit: '°C' },
      { k: 'Th', label: 'Outside (hot) temperature', min: 15, max: 50, step: 1, v: 30, unit: '°C' },
      { k: 'W', label: 'Work input (compressor power)', min: 50, max: 500, step: 10, v: 100, unit: 'W' }
    ],
    reads: [{ k: 'cop', label: 'Carnot COP T<sub>C</sub>/(T<sub>H</sub>&minus;T<sub>C</sub>)', big: true }, { k: 'Qc', label: 'Heat removed from inside Q<sub>C</sub>' }, { k: 'Qh', label: 'Heat dumped outside Q<sub>H</sub> = Q<sub>C</sub> + W' }, { k: 'hp', label: 'As a heat pump: COP' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, Tc = p.Tc + 273.15, Th = Math.max(p.Th, p.Tc + 1) + 273.15, cop = Tc / (Th - Tc), Qc = cop * p.W, Qh = Qc + p.W;
      D.clear(c, W, H);
      var cx = W * 0.4, top = H * 0.08, bot = H * 0.92, bw = W * 0.5;
      D.rect(c, cx - bw / 2, top, bw, H * 0.16, 'rgba(198,40,40,0.18)', K.pos, 8, 1.5); D.text(c, 'Outside (hot) ' + f(Th - 273.15, 3) + ' °C', cx, top + H * 0.08, { align: 'center', weight: 700, color: K.pos });
      D.rect(c, cx - bw / 2, bot - H * 0.16, bw, H * 0.16, 'rgba(29,78,216,0.16)', K.neg, 8, 1.5); D.text(c, 'Inside (cold) ' + f(Tc - 273.15, 3) + ' °C', cx, bot - H * 0.08, { align: 'center', weight: 700, color: K.neg });
      D.circle(c, cx, H * 0.5, 34, K.surface, K.ink, 2); D.text(c, 'fridge', cx, H * 0.5, { align: 'center', size: 12, weight: 600 });
      var sc = 0.02, wq = function (q) { return clamp(3 + q * sc, 3, 40); };
      D.arrow(c, cx, bot - H * 0.16, cx, H * 0.5 + 36, K.neg, wq(Qc)); D.arrow(c, cx, H * 0.5 - 36, cx, top + H * 0.16, K.pos, wq(Qh));
      D.arrow(c, W * 0.9, H * 0.5, cx + 38, H * 0.5, K.c5, wq(p.W)); D.text(c, 'W = ' + p.W + ' W', W * 0.9, H * 0.5 - 22, { align: 'right', size: 12, weight: 700, color: K.c5 });
      D.text(c, 'Qᶜ = ' + f(Qc, 3) + ' W', cx + 30, H * 0.7, { size: 12, color: K.neg, weight: 700 }); D.text(c, 'Qᴴ = ' + f(Qh, 3) + ' W', cx + 30, H * 0.3, { size: 12, color: K.pos, weight: 700 });
      S.set('cop', f(cop, 3)); S.set('Qc', f(Qc, 3) + ' W'); S.set('Qh', f(Qh, 3) + ' W'); S.set('hp', f(Th / (Th - Tc), 3));
    }
  });

  /* ---------- 2D: entropy of mixing hot and cold ---------- */
  Sim.make('sim-mix', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'T1', label: 'Hot body T<sub>1</sub>', min: 20, max: 100, step: 1, v: 80, unit: '°C' },
      { k: 'T2', label: 'Cold body T<sub>2</sub>', min: 0, max: 80, step: 1, v: 20, unit: '°C' },
      { k: 'm1', label: 'Mass of hot water', min: 0.2, max: 3, step: 0.1, v: 1, unit: 'kg' },
      { k: 'm2', label: 'Mass of cold water', min: 0.2, max: 3, step: 0.1, v: 1, unit: 'kg' }
    ],
    buttons: [{ label: 'Let heat flow', click: function (S) { S.st.t = 0; S.st.go = true; S.st.tr = []; } }],
    reads: [{ k: 'Tf', label: 'Final temperature' }, { k: 's1', label: '&Delta;S hot body' }, { k: 's2', label: '&Delta;S cold body' }, { k: 'st', label: '&Delta;S total', big: true }],
    init: function (S) { S.st.t = 0; S.st.go = false; S.st.tr = []; },
    onChange: function (S) { S.st.go = false; S.st.t = 0; S.st.tr = []; },
    draw: function (S, c, W, H, dt) {
      var K = C(), p = S.p, c4 = 4186, A = p.T1 + 273.15, B = p.T2 + 273.15, Tf = (p.m1 * A + p.m2 * B) / (p.m1 + p.m2);
      if (S.st.go) S.st.t = Math.min(1, S.st.t + dt * 0.3);
      var e = 1 - Math.exp(-4 * S.st.t), Ta = A + (Tf - A) * e, Tb = B + (Tf - B) * e;
      var s1 = p.m1 * c4 * Math.log(Ta / A), s2 = p.m2 * c4 * Math.log(Tb / B);
      if (S.st.go) S.st.tr.push([S.st.t, s1, s2, s1 + s2]);
      D.clear(c, W, H);
      var col = function (t) { var u = clamp((t - 273) / 100, 0, 1); return 'rgb(' + Math.round(60 + 190 * u) + ',' + Math.round(90 + 20 * u) + ',' + Math.round(220 - 180 * u) + ')'; };
      D.rect(c, W * 0.05, H * 0.2, W * 0.13, H * 0.5, col(Ta), K.ink, 8, 1.5); D.rect(c, W * 0.2, H * 0.2, W * 0.13, H * 0.5, col(Tb), K.ink, 8, 1.5);
      D.text(c, f(Ta - 273.15, 3) + ' °C', W * 0.115, H * 0.78, { align: 'center', size: 12, weight: 700 }); D.text(c, f(Tb - 273.15, 3) + ' °C', W * 0.265, H * 0.78, { align: 'center', size: 12, weight: 700 });
      if (S.st.go && S.st.t < 1) D.arrow(c, W * 0.15, H * 0.45, W * 0.23, H * 0.45, K.c2, 3);
      var box = { x: W * 0.42, y: H * 0.08, w: W * 0.54, h: H * 0.78 }, ext = Math.max(50, Math.abs(p.m1 * c4 * Math.log(Tf / A)), Math.abs(p.m2 * c4 * Math.log(Tf / B))) * 1.15;
      D.graph(c, box, { x0: 0, x1: 1, y0: -ext, y1: ext, xl: 'time →', yl: 'ΔS (J/K)' }, [{ pts: S.st.tr.map(function (q) { return [q[0], q[1]]; }), color: K.pos, w: 2.5 }, { pts: S.st.tr.map(function (q) { return [q[0], q[2]]; }), color: K.neg, w: 2.5 }, { pts: S.st.tr.map(function (q) { return [q[0], q[3]]; }), color: K.c3, w: 3.5 }]);
      D.text(c, 'red: hot  ·  blue: cold  ·  green: total', box.x + 6, box.y + box.h - 12, { size: 11, color: K.muted });
      S.set('Tf', f(Tf - 273.15, 3) + ' °C'); S.set('s1', f(s1, 3) + ' J/K'); S.set('s2', f(s2, 3) + ' J/K'); S.set('st', f(s1 + s2, 3) + ' J/K' + (S.st.go ? '' : ' (press Let heat flow)'));
    }
  });

  /* ---------- 3D: free expansion ---------- */
  function resetFree(S) { var st = S.st, N = Math.round(S.p.N); st.mol = []; for (var i = 0; i < N; i++) st.mol.push({ p: new THREE.Vector3(-0.2 - Math.random() * 3.6, (Math.random() - 0.5) * 3.6, (Math.random() - 0.5) * 3.6), v: new THREE.Vector3(gauss(), gauss(), gauss()) }); st.open = false; st.mesh.count = N; }
  Sim.make('sim-freeexp3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.5, ph: 1.15, r: 13 },
    controls: [{ k: 'N', label: 'Number of molecules N', min: 10, max: 300, step: 10, v: 120 }],
    buttons: [{ label: 'Remove the partition', click: function (S) { S.st.open = true; } }, { label: 'Reset', click: resetFree }],
    reads: [{ k: 'lr', label: 'Left : right' }, { k: 'ds', label: 'Entropy gained Nk ln(V<sub>occupied</sub>/V<sub>0</sub>)' }, { k: 'pr', label: 'Chance all return to the left (1/2)<sup>N</sup>', big: true }],
    init: function (S) {
      var st = S.st;
      S.scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 4, 4)), new THREE.LineBasicMaterial({ color: 0x59606a })));
      st.wall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 4), T.mat(0xb4441f, { opacity: 0.5 })); S.scene.add(st.wall);
      st.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), T.mat(0x2f5d78), 300); S.scene.add(st.mesh); st.m4 = new THREE.Matrix4();
      resetFree(S);
    },
    onChange: resetFree,
    draw: function (S, c, W, H, dt) {
      var st = S.st, left = 0, xmax = 0;
      st.wall.visible = !st.open;
      st.mol.forEach(function (o, i) {
        o.p.addScaledVector(o.v, dt * 1.5);
        var lo = -4, hi = st.open ? 4 : 0;
        if (o.p.x < lo) { o.p.x = 2 * lo - o.p.x; o.v.x = Math.abs(o.v.x); } if (o.p.x > hi) { o.p.x = 2 * hi - o.p.x; o.v.x = -Math.abs(o.v.x); }
        ['y', 'z'].forEach(function (a) { if (o.p[a] > 2) { o.p[a] = 4 - o.p[a]; o.v[a] = -Math.abs(o.v[a]); } if (o.p[a] < -2) { o.p[a] = -4 - o.p[a]; o.v[a] = Math.abs(o.v[a]); } });
        if (o.p.x < 0) left++; xmax = Math.max(xmax, o.p.x);
        st.m4.makeTranslation(o.p.x, o.p.y, o.p.z); st.mesh.setMatrixAt(i, st.m4);
      });
      st.mesh.instanceMatrix.needsUpdate = true;
      var N = st.mol.length, right = N - left, frac = clamp((xmax + 4) / 4, 1, 2);
      S.set('lr', left + ' : ' + right); S.set('ds', f(N * Math.log(frac), 3) + ' k (max N ln 2 = ' + f(N * Math.LN2, 3) + ' k)'); S.set('pr', f(Math.pow(0.5, N), 3));
    }
  });

  /* ---------- 2D: Clausius-Clapeyron ---------- */
  Sim.make('sim-clapeyron', {
    aspect: 0.5,
    controls: [
      { k: 'P', label: 'Pressure', min: 0.1, max: 5, step: 0.01, v: 1, unit: 'atm' },
      { k: 'L', label: 'Molar latent heat L<sub>m</sub>', min: 20, max: 60, step: 0.5, v: 40.7, unit: 'kJ/mol' }
    ],
    reads: [{ k: 'Tb', label: 'Boiling point', big: true }, { k: 'sl', label: 'Slope dP/dT = L<sub>m</sub>P/RT&sup2;' }, { k: 'pl', label: 'Like' }],
    draw: function (S, c, W, H) {
      var K = C(), Lm = S.p.L * 1000, Tb = function (P) { return 1 / (1 / 373.15 - R * Math.log(P) / Lm); }, pts = [];
      for (var P = 0.1; P <= 5.0001; P += 0.02) pts.push([Tb(P) - 273.15, P]);
      D.clear(c, W, H);
      var box = { x: W * 0.1, y: H * 0.06, w: W * 0.86, h: H * 0.8 }, T0 = Tb(0.1) - 273.15 - 5, T1 = Tb(5) - 273.15 + 5;
      var gp = D.graph(c, box, { x0: T0, x1: T1, y0: 0, y1: 5.2, xl: 'boiling point (°C) →', yl: 'pressure (atm)', dots: [{ x: Tb(S.p.P) - 273.15, y: S.p.P, color: K.c2, r: 7 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      [['Everest', 0.33], ['sea level', 1], ['pressure cooker', 2]].forEach(function (q) { var x = Tb(q[1]) - 273.15; D.circle(c, gp.px(x), gp.py(q[1]), 4, K.muted); D.text(c, q[0], gp.px(x) + 8, gp.py(q[1]) + 12, { size: 11, color: K.muted }); });
      [T0, (T0 + T1) / 2, T1].forEach(function (u) { D.text(c, f(u, 3), gp.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      var Tk = Tb(S.p.P), sl = Lm * S.p.P * 101325 / (R * Tk * Tk);
      S.set('Tb', f(Tk - 273.15, 3) + ' °C'); S.set('sl', f(sl, 3) + ' Pa/K'); S.set('pl', S.p.P < 0.5 ? 'high mountain' : S.p.P < 1.3 ? 'near sea level' : 'pressure cooker / boiler');
    }
  });

  /* ---------- 3D: P-V-T surface ---------- */
  Sim.make('sim-pvt3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.75, ph: 1.0, r: 17, target: [0, 1.5, 0] },
    controls: [
      { k: 'V', label: 'Volume V', min: 1.5, max: 10, step: 0.1, v: 4, unit: 'L' },
      { k: 'T', label: 'Temperature T', min: 200, max: 800, step: 10, v: 400, unit: 'K' },
      { k: 'g', label: '&gamma; (for the adiabat)', min: 1.1, max: 1.67, step: 0.01, v: 1.4 }
    ],
    buttons: [{ k: 'iso', label: 'Isotherm', click: function (S, b) { S.st.sh.iso = !S.st.sh.iso; b.classList.toggle('on', S.st.sh.iso); } }, { k: 'bar', label: 'Isobar', click: function (S, b) { S.st.sh.bar = !S.st.sh.bar; b.classList.toggle('on', S.st.sh.bar); } }, { k: 'adi', label: 'Adiabat', click: function (S, b) { S.st.sh.adi = !S.st.sh.adi; b.classList.toggle('on', S.st.sh.adi); } }],
    reads: [{ k: 'P', label: 'P = nRT/V (1 mol)', big: true }],
    init: function (S) {
      var st = S.st; st.sh = { iso: true, bar: true, adi: true }; ['iso', 'bar', 'adi'].forEach(function (k) { S.btn(k).classList.add('on'); });
      var X = function (V) { return (V - 1) / 9 * 8 - 4; }, Z = function (Tt) { return (Tt - 200) / 600 * 8 - 4; }, Yp = function (P) { return Math.min(P / 1e6 * 0.8, 6); };
      st.X = X; st.Z = Z; st.Y = Yp;
      var geo = new THREE.PlaneGeometry(8, 8, 60, 60); geo.rotateX(-PI / 2); var ps = geo.attributes.position, cols = new Float32Array(ps.count * 3), col = new THREE.Color();
      for (var i = 0; i < ps.count; i++) { var V = (ps.getX(i) + 4) / 8 * 9 + 1, Tt = (ps.getZ(i) + 4) / 8 * 600 + 200, P = R * Tt / (V * 1e-3); ps.setY(i, Yp(P)); col.setHSL(0.66 - 0.6 * (Tt - 200) / 600, 0.6, 0.62); cols.set([col.r, col.g, col.b], i * 3); }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
      S.scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })));
      S.scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0x59606a, transparent: true, opacity: 0.12 })));
      T.label(S.scene, 'V →', '#59606a', 1).position.set(4.6, 0, 4.6); T.label(S.scene, 'T →', '#59606a', 1).position.set(-4.8, 0, 4.2); T.label(S.scene, 'P', '#59606a', 1).position.set(-4.4, 5.8, -4.4);
      st.pt = T.sphere(0.18, 0x2f5d78); S.scene.add(st.pt);
      st.li = T.line(S.scene, 0xc62828, 120); st.lb = T.line(S.scene, 0x15803d, 120); st.la = T.line(S.scene, 0x1d4ed8, 120);
    },
    draw: function (S) {
      var st = S.st, p = S.p, P0 = R * p.T / (p.V * 1e-3), iso = [], bar = [], adi = [];
      st.pt.position.set(st.X(p.V), st.Y(P0) + 0.1, st.Z(p.T));
      for (var i = 0; i < 120; i++) {
        var V = 1 + 9 * i / 119;
        iso.push([st.X(V), st.Y(R * p.T / (V * 1e-3)) + 0.05, st.Z(p.T)]);
        var Tb = P0 * V * 1e-3 / R; if (Tb >= 200 && Tb <= 800) bar.push([st.X(V), st.Y(P0) + 0.05, st.Z(Tb)]);
        var Ta = p.T * Math.pow(p.V / V, p.g - 1); if (Ta >= 200 && Ta <= 800) adi.push([st.X(V), st.Y(R * Ta / (V * 1e-3)) + 0.05, st.Z(Ta)]);
      }
      T.setLine(st.li, iso); T.setLine(st.lb, bar); T.setLine(st.la, adi);
      st.li.visible = st.sh.iso; st.lb.visible = st.sh.bar && bar.length > 1; st.la.visible = st.sh.adi && adi.length > 1;
      S.set('P', f(P0 / 1000, 3) + ' kPa');
      S.msg('Red: isotherm  ·  green: isobar  ·  blue: adiabat. Colour of the surface shows T.');
    }
  });
  /* ---------- 2D: van der Waals isotherms ---------- */
  var vg = [['CO₂', 0.364, 4.27e-5], ['N₂', 0.137, 3.87e-5], ['H₂O', 0.554, 3.05e-5]];
  Sim.make('sim-vdw', {
    aspect: 0.55,
    controls: [
      { k: 't', label: 'Temperature (&times; T<sub>c</sub>)', min: 0.8, max: 1.8, step: 0.01, v: 1 },
      { k: 'am', label: 'Attraction a (&times; real value)', min: 0, max: 2, step: 0.05, v: 1 },
      { k: 'bm', label: 'Molecular volume b (&times; real value)', min: 0, max: 2, step: 0.05, v: 1 }
    ],
    buttons: vg.map(function (g, i) { return { label: g[0], group: 'g', on: i === 0, click: function (S) { S.st.g = i; } }; }),
    reads: [{ k: 'Tc', label: 'T<sub>c</sub> = 8a/27Rb' }, { k: 'Pc', label: 'P<sub>c</sub> = a/27b&sup2;' }, { k: 'T', label: 'Isotherm temperature', big: true }, { k: 'st', label: 'Behaviour' }],
    init: function (S) { S.st.g = 0; },
    draw: function (S, c, W, H) {
      var K = C(), g = vg[S.st.g], a0 = g[1], b0 = g[2], Tc = 8 * a0 / (27 * R * b0), Pc = a0 / (27 * b0 * b0), Tm = S.p.t * Tc, a = a0 * S.p.am, b = b0 * S.p.bm;
      var P = function (V) { return R * Tm / (V - b) - a / (V * V); }, Pid = function (V) { return R * Tm / V; };
      var V0 = 1.3 * b0, V1 = 14 * b0, pv = [], pi = [];
      for (var i = 0; i <= 300; i++) { var V = V0 + (V1 - V0) * i / 300; if (V > b * 1.02) pv.push([V * 1e6, clamp(P(V) / Pc, -1, 3)]); pi.push([V * 1e6, clamp(Pid(V) / Pc, -1, 3)]); }
      D.clear(c, W, H);
      var box = { x: W * 0.1, y: H * 0.06, w: W * 0.86, h: H * 0.8 };
      var gg = D.graph(c, box, { x0: V0 * 1e6, x1: V1 * 1e6, y0: -0.5, y1: 3, xl: 'molar volume V (cm³/mol) →', yl: 'P / Pᶜ', hlines: [{ y: 1, label: 'P = Pᶜ', color: K.faint }], dots: [{ x: 3 * b0 * 1e6, y: 1, color: K.c2, r: 5 }] }, [{ pts: pi, color: K.faint, w: 1.8, dash: [5, 4] }, { pts: pv, color: K.c1, w: 3 }]);
      [V0, (V0 + V1) / 2, V1].forEach(function (u) { D.text(c, f(u * 1e6, 3), gg.px(u * 1e6), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      D.text(c, 'dashed: ideal gas  ·  solid: van der Waals  ·  dot: critical point', box.x + 6, box.y + box.h - 26, { size: 11, color: K.muted });
      S.set('Tc', f(Tc, 3) + ' K'); S.set('Pc', f(Pc / 1e6, 3) + ' MPa'); S.set('T', f(Tm, 3) + ' K');
      S.set('st', S.p.t > 1.02 ? 'gas only (above Tᶜ)' : S.p.t > 0.98 ? 'critical: flat inflection' : 'below Tᶜ: liquid–gas region (wiggle)');
    }
  });

})();
