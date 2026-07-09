
"use strict";

(function () {
  const COMPARE_KEY = "emmagina.compare.v1";
  const MAX_COMPARE = 3;
  const productMap = new Map();
  let delegated = false;
  let modalReady = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    const icons = {
      eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.2 0 8.6 4.7 9.7 6.4a1.1 1.1 0 0 1 0 1.2C20.6 14.3 17.2 19 12 19s-8.6-4.7-9.7-6.4a1.1 1.1 0 0 1 0-1.2C3.4 9.7 6.8 5 12 5Zm0 2C8.2 7 5.5 10.1 4.4 12c1.1 1.9 3.8 5 7.6 5s6.5-3.1 7.6-5C18.5 10.1 15.8 7 12 7Zm0 2.2A2.8 2.8 0 1 1 12 14.8 2.8 2.8 0 0 1 12 9.2Z"/></svg>',
      heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.6-9.6-9A5.7 5.7 0 0 1 12 5.8 5.7 5.7 0 0 1 21.6 12C19.2 16.4 12 21 12 21Zm0-2.4c2.2-1.5 6.2-4.6 7.4-7.5a3.6 3.6 0 0 0-6.5-3.1l-.9 1.4-.9-1.4a3.6 3.6 0 0 0-6.5 3.1c1.2 2.9 5.2 6 7.4 7.5Z"/></svg>',
      cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5.2 4l.5 2H22l-2.1 8.2A2.4 2.4 0 0 1 17.6 16H8.4a2.4 2.4 0 0 1-2.3-1.8L3.8 5H2V3h2.4c.4 0 .7.2.8.6L5.2 4Zm1 4 1.4 5.7c.1.2.3.3.5.3h9.5c.2 0 .4-.1.5-.3L19.4 8H6.2Z"/></svg>'
    };
    return icons[name] || "";
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

  function productCard(product) {
    const detail = window.ProductLinks.detail(product);
    const price = window.EmmaginaData.formatPrice(product.precio);
    const original = product.precioOriginal > product.precio
      ? `<span class="product-old-price">${window.EmmaginaData.formatPrice(product.precioOriginal)}</span>`
      : "";
    const meta = product.availabilityText || (product.personalizable ? "Fabricado a pedido" : product.stock > 0 ? `${product.stock} disponibles` : "Disponible para vitrina");
    const category = product.categoriaPrincipal || product.categorias?.[0] || "Emmagina";
    const productId = escapeHtml(product.id);

    return `
      <article class="product-card" data-product-id="${productId}">
        <div class="product-media">
          <a class="product-image-link" href="${escapeHtml(detail)}" aria-label="Ver ${escapeHtml(product.nombre)}">
            <img src="${escapeHtml(product.imagenPrincipal)}" alt="${escapeHtml(product.nombre)}" loading="lazy" decoding="async" draggable="false">
          </a>
          ${productBadges(product)}
          <div class="product-quick-actions" aria-label="Acciones rápidas">
            <button class="quick-action" type="button" data-preview-product="${productId}" aria-label="Vista previa de ${escapeHtml(product.nombre)}" title="Vista previa">${icon("eye")}</button>
            <button class="quick-action quick-compare" type="button" data-compare-product="${productId}" aria-label="Comparar ${escapeHtml(product.nombre)}" title="Comparar">${icon("heart")}</button>
            <button class="quick-action quick-cart" type="button" data-add-cart="${productId}" aria-label="Agregar ${escapeHtml(product.nombre)} al carrito" title="Agregar al carrito">${icon("cart")}</button>
          </div>
        </div>
        <div class="product-body">
          <p class="product-category">${escapeHtml(category)}</p>
          <h3><a href="${escapeHtml(detail)}">${escapeHtml(product.nombre)}</a></h3>
          <p class="product-short">${escapeHtml(product.descripcionCorta || product.descripcion || "Producto impreso en 3D")}</p>
          <div class="product-price-row"><strong>${price}</strong>${original}</div>
          <p class="product-meta">${escapeHtml(meta)}</p>
        </div>
      </article>`;
  }

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

  function ensurePreviewModal() {
    if (modalReady) return;
    modalReady = true;
    const modal = document.createElement("div");
    modal.className = "product-preview-modal";
    modal.setAttribute("data-preview-modal", "");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="preview-backdrop" data-preview-close></div>
      <section class="preview-dialog" role="dialog" aria-modal="true" aria-label="Vista previa del producto">
        <button class="preview-close" type="button" data-preview-close aria-label="Cerrar vista previa">×</button>
        <div class="preview-stage" data-preview-stage>
          <img src="" alt="" data-preview-image draggable="false">
        </div>
        <div class="preview-info">
          <p class="product-category" data-preview-category></p>
          <h3 data-preview-title></h3>
          <p data-preview-text></p>
          <strong data-preview-price></strong>
        </div>
      </section>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-preview-close]")) closePreview();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePreview();
    });

    const stage = modal.querySelector("[data-preview-stage]");
    stage.addEventListener("mousemove", (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      stage.style.setProperty("--zoom-x", `${x}%`);
      stage.style.setProperty("--zoom-y", `${y}%`);
      stage.classList.add("is-zooming");
    });
    stage.addEventListener("mouseleave", () => stage.classList.remove("is-zooming"));
  }

  function openPreview(productId) {
    ensurePreviewModal();
    const product = productMap.get(String(productId || ""));
    if (!product) return;
    const modal = document.querySelector("[data-preview-modal]");
    const image = modal.querySelector("[data-preview-image]");
    const title = modal.querySelector("[data-preview-title]");
    const text = modal.querySelector("[data-preview-text]");
    const price = modal.querySelector("[data-preview-price]");
    const category = modal.querySelector("[data-preview-category]");
    const stage = modal.querySelector("[data-preview-stage]");
    image.src = product.imagenPrincipal;
    image.alt = product.nombre;
    title.textContent = product.nombre;
    text.textContent = product.descripcionCorta || product.descripcion || "Producto impreso en 3D por Emmagina.";
    price.textContent = window.EmmaginaData.formatPrice(product.precio);
    category.textContent = product.categoriaPrincipal || product.categorias?.[0] || "Emmagina";
    stage.classList.remove("is-zooming");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("preview-open");
  }

  function closePreview() {
    const modal = document.querySelector("[data-preview-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("preview-open");
  }

  function attachCartButtons(products = []) {
    products.forEach((product) => {
      if (product?.id) productMap.set(String(product.id), product);
    });
    writeCompare(readCompare());

    if (delegated) return;
    delegated = true;

    document.addEventListener("click", (event) => {
      const previewButton = event.target.closest?.("[data-preview-product]");
      if (previewButton) {
        event.preventDefault();
        openPreview(previewButton.dataset.previewProduct);
        return;
      }

      const compareButton = event.target.closest?.("[data-compare-product]");
      if (compareButton) {
        event.preventDefault();
        toggleCompare(compareButton.dataset.compareProduct);
        return;
      }

      const cartButton = event.target.closest?.("[data-add-cart]");
      if (cartButton) {
        event.preventDefault();
        const product = productMap.get(String(cartButton.dataset.addCart || ""));
        if (product) window.EmmaginaCart.add(product, 1);
      }
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
