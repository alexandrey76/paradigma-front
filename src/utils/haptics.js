// src/utils/haptics.js

// лёгкая вибра
export function vibrateLight() {
  try {
    if (window?.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
      return;
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }
  } catch (e) {}
}

/**
 * Хаптика + добавление класса для анимации
 * @param {HTMLElement} el
 * @param {Object} opts
 */
export function tap(el, opts = {}) {
  vibrateLight();

  if (!el) return;

  const cls = opts.className || "tap-press";
  const duration = opts.duration || 160;

  // если анимация ещё идёт — перезапустим
  if (el.__tapTimeout) {
    clearTimeout(el.__tapTimeout);
    el.classList.remove(cls);
    // форсим перерисовку, чтобы анимация могла стартануть снова
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth;
  }

  el.classList.add(cls);

  el.__tapTimeout = setTimeout(() => {
    el.classList.remove(cls);
    el.__tapTimeout = null;
  }, duration);
}
