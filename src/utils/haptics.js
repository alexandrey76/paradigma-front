// src/utils/haptics.js

// базовый хелпер
function getTgHaptic() {
  try {
    return window?.Telegram?.WebApp?.HapticFeedback || null;
  } catch {
    return null;
  }
}

/**
 * Короткий удар (light | medium | heavy | rigid | soft)
 */
export function hapticImpact(type = "light") {
  const h = getTgHaptic();
  if (!h?.impactOccurred) return;
  try {
    h.impactOccurred(type);
  } catch {
    /* ignore */
  }
}

/**
 * Выбор/переключение
 */
export function hapticSelection() {
  const h = getTgHaptic();
  if (!h?.selectionChanged) return;
  try {
    h.selectionChanged();
  } catch {
    /* ignore */
  }
}

/**
 * Уведомление об успехе
 */
export function hapticSuccess() {
  const h = getTgHaptic();
  if (!h?.notificationOccurred) return;
  try {
    h.notificationOccurred("success");
  } catch {
    /* ignore */
  }
}

/**
 * Уведомление об ошибке
 */
export function hapticError() {
  const h = getTgHaptic();
  if (!h?.notificationOccurred) return;
  try {
    h.notificationOccurred("error");
  } catch {
    /* ignore */
  }
}
