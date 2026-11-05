/* PHY1203 shared code: page chrome (theme, menu) and a tiny toolkit for the simulations.
   Every simulation follows the same pattern so students only learn the controls once:
   one picture, a few sliders, a box of live numbers, and a "what to notice" line. */
(function () {
  'use strict';

  /* ---------- page chrome ---------- */
  var root = document.documentElement;
  try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    var tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
    var mb = document.getElementById('menuBtn'), nl = document.getElementById('navlist');
    if (mb && nl) {
      mb.addEventListener('click', function () { var o = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
      nl.addEventListener('click', function (e) { if (e.target.tagName === 'A') nl.classList.remove('open'); });
    }
  });

  /* ---------- colours (read from CSS so both themes work) ---------- */
  var colCache = null;
  function col() {
    if (colCache) return colCache;
    var cs = getComputedStyle(root), g = function (n) { return cs.getPropertyValue(n).trim(); };
    colCache = {
      ink: g('--ink'), muted: g('--muted'), faint: g('--faint'), line: g('--line'), grid: g('--grid'),
      bg: g('--canvas'), surface: g('--surface-2'), accent: g('--accent-2'),
      c1: g('--c1'), c2: g('--c2'), c3: g('--c3'), c4: g('--c4'), c5: g('--c5'), pos: g('--pos'), neg: g('--neg'),
      water: root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches) ? 'rgba(80,150,220,0.28)' : 'rgba(80,150,220,0.20)'
    };
    return colCache;
  }
  var sims = [];
  function invalidate() { colCache = null; sims.forEach(function (s) { s.redraw(); }); }
  new MutationObserver(invalidate).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', invalidate); } catch (e) {}

  /* ---------- number formatting ---------- */
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function fmt(x, sig) {
    sig = sig || 3;
    if (!isFinite(x)) return '∞';
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 0.01 && a < 1e5) {
      var d = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
      return (+x.toFixed(Math.min(d, 6))).toLocaleString('en-US', { maximumFractionDigits: Math.min(d, 6) });
    }
    var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
    if (Math.abs(+m.toFixed(sig - 1)) >= 10) { e += 1; m /= 10; }
    return m.toFixed(sig - 1) + ' × 10' + String(e).split('').map(function (c) { return SUP[c]; }).join('');
  }

  /* ---------- drawing helpers ---------- */
  var D = {
    clear: function (c, W, H) { c.fillStyle = col().bg; c.fillRect(0, 0, W, H); },
    line: function (c, x1, y1, x2, y2, color, w, dash) {
      c.save(); c.strokeStyle = color; c.lineWidth = w || 2; if (dash) c.setLineDash(dash);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
    },
    poly: function (c, pts, color, w, close, fill) {
      if (!pts.length) return;
      c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      if (close) c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (color) { c.strokeStyle = color; c.lineWidth = w || 2; c.lineJoin = 'round'; c.stroke(); }
      c.restore();
    },
    arrow: function (c, x1, y1, x2, y2, color, w, head) {
      w = w || 3; head = head || Math.max(8, w * 3.2);
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 1) return;
      var ux = dx / L, uy = dy / L, h = Math.min(head, L * 0.6);
      c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.8, y2 - uy * h * 0.8); c.stroke();
      c.beginPath(); c.moveTo(x2, y2);
      c.lineTo(x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5);
      c.lineTo(x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5);
      c.closePath(); c.fill(); c.restore();
    },
    circle: function (c, x, y, r, fill, stroke, w) {
      c.save(); c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = w || 2; c.stroke(); }
      c.restore();
    },
    rect: function (c, x, y, w, h, fill, stroke, r, lw) {
      c.save(); c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, h, r || 0); else c.rect(x, y, w, h);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1.5; c.stroke(); }
      c.restore();
    },
    text: function (c, s, x, y, o) {
      o = o || {};
      c.save();
      c.font = (o.weight || 500) + ' ' + (o.size || 13) + 'px ' + (o.serif ? '"Source Serif 4",Georgia,serif' : 'Inter,system-ui,sans-serif');
      if (o.italic) c.font = 'italic ' + c.font;
      c.fillStyle = o.color || col().ink; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
      if (o.bg) {
        var m = c.measureText(s), pw = m.width + 10, ph = (o.size || 13) + 8;
        var bx = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw + 5 : x - 5;
        D.rect(c, bx, y - ph / 2, pw, ph, o.bg, null, 5);
      }
      c.fillText(s, x, y); c.restore();
    },
    /* simple x-y graph. box = {x,y,w,h}; ax = {x0,x1,y0,y1,xl,yl,xt,yt}; series = [{pts,color,w,dash}] */
    graph: function (c, box, ax, series) {
      var C = col();
      D.rect(c, box.x, box.y, box.w, box.h, C.surface, C.line, 6, 1);
      var px = function (x) { return box.x + (x - ax.x0) / (ax.x1 - ax.x0) * box.w; };
      var py = function (y) { return box.y + box.h - (y - ax.y0) / (ax.y1 - ax.y0) * box.h; };
      c.save(); c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
      (ax.hlines || []).forEach(function (h) { D.line(c, box.x, py(h.y), box.x + box.w, py(h.y), h.color || C.faint, 1.2, [5, 4]); if (h.label) D.text(c, h.label, box.x + box.w - 6, py(h.y) - 9, { size: 11, align: 'right', color: h.color || C.muted }); });
      (ax.vlines || []).forEach(function (v) { D.line(c, px(v.x), box.y, px(v.x), box.y + box.h, v.color || C.faint, 1.2, [5, 4]); if (v.label) D.text(c, v.label, px(v.x) + 5, box.y + 28, { size: 11, color: v.color || C.muted }); });
      if (ax.y0 < 0 && ax.y1 > 0) D.line(c, box.x, py(0), box.x + box.w, py(0), C.faint, 1);
      series.forEach(function (s) {
        if (!s.pts || s.pts.length < 2) return;
        D.poly(c, s.pts.map(function (p) { return [px(p[0]), py(p[1])]; }), s.color, s.w || 2.5, false, null);
      });
      (ax.dots || []).forEach(function (d) { D.circle(c, px(d.x), py(d.y), d.r || 5, d.color); });
      c.restore();
      if (ax.xl) D.text(c, ax.xl, box.x + box.w - 6, box.y + box.h - 10, { size: 11.5, align: 'right', color: C.muted });
      if (ax.yl) D.text(c, ax.yl, box.x + 6, box.y + 11, { size: 11.5, color: C.muted, weight: 600 });
      return { px: px, py: py };
    },
    spring: function (c, x1, y1, x2, y2, coils, amp, color, w) {
      var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, pts = [[x1, y1]];
      for (var i = 1; i < coils * 2; i++) { var t = i / (coils * 2), s = (i % 2 ? 1 : -1) * amp; pts.push([x1 + dx * t - uy * s, y1 + dy * t + ux * s]); }
      pts.push([x2, y2]); D.poly(c, pts, color, w || 2);
    }
  };

  /* ---------- 3D support (three.js) ---------- */
  function placeCam(S) {
    var o = S.orbit, t = o.target;
    S.camera.position.set(t[0] + o.r * Math.sin(o.ph) * Math.sin(o.th), t[1] + o.r * Math.cos(o.ph), t[2] + o.r * Math.sin(o.ph) * Math.cos(o.th));
    S.camera.lookAt(t[0], t[1], t[2]);
  }
  function setup3d(S, o) {
    if (!window.THREE) return false;
    try { S.renderer = new THREE.WebGLRenderer({ canvas: S.cv, antialias: true }); } catch (e) { return false; }
    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(40, 2, 0.1, 500);
    var c = o.camera || {};
    S.orbit = { th: c.th !== undefined ? c.th : 0.6, ph: c.ph !== undefined ? c.ph : 1.1, r: c.r || 10, target: c.target || [0, 0, 0] };
    placeCam(S);
    S.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    var dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(5, 10, 7); S.scene.add(dl);
    S.cv.parentNode.style.position = 'relative';
    var hint = document.createElement('div');
    hint.textContent = 'drag to rotate the 3D view';
    hint.style.cssText = 'position:absolute;right:12px;margin-top:8px;font:600 11px Inter,system-ui,sans-serif;color:var(--muted);background:var(--surface-2);padding:3px 8px;border-radius:999px;pointer-events:none;z-index:1';
    S.cv.parentNode.insertBefore(hint, S.cv);
    return true;
  }
  /* small 3D drawing kit */
  var T3 = {
    mat: function (color, o) { o = o || {}; return new THREE.MeshPhongMaterial({ color: color, transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide, shininess: 40 }); },
    sphere: function (r, color, o) { return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), T3.mat(color, o)); },
    arrow: function (scene, color) { var a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, new THREE.Color(color).getHex(), 0.35, 0.22); scene.add(a); return a; },
    setArrow: function (a, from, vec, head) {
      var v = new THREE.Vector3(vec[0], vec[1], vec[2]), L = v.length();
      a.visible = L > 1e-3; if (!a.visible) return;
      a.position.set(from[0], from[1], from[2]); a.setDirection(v.normalize());
      var h = Math.min(head || 0.35, L * 0.45); a.setLength(L, h, h * 0.65);
    },
    line: function (scene, color, n) { var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); var l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: color })); scene.add(l); return l; },
    setLine: function (l, pts) { var a = l.geometry.attributes.position; for (var i = 0; i < pts.length && i < a.count; i++) a.setXYZ(i, pts[i][0], pts[i][1], pts[i][2]); l.geometry.setDrawRange(0, Math.min(pts.length, a.count)); a.needsUpdate = true; },
    grid: function (scene, size, y) { var g = new THREE.GridHelper(size, size, 0x88998c, 0xbfcabf); g.position.y = y || 0; g.material.transparent = true; g.material.opacity = 0.35; scene.add(g); return g; },
    label: function (scene, text, color, scale) {
      var cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; var x = cv.getContext('2d');
      x.font = '600 34px Inter,system-ui,sans-serif'; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 32);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
      var s = scale || 1; sp.scale.set(2 * s, 0.5 * s, 1); scene.add(sp); return sp;
    }
  };

  /* ---------- the simulation builder ---------- */
  function make(id, o) {
    var el = document.getElementById(id);
    if (!el) return null;
    var note = el.querySelector('.sim-note');
    var cv = document.createElement('canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', (el.querySelector('h4') || {}).textContent || 'simulation');
    var ui = document.createElement('div'); ui.className = 'sim-ui';
    var left = document.createElement('div'); left.className = 'ctrls';
    var right = document.createElement('div'); right.className = 'reads';
    ui.appendChild(left); ui.appendChild(right);
    el.insertBefore(cv, note); el.insertBefore(ui, note);
    var ctx = o.webgl ? null : cv.getContext('2d');
    var S = { p: {}, st: {}, t: 0, W: 0, H: 0, el: el, cv: cv, ctx: ctx, running: o.autoplay !== false };
    if (o.webgl && !setup3d(S, o)) { o.webgl = false; o.draw = function (S, c, W, H) { D.clear(c, W, H); D.text(c, 'This 3D view needs an internet connection (three.js) and WebGL.', W / 2, H / 2, { align: 'center', color: col().muted }); }; ctx = S.ctx = cv.getContext('2d'); }
    var outs = {}, reads = {}, btns = {};

    (o.controls || []).forEach(function (c) {
      var w = document.createElement('div'); w.className = 'ctrl';
      var lab = document.createElement('label'), out = document.createElement('output'), inp = document.createElement('input');
      var span = document.createElement('span'); span.innerHTML = c.label;
      inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step || (c.max - c.min) / 100; inp.value = c.v;
      inp.setAttribute('aria-label', span.textContent);
      lab.appendChild(span); lab.appendChild(out); w.appendChild(lab); w.appendChild(inp); left.appendChild(w);
      var update = function () {
        var raw = parseFloat(inp.value);
        S.p[c.k] = c.map ? c.map(raw) : raw;
        out.textContent = c.show ? c.show(S.p[c.k]) : (fmt(S.p[c.k], c.sig || 3) + (c.unit ? ' ' + c.unit : ''));
      };
      inp.addEventListener('input', function () { update(); if (o.onChange) o.onChange(S, c.k); S.redraw(); });
      update(); outs[c.k] = { inp: inp, update: update };
    });
    if (o.buttons && o.buttons.length) {
      var bw = document.createElement('div'); bw.className = 'btns';
      o.buttons.forEach(function (b) {
        var bt = document.createElement('button'); bt.className = 'btn'; bt.type = 'button'; bt.textContent = b.label;
        if (b.group) bt.dataset.group = b.group;
        bt.addEventListener('click', function () {
          if (b.group) { bw.querySelectorAll('[data-group="' + b.group + '"]').forEach(function (x) { x.classList.remove('on'); }); bt.classList.add('on'); }
          b.click(S, bt); S.redraw();
        });
        if (b.on) bt.classList.add('on');
        bw.appendChild(bt); btns[b.k || b.label] = bt;
      });
      left.appendChild(bw);
    }
    (o.reads || []).forEach(function (r) {
      var d = document.createElement('div'); d.className = 'read' + (r.big ? ' big' : '');
      d.innerHTML = '<span>' + r.label + '</span><b>–</b>';
      right.appendChild(d); reads[r.k] = d.querySelector('b');
    });
    var msg = document.createElement('div'); msg.className = 'read msg'; msg.style.display = 'none'; right.appendChild(msg);
    if (!o.reads || !o.reads.length) right.style.display = 'none';

    S.set = function (k, v) { if (reads[k]) reads[k].textContent = v; };
    S.msg = function (h) { msg.style.display = h ? '' : 'none'; if (msg.innerHTML !== h) msg.innerHTML = h || ''; };
    S.btn = function (k) { return btns[k]; };
    S.setControl = function (k, v) { if (outs[k]) { outs[k].inp.value = v; outs[k].update(); } };
    var frame = function (dt) {
      if (o.webgl) { S.scene.background = new THREE.Color(col().bg); o.draw(S, null, S.W, S.H, dt); S.renderer.render(S.scene, S.camera); }
      else { ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); o.draw(S, ctx, S.W, S.H, dt); }
    };
    S.redraw = function () { if (S.W) frame(0); };

    function resize() {
      var w = cv.clientWidth || el.clientWidth;
      var h = Math.round(Math.min(o.maxH || 440, Math.max(o.minH || 250, w * (o.aspect || 0.5))));
      if (w === S.W && h === S.H) return;
      S.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.style.height = h + 'px';
      if (o.webgl) { S.renderer.setPixelRatio(S.dpr); S.renderer.setSize(w, h, false); S.camera.aspect = w / h; S.camera.updateProjectionMatrix(); }
      else { cv.width = Math.round(w * S.dpr); cv.height = Math.round(h * S.dpr); }
      S.W = w; S.H = h; S.redraw();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);

    if (o.pointer) {
      var down = false;
      var pos = function (e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', function (e) { down = true; cv.setPointerCapture(e.pointerId); var p = pos(e); o.pointer(S, 'down', p[0], p[1]); S.redraw(); });
      cv.addEventListener('pointermove', function (e) { if (!down) return; var p = pos(e); o.pointer(S, 'move', p[0], p[1]); S.redraw(); });
      cv.addEventListener('pointerup', function () { down = false; });
      cv.style.cursor = 'pointer';
    } else if (o.webgl) {
      var drag = null;
      cv.style.cursor = 'grab';
      cv.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
      cv.addEventListener('pointermove', function (e) {
        if (!drag) return;
        S.orbit.th -= (e.clientX - drag[0]) * 0.008; S.orbit.ph = Sim.clamp(S.orbit.ph - (e.clientY - drag[1]) * 0.008, 0.12, 3.0);
        drag = [e.clientX, e.clientY]; placeCam(S); S.redraw();
      });
      cv.addEventListener('pointerup', function () { drag = null; cv.style.cursor = 'grab'; });
    }

    if (o.init) o.init(S);
    if (o.animate) {
      var visible = false, last = 0;
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { last = 0; requestAnimationFrame(tick); } }).observe(cv);
      var tick = function (now) {
        if (!visible) return;
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
        if (S.running) S.t += dt;
        if (S.W) frame(S.running ? dt : 0);
        requestAnimationFrame(tick);
      };
    }
    sims.push(S);
    resize();
    return S;
  }

  window.Sim = { make: make, T3: T3, D: D, col: col, fmt: fmt, clamp: function (x, a, b) { return Math.max(a, Math.min(b, x)); } };
})();
