"use strict";

/*
 * Emmagina v1.7
 * Carrusel transform-based: no depende de scrollLeft ni de scroll horizontal.
 * Soporta movimiento automático infinito, flechas y arrastre lateral con clic.
 */
(function () {
    const SELECTOR = "body[data-page='home'] .carousel-container";
    const TRACK_SELECTOR = ".carousel-track";
    const CLONE_SELECTOR = "[data-emm-carousel-clone='true']";
    const state = new WeakMap();
    let loopId = 0;

    function number(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getTrack(container) {
        return container?.querySelector(TRACK_SELECTOR) || null;
    }

    function isRealItem(node) {
        return node instanceof HTMLElement &&
            !node.matches(CLONE_SELECTOR) &&
            !node.matches("[data-carousel-clone='true']") &&
            !node.matches(".loading-products, .catalog-empty") &&
            (node.classList.contains("card-product") || node.children.length > 0);
    }

    function getOriginalItems(track) {
        if (!track) return [];
        return Array.from(track.children).filter(isRealItem);
    }

    function cleanup(track) {
        if (!track) return;
        track.querySelectorAll(`${CLONE_SELECTOR}, [data-carousel-clone='true']`).forEach((node) => node.remove());
        track.style.transform = "";
        track.style.transition = "";
    }

    function getGap(track) {
        if (!track) return 0;
        const styles = window.getComputedStyle(track);
        return number(styles.columnGap || styles.gap, 0);
    }

    function measureSetWidth(track, items) {
        if (!track || !items.length) return 0;
        const gap = getGap(track);
        return items.reduce((total, item) => total + item.getBoundingClientRect().width, 0) + gap * Math.max(0, items.length - 1);
    }

    function cloneItem(item) {
        const clone = item.cloneNode(true);
        clone.dataset.emmCarouselClone = "true";
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a, button, input, select, textarea").forEach((element) => {
            element.tabIndex = -1;
        });
        clone.querySelectorAll("img").forEach((image) => {
            image.loading = "lazy";
            image.decoding = "async";
            image.draggable = false;
        });
        return clone;
    }

    function apply(container) {
        const data = state.get(container);
        const track = getTrack(container);
        if (!data || !track) return;

        if (data.originalWidth > 0) {
            while (data.position >= data.originalWidth * 2) {
                data.position -= data.originalWidth;
            }
            while (data.position < data.originalWidth) {
                data.position += data.originalWidth;
            }
        }

        track.style.transform = `translate3d(${-data.position}px, 0, 0)`;
    }

    function prepare(container) {
        const track = getTrack(container);
        if (!track) return;

        cleanup(track);

        const items = getOriginalItems(track);
        if (items.length < 2) {
            container.classList.remove("emm-carousel-ready");
            state.set(container, { ready: false, paused: true });
            return;
        }

        const before = document.createDocumentFragment();
        const after = document.createDocumentFragment();

        items.forEach((item) => before.appendChild(cloneItem(item)));
        items.forEach((item) => after.appendChild(cloneItem(item)));

        track.prepend(before);
        track.append(after);

        window.requestAnimationFrame(() => {
            const originals = getOriginalItems(track);
            const originalWidth = measureSetWidth(track, originals);

            if (!originalWidth || originalWidth <= container.clientWidth * 0.25) {
                container.classList.remove("emm-carousel-ready");
                state.set(container, { ready: false, paused: true });
                return;
            }

            const data = {
                ready: true,
                paused: false,
                dragging: false,
                pointerId: null,
                startX: 0,
                startY: 0,
                startPosition: originalWidth,
                position: originalWidth,
                originalWidth,
                lastInteraction: 0,
                animation: null
            };

            state.set(container, data);
            container.classList.add("emm-carousel-ready");
            apply(container);
        });
    }

    function animateTo(container, target, duration = 320) {
        const data = state.get(container);
        if (!data?.ready) return;

        const start = data.position;
        const change = target - start;
        const startedAt = performance.now();
        data.animation = true;
        data.paused = true;

        function frame(now) {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            data.position = start + change * eased;
            apply(container);

            if (progress < 1 && data.animation) {
                window.requestAnimationFrame(frame);
                return;
            }

            data.animation = null;
            data.paused = false;
            apply(container);
        }

        window.requestAnimationFrame(frame);
    }

    function bindContainer(container) {
        if (container.dataset.emmCarouselV170Bound === "true") return;
        container.dataset.emmCarouselV170Bound = "true";

        container.addEventListener("wheel", (event) => {
            // El mouse/trackpad solo debe mover la página verticalmente.
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                event.preventDefault();
            }
        }, { passive: false, capture: true });

        container.addEventListener("dragstart", (event) => event.preventDefault());

        container.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            const data = state.get(container);
            if (!data?.ready) return;

            data.animation = null;
            data.pointerId = event.pointerId;
            data.startX = event.clientX;
            data.startY = event.clientY;
            data.startPosition = data.position;
            data.dragging = false;
            data.paused = true;
            data.lastInteraction = Date.now();
            container.classList.add("emm-carousel-pressed");
        }, { capture: true });

        container.addEventListener("pointermove", (event) => {
            const data = state.get(container);
            if (!data?.ready || data.pointerId !== event.pointerId) return;

            const dx = event.clientX - data.startX;
            const dy = event.clientY - data.startY;

            if (!data.dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
                data.dragging = true;
                container.classList.add("is-dragging-scroll");
                container.setPointerCapture?.(event.pointerId);
            }

            if (!data.dragging) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            data.position = data.startPosition - dx;
            apply(container);
        }, { passive: false, capture: true });

        function finishPointer(event) {
            const data = state.get(container);
            if (!data || (event?.pointerId !== undefined && data.pointerId !== event.pointerId)) return;

            const wasDragging = data.dragging;
            data.pointerId = null;
            data.dragging = false;
            data.paused = false;
            data.lastInteraction = Date.now();
            container.classList.remove("is-dragging-scroll", "emm-carousel-pressed");

            if (wasDragging) {
                container.dataset.suppressClick = "true";
                window.setTimeout(() => delete container.dataset.suppressClick, 180);
                apply(container);
            }

            try {
                container.releasePointerCapture?.(event.pointerId);
            } catch {}
        }

        container.addEventListener("pointerup", finishPointer, { capture: true });
        container.addEventListener("pointercancel", finishPointer, { capture: true });
        container.addEventListener("lostpointercapture", finishPointer, { capture: true });

        container.addEventListener("click", (event) => {
            if (container.dataset.suppressClick === "true") {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, { capture: true });
    }

    function bindArrows() {
        document.querySelectorAll(".carousel-arrow[data-carousel]").forEach((button) => {
            if (button.dataset.emmCarouselV170Arrow === "true") return;
            button.dataset.emmCarouselV170Arrow = "true";

            button.addEventListener("click", (event) => {
                const container = document.getElementById(button.dataset.carousel || "");
                const data = container ? state.get(container) : null;
                const track = container ? getTrack(container) : null;

                if (!container || !data?.ready || !track) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                const direction = number(button.dataset.direction, 1);
                const firstCard = track.querySelector(".card-product:not([data-emm-carousel-clone='true']):not([data-carousel-clone='true'])");
                const step = (firstCard?.getBoundingClientRect().width || Math.max(240, container.clientWidth * 0.72)) + getGap(track);

                animateTo(container, data.position + direction * step);
            }, { capture: true });
        });
    }

    function refresh() {
        document.querySelectorAll(SELECTOR).forEach((container) => {
            bindContainer(container);
            prepare(container);
        });
        bindArrows();
        startLoop();
    }

    function startLoop() {
        if (loopId) return;

        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (reducedMotion) return;

        let last = 0;
        const tick = (time) => {
            const delta = last ? Math.min(40, time - last) : 16;
            last = time;

            document.querySelectorAll(SELECTOR).forEach((container) => {
                const data = state.get(container);
                if (!data?.ready || data.paused || data.dragging) return;
                data.position += delta * 0.028;
                apply(container);
            });

            loopId = window.requestAnimationFrame(tick);
        };

        loopId = window.requestAnimationFrame(tick);
    }

    /*
     * No usamos MutationObserver para este carrusel.
     * El render de productos ya dispara emmagina:products-rendered y el
     * MutationObserver generaba reinicios en bucle al crear clones infinitos.
     */

    function scheduleRefresh() {
        window.clearTimeout(scheduleRefresh.timer);
        scheduleRefresh.timer = window.setTimeout(refresh, 120);
    }

    document.addEventListener("DOMContentLoaded", () => {
        refresh();
    });
    window.addEventListener("load", scheduleRefresh);
    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("emmagina:products-rendered", scheduleRefresh);
    window.addEventListener("products:loaded", scheduleRefresh);

    window.EmmaginaCarouselV170 = {
        refresh: scheduleRefresh,
        forceRefresh: refresh,
        debug() {
            return Array.from(document.querySelectorAll(SELECTOR)).map((container) => ({
                id: container.id,
                state: state.get(container),
                cards: getOriginalItems(getTrack(container)).length
            }));
        }
    };
})();
