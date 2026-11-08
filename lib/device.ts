// Deteção do dispositivo. Só pode ser usado no browser.

export function isIOS() {
  const ua = navigator.userAgent;
  // Os iPads recentes identificam-se como "Macintosh", mas têm ecrã tátil.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** A app está aberta a partir do ícone, sem a barra do browser? */
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
