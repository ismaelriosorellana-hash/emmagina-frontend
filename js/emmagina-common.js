"use strict";

(function () {
  const BASE_NAV = [
    { label: "Inicio", href: "index.html", sortOrder: 10, source: "system" },
    { label: "Tienda", href: "catalogo.html", sortOrder: 20, source: "system" },
    { label: "Crea tu Figura", href: "pedido-personalizado.html", sortOrder: 30, source: "system" },
    { label: "Sobre Nosotros", href: "quienes-somos.html", sortOrder: 40, source: "system" },
    { label: "Preguntas Frecuentes", href: "preguntas-frecuentes.html", sortOrder: 50, source: "system" },
    { label: "Contáctanos", href: "contacto.html", sortOrder: 60, source: "system" }
  ];

  function displayBrandText(value) {
    return String(value ?? "")
      .replace(/EMMAGINA/g, "RHEMA DISEÑOS")
      .replace(/Emmagina/g, "Rhema Diseños")
      .replace(/Crea tu Escena/g, "Crea tu Figura")
      .replace(/3D Store/g, "Diseños 3D");
  }

  function escapeHtml(value) {
    return displayBrandText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanHref(value, fallback = "#") {
    const href = String(value || "").trim();
    if (!href || /^javascript:/i.test(href)) return fallback;
    return href;
  }

  function samePage(href, current) {
    const clean = cleanHref(href, "").split("?")[0].split("#")[0];
    return clean === current || (current === "" && clean === "index.html") || (current === "index.html" && clean === "");
  }

  function markActiveNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("is-active", samePage(href, current));
    });
  }


  const DEFAULT_PALETTE = Object.freeze({
    primary: "#8ECAE6",
    primaryDark: "#219EBC",
    primaryDeep: "#023047",
    primarySoft: "#EAF4F8",
    secondary: "#125373",
    accent: "#FB8500",
    background: "#EAF4F8",
    surface: "#FFFFFF",
    surfaceSoft: "#EAF4F8",
    text: "#023047",
    textSoft: "#125373",
    border: "rgba(2, 48, 71, 0.14)",
    footerBackground: "#023047",
    footerText: "#FFFFFF",
    buttonText: "#023047"
  });

  const LEGACY_PALETTE = new Set(["#FCC0E6", "#8E456A", "#71364F", "#FFF2FA", "#65445A", "#F59BCF", "#FFF9FD", "#F0D6E6", "#2F292C", "#F9F3F5", "#372A32", "#715F69"]);

  function colorValue(colors, key) {
    const value = String(colors?.[key] || "").trim();
    if (!value || LEGACY_PALETTE.has(value.toUpperCase())) return DEFAULT_PALETTE[key];
    return value;
  }

  function asPx(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number}px` : fallback;
  }

  function applySiteSettings(settings = {}) {
    const root = document.documentElement;
    const colors = settings.colors || {};
    const style = settings.visualStyle || {};
    const mapping = {
      "--cloud": colorValue(colors, "background"),
      "--paper": colorValue(colors, "surface"),
      "--mist": colorValue(colors, "surfaceSoft") || colorValue(colors, "primarySoft"),
      "--sand": colorValue(colors, "primarySoft"),
      "--clay": colorValue(colors, "primaryDark"),
      "--sky": colorValue(colors, "primary"),
      "--ink": colorValue(colors, "text"),
      "--muted": colorValue(colors, "textSoft"),
      "--line": colorValue(colors, "border"),
      "--footer-bg": colorValue(colors, "footerBackground"),
      "--footer-text": colorValue(colors, "footerText"),
      "--button-text": colorValue(colors, "buttonText"),
      "--buy": colorValue(colors, "accent"),
      "--radius-xl": asPx(style.cardRadius, null),
      "--radius-lg": asPx(Math.max(8, Number(style.cardRadius || 28) - 6), null),
      "--radius-md": asPx(style.inputRadius, null),
      "--section-spacing": asPx(style.sectionSpacing, null),
      "--container": style.pageMaxWidth ? `min(${Number(style.pageMaxWidth)}px, calc(100vw - 32px))` : null,
      "--button-radius": asPx(style.buttonRadius, null)
    };
    Object.entries(mapping).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });
    const shadow = style.shadowLevel === "none" ? "none" : style.shadowLevel === "medium" ? "0 22px 60px rgba(48,55,68,.14)" : "0 18px 42px rgba(48,55,68,.09)";
    root.style.setProperty("--shadow", shadow);
    document.body.dataset.density = style.density || "comfortable";

    const title = settings.branding?.title;
    const brand = document.querySelector(".brand");
    if (brand && title?.text) {
      const small = brand.querySelector("small")?.outerHTML || "<small>Diseños 3D</small>";
      brand.innerHTML = `<strong>${escapeHtml(title.text)}</strong>${small}`;
    }
  }

  async function loadAndApplySiteSettings() {
    if (!window.EmmaginaAPI?.getSiteSettings) return null;
    try {
      const settings = await window.EmmaginaAPI.getSiteSettings();
      applySiteSettings(settings);
      renderFooter(settings.footer || {});
      return settings;
    } catch (error) {
      console.warn("No fue posible cargar configuración visual:", error.message);
      return null;
    }
  }

  function normalizeNavKey(item = {}) {
    const href = cleanHref(item.href || "", "").split("?")[0].split("#")[0].toLowerCase();
    const label = String(item.label || "").trim().toLowerCase();
    if (href) return href;
    return label;
  }

  function mergeNavigation(cmsItems = []) {
    const map = new Map();
    BASE_NAV.forEach((item) => map.set(normalizeNavKey(item), { ...item, isVisible: true }));
    (Array.isArray(cmsItems) ? cmsItems : []).forEach((item) => {
      if (!item || item.isVisible === false || !item.label || !item.href) return;
      const cleanItem = {
        ...item,
        label: String(item.label).replace(/Emmagina/g, "Rhema Diseños").replace(/Crea tu Escena/g, "Crea tu Figura"),
        href: cleanHref(item.href, "#"),
        sortOrder: Number(item.sortOrder ?? item.orden ?? 100)
      };
      const key = normalizeNavKey(cleanItem);
      if (map.has(key)) {
        map.set(key, { ...map.get(key), ...cleanItem, href: map.get(key).href, label: map.get(key).label });
      } else {
        map.set(key, cleanItem);
      }
    });
    return [...map.values()].filter((item) => item.isVisible !== false).sort((a, b) => Number(a.sortOrder || a.orden || 100) - Number(b.sortOrder || b.orden || 100));
  }

  async function renderDynamicNav() {
    const nav = document.querySelector(".main-nav");
    if (!nav || !window.EmmaginaAPI?.getNavigation) {
      markActiveNav();
      return;
    }
    try {
      const items = await window.EmmaginaAPI.getNavigation();
      const list = mergeNavigation(items);
      nav.innerHTML = list
        .filter((item) => item && item.label && item.href && item.isVisible !== false)
        .map((item) => `<a href="${escapeHtml(cleanHref(item.href, "#"))}"${item.opensNewTab ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(item.label)}</a>`)
        .join("");
    } catch (error) {
      console.warn("No fue posible cargar navegación dinámica:", error.message);
    }
    markActiveNav();
  }

  function renderFooter(footer = {}) {
    const target = document.querySelector(".site-footer");
    if (!target || footer.enabled === false) return;
    const columns = (Array.isArray(footer.columns) ? footer.columns : [])
      .filter((column) => column && column.isVisible !== false)
      .sort((a,b) => (Number(a.sortOrder)||0) - (Number(b.sortOrder)||0));
    const colsHtml = columns.map((column) => `<nav class="footer-col" aria-label="${escapeHtml(column.title)}">
      <h3>${escapeHtml(column.title)}</h3>
      ${(Array.isArray(column.links) ? column.links : []).filter((link) => link.isVisible !== false).map((link) => `<a href="${escapeHtml(cleanHref(link.href, "#"))}">${escapeHtml(link.label)}</a>`).join("")}
    </nav>`).join("");
    const phone = String(footer.whatsapp || "").replace(/[^0-9]/g, "");
    const legal = (Array.isArray(footer.legalLinks) ? footer.legalLinks : [])
      .filter((link) => link.isVisible !== false)
      .map((link) => `<a href="${escapeHtml(cleanHref(link.href, "#"))}">${escapeHtml(link.label)}</a>`).join(" · ");
    target.innerHTML = `<div class="footer-inner">
      <section class="footer-col" aria-label="Marca">
        <h2 class="footer-brand">${escapeHtml(footer.brandTitle || window.CONFIG?.BRAND_NAME || "Rhema Diseños")}</h2>
        <p>${escapeHtml(footer.brandText || "")}</p>
      </section>
      ${colsHtml}
      <section class="footer-col" aria-label="Soporte al cliente">
        <h3>${escapeHtml(footer.contactTitle || "Soporte")}</h3>
        ${phone ? `<p>WhatsApp: +${escapeHtml(phone)}</p>` : ""}
        ${footer.email ? `<p>Correo: ${escapeHtml(footer.email)}</p>` : ""}
        ${phone ? `<a class="btn btn-soft btn-small" href="https://wa.me/${escapeHtml(phone)}" target="_blank" rel="noopener">${escapeHtml(footer.supportButtonText || "Contactar soporte")}</a>` : ""}
      </section>
    </div>
    <div class="footer-bottom">
      <span>${escapeHtml(footer.copyright || `© ${new Date().getFullYear()} Rhema Diseños`)}</span>
      <span>${legal}</span>
    </div>`;
  }

  function initNav() {
    const menuButton = document.querySelector("[data-mobile-menu]");
    const nav = document.querySelector(".main-nav");
    menuButton?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(Boolean(open)));
    });
    loadAndApplySiteSettings().finally(renderDynamicNav);
  }

  function updateCustomerHeader() {
    const session = window.EmmaginaAPI?.getStoredSession?.();
    document.querySelectorAll(".login-link").forEach((link) => {
      link.href = session?.token ? "cuenta.html" : "acceso.html";
      link.textContent = session?.token ? "Mi cuenta" : "Iniciar sesión";
    });
  }

  function initSearch() {
    const panel = document.querySelector("[data-search-panel]");
    const open = document.querySelector("[data-open-search]");
    const close = document.querySelector("[data-close-search]");
    const input = panel?.querySelector("input[name='q']");
    open?.addEventListener("click", () => {
      panel?.classList.add("is-open");
      document.body.classList.add("no-scroll");
      setTimeout(() => input?.focus(), 30);
    });
    close?.addEventListener("click", () => {
      panel?.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    });
    panel?.addEventListener("click", (event) => {
      if (event.target === panel) close?.click();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initSearch();
    updateCustomerHeader();
    window.EmmaginaCart?.updateBadges();
  });
})();
