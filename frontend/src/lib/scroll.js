// Smooth-scroll helper that prefers the active Lenis instance.
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: -24, duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
