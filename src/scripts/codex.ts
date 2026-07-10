/**
 * codex.ts — the book's moving parts.
 * Folio & fore-edge (reading progress), chrome inversion over dark plates,
 * the light-chasing pool on photographs, poem settle, contents dialog,
 * and gentle smooth scroll. Everything stands down under reduced motion.
 *
 * Performance notes: the light overlay is painted once and moved with
 * transform (composite-only); its rAF loop stops whenever every pool is
 * settled. Scroll work is coalesced into one rAF per frame.
 */
import Lenis from 'lenis';
import { navigate } from 'astro:transitions/client';
import { BOOK_ORDER } from '../lib/toc';

document.documentElement.classList.add('js');

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover)').matches;

let lenis: Lenis | null = null;
let lenisRaf = 0;
let teardown: AbortController | null = null;

/* ————— smooth scroll ————— */
function startLenis(): void {
  if (reduceMotion() || lenis) return;
  lenis = new Lenis({ lerp: 0.115, smoothWheel: true });
  const raf = (time: number): void => {
    lenis?.raf(time);
    lenisRaf = requestAnimationFrame(raf);
  };
  lenisRaf = requestAnimationFrame(raf);
}

function stopLenis(): void {
  cancelAnimationFrame(lenisRaf);
  lenis?.destroy();
  lenis = null;
}

/* ————— folio + fore-edge + chrome inversion ————— */
function initFolio(signal: AbortSignal): void {
  const main = document.querySelector<HTMLElement>('main[data-folio-start]');
  const folioOut = document.querySelector<HTMLElement>('[data-folio-now]');
  const edge = document.querySelector<HTMLElement>('.fore-edge');
  const hero = document.querySelector<HTMLElement>('[data-hero-dark]');
  if (!main || !folioOut) return;

  const start = Number(main.dataset.folioStart ?? '1');
  const end = Number(main.dataset.folioEnd ?? start);

  let leaves: HTMLElement[] = [];
  if (edge) {
    const total = Number(edge.dataset.total ?? '14');
    edge.replaceChildren();
    for (let i = 0; i < total; i++) edge.appendChild(document.createElement('i'));
    leaves = Array.from(edge.children) as HTMLElement[];
  }

  const update = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 4 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const current = start + progress * (end - start + 0.999);
    const shown = Math.min(end, Math.floor(current));
    folioOut.textContent = String(shown);
    leaves.forEach((leaf, i) => leaf.classList.toggle('read', i + 1 < current));
    document.body.classList.toggle(
      'chrome-inverse',
      !!hero && hero.getBoundingClientRect().bottom > 72
    );
  };

  // coalesce scroll/resize work into at most one update per frame
  let scheduled = false;
  const requestUpdate = (): void => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  };

  window.addEventListener('scroll', requestUpdate, { passive: true, signal });
  window.addEventListener('resize', requestUpdate, { passive: true, signal });
  update();
}

/* ————— chasing the light —————
   The pool follows the pointer anywhere inside its arena (the whole hero
   or cover section, so titles and buttons don't steal it). Once caught,
   it follows; when the pointer leaves, it stays where it was left.
   On touch devices it wanders on its own. */
interface LightState {
  frame: HTMLElement;
  overlay: HTMLElement;
  w: number;
  h: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  engaged: boolean;
  active: boolean;
  visible: boolean;
  phase: number;
}

let lightStates: LightState[] = [];
let lightIO: IntersectionObserver | null = null;
let lightRaf = 0;
let lightRunning = false;
let lightLast = 0;

function placeOverlay(s: LightState): void {
  s.overlay.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
}

function measureLight(s: LightState): void {
  const r = s.frame.getBoundingClientRect();
  s.w = r.width;
  s.h = r.height;
}

function startLightLoop(): void {
  if (lightRunning || reduceMotion() || !lightStates.length) return;
  lightRunning = true;
  lightLast = performance.now();

  const tick = (t: number): void => {
    const dt = Math.min(50, t - lightLast);
    lightLast = t;
    let moving = false;
    let drifting = false;

    for (const s of lightStates) {
      if (!s.visible) continue;

      // pre-engagement (or touch): the sun wanders until it is caught
      if (!canHover() || !s.engaged) {
        drifting = true;
        s.phase += dt * 0.00022;
        s.tx = s.w * (0.5 + 0.2 * Math.sin(s.phase));
        s.ty = s.h * (0.44 + 0.16 * Math.sin(s.phase * 1.37 + 1.3));
      }

      const dx = s.tx - s.x;
      const dy = s.ty - s.y;
      if (Math.abs(dx) < 0.06 && Math.abs(dy) < 0.06) continue; // settled

      s.x += dx * 0.085;
      s.y += dy * 0.085;
      placeOverlay(s);
      moving = true;
    }

    if (moving || drifting) {
      lightRaf = requestAnimationFrame(tick);
    } else {
      lightRunning = false; // idle — wake on the next pointer move
    }
  };

  lightRaf = requestAnimationFrame(tick);
}

function stopLightLoop(): void {
  cancelAnimationFrame(lightRaf);
  lightRunning = false;
}

function initLight(signal: AbortSignal): void {
  lightStates = [];
  if (reduceMotion()) return;
  const frames = Array.from(
    document.querySelectorAll<HTMLElement>('[data-light]')
  );
  if (!frames.length) return;

  for (const frame of frames) {
    const overlay = frame.querySelector<HTMLElement>('.plate-light');
    if (!overlay) continue;

    const s: LightState = {
      frame,
      overlay,
      w: 0,
      h: 0,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      engaged: false,
      active: false,
      visible: false,
      phase: Math.PI * 0.3,
    };
    measureLight(s);
    s.x = s.tx = s.w * 0.5;
    s.y = s.ty = s.h * 0.44;
    overlay.style.left = '0px';
    overlay.style.top = '0px';
    placeOverlay(s);

    // the arena includes the text layered above the photograph
    const arena =
      frame.closest<HTMLElement>('.cover, .chapter-hero') ??
      frame.parentElement ??
      frame;

    arena.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        const r = s.frame.getBoundingClientRect();
        s.tx = e.clientX - r.left;
        s.ty = e.clientY - r.top;
        s.engaged = true;
        s.active = true;
        startLightLoop();
      },
      { passive: true, signal }
    );
    arena.addEventListener(
      'pointerleave',
      () => {
        s.active = false; // the light stays where it was left standing
      },
      { signal }
    );

    lightStates.push(s);
  }

  lightIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const s = lightStates.find((st) => st.frame === entry.target);
        if (!s) continue;
        s.visible = entry.isIntersecting;
        if (s.visible) {
          measureLight(s);
          startLightLoop();
        }
      }
    },
    { rootMargin: '12% 0px' }
  );
  for (const s of lightStates) lightIO.observe(s.frame);

  window.addEventListener(
    'resize',
    () => lightStates.forEach(measureLight),
    { passive: true, signal }
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) stopLightLoop();
      else startLightLoop();
    },
    { signal }
  );

  startLightLoop();
}

/* ————— poems settle like letterpress ————— */
function initPoems(): void {
  const poems = document.querySelectorAll<HTMLElement>('.poem');

  // right-aligned poems live at their right edge — start there when
  // the block is narrower than the poem
  for (const poem of poems) {
    if (!poem.classList.contains('poem--right')) continue;
    const pre = poem.querySelector('pre');
    if (pre) pre.scrollLeft = pre.scrollWidth;
  }

  if (!('IntersectionObserver' in window) || reduceMotion()) {
    poems.forEach((p) => p.classList.add('is-set'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-set');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  poems.forEach((p) => io.observe(p));
}

/* ————— contents dialog (ribbon + fore-edge both open it) ————— */
function initContents(signal: AbortSignal): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-contents]');
  if (!dialog) return;

  for (const opener of document.querySelectorAll<HTMLElement>(
    '[data-open-contents]'
  )) {
    opener.addEventListener('click', () => dialog.showModal(), { signal });
  }

  dialog
    .querySelector<HTMLButtonElement>('[data-close-contents]')
    ?.addEventListener('click', () => dialog.close(), { signal });

  dialog.addEventListener(
    'click',
    (e) => {
      if (e.target === dialog) dialog.close();
    },
    { signal }
  );
}

/* ————— fold-outs change the book's height —————
   Lenis caches the scroll limit; re-measure when any details opens or
   closes (again after the unfold transition finishes), or scrolling
   stops short of the newly revealed content. */
function initDetailsResize(signal: AbortSignal): void {
  for (const details of document.querySelectorAll('details')) {
    details.addEventListener(
      'toggle',
      () => {
        lenis?.resize();
        window.setTimeout(() => lenis?.resize(), 650);
      },
      { signal }
    );
  }
}

/* ————— turning pages: arrow keys & swipe ————— */
let turnDirection: 'forward' | 'back' = 'forward';

function currentBookIndex(): number {
  const path =
    window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  return BOOK_ORDER.indexOf(path);
}

function turnPage(dir: 'forward' | 'back'): void {
  const idx = currentBookIndex();
  if (idx < 0) return; // not a bound page (e.g. 404)
  const dest = BOOK_ORDER[idx + (dir === 'forward' ? 1 : -1)];
  if (!dest) return; // the book ends here
  turnDirection = dir;
  navigate(dest);
}

/* Keyboard only: touch swipe was removed — it fought iOS's native
   edge-swipe-back gesture and the turn never felt smooth under a finger.
   On phones, the turn-page links and the contents dialog navigate. */
function initTurning(signal: AbortSignal): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-contents]');

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (dialog?.open) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      if (e.key === 'ArrowRight') turnPage('forward');
      else if (e.key === 'ArrowLeft') turnPage('back');
    },
    { signal }
  );
}

/* ————— “please open” ————— */
function initScrollButtons(signal: AbortSignal): void {
  for (const btn of document.querySelectorAll<HTMLElement>('[data-scroll-to]')) {
    btn.addEventListener(
      'click',
      () => {
        const target = document.querySelector(btn.dataset.scrollTo ?? '');
        if (!target) return;
        if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.6 });
        else
          target.scrollIntoView({
            behavior: reduceMotion() ? 'auto' : 'smooth',
          });
      },
      { signal }
    );
  }
}

/* ————— lifecycle ————— */
function boot(): void {
  teardown = new AbortController();
  const { signal } = teardown;
  startLenis();
  initFolio(signal);
  initLight(signal);
  initPoems();
  initContents(signal);
  initScrollButtons(signal);
  initTurning(signal);
  initDetailsResize(signal);
}

document.addEventListener('astro:page-load', boot);

document.addEventListener('astro:before-swap', (event) => {
  // let the incoming page know which way it is being turned
  event.newDocument.documentElement.dataset.turn = turnDirection;
  turnDirection = 'forward';

  document.querySelector<HTMLDialogElement>('[data-contents]')?.close();
  teardown?.abort();
  teardown = null;
  stopLightLoop();
  lightIO?.disconnect();
  lightIO = null;
  lightStates = [];
  stopLenis();
  document.body.classList.remove('chrome-inverse');
});
