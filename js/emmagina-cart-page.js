"use strict";

(function () {
  const list = document.querySelector("[data-cart-list]");
  const summary = document.querySelector("[data-cart-summary]");
  if (!list || !summary) return;

  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  const money = (value) => window.EmmaginaData.formatPrice(value);
  let validating = false;

  function renderItem(item) {
    const stock = Number(item.option?.stock || 0) || 0;
    const variant = item.option?.variantName ? `<span>${escape(item.option.variantName)}</span>` : "";
    const sku = item.option?.sku ? `<span>SKU: ${escape(item.option.sku)}</span>` : "";
    const status = item.option?.status ? `<span>${escape(item.option.status)}</span>` : "";
    const stockNote = stock > 0 && item.quantity >= stock
      ? `<small class="cart-warning">Máximo disponible: ${stock}</small>`
      : "";

    return `
      <article class="cart-item cart-item-advanced" data-line="${escape(item.lineKey)}">
        <a class="cart-item-image" href="${escape(item.slug ? `producto.html?slug=${encodeURIComponent(item.slug)}` : "producto.html")}">
          <img src="${escape(item.image || window.CONFIG.placeholderImage)}" alt="${escape(item.name)}">
        </a>
        <div class="cart-item-main">
          <h3>${escape(item.name)}</h3>
          <p class="cart-item-meta">${variant}${sku}${status}</p>
          <strong>${money(item.price)} <small>c/u</small></strong>
          ${stockNote}
          <button class="btn btn-soft btn-small" type="button" data-remove="${escape(item.lineKey)}">Quitar</button>
        </div>
        <div class="qty-control cart-qty-control">
          <label for="qty-${escape(item.lineKey)}">Cantidad</label>
          <input id="qty-${escape(item.lineKey)}" type="number" min="1" ${stock > 0 ? `max="${stock}"` : ""} value="${Number(item.quantity) || 1}" data-qty="${escape(item.lineKey)}">
          <strong>${money(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
        </div>
      </article>`;
  }

  function renderSummary(items, validation = null, error = "") {
    const subtotal = Number(validation?.subtotal ?? window.EmmaginaCart.subtotal() ?? 0);
    const shipping = Number(validation?.costoEnvio ?? 0);
    const total = Number(validation?.total ?? subtotal + shipping);
    const mpReady = validation?.metodosPago?.mercadopago === true;

    summary.innerHTML = `
      <h2>Resumen</h2>
      <div class="summary-line"><span>Productos</span><strong>${items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong></div>
      <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      <div class="summary-line"><span>Envío</span><strong>${shipping > 0 ? money(shipping) : "Por coordinar"}</strong></div>
      <div class="summary-total"><span>Total estimado</span><strong>${money(total)}</strong></div>
      ${validating ? `<p class="cart-info">Validando precios y stock...</p>` : ""}
      ${error ? `<p class="cart-error">${escape(error)}</p>` : ""}
      ${validation ? `<p class="cart-success">Carrito validado con precios actuales.</p>` : ""}
      <a class="btn btn-primary btn-checkout" href="finalizar-compra.html">Continuar compra</a>
      <button class="btn btn-soft" type="button" data-clear-cart>Vaciar carrito</button>
      <small>${mpReady ? "Mercado Pago disponible para esta tienda." : "Pago preparado para transferencia. Mercado Pago se activará cuando esté configurado."}</small>`;
  }

  async function validateAndRefresh(items) {
    if (!items.length || !window.EmmaginaAPI?.validateCart) return;
    validating = true;
    renderSummary(items);
    try {
      const validation = await window.EmmaginaAPI.validateCart(window.EmmaginaCart.toOrderItems());
      if (Array.isArray(validation?.items) && validation.items.length) {
        const current = window.EmmaginaCart.read();
        const priced = current.map((item) => {
          const valid = validation.items.find((entry) => entry.lineaId === item.lineKey || entry.productoId === item.productId);
          if (!valid) return item;
          return {
            ...item,
            price: Number(valid.precioUnitario || item.price),
            image: valid.imagen || item.image,
            option: {
              ...(item.option || {}),
              variantId: valid.varianteId || item.option?.variantId || "base",
              variantName: valid.color || item.option?.variantName || "Opción principal",
              sku: valid.sku || item.option?.sku || ""
            }
          };
        });
        window.EmmaginaCart.write(priced);
      }
      validating = false;
      renderSummary(window.EmmaginaCart.read(), validation);
    } catch (error) {
      validating = false;
      renderSummary(window.EmmaginaCart.read(), null, error.message || "No fue posible validar el carrito.");
    }
  }

  function render() {
    const items = window.EmmaginaCart.read();
    if (!items.length) {
      list.innerHTML = `<div class="state-box"><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="catalogo.html">Ver catálogo</a></div>`;
      summary.innerHTML = `<h2>Resumen</h2><p>No hay productos agregados.</p>`;
      return;
    }

    list.innerHTML = `
      <div class="cart-list-heading">
        <div><p class="kicker">Carrito</p><h2>Productos seleccionados</h2></div>
        <a class="btn btn-soft btn-small" href="catalogo.html">Seguir comprando</a>
      </div>
      ${items.map(renderItem).join("")}`;
    renderSummary(items);
    validateAndRefresh(items);
  }

  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      window.EmmaginaCart.remove(remove.dataset.remove);
      render();
      return;
    }
    if (event.target.closest("[data-clear-cart]")) {
      window.EmmaginaCart.clear();
      render();
    }
  });

  document.addEventListener("change", (event) => {
    const input = event.target.closest("[data-qty]");
    if (input) {
      window.EmmaginaCart.setQuantity(input.dataset.qty, input.value);
      render();
    }
  });

  window.addEventListener("emmagina:cart", () => window.EmmaginaCart.updateBadges());
  render();
})();
