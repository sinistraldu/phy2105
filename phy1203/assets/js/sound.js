/* Unit 3 simulations: sound */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI;

  /* 1. Longitudinal vs transverse wave */
  Sim.make('sim-wave', {
    aspect: 0.42, animate: true,
    controls: [
      { k: 'f', label: 'Frequency f', min: 0.5, max: 2, step: 0.1, v: 1, unit: 'Hz' },
      { k: 'v', label: 'Wave speed v (set by the medium)', min: 1, max: 3, step: 0.1, v: 2, unit: 'm/s' }
    ],
    buttons: [
      { label: 'Longitudinal (sound)', group: 'm', on: true, click: function (S) { S.st.tr = false; } },
      { label: 'Transverse', group: 'm', click: function (S) { S.st.tr = true; } },
      { k: 'pause', label: 'Pause', click: function (S, b) { S.running = !S.running; b.textContent = S.running ? 'Pause' : 'Play'; } }
    ],
    reads: [{ k: 'lam', label: 'Wavelength &lambda; = v/f', big: true }, { k: 'T', label: 'Period T = 1/f' }, { k: 'v', label: 'Speed v = f&lambda;' }],
    init: function (S) { S.st.tr = false; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), lam = p.v / p.f, k = 2 * PI / lam, w = 2 * PI * p.f, t = S.t, mpx = W / 6.2, x0 = W * 0.03;
      D.clear(c, W, H);
      var cy = H * 0.55, rows = S.st.tr ? 1 : 7, spacing = 0.1;
      var mark = 1.6;
      D.line(c, x0 + mark * mpx, H * 0.18, x0 + mark * mpx, H * 0.92, K.c2, 1, [3, 4]);
      for (var xr = 0; xr <= 6; xr += spacing) {
        var s = Math.sin(k * xr - w * t), hi = Math.abs(xr - mark) < 1e-6;
        for (var r = 0; r < rows; r++) {
          var px, py;
          if (S.st.tr) { px = x0 + xr * mpx; py = cy - s * H * 0.25; }
          else { px = x0 + (xr + 0.12 * s) * mpx; py = cy + (r - 3) * H * 0.075; }
          D.circle(c, px, py, hi ? 6 : 3.4, hi ? K.c2 : K.c1);
        }
      }
      if (S.st.tr) {
        var pts = []; for (var xx = 0; xx <= 6; xx += 0.02) pts.push([x0 + xx * mpx, cy - Math.sin(k * xx - w * t) * H * 0.25]);
        D.poly(c, pts, K.faint, 1);
      }
      // wavelength bracket
      var bx = x0 + 0.3 * mpx, ex = bx + lam * mpx, by = H * 0.12;
      if (ex < W - 4) { D.line(c, bx, by, ex, by, K.ink, 1.5); D.line(c, bx, by - 6, bx, by + 6, K.ink, 1.5); D.line(c, ex, by - 6, ex, by + 6, K.ink, 1.5); D.text(c, 'λ = ' + f(lam, 3) + ' m', (bx + ex) / 2, by - 12, { align: 'center', weight: 700, size: 13 }); }
      D.arrow(c, W * 0.8, H * 0.06, W * 0.96, H * 0.06, K.muted, 2); D.text(c, 'wave travels', W * 0.78, H * 0.06, { align: 'right', size: 11.5, color: K.muted });
      if (!S.st.tr) D.text(c, 'crowded dots = compression (high pressure), spread dots = rarefaction', W / 2, H * 0.96, { align: 'center', size: 11.5, color: K.muted });
      S.set('lam', f(lam, 3) + ' m'); S.set('T', f(1 / p.f, 3) + ' s'); S.set('v', f(p.f * lam, 3) + ' m/s');
    }
  });

  /* 2. Build a wave equation */
  Sim.make('sim-equation', {
    aspect: 0.45, animate: true,
    controls: [
      { k: 'A', label: 'Amplitude A', min: 0.01, max: 0.05, step: 0.005, v: 0.02, unit: 'm' },
      { k: 'lam', label: 'Wavelength &lambda;', min: 0.5, max: 3, step: 0.1, v: 1, unit: 'm' },
      { k: 'f', label: 'Frequency f', min: 0.2, max: 2, step: 0.1, v: 0.5, unit: 'Hz' }
    ],
    reads: [{ k: 'k', label: 'k = 2&pi;/&lambda;' }, { k: 'w', label: '&omega; = 2&pi;f' }, { k: 'v', label: 'v = f&lambda; = &omega;/k', big: true }, { k: 'T', label: 'T = 1/f' }],
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), k = 2 * PI / p.lam, w = 2 * PI * p.f;
      D.clear(c, W, H);
      var box = { x: W * 0.07, y: H * 0.08, w: W * 0.88, h: H * 0.62 }, pts = [];
      for (var x = 0; x <= 6; x += 0.02) pts.push([x, p.A * Math.sin(k * x - w * S.t)]);
      var g = D.graph(c, box, { x0: 0, x1: 6, y0: -0.055, y1: 0.055, xl: 'x (m) →', yl: 'y (m)', dots: [{ x: 1, y: p.A * Math.sin(k - w * S.t), color: K.c2, r: 6 }] }, [{ pts: pts, color: K.c1, w: 3 }]);
      for (var i = 0; i <= 6; i++) D.text(c, String(i), g.px(i), box.y + box.h + 12, { size: 10.5, align: 'center', color: K.faint });
      D.text(c, '+' + p.A.toFixed(3), box.x - 4, g.py(p.A), { size: 10, align: 'right', color: K.faint });
      D.line(c, box.x, g.py(p.A), box.x + box.w, g.py(p.A), K.grid, 1, [3, 3]);
      var eq = 'y = ' + p.A.toFixed(3) + ' sin(' + k.toFixed(2) + 'x − ' + w.toFixed(2) + 't)';
      D.text(c, eq, W / 2, H * 0.88, { align: 'center', size: Math.min(24, W / 26), serif: true, italic: true, weight: 600, color: K.ink });
      S.set('k', f(k, 3) + ' rad/m'); S.set('w', f(w, 3) + ' rad/s'); S.set('v', f(p.f * p.lam, 3) + ' m/s'); S.set('T', f(1 / p.f, 3) + ' s');
    }
  });

  /* 3. Spectrum explorer */
  var marks = [[14, 'elephant call', 0], [500, 'human speech', 1], [4000, 'top of a piano', 0], [22000, 'dog whistle', 2], [40000, 'ultrasonic cleaner', 0], [80000, 'bat sonar', 1], [3e6, 'abdominal scan', 0], [12e6, 'thyroid scan', 1]];
  Sim.make('sim-spectrum', {
    aspect: 0.4, minH: 250,
    controls: [{ k: 'lf', label: 'Frequency', min: 0, max: 7.3, step: 0.01, v: 2.7, map: function (x) { return Math.pow(10, x); }, show: function (v) { return v >= 1e6 ? f(v / 1e6, 3) + ' MHz' : v >= 1000 ? f(v / 1000, 3) + ' kHz' : f(v, 3) + ' Hz'; } }],
    buttons: [{ label: 'In air', group: 'm', on: true, click: function (S) { S.st.v = 343; } }, { label: 'In soft tissue', group: 'm', click: function (S) { S.st.v = 1540; } }],
    reads: [{ k: 'cat', label: 'Type', big: true }, { k: 'lam', label: 'Wavelength &lambda; = v/f' }, { k: 'near', label: 'Example near here' }],
    init: function (S) { S.st.v = 343; },
    draw: function (S, c, W, H) {
      var K = C(), fr = S.p.lf, x0 = W * 0.04, x1 = W * 0.96, y = H * 0.45, L = function (v) { return x0 + Math.log10(v) / 7.3 * (x1 - x0); };
      D.clear(c, W, H);
      D.rect(c, L(1), y - 16, L(20) - L(1), 32, 'rgba(124,58,237,0.25)', null, 4);
      D.rect(c, L(20), y - 16, L(20000) - L(20), 32, 'rgba(46,125,50,0.25)', null, 4);
      D.rect(c, L(20000), y - 16, L(2e7) - L(20000), 32, 'rgba(194,65,12,0.22)', null, 4);
      D.text(c, 'infrasound', (L(1) + L(20)) / 2, y, { align: 'center', size: 11.5, weight: 700, color: K.c4 });
      D.text(c, 'audible (20 Hz – 20 kHz)', (L(20) + L(20000)) / 2, y, { align: 'center', size: 11.5, weight: 700, color: K.c3 });
      D.text(c, 'ultrasound', (L(20000) + L(2e7)) / 2, y, { align: 'center', size: 11.5, weight: 700, color: K.c2 });
      ['1 Hz', '10', '100', '1 kHz', '10 kHz', '100 kHz', '1 MHz', '10 MHz'].forEach(function (s, i) { D.line(c, L(Math.pow(10, i)), y + 16, L(Math.pow(10, i)), y + 22, K.muted, 1); D.text(c, s, L(Math.pow(10, i)), y + 32, { align: 'center', size: 10.5, color: K.muted }); });
      marks.forEach(function (m) { var X = L(m[0]), h = 34 + m[2] * 18; D.line(c, X, y - 16, X, y - h, K.faint, 1); D.text(c, m[1], X, y - h - 8, { align: 'center', size: 10.5, color: K.muted }); });
      var X = L(fr); D.line(c, X, y - 24, X, y + 24, K.ink, 3); D.circle(c, X, y + 48, 7, K.ink);
      var lam = S.st.v / fr, cat = fr < 20 ? 'Infrasound' : fr <= 20000 ? 'Audible sound' : 'Ultrasound';
      var near = marks.reduce(function (a, m) { return Math.abs(Math.log10(m[0] / fr)) < Math.abs(Math.log10(a[0] / fr)) ? m : a; });
      S.set('cat', cat);
      S.set('lam', lam >= 1 ? f(lam, 3) + ' m' : lam >= 1e-3 ? f(lam * 100, 3) + ' cm' : f(lam * 1000, 3) + ' mm');
      S.set('near', Math.abs(Math.log10(near[0] / fr)) < 0.5 ? near[1] : '–');
    }
  });

  /* 4. Reflection at a boundary */
  var pairs = [['Skin → air (no gel)', 1.62, 1540, 0.0004, 343], ['Gel → skin', 1.50, 1500, 1.62, 1540], ['Tissue → fat', 1.62, 1540, 1.38, 1450], ['Tissue → muscle', 1.62, 1540, 1.70, 1580], ['Tissue → bone', 1.62, 1540, 7.75, 4000]];
  Sim.make('sim-reflect', {
    aspect: 0.4, animate: true,
    buttons: pairs.map(function (q, i) { return { label: q[0], group: 'p', on: i === 4, click: function (S) { S.st.i = i; S.t = 0; } }; })
      .concat([{ label: 'Send pulse', click: function (S) { S.t = 0; } }]),
    reads: [{ k: 'Z', label: 'Z<sub>1</sub>, Z<sub>2</sub> (MRayl)' }, { k: 'R', label: 'Reflected R', big: true }, { k: 'T', label: 'Transmitted T = 1 &minus; R' }],
    init: function (S) { S.st.i = 4; },
    draw: function (S, c, W, H) {
      var K = C(), q = pairs[S.st.i], Z1 = q[1], Z2 = q[3], R = Math.pow((Z2 - Z1) / (Z2 + Z1), 2), T = 1 - R;
      D.clear(c, W, H);
      var xb = W * 0.5, cy = H * 0.5, amp = H * 0.3, sp1 = 170 * Math.sqrt(q[2] / 1540), sp2 = 170 * Math.sqrt(q[4] / 1540), x0 = W * 0.08;
      D.rect(c, 0, 0, xb, H, 'rgba(230,180,150,0.18)', null, 0);
      D.rect(c, xb, 0, W - xb, H, S.st.i === 4 ? 'rgba(200,200,190,0.35)' : S.st.i === 0 ? 'rgba(160,200,240,0.12)' : 'rgba(230,150,130,0.22)', null, 0);
      D.line(c, xb, 0, xb, H, K.ink, 2);
      var n = q[0].split(' → ');
      D.text(c, n[0] + '  Z₁ = ' + Z1, xb / 2, 16, { align: 'center', weight: 600, size: 12.5 });
      D.text(c, n[1].replace(' (no gel)', '') + '  Z₂ = ' + Z2, (xb + W) / 2, 16, { align: 'center', weight: 600, size: 12.5 });
      var t = S.t, tb = (xb - x0) / sp1, packets = [];
      if (t < tb) packets.push([x0 + sp1 * t, 1, sp1]);
      else { packets.push([xb - sp1 * (t - tb), Math.sqrt(R) * (Z2 < Z1 ? -1 : 1), sp1, true]); packets.push([xb + sp2 * (t - tb), Math.sqrt(T), sp2]); }
      packets.forEach(function (pk) {
        var pts = [], lw = 22 * pk[2] / 170;
        for (var X = 0; X <= W; X += 2) {
          var u = (X - pk[0]) / (lw * 1.6);
          if (Math.abs(u) > 3) continue;
          if (pk[3] ? X > xb : (pk[0] > xb ? X < xb : X > xb)) continue;
          pts.push([X, cy - pk[1] * amp * Math.exp(-u * u) * Math.cos(2 * PI * (X - pk[0]) / lw)]);
        }
        D.poly(c, pts, pk[3] ? K.c2 : K.c1, 2.5);
      });
      if (t >= tb) {
        D.text(c, '← reflected ' + (R * 100 < 1 ? (R * 100).toFixed(2) : (R * 100).toFixed(1)) + '%', W * 0.06, H * 0.9, { size: 13, weight: 700, color: K.c2 });
        D.text(c, 'transmitted ' + (T * 100 < 1 ? (T * 100).toFixed(2) : (T * 100).toFixed(1)) + '% →', W * 0.94, H * 0.9, { size: 13, weight: 700, color: K.c1, align: 'right' });
      }
      S.set('Z', Z1 + ', ' + Z2); S.set('R', (R * 100).toPrecision(3) + '%'); S.set('T', (T * 100).toPrecision(3) + '%');
    }
  });

  /* 5. Echo depth */
  Sim.make('sim-echo', {
    aspect: 0.55, animate: true, autoplay: false,
    controls: [{ k: 'd', label: 'Depth of bone surface d', min: 2, max: 15, step: 0.5, v: 5, unit: 'cm' }],
    buttons: [
      { label: 'Send pulse', click: function (S) { S.t = 0; S.running = true; } },
      { label: 'Gel on', group: 'g', on: true, click: function (S) { S.st.gel = true; S.t = 0; S.running = false; } },
      { label: 'Gel off (air gap)', group: 'g', click: function (S) { S.st.gel = false; S.t = 0; S.running = false; } }
    ],
    reads: [{ k: 't', label: 'Echo time t (round trip)', big: true }, { k: 'd', label: 'Depth = vt/2' }, { k: 'e', label: 'Echo strength returned' }],
    init: function (S) { S.st.gel = true; },
    onChange: function (S) { S.t = 0; S.running = false; },
    draw: function (S, c, W, H) {
      var p = S.p, K = C(), v = 1540, tEcho = 2 * p.d / 100 / v, slow = 2.2e4, tr = S.t / slow;
      var Rskin = S.st.gel ? 0.0015 : 0.999, Tskin = 1 - Rskin, Rb = 0.447, echo = Tskin * Rb * Tskin;
      if (tr > tEcho * 1.4) { tr = tEcho * 1.4; S.running = false; }
      D.clear(c, W, H);
      var bx = W * 0.08, bw = W * 0.4, top = H * 0.16, depthPx = (H * 0.78) / 16, by = top + p.d * depthPx;
      D.rect(c, bx, top, bw, H * 0.82, 'rgba(230,180,150,0.25)', null, 0);
      D.rect(c, bx, by, bw, top + H * 0.82 - by, 'rgba(200,200,190,0.7)', null, 0);
      D.text(c, 'bone', bx + bw / 2, by + 16, { align: 'center', size: 12, weight: 600, color: K.muted });
      D.text(c, 'soft tissue (v = 1540 m/s)', bx + bw / 2, top + 16, { align: 'center', size: 11.5, color: K.muted });
      D.rect(c, bx + bw / 2 - 26, top - 30, 52, 26, K.c1, null, 4); D.text(c, 'probe', bx + bw / 2, top - 17, { align: 'center', size: 11, color: '#fff', weight: 700 });
      if (!S.st.gel) D.rect(c, bx + bw / 2 - 30, top - 4, 60, 4, 'rgba(120,180,240,0.9)', null, 0);
      // pulse
      if (S.running || tr > 0) {
        var dist = v * tr * 100, y;
        if (dist <= p.d) { y = top + dist * depthPx; if (S.st.gel || dist < 0.3) D.rect(c, bx + bw / 2 - 30, y - 3, 60, 6, K.c2, null, 3); }
        else if (dist <= 2 * p.d) { y = top + (2 * p.d - dist) * depthPx; if (S.st.gel) D.rect(c, bx + bw / 2 - 30, y - 3, 60, 6, K.c3, null, 3); }
      }
      // A-scan
      var box = { x: W * 0.56, y: H * 0.12, w: W * 0.4, h: H * 0.7 }, tmax = 2 * 0.15 / v, pts = [];
      var gph = D.graph(c, box, { x0: 0, x1: tmax * 1e6, y0: 0, y1: 1.05, xl: 'time (µs) →', yl: 'echo received' }, []);
      var shown = Math.min(tr, tmax);
      for (var tt = 0; tt <= shown; tt += tmax / 300) {
        var a = Rskin * Math.exp(-Math.pow((tt - 2e-6) / 1.5e-6, 2)) + echo * Math.exp(-Math.pow((tt - tEcho) / 2e-6, 2));
        pts.push([tt * 1e6, a]);
      }
      D.poly(c, pts.map(function (q) { return [gph.px(q[0]), gph.py(q[1])]; }), K.c3, 2.5);
      [0, 50, 100, 150, 200].forEach(function (u) { D.text(c, String(u), gph.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      var done = tr >= tEcho;
      S.set('t', done ? f(tEcho * 1e6, 3) + ' µs' : '–');
      S.set('d', done ? f(v * tEcho / 2 * 100, 3) + ' cm' : '–');
      S.set('e', done ? (echo * 100 < 0.1 ? f(echo * 100, 2) : f(echo * 100, 3)) + '% of the pulse' : '–');
      S.msg(!S.st.gel ? 'Air gap: ' + (Rskin * 100).toFixed(1) + '% reflects at the skin. Almost nothing reaches the bone.' : '');
    }
  });

  /* 6. Hearing aid and decibels */
  var sounds = [['Whisper', 30], ['Quiet speech', 45], ['Conversation', 60], ['Busy street', 80], ['Rock concert', 110]];
  Sim.make('sim-hearing', {
    aspect: 0.32, minH: 240,
    controls: [{ k: 'g', label: 'Hearing-aid gain', min: 0, max: 40, step: 1, v: 0, unit: 'dB' }],
    buttons: sounds.map(function (q, i) { return { label: q[0] + ' (' + q[1] + ' dB)', group: 's', on: i === 1, click: function (S) { S.st.s = i; } }; }),
    reads: [{ k: 'Iin', label: 'Input intensity' }, { k: 'out', label: 'Level at the eardrum', big: true }, { k: 'x', label: 'Gain multiplies intensity by' }, { k: 'safe', label: 'Safe exposure per day' }],
    init: function (S) { S.st.s = 1; },
    draw: function (S, c, W, H) {
      var K = C(), inp = sounds[S.st.s][1], out = inp + S.p.g, thr = 50;
      D.clear(c, W, H);
      var x0 = W * 0.08, x1 = W * 0.92, y = H * 0.5, L = function (db) { return x0 + db / 130 * (x1 - x0); };
      D.rect(c, L(0), y - 18, L(thr) - L(0), 36, 'rgba(140,140,140,0.25)', null, 4);
      D.rect(c, L(thr), y - 18, L(85) - L(thr), 36, 'rgba(46,125,50,0.25)', null, 0);
      D.rect(c, L(85), y - 18, L(120) - L(85), 36, 'rgba(220,120,30,0.3)', null, 0);
      D.rect(c, L(120), y - 18, L(130) - L(120), 36, 'rgba(200,40,40,0.4)', null, 4);
      D.text(c, 'patient cannot hear', (L(0) + L(thr)) / 2, y, { align: 'center', size: 11, weight: 600, color: K.muted });
      D.text(c, 'heard comfortably', (L(thr) + L(85)) / 2, y, { align: 'center', size: 11, weight: 600, color: K.c3 });
      D.text(c, 'damage risk', (L(85) + L(120)) / 2, y, { align: 'center', size: 11, weight: 600, color: K.c5 });
      D.text(c, 'pain', (L(120) + L(130)) / 2, y, { align: 'center', size: 11, weight: 600, color: K.pos });
      for (var d = 0; d <= 130; d += 10) { D.line(c, L(d), y + 18, L(d), y + 24, K.muted, 1); D.text(c, String(d), L(d), y + 34, { align: 'center', size: 10, color: K.muted }); }
      D.text(c, 'dB', x1 + 6, y + 34, { size: 10, color: K.muted });
      D.arrow(c, L(inp), y - 60, L(inp), y - 20, K.c1, 3); D.text(c, 'sound in: ' + inp + ' dB', L(inp), y - 70, { align: 'center', size: 12, weight: 700, color: K.c1 });
      if (S.p.g > 0) { D.arrow(c, L(out), y + 76, L(Math.min(out, 130)), y + 22, K.c2, 3); D.text(c, 'after aid: ' + out + ' dB', L(Math.min(out, 125)), y + 88, { align: 'center', size: 12, weight: 700, color: K.c2 }); }
      var I = 1e-12 * Math.pow(10, inp / 10), safe = 8 / Math.pow(2, (out - 85) / 3);
      S.set('Iin', f(I, 3) + ' W/m²'); S.set('out', out + ' dB'); S.set('x', f(Math.pow(10, S.p.g / 10), 3) + ' ×');
      S.set('safe', out <= 85 ? 'no limit (≤ 85 dB)' : safe >= 1 ? f(safe, 3) + ' h' : f(safe * 60, 3) + ' min');
      S.msg(out < thr ? 'Too quiet for this patient.' : out > 85 ? 'Too loud: risk of further hearing damage.' : 'Patient hears it safely.');
    }
  });

  /* 7. Attenuation vs resolution */
  Sim.make('sim-atten', {
    aspect: 0.45, minH: 280,
    controls: [{ k: 'f', label: 'Probe frequency', min: 1, max: 15, step: 0.5, v: 3, unit: 'MHz' }],
    reads: [{ k: 'lam', label: 'Wavelength &lambda; in tissue' }, { k: 'res', label: 'Finest detail &asymp; &lambda;/2', big: true }, { k: 'dep', label: 'Useful depth (60 dB budget)', big: true }, { k: 'use', label: 'Good for' }],
    draw: function (S, c, W, H) {
      var K = C(), fr = S.p.f, lam = 1540 / (fr * 1e6), depth = 60 / fr;
      D.clear(c, W, H);
      var box = { x: W * 0.08, y: H * 0.1, w: W * 0.86, h: H * 0.72 };
      var curve = function (F) { var pts = []; for (var d = 0; d <= 25; d += 0.25) pts.push([d, -F * d]); return pts; };
      var g = D.graph(c, box, { x0: 0, x1: 25, y0: -70, y1: 0, xl: 'depth (cm) →', yl: 'round-trip loss (dB)', hlines: [{ y: -60, label: 'too weak below this', color: K.pos }], vlines: [{ x: Math.min(depth, 25), label: 'max depth ' + f(depth, 3) + ' cm', color: K.c2 }] },
        [{ pts: curve(2), color: K.grid, w: 1.5 }, { pts: curve(12), color: K.grid, w: 1.5 }, { pts: curve(fr), color: K.c1, w: 3.5 }]);
      [0, 5, 10, 15, 20, 25].forEach(function (u) { D.text(c, String(u), g.px(u), box.y + box.h + 12, { size: 10, align: 'center', color: K.faint }); });
      [0, -20, -40, -60].forEach(function (u) { D.text(c, String(u), box.x - 4, g.py(u), { size: 10, align: 'right', color: K.faint }); });
      D.text(c, 'grey lines: 2 MHz and 12 MHz', box.x + box.w - 6, box.y + box.h - 26, { align: 'right', size: 11, color: K.muted });
      S.set('lam', f(lam * 1000, 3) + ' mm'); S.set('res', f(lam * 500, 3) + ' mm'); S.set('dep', f(depth, 3) + ' cm');
      S.set('use', fr <= 3.5 ? 'deep abdomen, obstetrics' : fr <= 7 ? 'heart, kidney, children' : 'thyroid, veins, skin, eyes');
    }
  });
})();

