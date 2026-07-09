"use strict";

(function () {
  const instances = new WeakMap();

  function initAll(root = document) {
    root.querySelectorAll("[data-carousel]").forEach(init);
  }

  function init(carousel) {
    if (!carousel || instances.has(carousel)) return instances.get(carousel);
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const track = carousel.querySelector("[data-carousel-track]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    if (!viewport || !track) return null;

    const state = {
      index: 0,
      step: 0,
      maxIndex: 0,
      timer: null,
      dragging: false,
      startX: 0,
      startTranslate: 0,
      currentTranslate: 0,
      pointerId: null,
      track,
      viewport,
      carousel,
      prev,
      next
    };

    function cards() {
      return Array.from(track.children).filter((child) => child.nodeType === 1);
    }

    function measure() {
      const items = cards();
      if (!items.length) {
        state.step = 0;
        state.maxIndex = 0;
        return;
      }
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const width = items[0].getBoundingClientRect().width;
      state.step = width + gap;
      const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / state.step));
      state.maxIndex = Math.max(0, items.length - visible);
      state.index = clamp(state.index, 0, state.maxIndex);
      apply(true);
      carousel.classList.toggle("is-static", state.maxIndex === 0);
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function translateFor(index) {
      return -(index * state.step);
    }

    function apply(noTransition = false) {
      if (noTransition) track.classList.add("no-transition");
      state.currentTranslate = translateFor(state.index);
      track.style.transform = `translate3d(${state.currentTranslate}px, 0, 0)`;
      if (noTransition) {
        requestAnimationFrame(() => track.classList.remove("no-transition"));
      }
    }

    function go(delta) {
      const total = cards().length;
      if (!total) return;
      if (state.maxIndex <= 0) {
        state.index = 0;
      } else {
        const nextIndex = state.index + delta;
        if (nextIndex > state.maxIndex) state.index = 0;
        else if (nextIndex < 0) state.index = state.maxIndex;
        else state.index = nextIndex;
      }
      apply();
    }

    function play() {
      stop();
      const autoplay = carousel.dataset.autoplay !== "false";
      if (!autoplay || state.maxIndex <= 0) return;
      state.timer = window.setInterval(() => go(1), Number(carousel.dataset.interval || 4200));
    }

    function stop() {
      if (state.timer) window.clearInterval(state.timer);
      state.timer = null;
    }

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      measure();
      stop();
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startTranslate = state.currentTranslate;
      track.classList.add("is-dragging", "no-transition");
      viewport.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      if (!state.dragging) return;
      const delta = event.clientX - state.startX;
      const nextTranslate = state.startTranslate + delta;
      track.style.transform = `translate3d(${nextTranslate}px, 0, 0)`;
      event.preventDefault();
    }

    function onPointerUp(event) {
      if (!state.dragging) return;
      const delta = event.clientX - state.startX;
      state.dragging = false;
      track.classList.remove("is-dragging", "no-transition");
      viewport.releasePointerCapture?.(state.pointerId);
      state.pointerId = null;

      if (Math.abs(delta) > Math.max(45, state.step * 0.18)) {
        go(delta < 0 ? 1 : -1);
      } else {
        apply();
      }
      play();
    }

    prev?.addEventListener("click", () => { stop(); go(-1); play(); });
    next?.addEventListener("click", () => { stop(); go(1); play(); });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("mouseenter", stop);
    viewport.addEventListener("mouseleave", () => { if (!state.dragging) play(); });
    viewport.addEventListener("wheel", () => {}, { passive: true });
    window.addEventListener("resize", () => { measure(); play(); });

    const observer = new MutationObserver(() => { measure(); play(); });
    observer.observe(track, { childList: true });

    instances.set(carousel, { measure, play, stop, go });
    requestAnimationFrame(() => { measure(); play(); });
    return instances.get(carousel);
  }

  window.EmmaginaCarousel = Object.freeze({ init, initAll });
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
