"use strict";

(function () {
    const SETTINGS_CACHE_KEY = "emmagina_site_settings_cache_v2";

    const CSS_VARIABLES = {
        primary: "--color-primary",
        primaryDark: "--color-primary-dark",
        primaryDeep: "--color-primary-deep",
        primarySoft: "--color-primary-soft",
        secondary: "--color-secondary",
        accent: "--color-accent",
        background: "--color-background",
        surface: "--color-surface",
        surfaceSoft: "--color-surface-soft",
        text: "--color-text",
        textSoft: "--color-text-soft",
        border: "--color-border",
        headerBackground: "--color-header-background",
        footerBackground: "--color-footer-background",
        footerText: "--color-footer-text",
        buttonText: "--color-button-text"
    };

    function directImages(container) {
        return [...container.children].filter((child) => child.tagName === "IMG");
    }

    function isLegacyMommyAsset(value) {
        return /mommy[_-]?crafts|jo3bgrnh/i.test(String(value || ""));
    }

    function safeImageUrl(value) {
        const url = String(value || "").trim();
        if (!url || isLegacyMommyAsset(url)) return "";
        if (/^(https:\/\/|data:image\/|assets\/|img\/|\.\/|\.\.\/|\/)/i.test(url)) return url;
        return "";
    }

    function updateBrandContainer(container, branding, colors) {
        const images = directImages(container);
        const logoUrl = safeImageUrl(branding.logo?.url);
        let logo = container.querySelector(":scope > img[data-site-logo]") || images.find((item) => item.dataset.siteLogo !== undefined) || null;

        if (logoUrl) {
            if (!logo) {
                logo = document.createElement("img");
                container.prepend(logo);
            }

            logo.dataset.siteLogo = "";
            logo.hidden = false;
            logo.src = logoUrl;
            logo.alt = branding.logo.alt || "Logo Emmagina";
            logo.style.width = `${Number(branding.logo.width) || 52}px`;
            logo.style.height = "auto";
            logo.style.maxWidth = "min(28vw, 240px)";
            logo.style.maxHeight = "none";
            logo.style.objectFit = "contain";
            logo.style.transform = `translate(${Number(branding.logo.offsetX) || 0}px, ${Number(branding.logo.offsetY) || 0}px)`;
        } else if (logo) {
            logo.hidden = true;
            logo.removeAttribute("src");
        }

        let titleImage = container.querySelector(":scope > img.logo-title, :scope > img[data-site-title-logo]") || images.find((item) => item !== logo) || null;
        let titleText = container.querySelector(":scope > [data-site-title-text]") || container.querySelector(":scope > strong");

        const titleUrl = safeImageUrl(branding.title?.url);
        const titleMode = branding.title?.mode === "image" && titleUrl ? "image" : "text";

        container.style.gap = `${Number(branding.title?.gap) || 10}px`;

        if (titleMode === "text") {
            if (titleImage) {
                titleImage.hidden = true;
                titleImage.removeAttribute("src");
            }
            if (!titleText) {
                titleText = document.createElement("strong");
                container.appendChild(titleText);
            }
            titleText.dataset.siteTitleText = "";
            titleText.hidden = false;
            titleText.textContent = branding.title?.text || "Emmagina";
            titleText.style.fontSize = `${Number(branding.title?.fontSize) || 32}px`;
            titleText.style.lineHeight = "1.1";
            titleText.style.color = colors.primaryDark || colors.text || "#45505f";
            titleText.style.transform = `translate(${Number(branding.title?.offsetX) || 0}px, ${Number(branding.title?.offsetY) || 0}px)`;
            titleText.style.whiteSpace = "nowrap";
        } else {
            if (titleText) titleText.hidden = true;
            if (!titleImage) {
                titleImage = document.createElement("img");
                container.appendChild(titleImage);
            }
            titleImage.dataset.siteTitleLogo = "";
            titleImage.hidden = false;
            titleImage.src = titleUrl;
            titleImage.alt = branding.title.text || "Emmagina";
            titleImage.style.width = `${Number(branding.title.width) || 220}px`;
            titleImage.style.height = "auto";
            titleImage.style.maxWidth = container.classList.contains("brand-link")
                ? "min(65vw, 520px)"
                : "min(58vw, 320px)";
            titleImage.style.maxHeight = "none";
            titleImage.style.objectFit = "contain";
            titleImage.style.transform = `translate(${Number(branding.title.offsetX) || 0}px, ${Number(branding.title.offsetY) || 0}px)`;
        }
    }


    function safeAnnouncementUrl(value) {
        const url = String(value || "").trim();
        if (!url) return "";
        if (/^https:\/\//i.test(url) || /^(\/|\.\/|\.\.\/|[a-z0-9_-]+\.html(?:[?#].*)?$)/i.test(url)) return url;
        return "";
    }

    function createAnnouncementItem(item, linkColor) {
        const text = String(item?.text || "").trim();
        if (!text) return null;
        const url = safeAnnouncementUrl(item?.url);
        const element = document.createElement(url ? "a" : "span");
        element.className = "promo-banner-text";
        element.textContent = text;
        if (url) {
            element.href = url;
            element.style.color = linkColor;
            if (/^https:\/\//i.test(url)) {
                element.target = "_blank";
                element.rel = "noopener noreferrer";
            }
        }
        return element;
    }

    function applyAnnouncementBar(settings) {
        const config = settings?.announcementBar || {};
        const items = Array.isArray(config.items) ? config.items.filter((item) => String(item?.text || "").trim()) : [];
        document.querySelectorAll(".promo-banner").forEach((banner) => {
            banner.hidden = config.enabled === false || items.length === 0;
            if (banner.hidden) return;
            banner.style.background = config.backgroundColor || "#71364F";
            banner.style.color = config.textColor || "#FFFFFF";
            banner.style.setProperty("--promo-duration", `${Math.max(6, Number(config.speedSeconds) || 22)}s`);
            let track = banner.querySelector(".promo-banner-track");
            if (!track) {
                track = document.createElement("div");
                track.className = "promo-banner-track";
                banner.appendChild(track);
            }
            track.replaceChildren();
            for (let copy = 0; copy < 2; copy += 1) {
                const loop = document.createElement("div");
                loop.className = "promo-banner-loop";
                if (copy === 1) loop.setAttribute("aria-hidden", "true");
                items.forEach((item) => {
                    const node = createAnnouncementItem(item, config.linkColor || config.textColor || "#FFFFFF");
                    if (node) loop.appendChild(node);
                });
                track.appendChild(loop);
            }
        });
    }


    function isProductMobileNavbarActions(selector) {
        // Conserva el nombre por compatibilidad. Desde v3.47.0,
        // el editor visual no desplaza las acciones del header en ningún móvil.
        return selector === ".site-header .navbar-actions"
            && window.matchMedia("(max-width: 820px)").matches;
    }

    function resetProductMobileNavbarActions(element) {
        if (!element) return;
        element.style.setProperty("translate", "0px 0px", "important");
        element.style.setProperty("transform", "none", "important");
        element.style.setProperty("position", "static", "important");
        element.style.setProperty("inset", "auto", "important");
        element.style.setProperty("margin", "0", "important");
    }

    function applyElementPosition(selector, value) {
        const isProductMobileActions = isProductMobileNavbarActions(selector);
        const offsetX = isProductMobileActions ? 0 : Number(value?.offsetX) || 0;
        const offsetY = isProductMobileActions ? 0 : Number(value?.offsetY) || 0;

        document.querySelectorAll(selector).forEach((element) => {
            element.style.setProperty("translate", `${offsetX}px ${offsetY}px`, "important");
            if (isProductMobileActions) resetProductMobileNavbarActions(element);
        });
    }

    function applyHeaderLayout(settings) {
        const layout = settings?.headerLayout || {};
        const groups = {
            social: layout.social,
            brand: layout.brand,
            support: layout.support,
            actions: layout.actions
        };

        for (const [name, value] of Object.entries(groups)) {
            const offsetX = Number(value?.offsetX) || 0;
            const offsetY = Number(value?.offsetY) || 0;
            document.documentElement.style.setProperty(`--mc-header-${name}-x`, `${offsetX}px`);
            document.documentElement.style.setProperty(`--mc-header-${name}-y`, `${offsetY}px`);
        }

        applyElementPosition(".container-hero .social-icons-header", layout.social);
        applyElementPosition(".container-hero .container-logo", layout.brand);
        applyElementPosition(".container-hero .customer-support", layout.support);
        applyElementPosition(".site-header .navbar-actions", layout.actions);
    }


    let currentStoreStatus = {
        paused: false,
        message: "Nuestra tienda online estará disponible próximamente. Si necesitas consultar por un producto, escríbenos por WhatsApp.",
        whatsappNumber: CONFIG.whatsapp || "56900000000"
    };

    function cleanWhatsApp(value) {
        return String(value || CONFIG.whatsapp || "56900000000").replace(/[^0-9]/g, "") || "56900000000";
    }

    function storePauseMessage() {
        return String(currentStoreStatus.message || "Nuestra tienda online estará disponible próximamente. Si necesitas consultar por un producto, escríbenos por WhatsApp.").trim();
    }

    function storePauseWhatsappUrl() {
        const text = encodeURIComponent("Hola Emmagina, quiero consultar por un producto mientras la tienda online está en preparación.");
        return `https://wa.me/${cleanWhatsApp(currentStoreStatus.whatsappNumber)}?text=${text}`;
    }

    function ensurePauseStyles() {
        if (document.getElementById("mc-store-pause-styles")) return;
        const style = document.createElement("style");
        style.id = "mc-store-pause-styles";
        style.textContent = `
            .mc-store-paused .mc-purchase-action,
            .mc-store-paused #btn-open-checkout,
            .mc-store-paused #btn-enviar-pedido,
            .mc-store-paused #checkout-mobile-pay-button,
            .mc-store-paused #mc-quick-view-add-cart,
            .mc-store-paused #btn-enviar {
                opacity: .55;
                cursor: not-allowed !important;
            }
            .mc-store-pause-banner {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: .7rem;
                padding: .85rem 1rem;
                background: #71364F;
                color: #fff;
                text-align: center;
                font-weight: 700;
                box-shadow: 0 6px 18px rgba(54, 30, 47, .16);
                position: relative;
                z-index: 30;
            }
            .mc-store-pause-banner a {
                color: #fff;
                border: 1px solid rgba(255,255,255,.7);
                border-radius: 999px;
                padding: .45rem .8rem;
                text-decoration: none;
                white-space: nowrap;
            }
            .mc-store-pause-card {
                margin: 1rem auto;
                max-width: 920px;
                border: 1px solid #F0D6E6;
                border-radius: 18px;
                background: #FFF2FA;
                color: #372A32;
                padding: 1rem;
                box-shadow: 0 12px 30px rgba(113, 54, 79, .12);
            }
            .mc-store-pause-card strong { display:block; color:#71364F; margin-bottom:.25rem; }
            .mc-store-pause-card a { display:inline-flex; align-items:center; gap:.4rem; margin-top:.75rem; }
        `;
        document.head.appendChild(style);
    }

    function renderPauseBanner() {
        ensurePauseStyles();
        document.documentElement.classList.toggle("mc-store-paused", Boolean(currentStoreStatus.paused));
        document.body?.classList.toggle("mc-store-paused", Boolean(currentStoreStatus.paused));

        let banner = document.getElementById("mc-store-pause-banner");
        if (!currentStoreStatus.paused) {
            banner?.remove();
            return;
        }

        if (!banner) {
            banner = document.createElement("div");
            banner.id = "mc-store-pause-banner";
            banner.className = "mc-store-pause-banner";
            document.body?.prepend(banner);
        }

        banner.innerHTML = `
            <span>${storePauseMessage()}</span>
            <a href="${storePauseWhatsappUrl()}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
        `;
    }

    function renderPauseNotice(target, { compact = false } = {}) {
        const container = typeof target === "string" ? document.querySelector(target) : target;
        if (!container || !currentStoreStatus.paused) return null;
        let notice = container.querySelector?.(".mc-store-pause-card");
        if (!notice) {
            notice = document.createElement("div");
            notice.className = "mc-store-pause-card";
            container.prepend(notice);
        }
        notice.innerHTML = `
            <strong>Compras temporalmente pausadas</strong>
            <p>${storePauseMessage()}</p>
            <a class="btn-primary" href="${storePauseWhatsappUrl()}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
        `;
        if (compact) notice.classList.add("is-compact");
        return notice;
    }

    function syncPurchaseUi() {
        const paused = Boolean(currentStoreStatus.paused);
        const selectors = [
            "#btn-open-checkout",
            "#btn-enviar-pedido",
            "#checkout-mobile-pay-button",
            "#mc-quick-view-add-cart",
            "#btn-enviar"
        ];
        document.querySelectorAll(selectors.join(",")).forEach((button) => {
            button.classList.add("mc-purchase-action");
            button.toggleAttribute("aria-disabled", paused);
            if (["BUTTON", "INPUT"].includes(button.tagName)) button.disabled = paused;
            if (paused && button.tagName === "A") {
                button.dataset.pauseHref = button.getAttribute("href") || "";
                button.setAttribute("href", storePauseWhatsappUrl());
                button.setAttribute("target", "_blank");
                button.setAttribute("rel", "noopener noreferrer");
            } else if (!paused && button.dataset.pauseHref) {
                button.setAttribute("href", button.dataset.pauseHref);
                button.removeAttribute("target");
                button.removeAttribute("rel");
                delete button.dataset.pauseHref;
            }
        });

        renderPauseNotice(".product-detail, .product-main, .product-detail-shell", { compact: true });
        if (document.body?.dataset.page === "cart") renderPauseNotice(".cart-layout, main, .container", { compact: true });
        if (document.body?.dataset.page === "checkout") renderPauseNotice("#checkout-content, main, .checkout-shell", { compact: true });
    }

    function setStoreStatus(settings = {}) {
        currentStoreStatus = {
            ...currentStoreStatus,
            ...(settings.storeStatus || {}),
            whatsappNumber: cleanWhatsApp(settings.storeStatus?.whatsappNumber || currentStoreStatus.whatsappNumber)
        };
        renderPauseBanner();
        syncPurchaseUi();
        document.dispatchEvent(new CustomEvent("store:status", { detail: currentStoreStatus }));
    }

    function preventPurchase(event) {
        if (!currentStoreStatus.paused) return false;
        if (event) {
            event.preventDefault?.();
            event.stopPropagation?.();
        }
        renderPauseBanner();
        window.open(storePauseWhatsappUrl(), "_blank", "noopener,noreferrer");
        return true;
    }

    window.StoreStatus = Object.freeze({
        get: () => ({ ...currentStoreStatus }),
        isPaused: () => Boolean(currentStoreStatus.paused),
        message: storePauseMessage,
        whatsappUrl: storePauseWhatsappUrl,
        renderNotice: renderPauseNotice,
        preventPurchase
    });

    function apply(settings) {
        const colors = settings?.colors || {};
        setStoreStatus(settings);
        applyAnnouncementBar(settings);
        applyHeaderLayout(settings);
        for (const [key, variable] of Object.entries(CSS_VARIABLES)) {
            if (colors[key]) document.documentElement.style.setProperty(variable, colors[key]);
        }

        const branding = settings?.branding;
        if (!branding?.logo || !branding?.title) return;

        document.querySelectorAll(".brand-link, .account-brand, .content-brand, .legal-brand")
            .forEach((container) => updateBrandContainer(container, branding, colors));

        const faviconUrl = safeImageUrl(branding.logo?.url);
        if (faviconUrl) {
            document.querySelectorAll('link[rel~="icon"]').forEach((link) => {
                link.href = faviconUrl;
            });
        }

        syncPurchaseUi();
        document.dispatchEvent(new CustomEvent("site:settings-applied", { detail: settings }));
    }

    function markReady() {
        document.body?.classList.add("mc-site-settings-ready");
        document.documentElement.classList.add("mc-site-settings-ready");
    }

    function readCachedSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function saveCachedSettings(settings) {
        try {
            localStorage.setItem(
                SETTINGS_CACHE_KEY,
                JSON.stringify(settings)
            );
        } catch {
            /* Cache visual opcional. */
        }
    }

    function applyCachedSettings() {
        const cached = readCachedSettings();
        if (!cached) return false;
        apply(cached);
        return true;
    }

    async function load() {
        const hadCache = applyCachedSettings();

        if (hadCache) {
            markReady();
        }

        try {
            const settings = window.API?.request
                ? await window.API.request("/configuracion-sitio", { timeoutMs: 30000 })
                : null;
            if (settings) {
                apply(settings);
                saveCachedSettings(settings);
            }
        } catch (error) {
            console.warn("No fue posible cargar la apariencia personalizada:", error);
        } finally {
            markReady();
        }
    }

    window.SiteSettings = Object.freeze({ apply, load, applyCachedSettings });
    document.addEventListener("click", (event) => {
        const purchase = event.target.closest?.("#btn-open-checkout, #btn-enviar-pedido, #checkout-mobile-pay-button, #mc-quick-view-add-cart, #btn-enviar");
        if (purchase) preventPurchase(event);
    }, true);
    document.addEventListener("DOMContentLoaded", load, { once: true });
})();
