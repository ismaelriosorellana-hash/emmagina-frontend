"use strict";

(async function () {
  const grid = document.querySelector("[data-catalog-grid]");
  const categoriesRoot = document.querySelector("[data-catalog-categories]");
  const segmentsRoot = document.querySelector("[data-catalog-segments]");
  const sort = document.querySelector("[data-catalog-sort]");
  const search = document.querySelector("[data-catalog-search]");
  const title = document.querySelector("[data-catalog-title]");
  const count = document.querySelector("[data-catalog-count]");
  const activeBox = document.querySelector("[data-active-filters]");
  const clearCategory = document.querySelector("[data-clear-category]");
  const params = new URLSearchParams(location.search);
  let products = [];
  let activeCategory = params.get("categoria") || "Todos";
  let activeSegment = params.get("segmento") || "todos";

  const LABELS = {
    todos: "Todo",
    listos: "Listos para comprar",
    pedido: "A pedido",
    premium: "Retratos / Premium",
    servicio: "Servicio 3D"
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function lower(value) {
    return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function includesAny(text, terms) {
    const normalized = lower(text);
    return terms.some((term) => normalized.includes(term));
  }

  function categoryCounts(list) {
    const map = new Map();
    list.forEach((product) => {
      const categories = product.categorias?.length ? product.categorias : [product.categoriaPrincipal || "Otros"];
      categories.forEach((category) => {
        const label = clean(category) || "Otros";
        if (label === "Todos") return;
        map.set(label, (map.get(label) || 0) + 1);
      });
    });
    (window.CONFIG.CATEGORIES || []).forEach((category) => {
      if (category && category !== "Todos" && !map.has(category)) map.set(category, 0);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  function matchesSegment(product) {
    if (activeSegment === "todos") return true;
    const text = [product.nombre, product.descripcion, product.descripcionCorta, product.categoriaPrincipal, ...(product.categorias || [])].join(" ");
    if (activeSegment === "listos") return !product.personalizable && !product.bajoPedido && Number(product.stockDisponible || product.stock || 0) > 0;
    if (activeSegment === "pedido") return product.personalizable || product.fabricadoPedido || product.bajoPedido || includesAny(text, ["pedido", "personaliz", "cotiz"]);
    if (activeSegment === "premium") return includesAny(text, ["retrato", "premium", "familia", "litofania", "relieve", "recuerdo", "figura"]);
    if (activeSegment === "servicio") return includesAny(text, ["servicio", "repuesto", "prototipo", "herramienta", "archivo", "stl", "impresion"]);
    return true;
  }

  function filteredProducts() {
    let list = products.filter(window.EmmaginaData.isVisible);
    if (activeCategory !== "Todos") {
      list = list.filter((product) => product.categorias.includes(activeCategory) || product.categoriaPrincipal === activeCategory);
    }
    list = list.filter(matchesSegment);
    const q = lower(search?.value || params.get("q") || "");
    if (q) {
      list = list.filter((product) => lower(`${product.nombre} ${product.descripcion} ${product.descripcionCorta} ${product.categorias.join(" ")}`).includes(q));
    }
    const order = sort?.value || "orden";
    if (order === "precio-menor") list.sort((a, b) => Number(a.precioDesde || a.precio || 0) - Number(b.precioDesde || b.precio || 0));
    if (order === "precio-mayor") list.sort((a, b) => Number(b.precioDesde || b.precio || 0) - Number(a.precioDesde || a.precio || 0));
    if (order === "nombre") list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (order === "destacados") list.sort((a, b) => Number(b.destacado) - Number(a.destacado) || Number(b.masVendido) - Number(a.masVendido));
    return list;
  }

  function updateUrl() {
    const next = new URLSearchParams();
    if (activeCategory !== "Todos") next.set("categoria", activeCategory);
    if (activeSegment !== "todos") next.set("segmento", activeSegment);
    const q = clean(search?.value || "");
    if (q) next.set("q", q);
    const suffix = next.toString();
    history.replaceState(null, "", suffix ? `catalogo.html?${suffix}` : "catalogo.html");
  }

  function renderCategories() {
    if (!categoriesRoot) return;
    const counts = categoryCounts(products.filter(window.EmmaginaData.isVisible));
    const total = products.filter(window.EmmaginaData.isVisible).length;
    const rows = [["Todos", total], ...counts].map(([category, qty]) => `
      <button class="${category === activeCategory ? "is-active" : ""}" type="button" data-category="${window.EmmaginaUI.escapeHtml(category)}">
        <span>${window.EmmaginaUI.escapeHtml(category)}</span>
        <small>${Number(qty) || 0}</small>
      </button>
    `).join("");
    categoriesRoot.innerHTML = rows;
    categoriesRoot.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "Todos";
        updateUrl();
        render();
      });
    });
  }

  function renderSegments() {
    if (!segmentsRoot) return;
    segmentsRoot.querySelectorAll("[data-segment]").forEach((button) => {
      const key = button.dataset.segment || "todos";
      button.classList.toggle("is-active", key === activeSegment);
      button.onclick = () => {
        activeSegment = key;
        updateUrl();
        render();
      };
    });
  }

  function renderMeta(list) {
    if (title) title.textContent = activeCategory === "Todos" ? "Todos los productos" : activeCategory;
    if (count) {
      count.textContent = list.length === 1
        ? "1 producto encontrado"
        : `${list.length} productos encontrados`;
    }
    if (activeBox) {
      const tags = [];
      if (activeCategory !== "Todos") tags.push(`Categoría: ${activeCategory}`);
      if (activeSegment !== "todos") tags.push(`Vista: ${LABELS[activeSegment] || activeSegment}`);
      const q = clean(search?.value || "");
      if (q) tags.push(`Búsqueda: “${q}”`);
      activeBox.hidden = tags.length === 0;
      activeBox.textContent = tags.join(" · ");
    }
  }

  function render() {
    const list = filteredProducts();
    renderCategories();
    renderSegments();
    renderMeta(list);
    if (!grid) return;
    if (!list.length) {
      window.EmmaginaUI.setEmpty(grid, "No encontramos productos con esos filtros. Prueba otra categoría o solicita una cotización personalizada.");
      return;
    }
    grid.innerHTML = list.map((product) => window.EmmaginaUI.productCard(product)).join("");
    window.EmmaginaUI.attachCartButtons(products);
  }

  try {
    if (search && params.get("q")) search.value = params.get("q");
    window.EmmaginaUI.setLoading(grid, "Cargando tienda...");
    products = await window.EmmaginaAPI.getProducts({ limit: 300 });
    render();
    sort?.addEventListener("change", () => { updateUrl(); render(); });
    search?.addEventListener("input", () => { updateUrl(); render(); });
    clearCategory?.addEventListener("click", () => {
      activeCategory = "Todos";
      updateUrl();
      render();
    });
  } catch (error) {
    console.error(error);
    window.EmmaginaUI.setError(grid, error.message || "No se pudo cargar la tienda.");
  }
})();
