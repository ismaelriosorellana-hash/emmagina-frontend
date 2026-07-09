"use strict";

/*
 * Emmagina Carousel v2.1
 * - No usa scrollLeft: se mueve por transform para evitar rebotes nativos.
 * - Crea clones internos para loop infinito real.
 * - Desactiva el drag nativo de imágenes/enlaces dentro del carrusel.
 * - El click normal abre links; el click después de arrastrar se cancela.
 */
(function () {
  const instances = new WeakMap();

  function toArray(value) {
    return Array.from(value || []);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function initAll(root = document) {
    root.querySelectorAll("[data-carousel]").forEach((carousel) => init(carousel));
  }

  function init(carousel) {
    if (!carousel) return null;
    const current = instances.get(carousel);
    if (current) {
      current.refresh();
      return current;
    }

    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const track = carousel.querySelector("[data-carousel-track]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");

    if (!viewport || !track) return null;

    const state = {
      carousel,
      viewport,
      track,
      prev,
      next,
      realCount: 0,
      cloneCount: 0,
      visibleCount: 1,
      index: 0,
      step: 0,
      timer: null,
      dragging: false,
      dragMoved: false,
      suppressClick: false,
      startX: 0,
      startY: 0,
      startTranslate: 0,
      currentTranslate: 0,
      pointerId: null,
      resizeTimer: null
    };

    function realSlides() {
      return toArray(track.children).filter((item) => item.nodeType === 1 && item.dataset.carouselClone !== "true");
    }

    function allSlides() {
      return toArray(track.children).filter((item) => item.nodeType === 1);
    }

    function setNativeDragDisabled() {
      carousel.querySelectorAll("img, a").forEach((element) => {
        element.setAttribute("draggable", "false");
      });
    }

    function clearClones() {
      track.querySelectorAll("[data-carousel-clone='true']").forEach((clone) => clone.remove());
    }

    function cardGap() {
      const styles = window.getComputedStyle(track);
      return parseFloat(styles.columnGap || styles.gap || "0") || 0;
    }

    function measureStep() {
      const first = allSlides()[0];
      if (!first) return 0;
      return first.getBoundingClientRect().width + cardGap();
    }

    function setTransition(enabled) {
      track.classList.toggle("no-transition", !enabled);
    }

    function translateFor(index) {
      return -(index * state.step);
    }

    function apply(index = state.index, transition = true) {
      state.index = index;
      state.currentTranslate = translateFor(state.index);
      setTransition(transition);
      track.style.transform = `translate3d(${state.currentTranslate}px, 0, 0)`;
      if (!transition) {
        window.requestAnimationFrame(() => setTransition(true));
      }
    }

    function rebuild() {
      stop();
      setTransition(false);
      clearClones();
      setNativeDragDisabled();

      const originals = realSlides();
      state.realCount = originals.length;

      if (!state.realCount) {
        state.cloneCount = 0;
        state.index = 0;
        state.step = 0;
        state.currentTranslate = 0;
        track.style.transform = "translate3d(0, 0, 0)";
        carousel.classList.add("is-static");
        return;
      }

      const gap = cardGap();
      const firstWidth = originals[0].getBoundingClientRect().width || 1;
      state.step = firstWidth + gap;
      state.visibleCount = Math.max(1, Math.ceil(viewport.clientWidth / Math.max(1, state.step)));

      // Si hay un solo producto real, no tiene sentido simular infinito.
      if (state.realCount === 1) {
        state.cloneCount = 0;
        state.index = 0;
        apply(0, false);
        carousel.classList.add("is-static");
        return;
      }

      carousel.classList.remove("is-static");
      state.cloneCount = Math.min(state.realCount, state.visibleCount + 2);

      const prepend = originals.slice(-state.cloneCount).map((node) => cloneSlide(node));
      const append = originals.slice(0, state.cloneCount).map((node) => cloneSlide(node));

      prepend.reverse().forEach((node) => track.insertBefore(node, track.firstChild));
      append.forEach((node) => track.appendChild(node));

      state.index = state.cloneCount;
      state.step = measureStep();
      apply(state.index, false);
      play();
    }

    function cloneSlide(node) {
      const clone = node.cloneNode(true);
      clone.dataset.carouselClone = "true";
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, input, select, textarea").forEach((interactive) => {
        interactive.setAttribute("tabindex", "-1");
      });
      clone.querySelectorAll("img, a").forEach((element) => element.setAttribute("draggable", "false"));
      return clone;
    }

    function normalizeLoop() {
      if (state.realCount <= 1) return;
      const firstReal = state.cloneCount;
      const lastReal = state.cloneCount + state.realCount - 1;
      if (state.index > lastReal) apply(firstReal, false);
      if (state.index < firstReal) apply(lastReal, false);
    }

    function slideTo(index, transition = true) {
      if (!state.step || state.realCount <= 1) return;
      apply(index, transition);
    }

    function nextSlide() {
      slideTo(state.index + 1, true);
    }

    function previousSlide() {
      slideTo(state.index - 1, true);
    }

    function play() {
      stop();
      if (carousel.dataset.autoplay === "false" || state.realCount <= 1) return;
      const interval = Number(carousel.dataset.interval || 3600);
      state.timer = window.setInterval(nextSlide, Math.max(2200, interval));
    }

    function stop() {
      if (state.timer) window.clearInterval(state.timer);
      state.timer = null;
    }

    function pointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (state.realCount <= 1) return;
      stop();
      setNativeDragDisabled();
      state.dragging = true;
      state.dragMoved = false;
      state.suppressClick = false;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.startTranslate = state.currentTranslate;
      track.classList.add("is-dragging", "no-transition");
      viewport.setPointerCapture?.(event.pointerId);
    }

    function pointerMove(event) {
      if (!state.dragging) return;
      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      // Si el gesto es claramente vertical, dejamos que la página haga scroll.
      if (!state.dragMoved && Math.abs(deltaY) > Math.abs(deltaX) + 8) return;

      if (Math.abs(deltaX) > 4) {
        state.dragMoved = true;
        state.suppressClick = true;
      }

      if (state.dragMoved) {
        event.preventDefault();
        state.currentTranslate = state.startTranslate + deltaX;
        track.style.transform = `translate3d(${state.currentTranslate}px, 0, 0)`;
      }
    }

    function pointerUp(event) {
      if (!state.dragging) return;
      const deltaX = event.clientX - state.startX;
      state.dragging = false;
      track.classList.remove("is-dragging", "no-transition");
      viewport.releasePointerCapture?.(state.pointerId);
      state.pointerId = null;

      const threshold = Math.max(40, state.step * 0.16);
      if (Math.abs(deltaX) >= threshold) {
        const moveBy = clamp(Math.round(-deltaX / state.step), -3, 3) || (deltaX < 0 ? 1 : -1);
        slideTo(state.index + moveBy, true);
      } else {
        apply(state.index, true);
      }
      play();
    }

    function clickCapture(event) {
      if (!state.suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppressClick = false;
    }

    function resize() {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(rebuild, 160);
    }

    function refresh() {
      rebuild();
    }

    function destroy() {
      stop();
      window.clearTimeout(state.resizeTimer);
      viewport.removeEventListener("pointerdown", pointerDown);
      viewport.removeEventListener("pointermove", pointerMove);
      viewport.removeEventListener("pointerup", pointerUp);
      viewport.removeEventListener("pointercancel", pointerUp);
      viewport.removeEventListener("click", clickCapture, true);
      carousel.removeEventListener("dragstart", preventDrag);
      track.removeEventListener("transitionend", normalizeLoop);
      prev?.removeEventListener("click", previousSlide);
      next?.removeEventListener("click", nextSlide);
      window.removeEventListener("resize", resize);
      clearClones();
      instances.delete(carousel);
    }

    function preventDrag(event) {
      event.preventDefault();
    }

    viewport.addEventListener("pointerdown", pointerDown, { passive: true });
    viewport.addEventListener("pointermove", pointerMove, { passive: false });
    viewport.addEventListener("pointerup", pointerUp, { passive: true });
    viewport.addEventListener("pointercancel", pointerUp, { passive: true });
    viewport.addEventListener("click", clickCapture, true);
    carousel.addEventListener("dragstart", preventDrag);
    track.addEventListener("transitionend", normalizeLoop);
    prev?.addEventListener("click", () => { stop(); previousSlide(); play(); });
    next?.addEventListener("click", () => { stop(); nextSlide(); play(); });
    window.addEventListener("resize", resize);

    const api = Object.freeze({ refresh, rebuild, play, stop, next: nextSlide, prev: previousSlide, destroy });
    instances.set(carousel, api);
    window.requestAnimationFrame(rebuild);
    return api;
  }

  window.EmmaginaCarousel = Object.freeze({ init, initAll });
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
