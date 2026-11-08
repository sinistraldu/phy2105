/* PHY1201 Unit 4: interference of light simulations */
(function () {
  var D = Sim.D, f = Sim.fmt, C = Sim.col, PI = Math.PI, T = Sim.T3, clamp = Sim.clamp;
  function wlRGB(nm) { var r = 0, g = 0, b = 0; if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1; return [r, g, b]; }
  function wl(nm, a) { var c = wlRGB(nm); return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + (a === undefined ? 1 : a) + ')'; }
  var lamCtl = { k: 'lam', label: 'Wavelength &lambda;', min: 400, max: 700, step: 5, v: 589, unit: 'nm' };

  /* ---------- 2D: Huygens' principle, refraction ---------- */
  Sim.make('sim-huygens', {
    aspect: 0.5, animate: true,
    controls: [
      { k: 'i', label: 'Angle of incidence i', min: 0, max: 70, step: 1, v: 40, unit: '°' },
      { k: 'n2', label: 'Refractive index of lower medium &mu;', min: 1, max: 2.4, step: 0.01, v: 1.5 }
    ],
    reads: [{ k: 'r', label: 'Angle of refraction r', big: true }, { k: 's', label: 'Snell: sin i / sin r = v<sub>1</sub>/v<sub>2</sub> = &mu;' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, i = p.i * PI / 180, n = p.n2, r = Math.asin(Math.sin(i) / n), y0 = H * 0.5, lam = 34, ph = (S.t * 30) % lam;
      D.clear(c, W, H);
      D.rect(c, 0, y0, W, H - y0, 'rgba(47,93,120,0.12)', null, 0); D.line(c, 0, y0, W, y0, K.ink, 1.5);
      D.text(c, 'air (fast)', 10, y0 - 12, { size: 11, color: K.muted }); D.text(c, 'glass/water (slow, μ = ' + f(n, 3) + ')', 10, y0 + 14, { size: 11, color: K.muted });
      var dirI = [Math.sin(i), Math.cos(i)], dirR = [Math.sin(r), Math.cos(r)], cx = W * 0.5;
      c.save(); c.beginPath(); c.rect(0, 0, W, y0); c.clip();
      for (var s = -40; s < 40; s++) { var d = s * lam + ph, px = cx + dirI[0] * d * 1, py = y0 + dirI[1] * d; var tx = dirI[1], ty = -dirI[0]; D.line(c, px - tx * 900, py - ty * 900, px + tx * 900, py + ty * 900, K.c1, 1.6); }
      c.restore();
      c.save(); c.beginPath(); c.rect(0, y0, W, H - y0); c.clip();
      for (var s2 = -40; s2 < 40; s2++) { var d2 = (s2 * lam + ph) / n, qx = cx + dirR[0] * d2, qy = y0 + dirR[1] * d2, ux = dirR[1], uy = -dirR[0]; D.line(c, qx - ux * 900, qy - uy * 900, qx + ux * 900, qy + uy * 900, K.c2, 1.6); }
      c.restore();
      var tt = (S.t * 0.4) % 1, A = [W * 0.32, y0], Bd = 140, Bx = A[0] + Bd;
      var travel = tt * Bd * Math.sin(i);
      D.circle(c, A[0], A[1], 4, K.pos); D.circle(c, Bx, y0, 4, K.pos);
      D.circle(c, A[0], A[1], travel / n, null, K.pos, 1.5);
      D.text(c, 'wavelet from A grows at v/μ while the incident front reaches B', A[0], H * 0.95, { size: 11, color: K.pos });
      D.line(c, cx, y0 - H * 0.4, cx, y0 + H * 0.4, K.faint, 1, [4, 4]);
      S.set('r', f(r * 180 / PI, 3) + '°'); S.set('s', f(Math.sin(i), 3) + ' / ' + f(Math.sin(r), 3) + ' = ' + (p.i ? f(Math.sin(i) / Math.sin(r), 3) : '—') + '; wavelength in glass λ/μ');
    }
  });

  /* ---------- 2D: Young's double slit ---------- */
  Sim.make('sim-ydse', {
    aspect: 0.5,
    controls: [
      lamCtl,
      { k: 'd', label: 'Slit separation d', min: 0.1, max: 2, step: 0.01, v: 0.5, unit: 'mm' },
      { k: 'D', label: 'Screen distance D', min: 0.5, max: 3, step: 0.05, v: 1, unit: 'm' }
    ],
    buttons: [{ k: 'white', label: 'White light', click: function (S, b) { S.st.w = !S.st.w; b.classList.toggle('on', S.st.w); } }, { k: 'one', label: 'Cover one slit', click: function (S, b) { S.st.one = !S.st.one; b.classList.toggle('on', S.st.one); } }],
    reads: [{ k: 'b', label: 'Fringe width &beta; = &lambda;D/d', big: true }, { k: 'n', label: 'Bright fringes at y = n&lambda;D/d' }],
    init: function (S) { S.st.w = false; S.st.one = false; },
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, lam = p.lam * 1e-9, d = p.d * 1e-3, Dd = p.D, beta = lam * Dd / d, ym = 5.5 * beta;
      D.clear(c, W, H);
      var sx = W * 0.05, s1 = H * 0.42, s2 = H * 0.58, scr = W * 0.42;
      D.line(c, W * 0.12, H * 0.1, W * 0.12, H * 0.9, K.ink, 3); D.line(c, W * 0.12, s1 - 4, W * 0.12, s1 + 4, K.bg, 4); if (!S.st.one) D.line(c, W * 0.12, s2 - 4, W * 0.12, s2 + 4, K.bg, 4);
      D.circle(c, sx, H * 0.5, 5, S.st.w ? '#fff' : wl(p.lam));
      for (var k = 0; k < 6; k++) { D.circle(c, W * 0.12, s1, 12 + k * 22, null, wl(p.lam, 0.35), 1); if (!S.st.one) D.circle(c, W * 0.12, s2, 12 + k * 22, null, wl(p.lam, 0.35), 1); }
      var I = function (y, L) { var ph = PI * d * y / (L * Dd); return S.st.one ? 0.5 : Math.pow(Math.cos(ph), 2); };
      var pts = [];
      for (var py = 0; py < H * 0.8; py++) {
        var y = (py / (H * 0.8) - 0.5) * 2 * ym, col;
        if (S.st.w) { var r = 0, g = 0, b = 0; for (var L = 400; L <= 700; L += 20) { var c3 = wlRGB(L), ii = I(y, L * 1e-9); r += c3[0] * ii; g += c3[1] * ii; b += c3[2] * ii; } col = 'rgb(' + Math.min(255, r * 30) + ',' + Math.min(255, g * 30) + ',' + Math.min(255, b * 30) + ')'; }
        else { var ii2 = I(y, lam), c4 = wlRGB(p.lam); col = 'rgb(' + Math.round(c4[0] * 255 * ii2) + ',' + Math.round(c4[1] * 255 * ii2) + ',' + Math.round(c4[2] * 255 * ii2) + ')'; }
        c.fillStyle = col; c.fillRect(scr, H * 0.1 + py, W * 0.06, 1.2); pts.push([I(y, lam), y]);
      }
      D.text(c, 'screen (±' + f(ym * 1000, 2) + ' mm)', scr + W * 0.03, H * 0.06, { size: 11, align: 'center', color: K.muted });
      var box = { x: W * 0.55, y: H * 0.1, w: W * 0.42, h: H * 0.8 };
      D.rect(c, box.x, box.y, box.w, box.h, K.surface, K.line, 6, 1);
      D.poly(c, pts.map(function (q, j) { return [box.x + 8 + q[0] * (box.w - 16), box.y + j]; }), K.c1, 2, false);
      D.text(c, 'intensity I = 4I₀cos²(πdy/λD)', box.x + 8, box.y + box.h + 14, { size: 11, color: K.muted });
      S.set('b', f(beta * 1000, 3) + ' mm'); S.set('n', S.st.one ? 'none: one slit gives no interference' : '0, ±' + f(beta * 1000, 3) + ', ±' + f(2 * beta * 1000, 3) + ' mm …');
    }
  });

  /* ---------- 3D: ripple tank, two coherent sources ---------- */
  var GN = 110;
  Sim.make('sim-ripple3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.2, ph: 0.85, r: 15 },
    controls: [
      { k: 'd', label: 'Source separation d', min: 0.5, max: 5, step: 0.1, v: 2.5 },
      { k: 'lam', label: 'Wavelength &lambda;', min: 0.5, max: 2.5, step: 0.05, v: 1 },
      { k: 'ph', label: 'Phase difference between sources', min: 0, max: 360, step: 10, v: 0, unit: '°' }
    ],
    reads: [{ k: 'n', label: 'Nodal lines (d sin&theta; = (n+&frac12;)&lambda;)', big: true }, { k: 'coh', label: 'Coherent sources' }],
    init: function (S) {
      var st = S.st; st.geo = new THREE.PlaneGeometry(12, 12, GN, GN); st.geo.rotateX(-PI / 2);
      var n = st.geo.attributes.position.count; st.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      st.mesh = new THREE.Mesh(st.geo, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, side: THREE.DoubleSide })); S.scene.add(st.mesh);
      st.s1 = T.sphere(0.15, 0x22262b); st.s2 = T.sphere(0.15, 0x22262b); S.scene.add(st.s1); S.scene.add(st.s2);
    },
    draw: function (S, c, W, H) {
      var st = S.st, p = S.p, k = 2 * PI / p.lam, w = 3, t = S.t, pos = st.geo.attributes.position, col = st.geo.attributes.color, ph = p.ph * PI / 180, x1 = -p.d / 2, x2 = p.d / 2, z0 = -5.5;
      st.s1.position.set(x1, 0.2, z0); st.s2.position.set(x2, 0.2, z0);
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), z = pos.getZ(i), r1 = Math.hypot(x - x1, z - z0) + 0.2, r2 = Math.hypot(x - x2, z - z0) + 0.2;
        var y = 0.35 * (Math.sin(k * r1 - w * t) / Math.sqrt(r1) + Math.sin(k * r2 - w * t + ph) / Math.sqrt(r2));
        pos.setY(i, y); var v = clamp(0.5 + y * 1.2, 0, 1); col.setXYZ(i, 0.18 + 0.75 * v, 0.36 + 0.5 * v, 0.47 + 0.45 * v);
      }
      pos.needsUpdate = true; col.needsUpdate = true; st.geo.computeVertexNormals();
      var n = 0; for (var m = -20; m <= 20; m++) { var s = (m + 0.5 - ph / (2 * PI)) * p.lam / p.d; if (Math.abs(s) < 1) n++; }
      S.set('n', String(n) + ' (more with larger d or smaller λ)'); S.set('coh', 'same frequency, fixed phase difference ' + p.ph + '°');
    }
  });

  /* ---------- 2D: displacement of fringes by a thin plate ---------- */
  Sim.make('sim-fringeshift', {
    aspect: 0.45,
    controls: [
      { k: 't', label: 'Plate thickness t', min: 0, max: 10, step: 0.1, v: 3, unit: 'µm' },
      { k: 'mu', label: 'Refractive index &mu;', min: 1, max: 1.8, step: 0.01, v: 1.5 },
      lamCtl,
      { k: 'd', label: 'Slit separation d', min: 0.2, max: 2, step: 0.05, v: 0.5, unit: 'mm' }
    ],
    reads: [{ k: 'x0', label: 'Shift x<sub>0</sub> = (&mu;&minus;1)tD/d (D = 1 m)', big: true }, { k: 'N', label: 'Fringes shifted N = (&mu;&minus;1)t/&lambda;' }, { k: 'b', label: 'Fringe width &beta; (unchanged)' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, lam = p.lam * 1e-9, d = p.d * 1e-3, Dd = 1, extra = (p.mu - 1) * p.t * 1e-6, shift = extra * Dd / d, beta = lam * Dd / d, ym = 5 * beta, c4 = wlRGB(p.lam);
      D.clear(c, W, H);
      var y0 = H * 0.3, y1 = H * 0.7, x0 = W * 0.05, w = W * 0.9;
      [[0, y0, 'without plate'], [extra, y1, 'with plate over the upper slit']].forEach(function (q) {
        for (var px = 0; px < w; px++) { var y = (px / w - 0.5) * 2 * ym, ii = Math.pow(Math.cos(PI * (d * y / Dd - q[0]) / lam), 2); c.fillStyle = 'rgb(' + Math.round(c4[0] * 255 * ii) + ',' + Math.round(c4[1] * 255 * ii) + ',' + Math.round(c4[2] * 255 * ii) + ')'; c.fillRect(x0 + px, q[1] - 30, 1.2, 60); }
        D.text(c, q[2], x0, q[1] - 40, { size: 11.5, color: K.muted, weight: 600 });
        var cx = x0 + w / 2 + q[0] * Dd / d / (2 * ym) * w; if (Math.abs(cx - x0 - w / 2) < w / 2) { D.text(c, '▼ central fringe', cx, q[1] + 44, { size: 11, align: 'center', color: K.pos, weight: 700 }); }
      });
      D.line(c, x0 + w / 2, y0 + 32, x0 + w / 2, y1 + 32, K.faint, 1, [4, 3]);
      S.set('x0', f(shift * 1000, 3) + ' mm'); S.set('N', f(extra / lam, 3) + ' fringes'); S.set('b', f(beta * 1000, 3) + ' mm');
    }
  });

  /* ---------- 2D: Fresnel biprism ---------- */
  Sim.make('sim-biprism', {
    aspect: 0.5,
    controls: [
      { k: 'al', label: 'Prism angle &alpha;', min: 0.5, max: 2, step: 0.05, v: 1, unit: '°' },
      { k: 'mu', label: 'Refractive index &mu;', min: 1.4, max: 1.7, step: 0.01, v: 1.5 },
      { k: 'a', label: 'Source to prism a', min: 5, max: 40, step: 1, v: 20, unit: 'cm' },
      { k: 'b', label: 'Prism to screen b', min: 30, max: 150, step: 5, v: 80, unit: 'cm' },
      lamCtl
    ],
    reads: [{ k: 'd', label: 'Virtual source separation d = 2a(&mu;&minus;1)&alpha;' }, { k: 'B', label: 'Fringe width &beta; = &lambda;(a+b)/d', big: true }, { k: 'W', label: 'Width of overlap region on screen' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, al = p.al * PI / 180, dev = (p.mu - 1) * al, a = p.a / 100, b = p.b / 100, lam = p.lam * 1e-9, d = 2 * a * dev, beta = lam * (a + b) / d, ov = 2 * b * dev;
      D.clear(c, W, H);
      var L = a + b, sx = W * 0.85 / L, x0 = W * 0.05, cy = H * 0.5, vy = H * 0.9 / 0.12, px = x0 + a * sx, scrx = x0 + L * sx;
      D.circle(c, x0, cy, 5, wl(p.lam)); D.text(c, 'S', x0, cy - 14, { size: 12, align: 'center', weight: 700 });
      D.circle(c, x0, cy - d / 2 * vy, 4, null, K.c2, 1.5); D.circle(c, x0, cy + d / 2 * vy, 4, null, K.c2, 1.5); D.text(c, 'S₁, S₂ (virtual)', x0 + 8, cy - d / 2 * vy - 12, { size: 11, color: K.c2 });
      D.poly(c, [[px, cy - H * 0.3], [px + 22, cy], [px, cy + H * 0.3]], K.c1, 1.5, true, 'rgba(180,68,31,0.15)');
      for (var s = -1; s <= 1; s += 2) {
        var yp = cy + s * H * 0.12, yS = cy - s * d / 2 * vy, slope = (yp - yS) / (px - x0);
        D.line(c, x0, cy, px, yp, wl(p.lam, 0.6), 1.2); D.line(c, px, yp, scrx, yp + slope * (scrx - px), wl(p.lam, 0.6), 1.2);
        D.line(c, x0, yS, px, yp, K.c2, 1, [3, 4]);
        var yp2 = cy + s * 4, sl2 = (yp2 - yS) / (px - x0); D.line(c, px, yp2, scrx, yp2 + sl2 * (scrx - px), wl(p.lam, 0.6), 1.2);
      }
      var ovpx = ov * vy; D.rect(c, scrx - 3, cy - ovpx / 2, 6, ovpx, 'rgba(198,40,40,0.25)', null, 0); D.line(c, scrx, H * 0.05, scrx, H * 0.95, K.ink, 2);
      D.text(c, 'interference region', scrx - 6, cy - ovpx / 2 - 10, { size: 11, align: 'right', color: K.pos });
      D.text(c, 'transverse distances exaggerated', W * 0.5, H * 0.97, { size: 10.5, align: 'center', color: K.faint });
      S.set('d', f(d * 1000, 3) + ' mm'); S.set('B', f(beta * 1000, 3) + ' mm'); S.set('W', f(ov * 1000, 3) + ' mm (≈ ' + Math.floor(ov / beta) + ' fringes)');
    }
  });

  /* ---------- 2D: wedge-shaped film ---------- */
  Sim.make('sim-wedge', {
    aspect: 0.45,
    controls: [
      { k: 'th', label: 'Wedge angle &theta;', min: 0.1, max: 2, step: 0.05, v: 0.5, unit: 'mrad' },
      { k: 'mu', label: 'Refractive index of the film &mu;', min: 1, max: 1.6, step: 0.01, v: 1 },
      lamCtl
    ],
    reads: [{ k: 'b', label: 'Fringe spacing &beta; = &lambda;/2&mu;&theta;', big: true }, { k: 'n', label: 'Dark fringes on 10 mm' }, { k: 'edge', label: 'At the contact edge' }],
    draw: function (S, c, W, H) {
      var K = C(), p = S.p, th = p.th * 1e-3, lam = p.lam * 1e-9, beta = lam / (2 * p.mu * th), Lx = 0.01, c4 = wlRGB(p.lam), x0 = W * 0.05, w = W * 0.9;
      D.clear(c, W, H);
      for (var px = 0; px < w; px++) { var x = Lx * px / w, t = x * th, ii = Math.pow(Math.sin(2 * PI * p.mu * t / lam), 2); c.fillStyle = 'rgb(' + Math.round(c4[0] * 255 * ii) + ',' + Math.round(c4[1] * 255 * ii) + ',' + Math.round(c4[2] * 255 * ii) + ')'; c.fillRect(x0 + px, H * 0.08, 1.2, H * 0.4); }
      D.text(c, 'view from above (reflected light)', x0, H * 0.05, { size: 11, color: K.muted });
      var yb = H * 0.85, ang = Math.min(0.25, th * 120);
      D.rect(c, x0, yb, w, 12, '#c9d6de', K.line, 1); D.poly(c, [[x0, yb], [x0 + w, yb - w * ang], [x0 + w, yb - w * ang - 12], [x0, yb - 12]], K.c2, 1.2, true, 'rgba(201,214,222,0.8)');
      D.poly(c, [[x0, yb], [x0 + w, yb], [x0 + w, yb - w * ang]], null, 0, true, p.mu > 1.01 ? 'rgba(47,93,120,0.25)' : 'rgba(255,255,255,0.1)');
      D.text(c, 'side view (angle exaggerated); film thickness t = xθ', x0 + w, yb + 26, { size: 11, align: 'right', color: K.muted });
      D.text(c, 'contact', x0, yb + 26, { size: 11, color: K.muted });
      S.set('b', f(beta * 1000, 3) + ' mm'); S.set('n', String(Math.floor(Lx / beta) + 1)); S.set('edge', 'dark: t = 0 but reflection at the lower surface adds a half-wave');
    }
  });

  /* ---------- 3D: Newton's rings ---------- */
  function ringTex(S) {
    var st = S.st, p = S.p, N = 256, cv = st.cv, x = cv.getContext('2d'), img = x.createImageData(N, N), rmax = 4e-3, R = p.R, lam = p.lam * 1e-9, cc = wlRGB(p.lam);
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var r = Math.hypot(i - N / 2, j - N / 2) / (N / 2) * rmax, t = r * r / (2 * R), ph = 2 * PI * 2 * p.mu * t / lam, ii = st.trans ? Math.pow(Math.cos(ph / 2), 2) : Math.pow(Math.sin(ph / 2), 2), k = (j * N + i) * 4;
      ii = 0.08 + 0.92 * ii; img.data[k] = cc[0] * 255 * ii; img.data[k + 1] = cc[1] * 255 * ii; img.data[k + 2] = cc[2] * 255 * ii; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); st.tex.needsUpdate = true;
  }
  Sim.make('sim-newton3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.3, ph: 0.75, r: 11 },
    controls: [
      { k: 'R', label: 'Radius of curvature R', min: 0.5, max: 5, step: 0.1, v: 1, unit: 'm' },
      lamCtl,
      { k: 'mu', label: 'Liquid between lens and plate &mu;', min: 1, max: 1.6, step: 0.01, v: 1 }
    ],
    buttons: [{ label: 'Reflected', group: 'v', on: true, click: function (S) { S.st.trans = false; ringTex(S); } }, { label: 'Transmitted', group: 'v', click: function (S) { S.st.trans = true; ringTex(S); } }],
    reads: [{ k: 'r', label: 'Radius of n-th dark ring r<sub>n</sub> = &radic;(n&lambda;R/&mu;)' }, { k: 'D', label: 'D<sub>n+p</sub>&sup2; &minus; D<sub>n</sub>&sup2; = 4p&lambda;R/&mu; (p = 5)', big: true }, { k: 'c', label: 'Centre spot' }],
    init: function (S) {
      var st = S.st; st.trans = false; st.cv = document.createElement('canvas'); st.cv.width = st.cv.height = 256; st.tex = new THREE.CanvasTexture(st.cv);
      var plate = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 8), T.mat(0xc9d6de, { opacity: 0.7 })); plate.position.y = -0.2; S.scene.add(plate);
      st.rings = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), new THREE.MeshBasicMaterial({ map: st.tex })); st.rings.rotation.x = -PI / 2; st.rings.position.y = 0.01; S.scene.add(st.rings);
      st.lens = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 24, 0, 2 * PI, 0, 0.62), T.mat(0xdfe8ee, { opacity: 0.12, side: THREE.DoubleSide })); st.lens.material.depthWrite = false; st.lens.rotation.x = PI; st.lens.position.y = 6.0; S.scene.add(st.lens);
      var top = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.05, 48), T.mat(0xdfe8ee, { opacity: 0.12 })); top.material.depthWrite = false; top.position.y = 6 - 6 * Math.cos(0.62); S.scene.add(top);
      ringTex(S);
    },
    onChange: ringTex,
    draw: function (S) {
      var p = S.p, lam = p.lam * 1e-9, rn = function (n) { return Math.sqrt(n * lam * p.R / p.mu); };
      S.set('r', 'r₁ = ' + f(rn(1) * 1000, 3) + ' mm, r₁₀ = ' + f(rn(10) * 1000, 3) + ' mm'); S.set('D', f(4 * 5 * lam * p.R / p.mu * 1e6, 3) + ' mm²'); S.set('c', S.st.trans ? 'bright (transmitted)' : 'dark (half-wave loss on reflection at the plate)');
    }
  });

  /* ---------- 3D: Michelson interferometer ---------- */
  function fringeTex(S) {
    var st = S.st, p = S.p, N = 200, x = st.cv.getContext('2d'), img = x.createImageData(N, N), lam = p.lam * 1e-9, d = st.d * 1e-6, cc = wlRGB(p.lam);
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var th = Math.hypot(i - N / 2, j - N / 2) / (N / 2) * 0.12, ii = Math.pow(Math.cos(2 * PI * d * Math.cos(th) / lam), 2), k = (j * N + i) * 4; img.data[k] = cc[0] * 255 * ii; img.data[k + 1] = cc[1] * 255 * ii; img.data[k + 2] = cc[2] * 255 * ii; img.data[k + 3] = 255; }
    x.putImageData(img, 0, 0); st.tex.needsUpdate = true;
  }
  Sim.make('sim-michelson3d', {
    webgl: true, aspect: 0.55, camera: { th: 0.6, ph: 0.7, r: 14 },
    controls: [{ k: 'd0', label: 'Mirror M<sub>2</sub> offset d (path difference 2d)', min: 0, max: 400, step: 0.05, v: 150, unit: 'µm' }, lamCtl],
    buttons: [{ k: 'go', label: 'Move M₂ slowly', click: function (S, b) { S.st.go = !S.st.go; b.classList.toggle('on', S.st.go); } }],
    reads: [{ k: 'd', label: 'Mirror offset d' }, { k: 'N', label: 'Fringes passed since d = 0: N = 2d/&lambda;', big: true }, { k: 'c', label: 'Centre' }],
    init: function (S) {
      var st = S.st; st.d = 150; st.go = false; st.cv = document.createElement('canvas'); st.cv.width = st.cv.height = 200; st.tex = new THREE.CanvasTexture(st.cv);
      var bs = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.06), T.mat(0x8fc1de, { opacity: 0.6 })); bs.rotation.y = PI / 4; S.scene.add(bs);
      var m1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.15), T.mat(0x59606a)); m1.position.set(0, 0, -4); S.scene.add(m1);
      st.m2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 1.2), T.mat(0xb4441f)); S.scene.add(st.m2);
      var src = T.sphere(0.25, 0xffb300); src.position.set(-5, 0, 0); S.scene.add(src);
      var scr = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: st.tex, side: THREE.DoubleSide })); scr.position.set(0, 0, 4); S.scene.add(scr);
      st.beam = [T.line(S.scene, 0xffb300, 2), T.line(S.scene, 0xffb300, 3), T.line(S.scene, 0xffb300, 3), T.line(S.scene, 0xffb300, 2)];
      [['M₁ (fixed)', 0, 1.2, -4], ['M₂ (movable)', 4.5, 1.2, 0], ['beam splitter', 0, 1.2, 0], ['screen', 0, 1.8, 4], ['source', -5, 0.8, 0]].forEach(function (q) { var l = T.label(S.scene, q[0], '#22262b', 0.8); l.position.set(q[1], q[2], q[3]); });
      fringeTex(S);
    },
    onChange: function (S, k) { if (k === 'd0') S.st.d = S.p.d0; fringeTex(S); },
    draw: function (S, c, W, H, dt) {
      var st = S.st, p = S.p; if (st.go && dt > 0) { st.d = (st.d + dt * 0.15) % 400; fringeTex(S); }
      var x2 = 4 + st.d * 0.003; st.m2.position.set(x2, 0, 0);
      T.setLine(st.beam[0], [[-5, 0, 0], [0, 0, 0]]); T.setLine(st.beam[1], [[0, 0.05, 0], [0, 0.05, -4], [0, 0.05, 0]]); T.setLine(st.beam[2], [[0, -0.05, 0], [x2, -0.05, 0], [0, -0.05, 0]]); T.setLine(st.beam[3], [[0, 0, 0], [0, 0, 4]]);
      var N = 2 * st.d * 1e-6 / (p.lam * 1e-9), fr = N - Math.floor(N);
      S.set('d', f(st.d, 4) + ' µm'); S.set('N', f(N, 4)); S.set('c', fr < 0.15 || fr > 0.85 ? 'bright' : Math.abs(fr - 0.5) < 0.15 ? 'dark' : 'in between');
    }
  });
})();
