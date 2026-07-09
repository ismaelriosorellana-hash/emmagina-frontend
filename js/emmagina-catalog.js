"use strict";

(async function () {
  const grid = document.querySelector("[data-catalog-grid]");
  const filters = document.querySelector("[data-catalog-filters]");
  const sort = document.querySelector("[data-catalog-sort]");
  const search = document.querySelector("[data-catalog-search]");
  let products = [];
  let activeCategory = new URLSearchParams(location.search).get("categoria") || "Todos";

  function renderFilters() {
    if (!filters) return;
    filters.innerHTML = window.CONFIG.CATEGORIES.map((category) => `
      <button class="filter-chip ${category === activeCategory ? "is-active" : ""}" type="button" data-category="${window.EmmaginaUI.escapeHtml(category)}">${window.EmmaginaUI.escapeHtml(category)}</button>
    `).join("");
    filters.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "Todos";
        history.replaceState(null, "", `catalogo.html?categoria=${encodeURIComponent(activeCategory)}`);
        render();
      });
    });
  }

  function render() {
    let list = products.filter(window.EmmaginaData.isVisible);
    if (activeCategory !== "Todos") list = list.filter((p) => p.categorias.includes(activeCategory) || p.categoriaPrincipal === activeCategory);
    const q = String(search?.value || "").trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.nombre} ${p.descripcion} ${p.categorias.join(" ")}`.toLowerCase().includes(q));
    const order = sort?.value || "orden";
    if (order === "precio-menor") list.sort((a, b) => a.precio - b.precio);
    if (order === "precio-mayor") list.sort((a, b) => b.precio - a.precio);
    if (order === "nombre") list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (order === "destacados") list.sort((a, b) => Number(b.destacado) - Number(a.destacado));

    if (!list.length) return window.EmmaginaUI.setEmpty(grid, "No encontramos productos para ese filtro.");
    grid.innerHTML = list.map((p) => window.EmmaginaUI.productCard(p)).join("");
    window.EmmaginaUI.attachCartButtons(products);
    renderFilters();
  }

  try {
    window.EmmaginaUI.setLoading(grid, "Cargando catálogo...");
    products = await window.EmmaginaAPI.getProducts({ limit: 300 });
    renderFilters();
    render();
    sort?.addEventListener("change", render);
    search?.addEventListener("input", render);
  } catch (error) {
    console.error(error);
    window.EmmaginaUI.setError(grid, error.message);
  }
})();
