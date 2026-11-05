/* Unit 6 simulations: imaging and optics */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3;

  function wlColor(nm, a) { // approximate visible colour of a wavelength
    var r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
    return 'rgba(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ',' + (a === undefined ? 1 : a) + ')';
  }

  /* 1. Thin lens ray diagram */
  Sim.make('sim-lens', {
    aspect: 0.48,
    controls: [
      { k: 'do', label: 'Object distance d<sub>o</sub>', min: 3, max: 40, step: 0.5, v: 30, unit: 'cm' },
      { k: 'f', label: 'Focal length f', min: 5, max: 15, step: 0.5, v: 10, unit: 'cm' }
    ],
    reads: [{ k: 'di', label: 'Image distance d<sub>i</sub>', big: true }, { k: 'm', label: 'Magnification m = &minus;d<sub>i</sub>/d<sub>o</sub>' }, { k: 'kind', label: 'Image' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), lx = W * 0.47, ay = H * 0.55, sc = W / 95, ho = 5;
      var X = function (cm) { return lx + cm * sc; }, Y = function (cm) { return ay - cm * sc; };
      D.clear(c, W, H);
      D.line(c, 0, ay, W, ay, K.faint, 1);
      c.save(); c.strokeStyle = K.c1; c.lineWidth = 2; c.fillStyle = 'rgba(80,150,220,0.18)'; c.beginPath(); c.ellipse(lx, ay, 8, H * 0.42, 0, 0, 2 * PI); c.fill(); c.stroke(); c.restore();
      [-1, 1].forEach(function (s) { D.circle(c, X(s * p.f), ay, 4, K.c2); D.text(c, 'F', X(s * p.f), ay + 16, { align: 'center', size: 12, weight: 700, color: K.c2 }); D.circle(c, X(s * 2 * p.f), ay, 3, K.faint); D.text(c, '2F', X(s * 2 * p.f), ay + 16, { align: 'center', size: 11, color: K.faint }); });
      var ox = X(-p.do), oy = Y(ho);
      D.arrow(c, ox, ay, ox, oy, K.c3, 4);
      var di = Math.abs(p.do - p.f) < 0.01 ? Infinity : 1 / (1 / p.f - 1 / p.do), m = -di / p.do, hi = m * ho;
      // ray 1: parallel then through F'
      var lensTop = [lx, oy];
      D.line(c, ox, oy, lx, oy, K.pos, 2);
      var s1 = (ay - oy) / (X(p.f) - lx); // slope of refracted ray
      D.line(c, lx, oy, W, oy + s1 * (W - lx), K.pos, 2);
      // ray 2: through centre
      var s2 = (ay - oy) / (lx - ox);
      D.line(c, ox, oy, W, oy + s2 * (W - ox), K.c4, 2);
      // ray 3: through F then parallel
      if (p.do > p.f + 0.01) { var yl = oy + (ay - oy) * (lx - ox) / (X(-p.f) - ox); D.line(c, ox, oy, lx, yl, K.c5, 2); D.line(c, lx, yl, W, yl, K.c5, 2); }
      if (isFinite(di)) {
        var ix = X(di), iy = Y(hi);
        if (di < 0) { // virtual: extend rays back
          D.line(c, lx, oy, ix, iy, K.pos, 1.5, [5, 4]); D.line(c, ox, oy, ix, iy, K.c4, 1.5, [5, 4]);
          D.line(c, ix, ay, ix, iy, K.c2, 3, [6, 4]); D.circle(c, ix, iy, 4, K.c2);
        } else if (ix < W + 200) D.arrow(c, ix, ay, ix, iy, K.c2, 4);
        D.text(c, di < 0 ? 'virtual image' : 'real image', Math.min(W - 60, Math.max(60, ix)), Math.max(14, Math.min(H - 12, iy + (hi > 0 ? -14 : 14))), { align: 'center', size: 12, weight: 700, color: K.c2, bg: K.bg });
      }
      D.text(c, 'object', ox, oy - 12, { align: 'center', size: 12, weight: 700, color: K.c3 });
      S.set('di', isFinite(di) ? f(di, 3) + ' cm' : 'at infinity');
      S.set('m', isFinite(di) ? f(m, 3) : '–');
      S.set('kind', !isFinite(di) ? 'no image (rays parallel)' : di > 0 ? 'real, inverted, ' + (Math.abs(m) > 1 ? 'enlarged' : 'smaller') : 'virtual, upright, enlarged');
    }
  });

  /* 2. 3D ray bundle through a lens */
  Sim.make('sim-lens3d', {
    webgl: true, aspect: 0.5, camera: { th: 0.9, ph: 1.2, r: 15, target: [1, 0, 0] },
    controls: [
      { k: 'f', label: 'Focal length f', min: 2, max: 6, step: 0.25, v: 4 },
      { k: 'w', label: 'Beam radius', min: 0.4, max: 2, step: 0.1, v: 1.5 }
    ],
    reads: [{ k: 'cone', label: 'Half-angle of the cone &alpha;', big: true }, { k: 'na', label: 'NA = sin&alpha; (in air)' }],
    init: function (S) {
      var lens = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 24), T.mat(0x5aa0dc, { opacity: 0.28 })); lens.scale.set(0.18, 1, 1); S.scene.add(lens);
      S.st.rays = []; for (var i = 0; i < 26; i++) S.st.rays.push(T.line(S.scene, i < 13 ? 0xc62828 : 0xe09b3d, 3));
      S.st.F = T.sphere(0.12, 0x1e4d2b); S.scene.add(S.st.F); S.st.lab = T.label(S.scene, 'F', '#1e4d2b', 0.8);
      var ax = T.line(S.scene, 0x88998c, 2); T.setLine(ax, [[-7, 0, 0], [12, 0, 0]]);
    },
    draw: function (S) {
      var p = S.p, n = 0;
      [p.w, p.w * 0.5].forEach(function (r) {
        for (var i = 0; i < 13; i++) {
          var a = 2 * PI * i / 13, y = r * Math.cos(a), z = r * Math.sin(a), end = 2 * p.f + 1;
          T.setLine(S.st.rays[n++], [[-7, y, z], [0, y, z], [end, y * (1 - end / p.f), z * (1 - end / p.f)]]);
        }
      });
      S.st.F.position.set(p.f, 0, 0); S.st.lab.position.set(p.f, -0.6, 0);
      var al = Math.atan(p.w / p.f);
      S.set('cone', f(al * 180 / PI, 3) + '°'); S.set('na', f(Math.sin(al), 3));
    }
  });

  /* 3. Resolution: two point sources */
  function J1(x) { // Bessel J1 (polynomial approximations)
    var ax = Math.abs(x), y, ans1, ans2;
    if (ax < 8) { y = x * x; ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606)))))); ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y)))); return ans1 / ans2; }
    var z = 8 / ax; y = z * z; var xx = ax - 2.356194491;
    ans1 = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
    ans2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    var a = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2); return x < 0 ? -a : a;
  }
  function airy(r, lam, NA) { var x = 2 * PI * NA * r / lam; if (Math.abs(x) < 1e-6) return 1; var v = 2 * J1(x) / x; return v * v; }
  Sim.make('sim-resolve', {
    aspect: 0.45,
    controls: [
      { k: 'lam', label: 'Light wavelength &lambda;', min: 400, max: 700, step: 10, v: 600, unit: 'nm' },
      { k: 'NA', label: 'Objective NA', min: 0.25, max: 1.4, step: 0.05, v: 0.65 }
    ],
    reads: [{ k: 'd', label: 'd<sub>min</sub> = 0.61&lambda;/NA', big: true }, { k: 'sep', label: 'Bead separation' }, { k: 'res', label: 'Result' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), sep = 300, dmin = 0.61 * p.lam / p.NA;
      D.clear(c, W, H);
      // image panel
      var ix = W * 0.04, iw = W * 0.38, iy = H * 0.1, ih = H * 0.8, nmPerPx = 1600 / iw;
      D.rect(c, ix, iy, iw, ih, '#05070a', null, 6);
      var iwp = Math.round(iw), ihp = Math.round(ih), img = c.createImageData(iwp, ihp), col = wlColor(p.lam).match(/\d+/g).map(Number);
      for (var py = 0; py < ihp; py++) for (var px = 0; px < iwp; px++) {
        var xn = (px - iwp / 2) * nmPerPx, yn = (py - ihp / 2) * nmPerPx;
        var I = airy(Math.hypot(xn + sep / 2, yn), p.lam, p.NA) + airy(Math.hypot(xn - sep / 2, yn), p.lam, p.NA);
        I = Math.min(1, I * 0.9); var o = (py * iwp + px) * 4;
        img.data[o] = col[0] * I; img.data[o + 1] = col[1] * I; img.data[o + 2] = col[2] * I; img.data[o + 3] = 255;
      }
      var off = S.st.off || (S.st.off = document.createElement('canvas')); off.width = iwp; off.height = ihp; off.getContext('2d').putImageData(img, 0, 0);
      c.drawImage(off, ix, iy, iw, ih);
      D.text(c, 'what the microscope shows', ix + iw / 2, iy - 8 + 0, { align: 'center', size: 11.5, color: K.muted });
      // profile
      var box = { x: W * 0.5, y: H * 0.1, w: W * 0.46, h: H * 0.74 }, pts = [], pa = [], pb = [];
      for (var x = -800; x <= 800; x += 8) { var a = airy(x + sep / 2, p.lam, p.NA), b = airy(x - sep / 2, p.lam, p.NA); pts.push([x, a + b]); pa.push([x, a]); pb.push([x, b]); }
      var g = D.graph(c, box, { x0: -800, x1: 800, y0: 0, y1: 2.1, xl: 'position (nm) →', yl: 'brightness across the beads' }, [{ pts: pa, color: K.faint, w: 1.2 }, { pts: pb, color: K.faint, w: 1.2 }, { pts: pts, color: wlColor(p.lam), w: 3 }]);
      [-150, 150].forEach(function (x) { D.line(c, g.px(x), box.y + box.h, g.px(x), box.y + box.h - 10, K.ink, 2); });
      var ok = sep >= dmin;
      S.set('d', f(dmin, 3) + ' nm'); S.set('sep', sep + ' nm'); S.set('res', ok ? 'resolved: two beads' : 'not resolved: one blob');
    }
  });

  /* 4. Young's double slit */
  Sim.make('sim-slits', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'lam', label: 'Wavelength &lambda;', min: 400, max: 700, step: 10, v: 600, unit: 'nm' },
      { k: 'd', label: 'Slit separation d', min: 0.1, max: 0.5, step: 0.02, v: 0.2, unit: 'mm' }
    ],
    reads: [{ k: 'dy', label: 'Fringe spacing &Delta;y = &lambda;L/d (L = 1 m)', big: true }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), lam = p.lam * 1e-9, d = p.d * 1e-3, L = 1, dy = lam * L / d, col = wlColor(p.lam);
      D.clear(c, W, H);
      var bx = W * 0.18, cy = H * 0.5, gap = 14 + p.d * 120, wl = 8 + (p.lam - 400) / 300 * 10;
      // waves from source
      for (var r = (S.t * 40) % wl; r < bx - 10; r += wl) D.line(c, 10 + r, cy - 60, 10 + r, cy + 60, wlColor(p.lam, 0.5), 2);
      D.rect(c, bx - 3, H * 0.05, 6, H * 0.9, K.ink, null, 0);
      D.rect(c, bx - 4, cy - gap / 2 - 3, 8, 6, K.bg, null, 0); D.rect(c, bx - 4, cy + gap / 2 - 3, 8, 6, K.bg, null, 0);
      var sx = W * 0.66;
      c.save(); c.beginPath(); c.rect(bx + 4, 0, sx - bx - 4, H); c.clip();
      [-1, 1].forEach(function (s) { for (var rr = (S.t * 40) % wl; rr < sx; rr += wl) { c.strokeStyle = wlColor(p.lam, 0.35); c.lineWidth = 1.5; c.beginPath(); c.arc(bx, cy + s * gap / 2, rr, -PI / 2, PI / 2); c.stroke(); } });
      c.restore();
      // screen
      var ymax = 0.012; // +- 12 mm shown
      for (var py = 0; py < H; py++) {
        var y = (py - cy) / (H / 2) * ymax, beta = PI * 0.04e-3 * y / (lam * L), env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
        var I = Math.pow(Math.cos(PI * d * y / (lam * L)), 2) * env;
        c.fillStyle = wlColor(p.lam, I); c.fillRect(sx, py, 22, 1);
      }
      D.rect(c, sx, 0, 22, H, null, K.ink, 0, 1);
      var box = { x: sx + 34, y: H * 0.03, w: W - sx - 44, h: H * 0.94 }, pts = [];
      D.rect(c, box.x, box.y, box.w, box.h, K.surface, K.line, 6, 1);
      for (py = 0; py < H; py += 2) { y = (py - cy) / (H / 2) * ymax; beta = PI * 0.04e-3 * y / (lam * L); env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2); pts.push([box.x + 4 + (box.w - 8) * Math.pow(Math.cos(PI * d * y / (lam * L)), 2) * env, py]); }
      D.poly(c, pts, col, 2.5);
      D.text(c, 'screen', sx + 11, H - 8, { align: 'center', size: 11, color: K.muted, bg: K.bg });
      D.text(c, 'two slits', bx, H - 8, { align: 'center', size: 11, color: K.muted, bg: K.bg });
      S.set('dy', f(dy * 1000, 3) + ' mm');
    }
  });

  /* 5. X-ray image of an arm */
  Sim.make('sim-xray', {
    aspect: 0.5,
    controls: [{ k: 'kv', label: 'Tube voltage', min: 40, max: 120, step: 5, v: 60, unit: 'kV' }],
    reads: [{ k: 'tt', label: 'Through soft tissue only' }, { k: 'tb', label: 'Through bone + tissue' }, { k: 'con', label: 'Contrast', big: true }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), muT = 0.25 * Math.pow(60 / p.kv, 1.5), muB = 1.4 * Math.pow(60 / p.kv, 2.5);
      var Rt = 4, Rb = 1.2; // cm radii of arm and bone
      var trans = function (x) { var lt = Math.abs(x) < Rt ? 2 * Math.sqrt(Rt * Rt - x * x) : 0, lb = Math.abs(x) < Rb ? 2 * Math.sqrt(Rb * Rb - x * x) : 0; return Math.exp(-muT * (lt - lb) - muB * lb); };
      D.clear(c, W, H);
      var cx = W * 0.5, sc = Math.min(W * 0.045, H * 0.065), ay = H * 0.4, fy = H * 0.74;
      D.rect(c, cx - 30, H * 0.02, 60, 18, K.ink, null, 4); D.text(c, 'X-ray tube', cx + 40, H * 0.02 + 9, { size: 11.5, color: K.muted });
      for (var i = -6; i <= 6; i++) D.line(c, cx, H * 0.06, cx + i * sc * 0.75, fy, 'rgba(124,58,237,0.12)', 1);
      D.circle(c, cx, ay, Rt * sc, 'rgba(230,180,150,0.65)', K.muted, 1); D.circle(c, cx, ay, Rb * sc, 'rgba(240,240,225,0.95)', K.muted, 1);
      D.text(c, 'soft tissue', cx + Rt * sc + 8, ay - Rt * sc * 0.6, { size: 11.5, color: K.muted }); D.text(c, 'bone', cx + Rb * sc + 8, ay, { size: 11.5, color: K.muted });
      // film: exposure darkens, so low transmission looks white
      var fx0 = cx - 6 * sc, fx1 = cx + 6 * sc;
      for (var px = fx0; px < fx1; px++) { var x = (px - cx) / sc, tr = trans(x), v = Math.round(255 * (1 - Math.min(1, tr))); c.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; c.fillRect(px, fy, 1, H * 0.14); }
      D.rect(c, fx0, fy, fx1 - fx0, H * 0.14, null, K.ink, 0, 1);
      D.text(c, 'film (white = fewer X-rays arrived)', cx, fy + H * 0.18, { align: 'center', size: 11.5, color: K.muted });
      var tt = trans(Rb + 0.3), tb = trans(0);
      S.set('tt', f(tt * 100, 3) + '%'); S.set('tb', f(tb * 100, 3) + '%'); S.set('con', f((tt - tb) / tt * 100, 3) + '%');
    }
  });

  /* 6. Bragg reflection */
  Sim.make('sim-bragg', {
    aspect: 0.5,
    controls: [
      { k: 'th', label: 'Angle &theta;', min: 5, max: 80, step: 0.5, v: 22.5, unit: '°' },
      { k: 'd', label: 'Layer spacing d', min: 0.15, max: 0.4, step: 0.01, v: 0.2, unit: 'nm' }
    ],
    reads: [{ k: 'pd', label: 'Path difference 2d sin&theta;' }, { k: 'n', label: 'In wavelengths (&lambda; = 0.154 nm)', big: true }, { k: 'I', label: 'Detector' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), lam = 0.154, th = p.th * PI / 180, pd = 2 * p.d * Math.sin(th), N = 10, ph = 2 * PI * pd / lam;
      var I = Math.abs(Math.sin(ph / 2)) < 1e-6 ? 1 : Math.pow(Math.sin(N * ph / 2) / (N * Math.sin(ph / 2)), 2);
      D.clear(c, W, H);
      var cx = W * 0.27, y1 = H * 0.55, gap = 36 + (p.d - 0.15) * 160;
      for (var r = 0; r < 3; r++) for (var x = W * 0.03; x < W * 0.52; x += 22) D.circle(c, x, y1 + r * gap, 5, K.c1);
      var L = W * 0.22, dx = Math.cos(th), dy = Math.sin(th);
      [[cx, y1, K.c2], [cx, y1 + gap, K.c5]].forEach(function (q) {
        var Lq = L + (q[1] - y1) / dy;
        D.arrow(c, q[0] - dx * Lq, q[1] - dy * Lq, q[0], q[1], q[2], 2.5, 9);
        D.arrow(c, q[0], q[1], q[0] + dx * Lq, q[1] - dy * Lq, q[2], 2.5, 9);
      });
      D.text(c, 'extra path = 2d sinθ', cx, y1 + gap + 22, { align: 'center', size: 12, weight: 600, color: K.c5 });
      D.line(c, cx + 40, y1, cx + 40, y1 + gap, K.ink, 1.2); D.text(c, 'd', cx + 46, y1 + gap / 2, { italic: true, serif: true, size: 14 });
      var box = { x: W * 0.58, y: H * 0.1, w: W * 0.38, h: H * 0.62 }, pts = [];
      for (var a = 5; a <= 80; a += 0.25) { var t = a * PI / 180, phh = 2 * PI * 2 * p.d * Math.sin(t) / lam, v = Math.abs(Math.sin(phh / 2)) < 1e-6 ? 1 : Math.pow(Math.sin(N * phh / 2) / (N * Math.sin(phh / 2)), 2); pts.push([a, v]); }
      var g = D.graph(c, box, { x0: 5, x1: 80, y0: 0, y1: 1.1, xl: 'θ (degrees) →', yl: 'detector signal', dots: [{ x: p.th, y: I, color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c4, w: 2.5 }]);
      [10, 30, 50, 70].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      D.circle(c, W * 0.77, H * 0.86, 10 + 14 * I, 'rgba(255,200,60,' + (0.15 + 0.85 * I) + ')', K.ink, 1);
      D.text(c, 'detector', W * 0.77 + 30, H * 0.86, { size: 11.5, color: K.muted });
      S.set('pd', f(pd, 3) + ' nm'); S.set('n', f(pd / lam, 3) + ' λ'); S.set('I', I > 0.5 ? 'bright (in step)' : I > 0.05 ? 'weak' : 'dark');
    }
  });

  /* 7. Lamp vs laser */
  Sim.make('sim-laser', {
    aspect: 0.4, animate: true,
    buttons: [{ label: 'Ordinary lamp', group: 'l', on: true, click: function (S) { S.st.laser = false; } }, { label: 'Laser', group: 'l', click: function (S) { S.st.laser = true; } }],
    reads: [{ k: 'c', label: 'Colours' }, { k: 'ph', label: 'Phase' }, { k: 'dir', label: 'Direction' }],
    init: function (S) { S.st.laser = false; S.st.w = []; for (var i = 0; i < 8; i++) S.st.w.push({ lam: 420 + Math.random() * 260, ph: Math.random() * 6.28, ang: (Math.random() - 0.5) * 0.5 }); },
    draw: function (S, c, W, H) {
      var K = C(), las = S.st.laser, x0 = W * 0.1, cy = H * 0.5;
      D.clear(c, W, H);
      D.rect(c, W * 0.02, cy - 30, W * 0.07, 60, las ? '#2d3a32' : '#f2d16b', K.ink, 8, 1.5);
      D.text(c, las ? 'laser' : 'lamp', W * 0.055, cy + 44, { align: 'center', size: 12, weight: 600 });
      S.st.w.forEach(function (w, i) {
        var lam = las ? 633 : w.lam, ph = las ? 0 : w.ph, ang = las ? 0 : w.ang, y0 = cy + (i - 3.5) * (las ? 6 : 4), kk = 2 * PI / (20 + (lam - 400) / 300 * 20), pts = [];
        for (var x = 0; x <= W * 0.62; x += 3) pts.push([x0 + x * Math.cos(ang), y0 + x * Math.sin(ang) + 9 * Math.sin(kk * x - S.t * 6 + ph)]);
        D.poly(c, pts, wlColor(lam, 0.8), 1.8);
      });
      var sx = W * 0.86;
      D.rect(c, sx, H * 0.08, 10, H * 0.84, K.surface, K.ink, 2, 1);
      if (las) { var g = c.createRadialGradient(sx, cy, 1, sx, cy, 22); g.addColorStop(0, 'rgba(255,60,40,1)'); g.addColorStop(1, 'rgba(255,60,40,0)'); c.fillStyle = g; c.fillRect(sx - 24, cy - 24, 48, 48); }
      else { var g2 = c.createRadialGradient(sx, cy, 4, sx, cy, H * 0.4); g2.addColorStop(0, 'rgba(255,240,200,0.45)'); g2.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g2; c.fillRect(sx - H * 0.4, cy - H * 0.4, H * 0.8, H * 0.8); }
      D.text(c, las ? 'small, bright spot' : 'wide, dim patch', sx - 14, H * 0.06 + 4, { align: 'right', size: 11.5, color: K.muted });
      S.set('c', las ? 'one (monochromatic)' : 'many'); S.set('ph', las ? 'all in step (coherent)' : 'random'); S.set('dir', las ? 'one narrow beam' : 'spreading');
    }
  });
})();
