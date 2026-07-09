"use strict";

(function () {
    let bannerTimer = 0;
    let bannerIndex = 0;


    function getCarouselTrack(scrollArea) {
        if (!scrollArea) return null;
        return scrollArea.querySelector(".carousel-track") || scrollArea;
    }

    function cleanupCarouselClones(track) {
        if (!track) return;
        track.querySelectorAll("[data-carousel-clone='true']").forEach((node) => node.remove());
    }

    function attachCloneActions(clone, container) {
        clone.querySelectorAll(".add-cart").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (container?.dataset?.suppressClick === "true") return;
                const card = button.closest(".card-product");
                const href = card?.querySelector(".product-card-link")?.getAttribute("href");
                if (href) window.location.href = href;
            });
        });
    }

    function setupInfiniteCarousel(scrollArea) {
        const track = getCarouselTrack(scrollArea);
        if (!scrollArea || !track || !track.classList.contains("carousel-track")) return;

        cleanupCarouselClones(track);

        const originals = Array.from(track.children)
            .filter((node) => !node.matches(".loading-products, .catalog-empty") && node.dataset.carouselClone !== "true");

        if (originals.length < 2) {
            delete scrollArea.dataset.infiniteReady;
            delete scrollArea.dataset.infiniteWidth;
            return;
        }

        const before = originals.map((node) => {
            const clone = node.cloneNode(true);
            clone.dataset.carouselClone = "true";
            clone.setAttribute("aria-hidden", "true");
            attachCloneActions(clone, scrollArea);
            return clone;
        });

        const after = originals.map((node) => {
            const clone = node.cloneNode(true);
            clone.dataset.carouselClone = "true";
            clone.setAttribute("aria-hidden", "true");
            attachCloneActions(clone, scrollArea);
            return clone;
        });

        before.reverse().forEach((clone) => track.prepend(clone));
        after.forEach((clone) => track.append(clone));

        window.requestAnimationFrame(() => {
            const setWidth = Math.max(1, track.scrollWidth / 3);
            scrollArea.dataset.infiniteReady = "true";
            scrollArea.dataset.infiniteWidth = String(setWidth);
            if (!scrollArea.dataset.infinitePositioned) {
                scrollArea.scrollLeft = setWidth;
                scrollArea.dataset.infinitePositioned = "true";
            } else {
                normalizeInfiniteCarousel(scrollArea);
            }
        });
    }

    function normalizeInfiniteCarousel(scrollArea) {
        if (!scrollArea || scrollArea.dataset.infiniteReady !== "true") return;
        const setWidth = Number(scrollArea.dataset.infiniteWidth || 0);
        if (!setWidth) return;

        const current = scrollArea.scrollLeft;
        if (current < setWidth * 0.5) {
            scrollArea.scrollLeft = current + setWidth;
        } else if (current > setWidth * 1.5) {
            scrollArea.scrollLeft = current - setWidth;
        }
    }

    function enableDragScroll(scrollArea, options = {}) {
        if (!scrollArea || scrollArea.dataset.dragScrollReady === "true") return;

        let isPointerDown = false;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startScrollLeft = 0;
        let pointerId = null;
        let normalizeTimer = 0;

        const threshold = Number(options.threshold || 6);

        function scheduleNormalize() {
            window.clearTimeout(normalizeTimer);
            normalizeTimer = window.setTimeout(() => normalizeInfiniteCarousel(scrollArea), 90);
        }

        scrollArea.dataset.dragScrollReady = "true";
        scrollArea.classList.add("drag-scroll-ready");

        scrollArea.addEventListener("dragstart", (event) => event.preventDefault());

        scrollArea.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            if (scrollArea.scrollWidth <= scrollArea.clientWidth) return;

            isPointerDown = true;
            isDragging = false;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            startScrollLeft = scrollArea.scrollLeft;
        });

        scrollArea.addEventListener("pointermove", (event) => {
            if (!isPointerDown || event.pointerId !== pointerId) return;

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;

            if (!isDragging && Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                isDragging = true;
                scrollArea.classList.add("is-dragging-scroll");
                scrollArea.setPointerCapture?.(pointerId);
            }

            if (!isDragging) return;

            event.preventDefault();
            scrollArea.scrollLeft = startScrollLeft - deltaX;
            normalizeInfiniteCarousel(scrollArea);
        }, { passive: false });

        function stopDragging(event) {
            if (!isPointerDown || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return;

            const wasDragging = isDragging;
            isPointerDown = false;
            isDragging = false;
            scrollArea.classList.remove("is-dragging-scroll");

            if (wasDragging) {
                scrollArea.dataset.suppressClick = "true";
                window.setTimeout(() => {
                    delete scrollArea.dataset.suppressClick;
                }, 120);
                scheduleNormalize();
            }

            try {
                if (pointerId !== null) scrollArea.releasePointerCapture?.(pointerId);
            } catch {}
            pointerId = null;
        }

        scrollArea.addEventListener("pointerup", stopDragging);
        scrollArea.addEventListener("pointercancel", stopDragging);
        scrollArea.addEventListener("lostpointercapture", stopDragging);
        scrollArea.addEventListener("scroll", scheduleNormalize, { passive: true });

        scrollArea.addEventListener("click", (event) => {
            if (scrollArea.dataset.suppressClick === "true") {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
    }

    function initDragCarousels() {
        document
            .querySelectorAll(".carousel-container")
            .forEach((scrollArea) => {
                setupInfiniteCarousel(scrollArea);
                enableDragScroll(scrollArea);
            });

        document
            .querySelectorAll(".categories-grid")
            .forEach((scrollArea) => enableDragScroll(scrollArea));
    }

    function initCarouselArrows() {
        document
            .querySelectorAll(".carousel-arrow")
            .forEach((button) => {
                if (button.dataset.arrowReady === "true") return;
                button.dataset.arrowReady = "true";
                button.addEventListener("click", () => {
                    const container = document.getElementById(button.dataset.carousel);
                    if (!container) return;

                    const direction = Number(button.dataset.direction) || 1;
                    const distance = Math.max(240, container.clientWidth * 0.78) * direction;
                    container.scrollBy({ left: distance, behavior: "smooth" });
                    window.setTimeout(() => normalizeInfiniteCarousel(container), 420);
                });
            });
    }


    function initCategoryRail() {
        const rail = document.getElementById("categories-grid");
        if (!rail) return;

        document.querySelectorAll("[data-category-direction]")
            .forEach((button) => {
                if (button.dataset.categoryArrowReady === "true") return;
                button.dataset.categoryArrowReady = "true";
                button.addEventListener("click", () => {
                    const direction = Number(button.dataset.categoryDirection) || 1;
                    rail.scrollBy({
                        left: Math.max(260, rail.clientWidth * 0.72) * direction,
                        behavior: "smooth"
                    });
                });
            });
    }

    function bannerImage(slide) {
        const mobile = window.matchMedia(
            "(max-width: 700px)"
        ).matches;

        return mobile && slide.mobileImage
            ? slide.mobileImage
            : slide.desktopImage;
    }

    function applyBannerSlide(slide, index = bannerIndex) {
        const background =
            document.getElementById("banner-bg");

        const eyebrow =
            document.getElementById("hero-eyebrow");

        const title =
            document.getElementById("hero-title");

        const button =
            document.getElementById("hero-cta");

        if (!background || !slide) return;

        const image = bannerImage(slide);
        const fallbackColor = "#eef8fc";

        background.classList.add("is-changing");

        window.setTimeout(() => {
            background.style.backgroundColor = fallbackColor;
            background.style.backgroundImage = image
                ? `url("${image}")`
                : "none";

            background.style.backgroundPosition =
                slide.position || "center";

            if (eyebrow && slide.eyebrow) {
                eyebrow.textContent = slide.eyebrow;
            }

            if (title && slide.title) {
                title.textContent = slide.title;
            }

            if (button) {
                button.textContent =
                    slide.buttonText || "Ver productos";

                button.href =
                    slide.target || "#lo-mas-vendido";
            }

            background.classList.remove("is-changing");

            document
                .querySelectorAll(".banner-pagination-dot")
                .forEach((dot, dotIndex) => {
                    const active = dotIndex === index;
                    dot.classList.toggle("active", active);
                    dot.setAttribute("aria-current", active ? "true" : "false");
                });
        }, 160);
    }

    function mapApiBanner(banner) {
        return {
            desktopImage:
                banner.imagenEscritorio ||
                banner.desktopImage ||
                "",
            mobileImage:
                banner.imagenMovil ||
                banner.mobileImage ||
                "",
            position:
                banner.posicion ||
                banner.position ||
                "center",
            eyebrow:
                banner.eyebrow ||
                banner.textoSuperior ||
                "",
            title:
                banner.titulo ||
                banner.title ||
                "",
            buttonText:
                banner.textoBoton ||
                banner.buttonText ||
                "Ver productos",
            target:
                banner.destino ||
                banner.target ||
                "#lo-mas-vendido"
        };
    }

    async function getBannerSlides() {
        try {
            const data =
                await API.request(
                    "/banners"
                );

            if (
                Array.isArray(data) &&
                data.length
            ) {
                return data.map(
                    mapApiBanner
                );
            }
        } catch (error) {
            console.warn(
                "Se utilizarán los banners de config.js:",
                error.message
            );
        }

        return Array.isArray(
            CONFIG.HOME_BANNERS
        )
            ? CONFIG.HOME_BANNERS
            : [];
    }

    function startBannerTimer(slides) {
        window.clearInterval(bannerTimer);

        if (slides.length <= 1) return;

        bannerTimer = window.setInterval(() => {
            bannerIndex = (bannerIndex + 1) % slides.length;
            applyBannerSlide(slides[bannerIndex], bannerIndex);
        }, 7000);
    }

    function renderBannerPagination(slides) {
        const pagination = document.getElementById("banner-pagination");
        if (!pagination) return;

        pagination.innerHTML = "";
        pagination.hidden = slides.length <= 1;

        slides.forEach((slide, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `banner-pagination-dot${index === 0 ? " active" : ""}`;
            button.setAttribute("aria-label", `Mostrar banner ${index + 1}: ${slide.title || "promoción"}`);
            button.setAttribute("aria-current", index === 0 ? "true" : "false");
            button.addEventListener("click", () => {
                bannerIndex = index;
                applyBannerSlide(slides[index], index);
                startBannerTimer(slides);
            });
            pagination.appendChild(button);
        });
    }

    async function initBanner() {
        const slides =
            await getBannerSlides();

        if (!slides.length) return;

        bannerIndex = 0;
        renderBannerPagination(slides);
        applyBannerSlide(slides[0], 0);
        startBannerTimer(slides);

        window
            .matchMedia("(max-width: 700px)")
            .addEventListener?.("change", () => {
                applyBannerSlide(
                    slides[bannerIndex],
                    bannerIndex
                );
            });
    }

    function initHeroScroll() {
        const button =
            document.getElementById("hero-cta");

        button?.addEventListener("click", (event) => {
            const selector =
                button.getAttribute("href");

            if (!selector?.startsWith("#")) return;

            const destination =
                document.querySelector(selector);

            if (!destination) return;

            event.preventDefault();

            destination.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    function openCustomizationFromQuery() {
        const params =
            new URLSearchParams(window.location.search);

        if (params.get("personalizar") === "1") {
            window.Customization?.open();
        }
    }

    // Emmagina v1.7: los carruseles de la home ahora se gestionan
    // exclusivamente desde js/emmagina-carousel-v170.js para evitar
    // doble inicialización, scroll bloqueado y conflictos con flechas.
    window.EmmaginaDragCarousels = function () {
        window.EmmaginaCarouselV170?.refresh?.();
    };

    window.addEventListener("emmagina:products-rendered", () => {
        window.EmmaginaCarouselV170?.refresh?.();
    });

    document.addEventListener("DOMContentLoaded", () => {
        // v1.7: initCarouselArrows/initDragCarousels quedan desactivados aquí.
        // El módulo emmagina-carousel-v170.js toma el control completo.
        initCategoryRail();
        initBanner();
        initHeroScroll();

        window.setTimeout(
            openCustomizationFromQuery,
            0
        );
    });

    window.addEventListener("beforeunload", () => {
        window.clearInterval(bannerTimer);
    });
})();
