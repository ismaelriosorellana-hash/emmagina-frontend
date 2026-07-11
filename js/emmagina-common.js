"use strict";

(function () {
  const BASE_NAV = [
    { label: "Inicio", href: "index.html" },
    { label: "Tienda", href: "catalogo.html" },
    { label: "Crea tu Escena", href: "pedido-personalizado.html" },
    { label: "Sobre Nosotros", href: "quienes-somos.html" },
    { label: "Contáctanos", href: "contacto.html" },
    { label: "Preguntas Frecuentes", href: "preguntas-frecuentes.html" }
  ];

  function escapeHtml(value) {
    return String(value ?? "")
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

  async function renderDynamicNav() {
    const nav = document.querySelector(".main-nav");
    if (!nav || !window.EmmaginaAPI?.getNavigation) {
      markActiveNav();
      return;
    }
    try {
      const items = await window.EmmaginaAPI.getNavigation();
      const list = Array.isArray(items) && items.length ? items : BASE_NAV;
      nav.innerHTML = list
        .filter((item) => item && item.label && item.href)
        .map((item) => `<a href="${escapeHtml(cleanHref(item.href, "#"))}">${escapeHtml(item.label)}</a>`)
        .join("");
    } catch (error) {
      console.warn("No fue posible cargar navegación dinámica:", error.message);
    }
    markActiveNav();
  }

  function initNav() {
    const menuButton = document.querySelector("[data-mobile-menu]");
    const nav = document.querySelector(".main-nav");
    menuButton?.addEventListener("click", () => {
      const open = nav?.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(Boolean(open)));
    });
    renderDynamicNav();
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
    window.EmmaginaCart?.updateBadges();
  });
})();
