// Nooki's website: your companion on a little taskbar, the companion picker, the tour of the app,
// and a download button that hands out the installer directly (the newest one, asked from GitHub).
(() => {
  const { icon, logo } = UmbraIcons;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const REPO = 'nwcl0ud/nooki';
  // when GitHub can't be asked (offline, too many visits): this one still works and updates itself
  // (set to the newest release whenever one goes out, see RELEASING.md)
  const FALLBACK = { version: '2.3.6', url: `https://github.com/${REPO}/releases/download/v2.3.6/Nooki-Setup-2.3.6.exe`, size: 127176574, zip: `https://github.com/${REPO}/releases/download/v2.3.6/Nooki-2.3.6-win.zip` };
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  function paintIcons(root = document) {
    for (const el of $$('[data-ic]', root)) el.innerHTML = icon(el.dataset.ic);
    for (const el of $$('[data-logo]', root)) el.innerHTML = logo(+el.dataset.logo || 18);
  }
  paintIcons();

  // ───────────────────────── download ─────────────────────────
  const UA = navigator.userAgent;
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  const WINDOWS = /Windows/i.test(UA) && !MOBILE;
  let release = FALLBACK;
  const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;

  function applyRelease(r) {
    release = r;
    for (const a of $$('[data-dl]')) a.href = r.url;
    for (const a of $$('[data-dl-zip]')) if (r.zip) a.href = r.zip;
    for (const m of $$('[data-dl-meta]')) m.textContent = `Free · v${r.version} · ${mb(r.size)}`;
  }
  async function loadRelease() {
    applyRelease(FALLBACK);
    try {
      const c = JSON.parse(sessionStorage.getItem('nooki-release') || 'null');
      if (c && Date.now() - c.at < 30 * 60000) return applyRelease(c.r);
    } catch {}
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      const a = (j.assets || []).find(x => /^Nooki-Setup-[\d.]+\.exe$/.test(x.name));
      if (!a) throw new Error('no installer');
      const z = (j.assets || []).find(x => /^Nooki-[\d.]+-win\.zip$/.test(x.name));
      const r = { version: String(j.tag_name).replace(/^v/, ''), url: a.browser_download_url, size: a.size, zip: z ? z.browser_download_url : '' };
      try { sessionStorage.setItem('nooki-release', JSON.stringify({ at: Date.now(), r })); } catch {}
      applyRelease(r);
    } catch { /* the fallback stays */ }
  }
  loadRelease();

  const modal = $('#dlModal');
  function openModal(html) {
    $('#dlModalBody').innerHTML = html;
    paintIcons(modal);
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); }); // a click on the backdrop

  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-dl]');
    if (!a) return;
    if (!WINDOWS) {
      e.preventDefault();
      openModal(`
        <h2>Nooki is made for Windows</h2>
        <p>${MOBILE ? "It lives on a Windows PC's taskbar, so it can't move into your phone." : 'It runs on Windows 10 and 11. There is no Mac or Linux version yet.'} Open this page on your Windows PC, or send yourself the link.</p>
        <div class="row">
          <button class="btn" data-copy>${icon('copy')}Copy the link</button>
          ${navigator.share ? `<button class="btn btn-ghost" data-share>${icon('send')}Share</button>` : ''}
        </div>
        <small>On Windows after all? <a href="${esc(release.url)}">Download it anyway</a> (v${esc(release.version)}, ${mb(release.size)}).</small>`);
      return;
    }
    // the download starts by itself (it's a direct link); say what comes next
    setTimeout(() => openModal(`
      <h2>Your download is on its way</h2>
      <p>Nooki ${esc(release.version)} · ${mb(release.size)}. Three small steps and your companion moves in:</p>
      <ol>
        <li><b class="n">1</b><span>Open <b>Nooki-Setup-${esc(release.version)}.exe</b> from your downloads.</span></li>
        <li><b class="n">2</b><span>If Windows says it protected your PC: click <b>More info</b>, then <b>Run anyway</b>. Nooki isn't code-signed yet.</span></li>
        <li><b class="n">3</b><span>Your companion hops onto your taskbar. Double-click it to open Nooki.</span></li>
      </ol>
      <small>Download didn't start? <a href="${esc(release.url)}">Try again</a>. The setup doesn't open? <a href="#setup-help" data-help>Here's what helps</a>.</small>`), 350);
  });
  modal.addEventListener('click', async (e) => {
    if (e.target.closest('[data-help]')) { modal.close(); $('#setup-help').open = true; return; } // the link scrolls there by itself
    if (e.target.closest('[data-copy]')) {
      try { await navigator.clipboard.writeText(location.href.split('#')[0]); e.target.closest('[data-copy]').innerHTML = `${icon('check')}Copied!`; } catch {}
    }
    if (e.target.closest('[data-share]')) {
      try { await navigator.share({ title: 'Nooki', text: 'A tiny pixel companion for your Windows taskbar', url: location.href.split('#')[0] }); } catch {}
    }
  });

  // ───────────────────────── sprites ─────────────────────────
  // Sheets from the app (PMD Sprite Collab): one column per frame, one row per direction
  // (0 faces you, 2 walks right, 6 walks left). Durations are in 1/60 s.
  const sheets = new Map();
  function sheet(id, anim) {
    const key = `${id}/${anim}`;
    if (!sheets.has(key)) {
      sheets.set(key, new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = `pets/${id}/${anim}.png`;
      }));
    }
    return sheets.get(key);
  }
  async function spritesOf(pet) {
    const out = {};
    await Promise.all(Object.keys(pet.anims).map(async (n) => { out[n] = await sheet(pet.id, n); }));
    return out;
  }
  const animOf = (pet, name) => (pet.anims[name] ? name : 'Idle');
  function frameAt(a, tick) {
    const total = a.dur.reduce((s, d) => s + d, 0);
    let t = Math.floor(tick) % total, f = 0;
    while (t >= a.dur[f]) { t -= a.dur[f]; f++; }
    return f;
  }
  const animLength = (a) => a.dur.reduce((s, d) => s + d, 0);
  // draw one frame: centered on x, feet on groundY (canvas pixels), s canvas pixels per sprite pixel
  function drawPet(ctx, pet, imgs, name, row, tick, x, groundY, s, flipX = false) {
    name = animOf(pet, name);
    const a = pet.anims[name], im = imgs[name];
    if (!a || !im) return null;
    row = Math.min(row, Math.round(im.height / a.fh) - 1);
    const f = frameAt(a, tick);
    const base = a.base[row] ?? a.fh - 1;
    const dx = Math.round(x - (a.fw / 2) * s), dy = Math.round(groundY - (base + 1) * s);
    ctx.save();
    if (flipX) { ctx.translate(dx * 2 + a.fw * s, 0); ctx.scale(-1, 1); }
    ctx.drawImage(im, f * a.fw, row * a.fh, a.fw, a.fh, dx, dy, a.fw * s, a.fh * s);
    ctx.restore();
    return { left: dx, top: dy, w: a.fw * s, h: (base + 1) * s };
  }

  // ───────────────────────── the night sky ─────────────────────────
  const sky = (() => {
    const c = $('#sky');
    const g = c.getContext('2d');
    const P = 3; // css pixels per sky pixel: chunky like the app
    let w = 0, h = 0, stars = [], cols = {}, shoot = null, nextShoot = performance.now() + 4000;
    function resize() {
      const r = c.getBoundingClientRect();
      w = Math.max(1, Math.ceil(r.width / P)); h = Math.max(1, Math.ceil(r.height / P));
      c.width = w; c.height = h;
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      stars = Array.from({ length: Math.min(320, Math.round((w * h) / 260)) }, () => ({
        x: Math.floor(rnd() * w), y: Math.floor(rnd() * h * 0.78), p: 1.5 + rnd() * 3.5, o: rnd() * 6, big: rnd() > 0.88,
      }));
      colors();
    }
    function colors() {
      const cs = getComputedStyle(document.documentElement);
      cols = { far: cs.getPropertyValue('--bg-3').trim(), near: cs.getPropertyValue('--bg-2').trim(), rim: cs.getPropertyValue('--rim-soft').trim() };
    }
    function hills(base, amp, freq, seed, fill, top) {
      g.fillStyle = fill;
      for (let x = 0; x < w; x++) {
        const y = Math.round(base - amp * (0.55 + 0.25 * Math.sin(x * freq + seed) + 0.2 * Math.sin(x * freq * 2.7 + seed * 3)));
        g.fillRect(x, y, 1, h - y);
        if (top) { g.fillStyle = top; g.fillRect(x, y, 1, 1); g.fillStyle = fill; }
      }
    }
    function draw(now) {
      g.clearRect(0, 0, w, h);
      const t = now / 1000;
      for (const s of stars) {
        const on = (Math.sin(t * s.p + s.o) + 1) / 2;
        g.globalAlpha = REDUCED ? 0.7 : 0.25 + on * 0.75;
        g.fillStyle = '#f7ecd5';
        g.fillRect(s.x, s.y, 1, 1);
        if (s.big && on > 0.6) { g.globalAlpha = 0.45; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
      }
      g.globalAlpha = 1;
      // a crescent moon
      const mx = Math.round(w * 0.84), my = Math.round(w * P < 640 ? 84 / P : h * 0.15), R = 10; // on a phone: up out of the text's way
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R - 2) continue;
        if ((x - 5) ** 2 + (y + 4) ** 2 < (R - 1) ** 2) continue;
        g.fillStyle = x + y > 6 && x * x + y * y > (R - 3) ** 2 ? '#d9c38c' : '#f3e1ad';
        g.fillRect(mx + x, my + y, 1, 1);
      }
      // now and then a shooting star
      if (!REDUCED && !shoot && now > nextShoot) shoot = { at: now, x: w * (0.2 + Math.random() * 0.5), y: h * 0.06 };
      if (shoot) {
        const k = (now - shoot.at) / 900;
        if (k >= 1) { shoot = null; nextShoot = now + 7000 + Math.random() * 9000; } else {
          const x = Math.round(shoot.x + k * 70), y = Math.round(shoot.y + k * 24);
          for (let i = 0; i < 10; i++) { g.globalAlpha = (1 - i / 10) * (1 - k); g.fillStyle = '#fff3c4'; g.fillRect(x - i * 3, y - i, 3, 1); }
          g.globalAlpha = 1;
        }
      }
      // two rows of hills behind the taskbar
      const ground = h - Math.round(48 / P);
      hills(ground, 26, 0.035, 1.3, cols.far, cols.rim);
      hills(ground, 12, 0.06, 4.1, cols.near);
    }
    return { resize, draw, colors };
  })();

  // ───────────────────────── your companion on the taskbar ─────────────────────────
  const stage = (() => {
    const c = $('#stage');
    const g = c.getContext('2d');
    const bubbleEl = $('#bubble');
    const dock = $('#dock');
    let pet = null, imgs = null, dpr = 1, W = 0, H = 0, S = 3;
    const me = { x: 160, y: 0, vy: 0, dir: 1, mode: 'idle', until: 0, target: 0, start: 0, seen: 0, box: null };
    let press = null, petting = null, lastPoke = performance.now(), bubbleUntil = 0, nextMumble = performance.now() + 9000;
    const parts = []; // hearts, sparks and z's

    function resize() {
      const r = c.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      S = W < 640 ? 2 : 3;
      me.x = Math.min(Math.max(me.x, 40), maxX());
    }
    const maxX = () => {
      const d = dock && getComputedStyle(dock).display !== 'none' ? dock.getBoundingClientRect() : null;
      return Math.max(80, (d ? d.left - c.getBoundingClientRect().left - 50 : W - 40));
    };
    const tickOf = (now) => ((now - me.start) / 1000) * 60;
    function setMode(mode, ms = 0, now = performance.now()) {
      me.mode = mode; me.start = now; me.until = now + ms;
    }
    async function setPet(p, hello) {
      pet = p;
      imgs = await spritesOf(p);
      if (pet !== p) return;
      if (me.mode === 'sleep') setMode('idle', 1500);
      if (hello) say(hello, 3200);
    }
    function say(text, ms = 3000) {
      bubbleEl.textContent = text;
      bubbleEl.classList.add('show');
      bubbleUntil = performance.now() + ms;
    }
    const lines = (k) => (pet?.lines?.[k]?.length ? pet.lines[k] : ['♪']);
    function poke() {
      lastPoke = performance.now();
      $('#tryHint')?.classList.add('gone');
    }
    function hop(text) {
      if (!pet) return;
      const a = pet.anims[animOf(pet, 'Hop')];
      setMode('hop', (animLength(a) / 60) * 1000);
      if (text) say(text, 2600);
    }
    function cheer(text) {
      if (me.mode === 'sleep' || me.mode === 'held' || me.mode === 'fall') { setMode('idle', 800); }
      hop(text);
      for (let i = 0; i < 10; i++) parts.push({ k: 'spark', x: me.x + (Math.random() - 0.5) * 50, y: 30 + Math.random() * 40, vy: 20 + Math.random() * 30, t: performance.now(), life: 900 });
    }
    function spawnZ(now) {
      if (!parts.some(p => p.k === 'z' && now - p.t < 700)) parts.push({ k: 'z', x: me.x + 14, y: 34, vy: 16, t: now, life: 2100 });
    }
    function think(now) {
      if (!pet) return;
      if (me.mode === 'held' || me.mode === 'fall') return;
      if (me.mode === 'hop' && now < me.until) return;
      if (me.mode === 'sleep') { spawnZ(now); return; }
      if (me.mode === 'walk') {
        const step = (S * 24 * (now - (me.last || now))) / 1000;
        me.x += me.dir * step;
        if ((me.dir > 0 && me.x >= me.target) || (me.dir < 0 && me.x <= me.target)) { me.x = me.target; setMode('idle', 1400 + Math.random() * 2600, now); }
        return;
      }
      if (me.mode === 'hop' || now > me.until) {
        // what next: a nap when nobody played with it for a while, else wander or look around
        if (now - lastPoke > 45000 && Math.random() < 0.5) { setMode('sleep', 0, now); return; }
        if (REDUCED || Math.random() < 0.3) { setMode('idle', 2000 + Math.random() * 3000, now); return; }
        let t = 40 + Math.random() * (maxX() - 40);
        if (Math.abs(t - me.x) < 70) t = me.x > maxX() / 2 ? me.x - 120 : me.x + 120;
        me.target = Math.min(Math.max(t, 40), maxX());
        me.dir = me.target > me.x ? 1 : -1;
        setMode('walk', 0, now);
      }
    }
    function physics(now, dt) {
      if (me.mode !== 'fall') return;
      me.vy += 2200 * dt;
      me.y -= me.vy * dt;
      if (me.y <= 0) { me.y = 0; me.vy = 0; hop(pick(lines('reactions'))); }
    }
    function drawParts(now) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const age = now - p.t;
        if (age > p.life) { parts.splice(i, 1); continue; }
        const k = age / p.life;
        const px = Math.round((p.x + (p.k === 'z' ? k * 14 : 0)) * dpr), py = Math.round((H - p.y - p.vy * (age / 1000)) * dpr);
        const u = Math.max(1, Math.round(S * dpr * 0.67)); // one "pixel" of a particle
        g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        if (p.k === 'heart') {
          g.fillStyle = '#ff7aa2';
          for (const [x, y] of [[0, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) g.fillRect(px + (x - 1) * u, py + y * u, u, u);
          g.fillStyle = '#ffd1df'; g.fillRect(px - u, py + u, u, u);
        } else if (p.k === 'z') {
          g.fillStyle = '#d7d2f5';
          for (const [x, y] of [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]) g.fillRect(px + x * u, py + y * u, u, u);
        } else {
          g.fillStyle = Math.floor(age / 120) % 2 ? '#fff' : '#ffe39a';
          g.fillRect(px, py, u, u);
          if (k < 0.5) { g.fillRect(px - u, py, u * 3, u); g.fillRect(px, py - u, u, u * 3); }
        }
      }
      g.globalAlpha = 1;
    }
    function draw(now) {
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, c.width, c.height);
      if (!pet || !imgs) return;
      const dt = Math.min(0.05, (now - (me.last || now)) / 1000);
      think(now);
      physics(now, dt);
      me.last = now;
      if (petting && now - petting.at > 140) {
        petting.at = now;
        parts.push({ k: 'heart', x: me.x + (Math.random() - 0.5) * 30, y: 40 + Math.random() * 20, vy: 28, t: now, life: 1100 });
      }
      const s = S * dpr, ground = Math.round(H * dpr - me.y * dpr);
      // a soft shadow on the taskbar's edge
      g.fillStyle = 'rgba(4, 5, 14, 0.35)';
      const sw = Math.round(12 * s * (me.y > 0 ? Math.max(0.4, 1 - me.y / 200) : 1));
      g.fillRect(Math.round(me.x * dpr - sw / 2), H * dpr - Math.round(1.5 * s), sw, Math.round(1.5 * s));
      let anim = 'Idle', row = 0, tick = tickOf(now);
      if (me.mode === 'walk') { anim = 'Walk'; row = me.dir > 0 ? 2 : 6; }
      else if (me.mode === 'hop') anim = 'Hop';
      else if (me.mode === 'sleep') anim = 'Sleep';
      else if (me.mode === 'held' || me.mode === 'fall') { anim = 'Idle'; tick = 0; }
      me.box = drawPet(g, pet, imgs, anim, row, tick, me.x * dpr, ground, s);
      drawParts(now);
      // the speech bubble follows the head
      if (bubbleEl.classList.contains('show')) {
        if (now > bubbleUntil) bubbleEl.classList.remove('show');
        const top = me.box ? me.box.top / dpr : H - 60;
        bubbleEl.style.left = `${Math.round(Math.min(Math.max(me.x, 90), W - 90))}px`;
        bubbleEl.style.top = `${Math.round(c.offsetTop + top + 10)}px`;
      }
      // a few words now and then
      if (now > nextMumble) {
        nextMumble = now + 16000 + Math.random() * 14000;
        if (me.mode !== 'sleep' && me.mode !== 'held') {
          const h = new Date().getHours();
          say(pick(h >= 19 || h < 6 ? [...lines('mumbles'), ...lines('night')] : lines('mumbles')), 3400);
        }
      }
    }
    // is the pointer on the companion? (a bit generous, they're small)
    function hit(e) {
      if (!me.box) return false;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
      const pad = 6 * dpr, w = Math.min(me.box.w, 34 * S * dpr);
      const cx = me.x * dpr;
      return x > cx - w / 2 - pad && x < cx + w / 2 + pad && y > Math.max(me.box.top, H * dpr - me.box.h - me.y * dpr) - pad && y < H * dpr - me.y * dpr + pad;
    }
    c.addEventListener('pointermove', (e) => {
      if (press) {
        const r = c.getBoundingClientRect();
        if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) { press.moved = true; setMode('held'); poke(); say(pick(lines('reactions')), 1600); }
        if (press.moved) {
          me.x = Math.min(Math.max(e.clientX - r.left, 30), W - 30);
          me.y = Math.min(Math.max(H - (e.clientY - r.top) - 18, 0), H - 30);
        }
        return;
      }
      c.style.cursor = hit(e) ? 'grab' : '';
    });
    c.addEventListener('pointerdown', (e) => {
      if (!hit(e)) return;
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      poke();
      if (e.button === 2) { petting = { at: 0 }; say(pick(['♥', ...lines('reactions')]), 1800); return; }
      press = { x: e.clientX, y: e.clientY, moved: false, shift: e.shiftKey };
      c.style.cursor = 'grabbing';
    });
    const release = () => {
      if (petting) { petting = null; return; }
      if (!press) return;
      const p = press;
      press = null;
      c.style.cursor = '';
      if (p.moved) { setMode('fall'); return; }
      if (p.shift) { setMode('sleep'); say('Zzz…', 1400); return; }
      if (me.mode === 'sleep') { setMode('idle', 1500); say('*yawns*', 1800); return; }
      hop(pick(lines('reactions')));
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', () => { press = null; petting = null; if (me.mode === 'held') setMode('fall'); });
    c.addEventListener('dblclick', (e) => { if (hit(e)) say('In the app, a double-click opens Nooki!', 3000); });
    c.addEventListener('contextmenu', (e) => { if (hit(e) || petting) e.preventDefault(); });
    return { resize, draw, setPet, say, cheer, get pet() { return pet; } };
  })();

  // the task window on the taskbar: tick one off and your companion cheers
  (() => {
    const TASKS = [
      { t: 'Say hi to your companion', tag: 'Today', sun: true },
      { t: 'Pick a companion you like' },
      { t: 'Download Nooki', tag: 'in 5 min' },
    ];
    const list = $('#dockList');
    const dock = $('#dock');
    function draw() {
      list.innerHTML = TASKS.map((x, i) => `<li class="${x.done ? 'done' : ''}"><button class="check ${x.done ? 'on' : ''}" data-i="${i}" aria-label="${x.done ? 'Not done' : 'Done'}: ${esc(x.t)}">${icon('check')}</button><span>${esc(x.t)}</span>${x.tag && !x.done ? `<em class="tag ${x.sun ? 'sun' : ''}">${esc(x.tag)}</em>` : ''}</li>`).join('');
      const left = TASKS.filter(x => !x.done).length;
      $('#dockN').textContent = left ? String(left) : '';
    }
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const x = TASKS[+b.dataset.i];
      x.done = !x.done;
      draw();
      if (!x.done) return;
      const left = TASKS.filter(y => !y.done).length;
      stage.cheer(left ? pick(['Nice one!', 'One less thing!', 'Woo!', 'Look at you go!']) : 'All done! Time to relax.');
    });
    $('#dockHead').addEventListener('click', () => {
      dock.classList.toggle('closed');
      $('#dockHead').setAttribute('aria-expanded', String(!dock.classList.contains('closed')));
    });
    draw();
  })();

  // on a touch screen there's no right-click or shift
  if (matchMedia('(pointer: coarse)').matches) $('#tryText').textContent = 'Try it: tap your companion, or drag it sideways';

  // the taskbar clock
  function clock() {
    const d = new Date();
    $('#tbTime').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    $('#tbDate').textContent = d.toLocaleDateString();
  }
  clock();
  setInterval(clock, 15000);

  // ───────────────────────── companions ─────────────────────────
  let pets = [], current = null, cardImgs = null, cardHopUntil = 0, cardStart = performance.now();
  function applyTheme(p) {
    const vars = UmbraTheme.themeVars(p, {});
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
    $('meta[name="theme-color"]').setAttribute('content', UmbraTheme.bgHex(p, {}));
    for (const el of $$('[data-logo]')) el.innerHTML = logo(+el.dataset.logo || 18); // the logo wears the colors too
    requestAnimationFrame(() => sky.colors());
  }
  async function select(id, byUser = false) {
    const p = pets.find(x => x.id === id) || pets.find(x => x.id === 'umbreon') || pets[0];
    current = p;
    applyTheme(p);
    $('#compSpecies').textContent = p.species;
    $('#compName').textContent = p.name;
    $('#compDesc').textContent = p.description;
    $('#compTricks').innerHTML = p.tricks.map(t => `<li><b>${icon('sparkles')}${esc(t.label)}</b><span>${esc(t.desc)}</span></li>`).join('');
    for (const b of $$('.pet-btn')) b.setAttribute('aria-selected', String(b.dataset.id === p.id));
    for (const im of $$('[data-mine]')) im.src = `pets/${p.id}.png`;
    stage.setPet(p, byUser ? null : `Hi! I'm ${p.name}.`);
    cardImgs = await spritesOf(p);
    if (current !== p) return;
    cardStart = performance.now();
    if (byUser) {
      // on a narrow screen the card sits above the list: bring it into view
      if (innerWidth <= 1000) $('#compCard').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      cardHopUntil = performance.now() + (animLength(p.anims[animOf(p, 'Hop')]) / 60) * 1000;
      saved.set('nooki-pet', p.id);
    }
  }
  async function loadPets() {
    pets = await (await fetch('pets.json')).json();
    $('#compGrid').innerHTML = pets.map(p => `
      <button class="pet-btn" role="option" data-id="${p.id}" aria-selected="false" style="--pc:${esc(p.theme.accent || '#f2c14e')}">
        <img src="pets/${p.id}.png" alt="" width="72" height="72" loading="lazy">${esc(p.name)}
      </button>`).join('');
    $('#compGrid').addEventListener('click', (e) => {
      const b = e.target.closest('.pet-btn');
      if (b) select(b.dataset.id, true);
    });
    await select(saved.get('nooki-pet') || 'umbreon');
  }

  // the big companion in the card, and the little one in "Say hi"
  const cardCanvas = $('#compCanvas'), hiCanvas = $('#hiCanvas');
  function drawCard(now) {
    if (!current || !cardImgs) return;
    const g = cardCanvas.getContext('2d');
    // 240 css px tall, ground 38 px from the bottom; drawn at 3 css px per sprite pixel
    cardCanvas.width = 60; cardCanvas.height = 60;
    g.imageSmoothingEnabled = false;
    const hopping = now < cardHopUntil;
    drawPet(g, current, cardImgs, hopping ? 'Hop' : 'Idle', 0, ((now - (hopping ? cardHopUntil - (animLength(current.anims[animOf(current, 'Hop')]) / 60) * 1000 : cardStart)) / 1000) * 60, 30, 50, 1);
  }
  function drawHi(now) {
    if (!current || !cardImgs) return;
    const g = hiCanvas.getContext('2d');
    hiCanvas.width = 48; hiCanvas.height = 36;
    g.imageSmoothingEnabled = false;
    drawPet(g, current, cardImgs, 'Idle', 0, ((now - cardStart) / 1000) * 60, 24, 36, 1);
  }

  // ───────────────────────── the tour ─────────────────────────
  const TOUR = [
    { id: 'overview', label: 'Overview', icon: 'home', img: 'overview', h: 'Your day at a glance', p: 'Double-click your companion (or press <span class="keys"><kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>U</kbd></span>) and everything is right there.',
      li: ["A greeting with your city's weather and a sky that matches it", "Today's tasks and a focus timer to start right away", "Your friends on the side: who's online and what they're playing"] },
    { id: 'tasks', label: 'Tasks', icon: 'todo', img: 'tasks', h: 'Tasks with deadlines', p: 'Write it down, and Nooki makes sure it gets done.',
      li: ['Type <kbd>!</kbd> for important, <kbd>#today</kbd> for today and <kbd>@fri 15:00</kbd> for a deadline', "Reminders a day before, an hour before and when time's up", 'A task list on your taskbar, one click away', 'Your companion cheers when you tick one off'] },
    { id: 'games', label: 'Daily games', icon: 'gamepad', img: 'social', h: 'Six puzzles a day', p: 'The same puzzles for everyone, new ones at midnight. A few minutes, then see how your friends did.',
      li: ['Chrono, Rulebreaker, Higher, 500%, Zip and Binary Breaker', "Today's table: rank everyone by any game", 'Streaks, badges, frames and titles for your profile'] },
    { id: 'screen', label: 'Screen time', icon: 'hourglass', img: 'screentime', h: 'Where did the day go?', p: 'An honest look at your time at the PC, without sending it anywhere.',
      li: ["How long you've been at your PC, by day, week and month", 'Games, browsers and everything else, with your top apps', 'Only the window in front counts, so nothing counts twice'] },
    { id: 'music', label: 'SpotiStats', icon: 'music', img: 'spotistats', h: 'Your music, counted', p: 'Nooki listens along while it runs and keeps score.',
      li: ['Your top 10 songs and artists of the month', 'A song counts after 30 seconds, like a Spotify stream', "Music controls with the cover art in your companion's menu"] },
    { id: 'pets', label: 'Companions', icon: 'paw', img: 'companions', h: 'Companions with character', p: 'Each one has its own colors, moods and tricks, and the whole app takes them on.',
      li: ['23 companions to choose from, switch anytime', 'Feed them, play with them and level up your bond', 'Give them a nickname and visit their room'] },
  ];
  let tourAt = 'overview';
  function showTour(id, focus = false) {
    const t = TOUR.find(x => x.id === id) || TOUR[0];
    tourAt = t.id;
    for (const b of $$('.tab')) { const on = b.dataset.tab === t.id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); }
    const img = $('#tourImg');
    if (!img.src.endsWith(`img/${t.img}.png`)) {
      img.classList.add('swap');
      const next = new Image();
      next.onload = () => { img.src = next.src; img.classList.remove('swap'); };
      next.src = `img/${t.img}.png`;
    }
    img.alt = `Nooki: ${t.label}`;
    $('#tourText').innerHTML = `<h3>${t.h}</h3><p>${t.p}</p><ul>${t.li.map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>`;
  }
  $('#tabs').innerHTML = TOUR.map(t => `<button class="tab" role="tab" data-tab="${t.id}" aria-controls="tourText">${icon(t.icon)}${t.label}</button>`).join('');
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTour(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TOUR.findIndex(x => x.id === tourAt);
    showTour(TOUR[(i + (e.key === 'ArrowRight' ? 1 : TOUR.length - 1)) % TOUR.length].id, true);
  });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-tab-go]'); if (a) showTour(a.dataset.tabGo); });
  showTour('overview');

  const FEATURES = [
    ['todo', 'Tasks & deadlines', "Important, for today, due Friday at three. Reminders before it's too late."],
    ['note', 'Quick notes', 'A note pops up right where you are. <span class="keys"><kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>N</kbd></span>'],
    ['clipboard', 'Clipboard history', 'Everything you copied, with pins for the keepers. <span class="keys"><kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>V</kbd></span>'],
    ['pipette', 'Color picker', 'Any pixel on your screen, with a loupe and every format. <span class="keys"><kbd>Ctrl</kbd> <kbd>Alt</kbd> <kbd>C</kbd></span>'],
    ['timer', 'Focus timer', "Focus and break rounds, tied to the task you're on."],
    ['zap', 'Quick launch', 'Your apps, folders and websites, a click away.'],
    ['volume', 'Sound mixer', "The volume of every app, right from your companion's menu."],
    ['music', 'Music controls', 'Play, pause and skip Spotify and other players, with the cover.'],
    ['mouse', 'Autoclicker', 'Clicks for you, with its own hotkey and the pause you choose.'],
    ['qr', 'Link to QR code', 'Drop a link on your companion and there is its QR code.'],
    ['sun', 'Weather', "Your city's weather on the start page and in the menu."],
    ['discord', 'Discord status', "Your Discord profile shows you're hanging out with Nooki."],
  ];
  $('#featureCards').innerHTML = FEATURES.map(([ic, h, p]) => `<article class="card"><span class="card-ic">${icon(ic)}</span><h3>${h}</h3><p>${p}</p></article>`).join('');

  const MOVES = [
    ['mouse', 'Click', 'Click it', 'The quick menu: your shortcuts, the color picker, the sound mixer and music.'],
    ['mouse', 'Double-click', 'Double-click it', 'Opens Nooki.'],
    ['hand', 'Drag', 'Carry it around', 'Put it anywhere. Hold the right mouse button while dragging to take a screenshot.'],
    ['heart', 'Hold right-click', 'Pet it', "It likes that. Petting builds your bond, too."],
    ['moon', '<kbd>Shift</kbd> + click', 'Tuck it in', 'It naps until you click it again.'],
    ['bag', 'Drop files', 'Hand it files', 'It keeps them in its stash until you need them.'],
    ['link', 'Drop a link', 'Hand it a link', 'It shows the QR code and copies it to your clipboard.'],
    ['users', 'Friends', 'Get visitors', "Your friends' companions come over to say hi now and then."],
  ];
  $('#moves').innerHTML = MOVES.map(([ic, how, h, p]) => `<article class="move"><span class="move-do">${icon(ic)}${how}</span><h3>${h}</h3><p>${p}</p></article>`).join('');

  async function loadGames() {
    try {
      const games = await (await fetch('games.json')).json();
      $('#gameGrid').innerHTML = games.map(g => `<article class="game" style="--gc:${esc(g.color)}"><span class="game-ic">${icon(g.icon)}</span><h3>${esc(g.name)}</h3><p>${esc(g.tag)}</p></article>`).join('');
    } catch {}
  }

  // ───────────────────────── the loop ─────────────────────────
  const visible = new Map();
  const io = new IntersectionObserver((entries) => { for (const en of entries) visible.set(en.target, en.isIntersecting); }, { rootMargin: '100px' });
  for (const el of [$('.hero'), $('.comp-stage'), $('.hi')]) io.observe(el);
  let lastSky = 0;
  function frame(now) {
    if (!document.hidden) {
      if (visible.get($('.hero'))) {
        if (now - lastSky > 66) { sky.draw(now); lastSky = now; }
        stage.draw(now);
      }
      if (visible.get($('.comp-stage'))) drawCard(now);
      if (visible.get($('.hi'))) drawHi(now);
    }
    requestAnimationFrame(frame);
  }
  function resize() { sky.resize(); stage.resize(); }
  window.addEventListener('resize', resize);
  resize();
  loadGames();
  loadPets().then(() => { sky.draw(performance.now()); requestAnimationFrame(frame); }).catch(() => requestAnimationFrame(frame));
})();
