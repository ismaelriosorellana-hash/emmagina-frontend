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
    const badges = Array.isArray(product.badges) ? product.badges : [];
    const parts = badges.map((badge) => {
      const text = escapeHtml(badge.texto || "");
      if (!text) return "";
      const background = escapeHtml(badge.color || "#303744");
      const color = escapeHtml(badge.textoColor || "#ffffff");
      return `<span class="product-badge" style="background:${background};color:${color};">${text}</span>`;
    }).filter(Boolean);

    if (!parts.length && product.insignia) {
      parts.push(`<span class="product-badge badge-primary">${escapeHtml(product.insignia)}</span>`);
    }

    return parts.length ? `<div class="product-badges">${parts.join("")}</div>` : "";
  }

  function productCard(product, options = {}) {
    const detail = window.ProductLinks.detail(product);
    const price = window.EmmaginaData.formatPrice(product.precio);
    const original = product.precioOriginal > product.precio
      ? `<span class="product-old-price">${window.EmmaginaData.formatPrice(product.precioOriginal)}</span>`
      : "";
    const meta = product.availabilityText || (product.personalizable ? "Fabricado a pedido" : product.stock > 0 ? `${product.stock} disponibles` : "Disponible para vitrina");
    const category = product.categoriaPrincipal || product.categorias?.[0] || "Emmagina";

    return `
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <a class="product-media" href="${detail}" aria-label="Ver ${escapeHtml(product.nombre)}">
          <img src="${escapeHtml(product.imagenPrincipal)}" alt="${escapeHtml(product.nombre)}" loading="lazy" decoding="async" draggable="false">
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
            <a class="btn btn-soft" href="${detail}" title="Ver detalle">Detalle</a>
            <button class="btn btn-compare" type="button" data-compare-product="${escapeHtml(product.id)}" title="Comparar producto">Comparar</button>
            <button class="btn btn-primary" type="button" data-add-cart="${escapeHtml(product.id)}" title="Agregar al carrito">Agregar</button>
          </div>
        </div>
      </article>`;
  }

  const productMap = new Map();
  let cartDelegationReady = false;
  const COMPARE_KEY = "emmagina.compare.v1";
  const MAX_COMPARE = 3;

  function showToast(message) {
    let el = document.querySelector(".em-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "em-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function readCompare() {
    try {
      const parsed = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, MAX_COMPARE) : [];
    } catch {
      return [];
    }
  }

  function writeCompare(ids) {
    const normalized = [...new Set(ids.map(String).filter(Boolean))].slice(0, MAX_COMPARE);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(normalized));
    document.querySelectorAll("[data-compare-product]").forEach((button) => {
      button.classList.toggle("is-active", normalized.includes(String(button.dataset.compareProduct || "")));
    });
  }

  function toggleCompare(productId) {
    const id = String(productId || "");
    if (!id) return;
    const ids = readCompare();
    const index = ids.indexOf(id);
    if (index >= 0) {
      ids.splice(index, 1);
      writeCompare(ids);
      showToast("Producto quitado de comparación.");
      return;
    }
    if (ids.length >= MAX_COMPARE) {
      showToast("Puedes comparar hasta 3 productos.");
      return;
    }
    ids.push(id);
    writeCompare(ids);
    showToast("Producto agregado a comparación.");
  }

  function attachCartButtons(products = []) {
    products.forEach((product) => {
      if (product?.id) productMap.set(String(product.id), product);
    });

    if (cartDelegationReady) return;
    cartDelegationReady = true;

    document.addEventListener("click", (event) => {
      const compareButton = event.target.closest?.("[data-compare-product]");
      if (compareButton) {
        event.preventDefault();
        toggleCompare(compareButton.dataset.compareProduct);
        return;
      }

      const button = event.target.closest?.("[data-add-cart]");
      if (!button) return;
      event.preventDefault();
      const product = productMap.get(String(button.dataset.addCart));
      if (product) window.EmmaginaCart.add(product, 1);
    });

    writeCompare(readCompare());
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
