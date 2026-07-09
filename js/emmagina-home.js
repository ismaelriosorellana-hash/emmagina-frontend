"use strict";

(async function () {
  const all = [];

  function by(selector) { return document.querySelector(selector); }

  function uniqueById(list) {
    const seen = new Set();
    return list.filter((product) => {
      const key = String(product.id || product.slug || product.nombre || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function fillCarouselList(selected, products, minItems = 6) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const base = uniqueById(selected);
    if (base.length >= minItems) return base.slice(0, 14);
    const selectedKeys = new Set(base.map((p) => String(p.id || p.slug || p.nombre || "")));
    const fillers = visible.filter((p) => !selectedKeys.has(String(p.id || p.slug || p.nombre || "")));
    return base.concat(fillers).slice(0, Math.max(minItems, Math.min(14, visible.length)));
  }

  function sectionProducts(kind, products) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    let selected = [];
    if (kind === "destacados") selected = visible.filter((p) => p.destacado || String(p.insignia || "").toLowerCase().includes("destacado"));
    else if (kind === "desde14990") selected = visible.filter((p) => p.desde14990 || p.precio <= 14990);
    else if (kind === "lanzamiento") selected = visible.filter((p) => p.lanzamiento || String(p.insignia || "").toLowerCase().includes("lanzamiento"));
    else if (kind === "vendidos") selected = visible.filter((p) => p.masVendido);
    else if (kind === "vistos") selected = visible.filter((p) => p.masVisto);
    else selected = visible;
    return fillCarouselList(selected, visible, 6);
  }

  function renderCarousel(id, title, products) {
    const root = by(`[data-home-carousel='${id}']`);
    if (!root) return;
    const track = root.querySelector("[data-carousel-track]");
    const selected = products.length ? products : all.slice(0, 10);
    if (!selected.length) {
      root.innerHTML = `<div class="state-box"><p>No hay productos disponibles para ${title}.</p></div>`;
      return;
    }

    track.innerHTML = selected.map((p) => window.EmmaginaUI.productCard(p)).join("");
    window.EmmaginaUI.attachCartButtons(all);
    window.EmmaginaCarousel.init(root);
  }

  function renderExplore(products) {
    const cards = [
      { title: "Destacados", text: "Piezas seleccionadas para regalar o decorar.", kind: "destacados" },
      { title: "Los más vendidos", text: "Productos con mayor movimiento en la tienda.", kind: "vendidos" },
      { title: "Los más vistos", text: "Opciones que más despiertan interés.", kind: "vistos" }
    ];
    const container = by("[data-explore-grid]");
    if (!container) return;
    container.innerHTML = cards.map((card) => {
      const product = sectionProducts(card.kind, products)[0] || products[0] || {};
      const image = product.imagenPrincipal || window.CONFIG.placeholderImage;
      return `<a class="explore-card" href="catalogo.html?grupo=${encodeURIComponent(card.kind)}">
        <img src="${window.EmmaginaUI.escapeHtml(image)}" alt="${window.EmmaginaUI.escapeHtml(card.title)}" loading="lazy">
        <h3>${window.EmmaginaUI.escapeHtml(card.title)}</h3>
        <p>${window.EmmaginaUI.escapeHtml(card.text)}</p>
      </a>`;
    }).join("");
  }

  try {
    document.querySelectorAll("[data-carousel-track]").forEach((track) => window.EmmaginaUI.setLoading(track, "Cargando productos..."));
    all.push(...await window.EmmaginaAPI.getProducts({ limit: 240 }));
    const visible = all.filter(window.EmmaginaData.isVisible);
    renderExplore(visible);
    renderCarousel("desde14990", "Desde $14.990", sectionProducts("desde14990", visible));
    renderCarousel("lanzamiento", "Lanzamiento", sectionProducts("lanzamiento", visible));
    renderCarousel("destacados", "Destacados", sectionProducts("destacados", visible));
  } catch (error) {
    console.error("No fue posible cargar productos en inicio:", error);
    document.querySelectorAll("[data-home-carousel]").forEach((root) => window.EmmaginaUI.setError(root, error.message));
  }
})();
