/* Instructor editor (same idea as the PHY 2105 site).
   - Click "Instructor" in the footer and paste a GitHub key (fine-grained, Contents: Read and write on this repo).
     The key stays only in this browser; students never see the tools.
   - "Edit this page" makes the text editable in place, with a toolbar to format and insert boxes,
     worked examples, practice problems, tables and images.
   - "Save and publish" writes the page file straight into the GitHub repository (main branch);
     GitHub Pages shows the change about a minute later. Simulations keep working; their
     headings, "Try" and "What to notice" texts are editable too.
   Configure with data attributes on the script tag: data-repo, data-dir, data-course.
   Maths: if the page uses KaTeX, equations turn into editable $...$ / $$...$$ while editing. */
(function () {
  'use strict';
  var me = document.currentScript || {};
  var ds = me.dataset || {};
  var REPO = ds.repo || 'sinistraldu/phy2105', DIR = ds.dir || '', COURSE = ds.course || 'Course';
  var KEY = 'phy-editor-key', API = 'https://api.github.com';
  var key = null, editing = false, savedRange = null, origHTML = '';
  try { key = localStorage.getItem(KEY) || sessionStorage.getItem(KEY); } catch (e) {}

  var file = (function () { var p = location.pathname.split('/').pop() || 'index.html'; if (!/\.html?$/.test(p)) p = 'index.html'; return (DIR ? DIR + '/' : '') + p; })();
  var draftKey = 'phy-editor-draft:' + REPO + ':' + file;

  /* ---------- styles (use each site's own colour variables) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.ed-link{background:none;border:0;color:var(--faint);font:inherit;cursor:pointer;padding:0;text-decoration:underline dotted}',
    '#edPill{position:fixed;right:14px;bottom:14px;z-index:60;display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 8px 6px 12px;box-shadow:0 6px 24px -8px rgba(0,0,0,.35);font:600 13px var(--sans,system-ui)}',
    '#edPill .dot{width:8px;height:8px;border-radius:50%;background:#2e7d32}',
    '#edPill button,#edBar button,#edBar select,.ed-modal button{font:600 13px var(--sans,system-ui);border:1px solid var(--line);background:var(--surface-2);color:var(--ink);border-radius:8px;padding:5px 10px;cursor:pointer}',
    '#edPill button.pri,#edBar button.pri,.ed-modal button.pri{background:var(--accent-2);border-color:var(--accent-2);color:#fff}',
    '#edBar{position:sticky;top:60px;z-index:30;display:flex;flex-wrap:wrap;gap:5px;align-items:center;padding:8px 12px;background:var(--surface);border-bottom:2px solid var(--accent-2);box-shadow:0 6px 18px -12px rgba(0,0,0,.4)}',
    '#edBar .lab{font:700 12px var(--sans,system-ui);letter-spacing:1px;text-transform:uppercase;color:var(--accent-2);margin-right:4px}',
    '#edBar .sep{width:1px;height:22px;background:var(--line);margin:0 3px}',
    '#edBar .st{font:500 12.5px var(--sans,system-ui);color:var(--muted);margin-left:6px}',
    'main.ed-on [contenteditable="true"]:focus{outline:none}',
    'main.ed-on section,main.ed-on .hero{outline:1px dashed color-mix(in srgb,var(--accent-2) 45%,transparent);outline-offset:-6px}',
    'main.ed-on .sim{opacity:.96}',
    'main.ed-on .sim .sim-try,main.ed-on .sim .sim-note,main.ed-on .sim h4{outline:1px dashed var(--accent-2);outline-offset:2px}',
    '.ed-modal-bg{position:fixed;inset:0;background:rgba(10,10,20,.45);z-index:70;display:grid;place-items:center;padding:16px}',
    '.ed-modal{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;max-width:520px;width:100%;padding:20px 22px;font:15px/1.55 var(--sans,system-ui);box-shadow:0 20px 60px -20px rgba(0,0,0,.5)}',
    '.ed-modal h3{margin:0 0 8px;font-family:var(--serif,serif);font-size:21px}',
    '.ed-modal input[type=password],.ed-modal input[type=text]{width:100%;font:14px var(--mono,monospace);padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);margin:8px 0}',
    '.ed-modal .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}',
    '.ed-modal .msg{min-height:1.4em;font-size:13.5px;color:var(--muted);margin-top:8px}',
    '.ed-modal ol{padding-left:20px;margin:8px 0;font-size:14px;color:var(--muted)}',
    '.ed-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:80;background:var(--ink);color:var(--bg);padding:9px 16px;border-radius:999px;font:600 13.5px var(--sans,system-ui);box-shadow:0 8px 24px -8px rgba(0,0,0,.5)}',
    'img.ed-img{max-width:100%;height:auto;border-radius:8px;display:block;margin:12px 0}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function toast(t, ms) { var d = document.createElement('div'); d.className = 'ed-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, ms || 3500); }
  function b64enc(str) { var u = new TextEncoder().encode(str), s = ''; for (var i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }
  function b64dec(b) { var bin = atob(b.replace(/\s/g, '')), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function url(path) { return API + '/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/'); }
  function gh(method, u, body, k) {
    return fetch(u, { method: method, cache: 'no-store', headers: { Authorization: 'Bearer ' + (k || key), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        if (method === 'GET' && r.status === 404) return null;
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(r.status === 401 ? 'The key was rejected (it may have expired). Unlock again.' : (j.message || ('GitHub error ' + r.status))); });
        return r.status === 204 ? {} : r.json();
      });
  }
  function getFile(path) { return gh('GET', url(path) + '?ref=main&t=' + Date.now()); }
  function putFile(path, b64, msg) {
    return getFile(path).then(function (cur) {
      var who = { name: COURSE + ' editor', email: 'noreply@users.noreply.github.com' };
      return gh('PUT', url(path), { message: msg, content: b64, branch: 'main', sha: cur ? cur.sha : undefined, author: who, committer: who });
    });
  }

  /* ---------- unlock / lock ---------- */
  function modal(html) {
    var bg = document.createElement('div'); bg.className = 'ed-modal-bg';
    bg.innerHTML = '<div class="ed-modal" role="dialog" aria-modal="true">' + html + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg); return bg;
  }
  function openPanel() {
    if (key) {
      var m = modal('<h3>Instructor tools are unlocked</h3><p>On any page of ' + COURSE + ', press <b>Edit this page</b> in the corner. Students never see these tools, and nothing can be saved without your key.</p><p style="font-size:13.5px;color:var(--muted)">Saving writes to <code>' + REPO + '</code> (main branch). GitHub Pages updates about a minute later.</p><div class="row"><button type="button" data-x="close" class="pri">Done</button><button type="button" data-x="lock">Lock and forget the key on this device</button></div>');
      m.addEventListener('click', function (e) {
        var x = e.target.dataset && e.target.dataset.x; if (!x) return;
        if (x === 'lock') { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (er) {} key = null; m.remove(); pill(); toast('Locked. The key was removed from this browser.'); }
        if (x === 'close') m.remove();
      });
      return;
    }
    var m2 = modal('<h3>Instructor login</h3><p>Paste your private GitHub key to edit this site in place.</p><input type="password" id="edKey" placeholder="github_pat_…" autocomplete="off"><label style="font-size:14px"><input type="checkbox" id="edRem" checked> Remember on this device (untick on shared computers)</label><details style="margin-top:8px;font-size:14px"><summary style="cursor:pointer;color:var(--accent-2)">How do I make a key?</summary><ol><li>On GitHub: Settings &rarr; Developer settings &rarr; Fine-grained tokens &rarr; Generate new token.</li><li>Repository access: only <b>' + REPO + '</b>.</li><li>Permissions: <b>Contents: Read and write</b>.</li><li>Copy the token and paste it here.</li></ol></details><div class="row"><button type="button" class="pri" id="edGo">Unlock</button><button type="button" id="edX">Cancel</button></div><div class="msg" id="edMsg"></div>');
    $('#edX', m2).onclick = function () { m2.remove(); };
    $('#edGo', m2).onclick = function () {
      var k = $('#edKey', m2).value.trim(), msg = $('#edMsg', m2);
      if (!k) { msg.textContent = 'Paste a key first.'; return; }
      msg.textContent = 'Checking the key…';
      gh('GET', API + '/repos/' + REPO, null, k).then(function (r) {
        if (!r) throw new Error('Repository not found for this key.');
        if (r.permissions && r.permissions.push === false) throw new Error('This key cannot write to the repository. Give it Contents: Read and write.');
        key = k; try { ($('#edRem', m2).checked ? localStorage : sessionStorage).setItem(KEY, k); } catch (e) {}
        m2.remove(); pill(); toast('Unlocked. Press "Edit this page" to start.');
      }).catch(function (e) { msg.textContent = e.message; });
    };
  }

  /* ---------- floating pill ---------- */
  function pill() {
    var p = $('#edPill'); if (p) p.remove();
    if (!key || editing) return;
    p = document.createElement('div'); p.id = 'edPill';
    p.innerHTML = '<span class="dot"></span><span>Instructor</span><button type="button" class="pri" data-x="edit">Edit this page</button><button type="button" data-x="panel">Settings</button>';
    p.addEventListener('click', function (e) { var x = e.target.dataset.x; if (x === 'edit') startEdit(); if (x === 'panel') openPanel(); });
    document.body.appendChild(p);
  }

  /* ---------- editing ---------- */
  var BLOCKS = {
    idea: '<div class="box"><span class="lbl">Big idea</span><p>Write the idea here.</p></div><p><br></p>',
    key: '<div class="box key"><span class="lbl">Key concept</span><div class="eq">$$ \\vec F = q\\vec E $$</div><p>Explain the symbols here.</p></div><p><br></p>',
    der: '<div class="box der"><span class="lbl">Derivation</span><p><span class="step">Step 1</span>Start from &hellip;</p><p><span class="step">Step 2</span>&hellip;</p></div><p><br></p>',
    app: '<div class="box bio"><span class="lbl">Application</span><p>Where this is used.</p></div><p><br></p>',
    ex: '<div class="box ex"><span class="lbl">Worked example</span><p>Question.</p><p><span class="step">Step 1</span>&hellip;</p></div><p><br></p>',
    prob: '<ol class="problems"><li>Write the problem here. <span class="lvl easy">easy</span><details class="ans"><summary></summary><div class="sol"><p>Write the solution here.</p></div></details></li></ol><p><br></p>',
    eq: '<div class="eq">$$ V = IR $$</div><p><br></p>',
    table: '<div class="table-wrap"><table class="data"><tr><th>Heading</th><th>Heading</th></tr><tr><td>value</td><td>value</td></tr></table></div><p><br></p>',
    h3: '<h3>New subheading</h3><p>Text.</p>'
  };
  function saveSel() { var s = window.getSelection(); if (s.rangeCount) savedRange = s.getRangeAt(0).cloneRange(); }
  function restoreSel() { if (!savedRange) return; var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); }
  function insertHTML(h) { restoreSel(); document.execCommand('insertHTML', false, h); }
  function main() { return $('main'); }
  function setStatus(t) { var s = $('#edBar .st'); if (s) s.textContent = t; }

  function startEdit() {
    var m = main(); if (!m || editing) return;
    editing = true; pill(); origHTML = m.innerHTML;
    m.classList.add('ed-on'); m.contentEditable = 'true';
    m.querySelectorAll('.sim').forEach(function (s) { s.contentEditable = 'false'; s.querySelectorAll('h4,.sim-try,.sim-note').forEach(function (x) { x.contentEditable = 'true'; }); });
    m.querySelectorAll('details').forEach(function (d) { d.open = true; });
    unTex(m);
    var bar = document.createElement('div'); bar.id = 'edBar';
    bar.innerHTML = '<span class="lab">Editing</span>' +
      '<button type="button" data-c="bold"><b>B</b></button><button type="button" data-c="italic"><i>I</i></button><button type="button" data-c="underline"><u>U</u></button>' +
      '<button type="button" data-c="superscript">x&sup2;</button><button type="button" data-c="subscript">x&#8322;</button><span class="sep"></span>' +
      '<button type="button" data-f="h2">Heading</button><button type="button" data-f="h3">Subheading</button><button type="button" data-f="p">Text</button>' +
      '<button type="button" data-c="insertUnorderedList">&bull; List</button><button type="button" data-c="insertOrderedList">1. List</button><button type="button" data-a="link">Link</button><span class="sep"></span>' +
      '<select data-ins><option value="">&#xFF0B; Insert&hellip;</option><option value="idea">Big idea box</option><option value="key">Key concept / formula box</option><option value="der">Derivation box</option><option value="app">Application box</option><option value="ex">Worked example</option><option value="prob">Practice problem + solution</option><option value="eq">Display equation</option><option value="table">Table</option><option value="h3">Subheading + text</option><option value="img">Image (upload)</option></select>' +
      '<button type="button" data-c="undo">Undo</button><button type="button" data-c="redo">Redo</button><span class="sep"></span>' +
      '<button type="button" class="pri" data-a="save">Save and publish</button><button type="button" data-a="cancel">Cancel</button><span class="st"></span>';
    document.body.insertBefore(bar, m);
    bar.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); saveSel(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c) { restoreSel(); document.execCommand(b.dataset.c, false, null); }
      if (b.dataset.f) { restoreSel(); document.execCommand('formatBlock', false, '<' + b.dataset.f + '>'); }
      if (b.dataset.a === 'link') { var u = prompt('Link address (https://…)'); if (u) { restoreSel(); document.execCommand('createLink', false, u); } }
      if (b.dataset.a === 'cancel') { if (confirm('Discard your changes to this page?')) stopEdit(true); }
      if (b.dataset.a === 'save') save(b);
    });
    var sel = $('select[data-ins]', bar);
    sel.addEventListener('focus', saveSel);
    sel.addEventListener('change', function () { var v = sel.value; sel.value = ''; if (!v) return; if (v === 'img') return uploadImage(); var h = BLOCKS[v]; if (!window.katex) h = h.replace('$$ \\vec F = q\\vec E $$', 'F = qE').replace('$$ V = IR $$', 'V = IR'); insertHTML(h); });
    m.addEventListener('keyup', saveSel); m.addEventListener('mouseup', saveSel);
    m.addEventListener('paste', onPaste);
    m.addEventListener('input', onInput);
    var d = null; try { d = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch (e) {}
    if (d && d.html && d.html !== origHTML && confirm('You have an unsaved draft of this page from ' + new Date(d.t).toLocaleString() + '. Restore it?')) { m.innerHTML = d.html; startEditLite(m); }
    setStatus('Click any text to change it.');
  }
  /* typeset maths (KaTeX) becomes plain $...$ / $$...$$ text while editing, and is typeset again after saving */
  function texOf(el) { var a = el.querySelector('annotation[encoding="application/x-tex"]'); return a ? a.textContent.trim() : el.textContent; }
  function unTex(root) {
    root.querySelectorAll('.katex-display').forEach(function (e) { e.replaceWith(document.createTextNode('$$' + texOf(e) + '$$')); });
    root.querySelectorAll('.katex').forEach(function (e) { e.replaceWith(document.createTextNode('$' + texOf(e) + '$')); });
  }
  function reTex(root) { if (window.renderMathInElement) try { window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) {} }
  window.PHYTEX = reTex;
  function startEditLite(m) { m.querySelectorAll('.sim').forEach(function (s) { s.contentEditable = 'false'; s.querySelectorAll('h4,.sim-try,.sim-note').forEach(function (x) { x.contentEditable = 'true'; }); }); }
  var draftT;
  function onInput() { clearTimeout(draftT); draftT = setTimeout(function () { try { localStorage.setItem(draftKey, JSON.stringify({ t: Date.now(), html: main().innerHTML })); setStatus('Draft kept on this device.'); } catch (e) {} }, 600); }
  function onPaste(e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); }
  function stopEdit(revert) {
    var m = main(); editing = false;
    if (revert) { try { localStorage.removeItem(draftKey); } catch (e) {} location.reload(); return; }
    m.contentEditable = 'false'; m.classList.remove('ed-on');
    m.querySelectorAll('[contenteditable]').forEach(function (x) { x.removeAttribute('contenteditable'); });
    var bar = $('#edBar'); if (bar) bar.remove(); reTex(m); pill();
  }
  function uploadImage() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      if (f.size > 3e6) { alert('Please use an image smaller than 3 MB.'); return; }
      var name = Date.now() + '-' + f.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
      var path = (DIR ? DIR + '/' : '') + 'content/img/' + name;
      setStatus('Uploading image…');
      var rd = new FileReader();
      rd.onload = function () {
        var b64 = String(rd.result).split(',')[1];
        putFile(path, b64, 'Add image ' + name + ' (instructor editor)').then(function () {
          insertHTML('<img class="ed-img" src="content/img/' + name + '" alt="">'); setStatus('Image uploaded. It shows for everyone after you save.');
        }).catch(function (e) { setStatus(''); alert('Upload failed: ' + e.message); });
      };
      rd.readAsDataURL(f);
    };
    inp.click();
  }
  function cleanHTML() {
    var c = main().cloneNode(true);
    c.querySelectorAll('.sim').forEach(function (s) { [].slice.call(s.children).forEach(function (ch) { if (!ch.matches('.sim-head,.sim-try,.sim-note')) ch.remove(); }); s.removeAttribute('style'); });
    c.querySelectorAll('script,#edBar,#edPill').forEach(function (x) { x.remove(); });
    c.querySelectorAll('[contenteditable]').forEach(function (x) { x.removeAttribute('contenteditable'); });
    c.querySelectorAll('details').forEach(function (d) { d.removeAttribute('open'); });
    c.querySelectorAll('[style=""]').forEach(function (x) { x.removeAttribute('style'); });
    c.querySelectorAll('*').forEach(function (x) { [].slice.call(x.attributes).forEach(function (a) { if (/^on/i.test(a.name)) x.removeAttribute(a.name); }); });
    return c.innerHTML.trim();
  }
  function save(btn) {
    btn.disabled = true; setStatus('Saving…');
    var body = cleanHTML();
    getFile(file).then(function (cur) {
      if (!cur) throw new Error('Could not find ' + file + ' in ' + REPO + ' (main). Has the site been merged to main yet?');
      var src = b64dec(cur.content), i = src.indexOf('<main>'), j = src.lastIndexOf('</main>');
      if (i < 0 || j < 0) throw new Error('This page has no <main> section to replace.');
      var out = src.slice(0, i + 6) + '\n' + body + '\n' + src.slice(j);
      var who = { name: COURSE + ' editor', email: 'noreply@users.noreply.github.com' };
      return gh('PUT', url(file), { message: 'Edit ' + file + ' (instructor editor)', content: b64enc(out), branch: 'main', sha: cur.sha, author: who, committer: who });
    }).then(function () {
      try { localStorage.removeItem(draftKey); } catch (e) {}
      stopEdit(false); toast('Published. Students will see it in about a minute.', 5000);
    }).catch(function (e) { btn.disabled = false; setStatus(''); alert('Not saved: ' + e.message + '\nYour draft is still kept on this device.'); });
  }

  /* ---------- footer entry point ---------- */
  function boot() {
    var f = $('footer .wrap') || document.body;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ed-link'; b.textContent = 'Instructor';
    b.onclick = openPanel;
    var span = document.createElement('span'); span.appendChild(b); f.appendChild(span);
    pill();
    if (location.hash === '#instructor') openPanel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.PHYEDITOR = { cleanHTML: function () { return cleanHTML(); }, file: file, repo: REPO };
})();
