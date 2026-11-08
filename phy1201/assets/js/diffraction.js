/* PHY1201 Unit 5: diffraction of light simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  function wlRGB(nm) { var r = 0, g = 0, b = 0; if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1; return [r, g, b]; }
  function strip(c, x, y, w, h, nm, I) { var cc = wlRGB(nm); for (var i = 0; i < w; i++) { var v = clamp(I(i / w), 0, 1); c.fillStyle = 'rgb(' + Math.round(cc[0] * 255 * v) + ',' + Math.round(cc[1] * 255 * v) + ',' + Math.round(cc[2] * 255 * v) + ')'; c.fillRect(x + i, y, 1.2, h); } }
  function sinc(x) { return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x; }
  function J1(x) { var s = 0, n = Math.max(40, Math.ceil(Math.abs(x) * 3)); for (var i = 0; i < n; i++) { var t = (i + 0.5) / n * PI; s += Math.cos(t - x * Math.sin(t)); } return s / n; }
  var lamCtl = { k: 'lam', label: 'Wavelength &lambda;', min: 400, max: 700, step: 5, v: 589, unit: 'nm' };

  /* ---------- 2D: Fresnel diffraction at a straight edge ---------- */
  function fresnelCS(v) { var n = 2 * Math.ceil(Math.max(100, v * v * 4)), h = v / n, c = 0, s = 0; for (var i = 0; i <= n; i++) { var t = i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2); c += w * Math.cos(PI * t * t / 2); s += w * Math.sin(PI * t * t / 2); } return [c * h / 3, s * h / 3]; }
  Sim.make('sim-edge', {
    aspect: 0.45,
    controls: [{ k: 'b', label: 'Edge to screen distance b', min: 0.05, max: 3, step: 0.05, v: 1, unit: 'm' }, lamCtl],
    reads: [{ k: 'w', label: 'Width of the first bright band &asymp; &radic;(&lambda;b)', big: true }, { k: 'k', label: 'Type' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, lam = p.lam * 1e-9, sc = Math.sqrt(2 / (lam * p.b)), xm = 3e-3, pts = [], vals = [];
      for (var i = 0; i <= 300; i++) { var x = -xm + 2 * xm * i / 300, v = x * sc, cs = fresnelCS(v), I = 0.5 * (Math.pow(cs[0] + 0.5, 2) + Math.pow(cs[1] + 0.5, 2)); pts.push([x * 1000, I]); vals.push(I); }
      D.clear(c, W, H);
      strip(c, W * 0.05, H * 0.06, W * 0.9, H * 0.2, p.lam, function (u) { return vals[Math.round(u * 300)] / 1.4; });
      var g = D.graph(c, { x: W * 0.05, y: H * 0.32, w: W * 0.9, h: H * 0.6 }, { x0: -3, x1: 3, y0: 0, y1: 1.5, xl: 'position on screen (mm) →', yl: 'intensity (1 = no edge)', vlines: [{ x: 0, label: 'edge of geometric shadow', color: K.c2 }], hlines: [{ y: 1, color: K.faint }] }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      D.text(c, 'shadow', g.px(-1.5), g.py(0.2), { size: 12, align: 'center', color: K.muted, weight: 600 });
      S.set('w', f(Math.sqrt(lam * p.b) * 1000, 3) + ' mm'); S.set('k', 'Fresnel (source and screen at finite distance; light bends into the shadow, bands outside it)');
    }
  });

  /* ---------- 2D: single slit ---------- */
  Sim.make('sim-single', {
    aspect: 0.45,
    controls: [{ k: 'a', label: 'Slit width a', min: 0.02, max: 0.5, step: 0.005, v: 0.1, unit: 'mm' }, lamCtl, { k: 'D', label: 'Lens focal length / screen distance D', min: 0.5, max: 2, step: 0.1, v: 1, unit: 'm' }],
    reads: [{ k: 'w', label: 'Central maximum width 2&lambda;D/a', big: true }, { k: 'min', label: 'Minima at a sin&theta; = n&lambda;: first at &theta;' }, { k: 'sec', label: 'Secondary maxima (&alpha; = 1.43&pi;, 2.46&pi;)' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, a = p.a * 1e-3, lam = p.lam * 1e-9, Dd = p.D, w = 2 * lam * Dd / a, xm = 2.2 * w, pts = [], vl = [];
      var I = function (x) { var al = PI * a * x / (lam * Dd); return Math.pow(sinc(al), 2); };
      for (var i = 0; i <= 600; i++) { var x = -xm + 2 * xm * i / 600; pts.push([x * 1000, I(x)]); }
      for (var n = -3; n <= 3; n++) if (n) vl.push({ x: n * lam * Dd / a * 1000, color: K.faint });
      D.clear(c, W, H);
      strip(c, W * 0.05, H * 0.05, W * 0.9, H * 0.18, p.lam, function (u) { return Math.pow(I(-xm + 2 * xm * u), 0.45); });
      D.graph(c, { x: W * 0.05, y: H * 0.3, w: W * 0.9, h: H * 0.62 }, { x0: -xm * 1000, x1: xm * 1000, y0: 0, y1: 1.08, xl: 'position on screen (mm) →', yl: 'I/I₀ = (sin α / α)², α = πa sinθ/λ', vlines: vl }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      S.set('w', f(w * 1000, 3) + ' mm'); S.set('min', f(Math.asin(Math.min(1, lam / a)) * 180 / PI, 3) + '°'); S.set('sec', '4.7% and 1.6% of the central peak');
    }
  });

  /* ---------- 2D: double slit and N-slit grating ---------- */
  Sim.make('sim-nslit', {
    aspect: 0.45,
    controls: [
      { k: 'N', label: 'Number of slits N', min: 1, max: 12, step: 1, v: 2 },
      { k: 'r', label: 'Slit spacing / slit width (a+b)/a', min: 1.5, max: 8, step: 0.5, v: 4 },
      lamCtl
    ],
    reads: [{ k: 'pm', label: 'Principal maxima: (a+b) sin&theta; = n&lambda;' }, { k: 'sec', label: 'Between principal maxima' }, { k: 'miss', label: 'Missing orders', big: true }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, N = p.N, r = p.r, pts = [], env = [], um = 3.2;
      var I = function (u) { var al = PI * u, be = PI * u * r, sN = Math.abs(Math.sin(be)) < 1e-6 ? N : Math.sin(N * be) / Math.sin(be); return Math.pow(sinc(al), 2) * sN * sN / (N * N); };
      for (var i = 0; i <= 1500; i++) { var u = -um + 2 * um * i / 1500; pts.push([u, I(u)]); env.push([u, Math.pow(sinc(PI * u), 2)]); }
      D.clear(c, W, H);
      strip(c, W * 0.05, H * 0.05, W * 0.9, H * 0.16, p.lam, function (q) { return Math.pow(I(-um + 2 * um * q), 0.4); });
      D.graph(c, { x: W * 0.05, y: H * 0.27, w: W * 0.9, h: H * 0.65 }, { x0: -um, x1: um, y0: 0, y1: 1.08, xl: 'a sinθ / λ →', yl: 'intensity (dashed: single-slit envelope)' }, [{ pts: env, color: K.faint, w: 1.5 }, { pts: pts, color: K.c1, w: 2 }]);
      var miss = []; if (N > 1) for (var n = 1; n <= 8; n++) { var m = n * r; if (Math.abs(m - Math.round(m)) < 1e-6 && Math.round(m) <= 12) miss.push(Math.round(m)); }
      S.set('pm', N > 1 ? 'every ' + f(1 / r, 3) + ' on this axis; sharper as N grows' : 'single slit only');
      S.set('sec', N > 1 ? (N - 1) + ' minima and ' + (N - 2) + ' weak secondary maxima' : '—');
      S.set('miss', miss.length ? 'orders ' + miss.join(', ') + ' (fall on single-slit minima)' : 'none');
    }
  });

  /* ---------- 2D: diffraction grating, resolving and dispersive power ---------- */
  Sim.make('sim-grating', {
    aspect: 0.5,
    controls: [
      { k: 'lines', label: 'Lines per mm', min: 100, max: 1200, step: 50, v: 600 },
      { k: 'Nw', label: 'Illuminated lines N', min: 100, max: 3000, step: 50, v: 600 },
      { k: 'n', label: 'Order viewed in the zoom', min: 1, max: 3, step: 1, v: 1 }
    ],
    reads: [{ k: 'th', label: 'Angle of Na D lines in that order' }, { k: 'R', label: 'Resolving power nN (need &lambda;/d&lambda; = 982)', big: true }, { k: 'dp', label: 'Dispersive power d&theta;/d&lambda; = n/((a+b)cos&theta;)' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, dg = 1e-3 / p.lines, l1 = 589.0e-9, l2 = 589.6e-9, n = p.n, R = n * p.Nw;
      D.clear(c, W, H);
      var y0 = H * 0.28, x0 = W * 0.05, w = W * 0.9; D.line(c, x0, y0, x0 + w, y0, K.line, 1);
      for (var deg = -90; deg <= 90; deg += 30) { var xx = x0 + w * (deg + 90) / 180; D.line(c, xx, y0 - 4, xx, y0 + 4, K.faint, 1); D.text(c, deg + '°', xx, y0 + 16, { size: 10, align: 'center', color: K.faint }); }
      D.rect(c, x0 + w / 2 - 1.5, y0 - 34, 3, 34, K.ink, null, 0); D.text(c, 'white', x0 + w / 2, y0 - 42, { size: 10, align: 'center', color: K.muted });
      for (var L = 400; L <= 700; L += 4) for (var m = -4; m <= 4; m++) { if (!m) continue; var s = m * L * 1e-9 / dg; if (Math.abs(s) >= 1) continue; var th = Math.asin(s) * 180 / PI, cc = wlRGB(L); c.fillStyle = 'rgb(' + cc.map(function (v) { return Math.round(v * 255); }).join(',') + ')'; c.fillRect(x0 + w * (th + 90) / 180, y0 - (m === 0 ? 30 : 22), 1.5, m === 0 ? 30 : 22); }
      D.text(c, 'white-light spectra: order 0 (centre) and orders ±1, ±2, … ', x0, H * 0.05, { size: 11, color: K.muted });
      var s1 = n * l1 / dg, s2 = n * l2 / dg;
      var box = { x: W * 0.05, y: H * 0.42, w: W * 0.9, h: H * 0.48 };
      if (s2 >= 1) { D.rect(c, box.x, box.y, box.w, box.h, K.surface, K.line, 6, 1); D.text(c, 'order ' + n + ' does not exist: n λ > (a+b)', W / 2, box.y + box.h / 2, { size: 13, align: 'center', color: K.pos, weight: 700 }); S.set('th', '—'); S.set('R', String(R)); S.set('dp', '—'); return; }
      var t1 = Math.asin(s1), t2 = Math.asin(s2), dth = t2 - t1, width = l1 / (p.Nw * dg * Math.cos(t1)), span = Math.max(4 * dth, 6 * width), pts = [];
      var Ip = function (th, t0) { var x = (th - t0) / width * PI; return Math.pow(sinc(x), 2); };
      for (var i = 0; i <= 600; i++) { var th = t1 + dth / 2 - span / 2 + span * i / 600; pts.push([(th - t1) * 1e6, Ip(th, t1) + Ip(th, t2)]); }
      var g = D.graph(c, box, { x0: (dth / 2 - span / 2) * 1e6, x1: (dth / 2 + span / 2) * 1e6, y0: 0, y1: 2.2, xl: 'angle from D₁ line (µrad) →', yl: 'zoom on the sodium doublet 589.0 / 589.6 nm' }, [{ pts: pts, color: K.c1, w: 2.5 }]);
      var res = R >= 982;
      D.text(c, res ? 'RESOLVED: two separate peaks' : 'NOT resolved: the peaks merge', box.x + box.w - 8, box.y + 28, { size: 13, align: 'right', color: res ? K.c3 : K.pos, weight: 700 });
      S.set('th', f(t1 * 180 / PI, 4) + '° and ' + f(t2 * 180 / PI, 4) + '°'); S.set('R', String(R) + (res ? ' ≥ 982 ✓' : ' < 982 ✗')); S.set('dp', f(n / (dg * Math.cos(t1)) * 1e-9 * 180 / PI, 3) + ' °/nm');
    }
  });

  /* ---------- 2D: circular aperture and Rayleigh criterion ---------- */
  Sim.make('sim-airy', {
    aspect: 0.5,
    controls: [
      { k: 'Dap', label: 'Aperture diameter D', min: 1, max: 20, step: 0.5, v: 5, unit: 'mm' },
      lamCtl,
      { k: 'sep', label: 'Angular separation of two stars', min: 20, max: 400, step: 5, v: 150, unit: 'µrad' },
      { k: 'fl', label: 'Focal length f', min: 20, max: 200, step: 5, v: 50, unit: 'mm' }
    ],
    reads: [{ k: 'th', label: 'Rayleigh limit &theta; = 1.22&lambda;/D', big: true }, { k: 'res', label: 'The two stars are' }, { k: 'fn', label: 'f-number f/D; Airy disc radius 1.22&lambda;f/D' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, Dap = p.Dap * 1e-3, lam = p.lam * 1e-9, k = PI * Dap / lam, sep = p.sep * 1e-6, thR = 1.22 * lam / Dap, tm = Math.max(3 * thR, 1.6 * sep);
      var A = function (th) { var x = k * Math.sin(th); return Math.abs(x) < 1e-6 ? 1 : Math.pow(2 * J1(x) / x, 2); };
      D.clear(c, W, H);
      var N = 120, sz = Math.min(H * 0.8, W * 0.38), cx = W * 0.05, cy = H * 0.1, cell = sz / N, cc = wlRGB(p.lam);
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var tx = (i / N - 0.5) * 2 * tm, ty = (j / N - 0.5) * 2 * tm, v = A(Math.hypot(tx - sep / 2, ty)) + A(Math.hypot(tx + sep / 2, ty)); v = Math.pow(clamp(v, 0, 1), 0.5);
        c.fillStyle = 'rgb(' + Math.round(cc[0] * 255 * v) + ',' + Math.round(cc[1] * 255 * v) + ',' + Math.round(cc[2] * 255 * v) + ')'; c.fillRect(cx + i * cell, cy + j * cell, cell + 0.6, cell + 0.6);
      }
      D.text(c, 'image of two stars', cx + sz / 2, cy + sz + 14, { size: 11, align: 'center', color: K.muted });
      var pts = [], p1 = [], p2 = [];
      for (var q = 0; q <= 400; q++) { var th = -tm + 2 * tm * q / 400, a1 = A(th - sep / 2), a2 = A(th + sep / 2); pts.push([th * 1e6, a1 + a2]); p1.push([th * 1e6, a1]); p2.push([th * 1e6, a2]); }
      D.graph(c, { x: W * 0.48, y: H * 0.07, w: W * 0.5, h: H * 0.8 }, { x0: -tm * 1e6, x1: tm * 1e6, y0: 0, y1: 2.1, xl: 'angle (µrad) →', yl: 'cross-section through both stars' }, [{ pts: p1, color: K.faint, w: 1.2 }, { pts: p2, color: K.faint, w: 1.2 }, { pts: pts, color: K.c1, w: 2.5 }]);
      var ratio = sep / thR;
      S.set('th', f(thR * 1e6, 3) + ' µrad'); S.set('res', ratio >= 1 ? 'resolved (separation ' + f(ratio, 3) + ' × limit)' : 'not resolved (separation only ' + f(ratio, 3) + ' × limit)');
      S.set('fn', 'f/' + f(p.fl / p.Dap, 3) + '; ' + f(1.22 * lam * p.fl / p.Dap * 1e3 * 1e3, 3) + ' µm');
    }
  });

  /* ---------- 3D: diffraction pattern as a surface ---------- */
  var SN = 120;
  Sim.make('sim-airy3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 0.9, r: 15 },
    controls: [
      { k: 'a', label: 'Aperture size (relative)', min: 0.5, max: 3, step: 0.05, v: 1.2 },
      { k: 'b', label: 'Aspect ratio (rectangle height / width)', min: 0.3, max: 3, step: 0.05, v: 1 }
    ],
    buttons: [{ label: 'Circular hole', group: 's', on: true, click: function (S) { S.st.sh = 0; S.st.dirty = true; } }, { label: 'Rectangular hole', group: 's', click: function (S) { S.st.sh = 1; S.st.dirty = true; } }, { k: 'log', label: 'Exaggerate faint rings', click: function (S, b) { S.st.log = !S.st.log; b.classList.toggle('on', S.st.log); S.st.dirty = true; } }],
    reads: [{ k: 'c', label: 'Central peak' }, { k: 'n', label: 'Shape of the pattern', big: true }],
    init: function (S) {
      var st = S.st; st.sh = 0; st.log = false; st.dirty = true;
      st.geo = new THREE.PlaneGeometry(12, 12, SN, SN); st.geo.rotateX(-PI / 2); st.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(st.geo.attributes.position.count * 3), 3));
      st.mesh = new THREE.Mesh(st.geo, new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide, shininess: 30 })); S.scene.add(st.mesh);
      st.hole = new THREE.Mesh(new THREE.CircleGeometry(1, 40), T.mat(0x22262b, { side: THREE.DoubleSide })); st.hole.position.set(-7.5, 2, 0); st.hole.rotation.y = PI / 2; S.scene.add(st.hole);
      st.lb = T.label(S.scene, 'aperture shape', '#22262b', 0.8); st.lb.position.set(-7.5, 3.6, 0);
    },
    onChange: function (S) { S.st.dirty = true; },
    draw: function (S) {
      var st = S.st, p = S.p; if (!st.dirty) return; st.dirty = false;
      var pos = st.geo.attributes.position, col = st.geo.attributes.color, k = p.a * 2.2;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), z = pos.getZ(i), I;
        if (st.sh === 0) { var r = Math.hypot(x, z) * k, j = Math.abs(r) < 1e-6 ? 0.5 : J1(r) / r; I = 4 * j * j; }
        else { I = Math.pow(sinc(x * k * 0.8), 2) * Math.pow(sinc(z * k * 0.8 * p.b), 2); }
        var h = st.log ? Math.max(0, 1 + Math.log10(I + 1e-4) / 4) : I;
        pos.setY(i, h * 4); col.setXYZ(i, 0.95 * Math.pow(h, 0.5) + 0.05, 0.75 * Math.pow(h, 0.7) + 0.05, 0.2 * h + 0.1);
      }
      pos.needsUpdate = true; col.needsUpdate = true; st.geo.computeVertexNormals();
      st.hole.geometry.dispose(); st.hole.geometry = st.sh === 0 ? new THREE.CircleGeometry(0.6 / p.a + 0.2, 40) : new THREE.PlaneGeometry(0.8 / p.a + 0.2, (0.8 / p.a + 0.2) * p.b);
      S.set('c', 'smaller hole → wider pattern (width ∝ λ/size)');
      S.set('n', st.sh === 0 ? 'Airy disc with concentric rings (84% of the light in the centre)' : 'cross pattern: widest along the narrow side of the hole');
    }
  });

  /* ---------- 3D: EM wave and the Poynting vector ---------- */
  Sim.make('sim-poynting3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.8, ph: 1.1, r: 15 },
    controls: [
      { k: 'E0', label: 'Electric field amplitude E<sub>0</sub>', min: 10, max: 1000, step: 10, v: 500, unit: 'V/m' },
      { k: 'lam', label: 'Wavelength (display)', min: 2, max: 8, step: 0.5, v: 4 }
    ],
    reads: [{ k: 'B', label: 'B<sub>0</sub> = E<sub>0</sub>/c' }, { k: 'S', label: 'Average intensity &lang;S&rang; = E<sub>0</sub>&sup2;/2&mu;<sub>0</sub>c', big: true }, { k: 'u', label: 'Energy density &epsilon;<sub>0</sub>E<sub>0</sub>&sup2;/2' }],
    init: function (S) {
      var st = S.st; st.E = []; st.B = []; st.S = [];
      for (var i = 0; i < 24; i++) { st.E.push(T.arrow(S.scene, '#c62828')); st.B.push(T.arrow(S.scene, '#1d4ed8')); }
      for (var j = 0; j < 6; j++) st.S.push(T.arrow(S.scene, '#3f7d3a'));
      var ax = T.line(S.scene, 0x8b9098, 2); T.setLine(ax, [[-7, 0, 0], [7, 0, 0]]);
      [['E (electric)', '#c62828', -6, 2.6, 0], ['B (magnetic)', '#1d4ed8', -6, 0, 2.6], ['S = E × B / μ₀ (energy flow)', '#3f7d3a', 3, 3, 0]].forEach(function (q) { var l = T.label(S.scene, q[0], q[1], 0.8); l.position.set(q[2], q[3], q[4]); });
    },
    draw: function (S) {
      var st = S.st, p = S.p, k = 2 * PI / p.lam, w = 2, t = S.t, a = clamp(p.E0 / 1000, 0.05, 1) * 2.2;
      for (var i = 0; i < 24; i++) { var x = -7 + 14 * i / 23, v = Math.sin(k * x - w * t); T.setArrow(st.E[i], [x, 0, 0], [0, a * v, 0], 0.18); T.setArrow(st.B[i], [x, 0, 0], [0, 0, a * v], 0.18); }
      for (var j = 0; j < 6; j++) { var xs = -6 + ((j * 2.4 + t * 1.5) % 14), v2 = Math.pow(Math.sin(k * xs - w * t), 2); T.setArrow(st.S[j], [xs, 0, 0], [0.4 + 1.2 * v2, 0, 0], 0.25); }
      var c0 = 3e8, mu0 = 4 * PI * 1e-7, e0 = 8.854e-12;
      S.set('B', f(p.E0 / c0 * 1e6, 3) + ' µT (E and B in phase, perpendicular)'); S.set('S', f(p.E0 * p.E0 / (2 * mu0 * c0), 3) + ' W/m²'); S.set('u', f(e0 * p.E0 * p.E0 / 2, 3) + ' J/m³ (half electric, half magnetic)');
    }
  });
})();
