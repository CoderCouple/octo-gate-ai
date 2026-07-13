// OctoGateAI widget — vanilla JS, no dependencies, Canvas 2D.
// Runs on customer pages. Contract:
//   - Exposes exactly one global: window.OctoGateAI.
//   - Reads sitekey + optional apiUrl/theme from the host element.
//   - Never receives the challenge answer — see backend invariant #1.
//   - Uses per-instance classes prefixed `og-` to avoid host CSS collisions.

(function () {
  'use strict';

  const DEFAULT_API = 'https://api.octogateai.com';

  const THEMES = {
    dark: { bg: '#000000', ink: '#00ff41', muted: '#0f3d1f' },
    light: { bg: '#ffffff', ink: '#000000', muted: '#dddddd' },
  };

  function css(theme) {
    return `
.og-root{font:14px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:${theme.ink};background:${theme.bg};padding:16px;border:1px solid ${theme.muted};max-width:520px;box-sizing:border-box}
.og-canvas{display:block;width:100%;height:auto;background:${theme.bg};border:1px solid ${theme.muted};box-sizing:border-box}
.og-row{display:flex;gap:8px;margin-top:12px}
.og-input{flex:1;font:inherit;color:${theme.ink};background:${theme.bg};border:1px solid ${theme.muted};padding:8px 10px;text-transform:uppercase;letter-spacing:.12em;outline:none;box-sizing:border-box}
.og-input:focus{border-color:${theme.ink}}
.og-btn{font:inherit;color:${theme.bg};background:${theme.ink};border:0;padding:8px 14px;cursor:pointer;text-transform:uppercase;letter-spacing:.12em}
.og-btn:disabled{opacity:.4;cursor:default}
.og-status{margin-top:10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${theme.ink};min-height:1em}
.og-hint{margin:0 0 10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${theme.ink};opacity:.7}
`;
  }

  function injectStyle(id, text) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = text;
    document.head.appendChild(s);
  }

  function mount(el, opts) {
    const sitekey = opts.sitekey || el.getAttribute('data-sitekey');
    if (!sitekey) throw new Error('OctoGateAI: sitekey required');
    const apiUrl = opts.apiUrl || el.getAttribute('data-api') || DEFAULT_API;
    const themeName = opts.theme || el.getAttribute('data-theme') || 'dark';
    const theme = THEMES[themeName] || THEMES.dark;

    const styleId = `og-style-${themeName}`;
    injectStyle(styleId, css(theme));

    el.classList.add('og-root');
    el.innerHTML = `
<p class="og-hint">Read the word in the motion. Type it.</p>
<canvas class="og-canvas" width="480" height="140"></canvas>
<div class="og-row">
  <input class="og-input" type="text" autocomplete="off" spellcheck="false" maxlength="16" aria-label="Type the word you see">
  <button class="og-btn" type="button">Verify</button>
</div>
<div class="og-status" role="status" aria-live="polite"></div>
`;
    const canvas = el.querySelector('.og-canvas');
    const input = el.querySelector('.og-input');
    const btn = el.querySelector('.og-btn');
    const status = el.querySelector('.og-status');
    const ctx = canvas.getContext('2d');

    let dots = null;
    let width = 480;
    let height = 140;
    let challengeId = null;
    let rafId = null;
    let start = 0;
    let busy = false;

    function setStatus(msg) {
      status.textContent = msg;
    }

    function stopAnim() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function draw(t) {
      const elapsed = (t - start) / 1000;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = theme.ink;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const phase = 2 * Math.PI * d.f * elapsed + d.p;
        const off = d.m * Math.sin(phase);
        const px = d.x + Math.cos(d.a) * off;
        const py = d.y + Math.sin(d.a) * off;
        ctx.fillRect(px | 0, py | 0, 2, 2);
      }
      rafId = requestAnimationFrame(draw);
    }

    async function loadChallenge() {
      stopAnim();
      setStatus('Loading…');
      input.value = '';
      input.disabled = true;
      btn.disabled = true;
      try {
        const res = await fetch(apiUrl + '/api/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sitekey }),
        });
        const body = await res.json();
        if (!res.ok) {
          setStatus(body.reason || 'error');
          return;
        }
        dots = body.dots;
        width = body.width;
        height = body.height;
        challengeId = body.challenge_id;
        canvas.width = width;
        canvas.height = height;
        start = performance.now();
        rafId = requestAnimationFrame(draw);
        setStatus('');
        input.disabled = false;
        btn.disabled = false;
        input.focus();
      } catch (err) {
        setStatus('network error');
      }
    }

    async function submit() {
      if (busy || !challengeId) return;
      const answer = (input.value || '').trim().toUpperCase();
      if (!answer) return;
      busy = true;
      btn.disabled = true;
      setStatus('Verifying…');
      try {
        const res = await fetch(apiUrl + '/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sitekey, challenge_id: challengeId, answer }),
        });
        const body = await res.json();
        if (body.success) {
          stopAnim();
          setStatus('Verified.');
          if (typeof opts.onSuccess === 'function') opts.onSuccess(body.token);
          if (typeof window.OctoGateAI.onSuccess === 'function') {
            window.OctoGateAI.onSuccess(body.token);
          }
        } else {
          setStatus(body.reason || 'failed');
          // Any terminal state consumes the challenge — reload.
          setTimeout(loadChallenge, 700);
        }
      } catch (err) {
        setStatus('network error');
      } finally {
        busy = false;
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    loadChallenge();

    return { reload: loadChallenge, destroy: stopAnim };
  }

  const API = {
    render(el, opts) {
      return mount(el, opts || {});
    },
    autoMount() {
      const nodes = document.querySelectorAll('.octogate:not([data-og-mounted])');
      const handles = [];
      nodes.forEach((n) => {
        n.setAttribute('data-og-mounted', '1');
        handles.push(mount(n, {}));
      });
      return handles;
    },
  };

  window.OctoGateAI = window.OctoGateAI || API;
  if (!window.OctoGateAI.render) Object.assign(window.OctoGateAI, API);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => API.autoMount());
  } else {
    API.autoMount();
  }
})();
