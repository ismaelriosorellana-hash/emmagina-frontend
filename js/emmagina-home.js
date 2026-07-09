"use strict";

(async function () {
  const all = [];

  function by(selector) { return document.querySelector(selector); }

  function sectionProducts(kind, products) {
    const visible = products.filter(window.EmmaginaData.isVisible);
    if (kind === "destacados") return visible.filter((p) => p.destacado || p.insignia.toLowerCase().includes("destacado")).slice(0, 12);
    if (kind === "desde14990") return visible.filter((p) => p.desde14990 || p.precio <= 14990).slice(0, 12);
    if (kind === "lanzamiento") return visible.filter((p) => p.lanzamiento || p.insignia.toLowerCase().includes("lanzamiento")).slice(0, 12);
    if (kind === "vendidos") return visible.filter((p) => p.masVendido).slice(0, 12);
    if (kind === "vistos") return visible.filter((p) => p.masVisto).slice(0, 12);
    return visible.slice(0, 12);
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

    /*
     * Para que el carrusel sea realmente útil incluso cuando una sección tenga
     * pocos productos, repetimos visualmente los mismos ítems hasta generar
     * una tira navegable. No duplica datos ni afecta el carrito; solo mejora
     * la presentación.
     */
    const display = [];
    while (display.length < Math.max(8, selected.length)) {
      display.push(...selected);
      if (selected.length === 0) break;
    }
    track.innerHTML = display.slice(0, Math.max(8, selected.length)).map((p) => window.EmmaginaUI.productCard(p)).join("");
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
