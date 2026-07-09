"use strict";

/*
 * Emmagina v1.6
 * Carruseles estables: desplazamiento infinito, arrastre lateral y flechas.
 * Este módulo funciona encima del render dinámico de productos sin depender
 * del scroll horizontal del mouse. El scroll vertical queda reservado para la página.
 */
(function () {
    const CAROUSEL_SELECTOR = "body[data-page='home'] .carousel-container";
    const CLONE_SELECTOR = "[data-emm-carousel-clone='true'], [data-carousel-clone='true']";
    const state = new WeakMap();
    let rafId = 0;
    let initialized = false;

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getTrack(container) {
        return container?.querySelector(".carousel-track") || null;
    }

    function getItems(track) {
        if (!track) return [];
        return Array.from(track.children).filter((node) => {
            if (!(node instanceof HTMLElement)) return false;
            if (node.matches(CLONE_SELECTOR)) return false;
            if (node.matches(".loading-products, .catalog-empty")) return false;
            return node.classList.contains("card-product") || node.children.length > 0;
        });
    }

    function getGap(track) {
        const styles = window.getComputedStyle(track);
        return toNumber(styles.columnGap || styles.gap, 0);
    }

    function measureOriginalWidth(track, items) {
        if (!track || !items.length) return 0;
        const gap = getGap(track);
        const width = items.reduce((sum, item) => sum + item.getBoundingClientRect().width, 0) + gap * Math.max(0, items.length - 1);
        return Math.max(1, width);
    }

    function cloneItem(item) {
        const clone = item.cloneNode(true);
        clone.dataset.emmCarouselClone = "true";
        clone.dataset.carouselClone = "true";
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("img").forEach((image) => {
            image.loading = "lazy";
            image.decoding = "async";
        });
        return clone;
    }

    function cleanup(track) {
        track?.querySelectorAll(CLONE_SELECTOR).forEach((node) => node.remove());
    }

    function normalize(container) {
        const data = state.get(container);
        if (!data?.ready || !data.originalWidth) return;

        const min = data.originalWidth * (data.repeat - 0.5);
        const max = data.originalWidth * (data.repeat + 1.5);

        if (container.scrollLeft < min) {
            container.scrollLeft += data.originalWidth;
        } else if (container.scrollLeft > max) {
            container.scrollLeft -= data.originalWidth;
        }
    }

    function positionAtMiddle(container) {
        const data = state.get(container);
        if (!data?.ready) return;
        container.scrollLeft = data.originalWidth * data.repeat;
    }

    function prepare(container) {
        const track = getTrack(container);
        if (!track) return;

        cleanup(track);

        const items = getItems(track);
        if (!items.length) {
            state.set(container, { ready: false });
            return;
        }

        const originalWidth = measureOriginalWidth(track, items);
        const repeat = Math.max(4, Math.ceil((container.clientWidth * 2.2) / Math.max(originalWidth, 1)) + 1);

        const before = document.createDocumentFragment();
        const after = document.createDocumentFragment();

        for (let index = 0; index < repeat; index += 1) {
            items.forEach((item) => after.appendChild(cloneItem(item)));
            [...items].reverse().forEach((item) => before.appendChild(cloneItem(item)));
        }

        track.prepend(before);
        track.append(after);

        state.set(container, {
            ready: true,
            originalWidth,
            repeat,
            dragging: false,
            pointerId: null,
            startX: 0,
            startY: 0,
            startLeft: 0,
            moved: false,
            paused: false
        });

        window.requestAnimationFrame(() => positionAtMiddle(container));
    }

    function getCardLinkFromButton(button) {
        const card = button.closest(".card-product");
        return card?.querySelector(".product-card-link")?.getAttribute("href") || "";
    }

    function bindInteraction(container) {
        if (container.dataset.emmCarouselV160Ready === "true") return;
        container.dataset.emmCarouselV160Ready = "true";

        container.addEventListener("wheel", (event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                event.preventDefault();
            }
        }, { passive: false, capture: true });

        container.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            const data = state.get(container);
            if (!data?.ready) return;

            data.pointerId = event.pointerId;
            data.startX = event.clientX;
            data.startY = event.clientY;
            data.startLeft = container.scrollLeft;
            data.dragging = false;
            data.moved = false;
            data.paused = true;
            container.classList.add("emm-carousel-active-pointer");
        }, { capture: true });

        container.addEventListener("pointermove", (event) => {
            const data = state.get(container);
            if (!data?.ready || data.pointerId !== event.pointerId) return;

            const dx = event.clientX - data.startX;
            const dy = event.clientY - data.startY;

            if (!data.dragging && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
                data.dragging = true;
                data.moved = true;
                container.classList.add("is-dragging-scroll");
                container.setPointerCapture?.(event.pointerId);
            }

            if (!data.dragging) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            container.scrollLeft = data.startLeft - dx;
            normalize(container);
        }, { passive: false, capture: true });

        function endPointer(event) {
            const data = state.get(container);
            if (!data || (event?.pointerId !== undefined && data.pointerId !== event.pointerId)) return;

            const wasDragging = data.dragging;
            data.dragging = false;
            data.pointerId = null;
            data.paused = false;
            container.classList.remove("is-dragging-scroll", "emm-carousel-active-pointer");

            if (wasDragging) {
                container.dataset.suppressClick = "true";
                window.setTimeout(() => delete container.dataset.suppressClick, 180);
                normalize(container);
            }
        }

        container.addEventListener("pointerup", endPointer, { capture: true });
        container.addEventListener("pointercancel", endPointer, { capture: true });
        container.addEventListener("lostpointercapture", endPointer, { capture: true });

        container.addEventListener("mouseenter", () => {
            const data = state.get(container);
            if (data) data.paused = true;
        });

        container.addEventListener("mouseleave", () => {
            const data = state.get(container);
            if (data && !data.dragging) data.paused = false;
        });

        container.addEventListener("focusin", () => {
            const data = state.get(container);
            if (data) data.paused = true;
        });

        container.addEventListener("focusout", () => {
            const data = state.get(container);
            if (data && !data.dragging) data.paused = false;
        });

        container.addEventListener("click", (event) => {
            if (container.dataset.suppressClick === "true") {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            const button = event.target.closest?.(".add-cart");
            if (!button || !container.contains(button)) return;

            const href = getCardLinkFromButton(button);
            if (href) {
                event.preventDefault();
                event.stopImmediatePropagation();
                window.location.href = href;
            }
        }, { capture: true });
    }

    function bindArrows() {
        document.querySelectorAll(".carousel-arrow[data-carousel]").forEach((button) => {
            if (button.dataset.emmArrowV160Ready === "true") return;
            button.dataset.emmArrowV160Ready = "true";
            button.addEventListener("click", (event) => {
                const container = document.getElementById(button.dataset.carousel || "");
                const data = container ? state.get(container) : null;
                if (!container || !data?.ready) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                const direction = toNumber(button.dataset.direction, 1);
                const firstCard = getTrack(container)?.querySelector(".card-product:not([data-emm-carousel-clone='true'])");
                const cardWidth = firstCard?.getBoundingClientRect?.().width || Math.max(240, container.clientWidth * 0.72);
                const gap = getGap(getTrack(container));
                data.paused = true;
                container.scrollBy({
                    left: direction * (cardWidth + gap),
                    behavior: "smooth"
                });
                window.setTimeout(() => {
                    normalize(container);
                    data.paused = false;
                }, 460);
            }, { capture: true });
        });
    }

    function initOne(container) {
        bindInteraction(container);
        prepare(container);
    }

    function init() {
        document.querySelectorAll(CAROUSEL_SELECTOR).forEach(initOne);
        bindArrows();
        startAutoLoop();
    }

    function startAutoLoop() {
        if (rafId) return;
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (reducedMotion) return;

        let last = 0;
        const tick = (time) => {
            const delta = last ? Math.min(34, time - last) : 16;
            last = time;

            document.querySelectorAll(CAROUSEL_SELECTOR).forEach((container) => {
                const data = state.get(container);
                if (!data?.ready || data.paused || data.dragging) return;
                container.scrollLeft += delta * 0.018;
                normalize(container);
            });

            rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
    }

    function reinitSoon() {
        window.clearTimeout(reinitSoon.timer);
        reinitSoon.timer = window.setTimeout(init, 90);
    }

    document.addEventListener("DOMContentLoaded", reinitSoon);
    window.addEventListener("load", reinitSoon);
    window.addEventListener("resize", reinitSoon);
    window.addEventListener("emmagina:products-rendered", reinitSoon);
    window.addEventListener("products:loaded", reinitSoon);

    window.EmmaginaCarouselV160 = {
        init: reinitSoon,
        normalizeAll: () => document.querySelectorAll(CAROUSEL_SELECTOR).forEach(normalize)
    };
})();
