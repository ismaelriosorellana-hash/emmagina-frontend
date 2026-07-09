"use strict";

(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function productBadges(product) {
    const parts = [];
    if (product.insignia) parts.push(`<span class="product-badge badge-primary">${escapeHtml(product.insignia)}</span>`);
    if (product.discount > 0) parts.push(`<span class="product-badge badge-discount">-${product.discount}%</span>`);
    return parts.length ? `<div class="product-badges">${parts.join("")}</div>` : "";
  }

  function productCard(product, options = {}) {
    const detail = window.ProductLinks.detail(product);
    const price = window.EmmaginaData.formatPrice(product.precio);
    const original = product.precioOriginal > product.precio
      ? `<span class="product-old-price">${window.EmmaginaData.formatPrice(product.precioOriginal)}</span>`
      : "";
    const meta = product.personalizable ? "Fabricado a pedido" : product.stock > 0 ? `${product.stock} disponibles` : "Disponible para vitrina";
    const category = product.categoriaPrincipal || product.categorias?.[0] || "Emmagina";

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <a class="product-media" href="${detail}" aria-label="Ver ${escapeHtml(product.nombre)}">
          <img src="${escapeHtml(product.imagenPrincipal)}" alt="${escapeHtml(product.nombre)}" loading="lazy" decoding="async">
          ${productBadges(product)}
        </a>
        <div class="product-body">
          <p class="product-category">${escapeHtml(category)}</p>
          <h3><a href="${detail}">${escapeHtml(product.nombre)}</a></h3>
          <p class="product-short">${escapeHtml(product.descripcionCorta || product.descripcion || "Producto impreso en 3D")}</p>
          <div class="product-price-row">
            <strong>${price}</strong>
            ${original}
          </div>
          <p class="product-meta">${escapeHtml(meta)}</p>
          <div class="product-actions">
            <a class="btn btn-soft" href="${detail}">Ver detalle</a>
            <button class="btn btn-primary" type="button" data-add-cart="${escapeHtml(product.id)}">Agregar</button>
          </div>
        </div>
      </article>`;
  }

  function attachCartButtons(products = []) {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    document.querySelectorAll("[data-add-cart]").forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const product = byId.get(String(button.dataset.addCart));
        if (product) window.EmmaginaCart.add(product, 1);
      });
    });
  }

  function setLoading(container, message = "Cargando...") {
    if (!container) return;
    container.innerHTML = `<div class="state-box"><span class="loader"></span><p>${escapeHtml(message)}</p></div>`;
  }

  function setEmpty(container, message = "No hay productos para mostrar por ahora.") {
    if (!container) return;
    container.innerHTML = `<div class="state-box"><p>${escapeHtml(message)}</p></div>`;
  }

  function setError(container, message = "No fue posible cargar la información.") {
    if (!container) return;
    container.innerHTML = `<div class="state-box state-error"><p>${escapeHtml(message)}</p><small>Revisa la conexión del backend o intenta nuevamente.</small></div>`;
  }

  window.EmmaginaUI = Object.freeze({ escapeHtml, productCard, attachCartButtons, setLoading, setEmpty, setError });
})();
