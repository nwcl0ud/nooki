// Pet colour themes. Shared by the windows and the main process, which hands every window
// its colours before the first paint, so nothing flashes in the wrong theme.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UmbraTheme = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  // A pet's theme is a hue + saturation for the whole dark palette plus an accent.
  const BASE = { hue: 237, sat: 34, accent: '#f2c14e', accent2: '#ffe39a', accentInk: '#2a1f05', glow: '#ffd65a' };

  function palette(h, s) {
    const c = (l, sat = s) => `hsl(${h} ${Math.round(sat)}% ${l}%)`;
    return {
      '--void': c(9),
      '--edge': c(7, s * 1.25),
      '--bg': c(16),
      '--bg-2': c(21),
      '--bg-3': c(28),
      '--bg-4': c(35),
      '--well': c(13),
      '--rim': c(37, s * 1.05),
      '--rim-soft': c(28),
      '--muted': `hsl(${h + 10} ${Math.min(42, s * 0.95)}% 73%)`,
      '--dim': `hsl(${h + 7} ${Math.min(28, s * 0.7)}% 56%)`,
      '--faint': `hsl(${h + 5} ${Math.min(30, s * 0.75)}% 43%)`,
    };
  }

  function petSetting(pet, petSettings, key) {
    if (!pet || !key) return undefined;
    const own = petSettings && petSettings[pet.id];
    if (own && own[key] !== undefined) return own[key];
    const def = (pet.settings || []).find(s => s.key === key);
    return def ? def.default : undefined;
  }

  // Theme for today: some pets (Eevee) cycle through variants, one per day.
  function themeFor(pet, petSettings) {
    let t = { ...BASE, ...((pet && pet.theme) || {}) };
    const cyc = pet && pet.themeCycle;
    if (cyc && cyc.variants && cyc.variants.length && petSetting(pet, petSettings, cyc.setting)) {
      const now = new Date();
      const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      t = { ...t, ...cyc.variants[day % cyc.variants.length] };
    }
    return t;
  }

  // CSS variables for a pet's theme (colours only, fonts stay the same everywhere)
  function themeVars(pet, petSettings) {
    const t = themeFor(pet, petSettings);
    return {
      ...palette(t.hue, t.sat),
      '--accent': t.accent,
      '--accent-2': t.accent2,
      '--accent-ink': t.accentInk,
      '--glow': t.glow || t.accent,
      '--accent-deep': `color-mix(in srgb, ${t.accent} 70%, black)`,
      '--theme-h': String(t.hue),
      '--theme-s': `${t.sat}%`,
    };
  }

  // window background colour (hex) for a theme: the same as --bg
  function bgHex(pet, petSettings) {
    const t = themeFor(pet, petSettings);
    const s = t.sat / 100, l = 0.16;
    const k = (n) => (n + t.hue / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }

  return { BASE, palette, petSetting, themeFor, themeVars, bgHex };
});
