"use strict";

(function () {
  const form = document.querySelector("[data-checkout-form]");
  const summary = document.querySelector("[data-checkout-summary]");
  if (!form || !summary) return;

  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  const money = (value) => window.EmmaginaData.formatPrice(value);
  let validation = null;
  let submitting = false;

  function items() {
    return window.EmmaginaCart.read();
  }

  function orderItems() {
    return window.EmmaginaCart.toOrderItems();
  }

  function renderSummary(message = "") {
    const cartItems = items();
    if (!cartItems.length) {
      summary.innerHTML = `<h2>Resumen</h2><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="catalogo.html">Volver a la tienda</a>`;
      return;
    }

    const subtotal = Number(validation?.subtotal ?? window.EmmaginaCart.subtotal());
    const shipping = Number(validation?.costoEnvio ?? 0);
    const total = Number(validation?.total ?? subtotal + shipping);

    summary.innerHTML = `
      <h2>Resumen</h2>
      <div class="checkout-items">
        ${cartItems.map((item) => `
          <article>
            <img src="${escape(item.image || window.CONFIG.placeholderImage)}" alt="${escape(item.name)}">
            <div><strong>${escape(item.name)}</strong><span>${escape(item.option?.variantName || "Opción principal")} · ${Number(item.quantity) || 1} un.</span></div>
            <b>${money(Number(item.price || 0) * Number(item.quantity || 1))}</b>
          </article>`).join("")}
      </div>
      <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      <div class="summary-line"><span>Envío</span><strong>${shipping > 0 ? money(shipping) : "Por coordinar"}</strong></div>
      <div class="summary-total"><span>Total estimado</span><strong>${money(total)}</strong></div>
      ${message ? `<p class="cart-info">${escape(message)}</p>` : ""}
      <button class="btn btn-primary btn-checkout" type="submit" ${submitting ? "disabled" : ""}>${submitting ? "Creando pedido..." : "Crear pedido"}</button>
      <a class="btn btn-soft" href="carrito.html">Volver al carrito</a>
      <small>Los precios y stock se validan nuevamente al crear el pedido.</small>`;
  }

  async function validateCart() {
    const cartItems = items();
    if (!cartItems.length) {
      renderSummary();
      return;
    }
    renderSummary("Validando precios y stock...");
    try {
      validation = await window.EmmaginaAPI.validateCart(orderItems());
      const mpOption = form.querySelector("[data-mp-option]");
      const mpInput = mpOption?.querySelector("input");
      const mpLabel = form.querySelector("[data-mp-label]");
      const mpReady = validation?.metodosPago?.mercadopago === true;
      if (mpInput) mpInput.disabled = !mpReady;
      if (mpOption) mpOption.classList.toggle("is-disabled", !mpReady);
      if (mpLabel) mpLabel.textContent = mpReady ? "Disponible para pagar en línea." : "Preparado para activarse cuando Mercado Pago esté configurado.";
      renderSummary("Carrito validado correctamente.");
    } catch (error) {
      validation = null;
      renderSummary(error.message || "No fue posible validar el carrito.");
    }
  }

  function formPayload() {
    const data = new FormData(form);
    const metodoEntrega = String(data.get("metodoEntrega") || "envio");
    return {
      cliente: {
        nombre: String(data.get("nombre") || "").trim(),
        email: String(data.get("email") || "").trim(),
        telefono: String(data.get("telefono") || "").trim(),
        rut: String(data.get("rut") || "").trim(),
        direccion: String(data.get("direccion") || "").trim(),
        comuna: String(data.get("comuna") || "").trim()
      },
      entrega: {
        metodo: metodoEntrega === "retiro" ? "retiro" : "envio",
        direccion: String(data.get("direccion") || "").trim(),
        comuna: String(data.get("comuna") || "").trim(),
        zonaEnvio: "santiago"
      },
      items: orderItems(),
      metodoPago: String(data.get("metodoPago") || "transferencia"),
      observaciones: String(data.get("observaciones") || "").trim(),
      origen: "web"
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!items().length) {
      renderSummary("Tu carrito está vacío.");
      return;
    }
    submitting = true;
    renderSummary("Creando pedido...");
    try {
      const response = await window.EmmaginaAPI.createOrder(formPayload());
      window.EmmaginaCart.clear();
      summary.innerHTML = `
        <h2>Pedido recibido</h2>
        <p class="cart-success">${escape(response.mensaje || "Tu pedido fue creado correctamente.")}</p>
        <div class="checkout-confirmation"><span>Número de pedido</span><strong>${escape(response.numeroPedido || "—")}</strong></div>
        <div class="summary-total"><span>Total</span><strong>${money(response.total || 0)}</strong></div>
        ${response.venceAt ? `<p>El stock quedó reservado mientras envías el comprobante.</p>` : ""}
        <a class="btn btn-primary" href="seguimiento-pedido.html">Ver seguimiento</a>
        <a class="btn btn-soft" href="catalogo.html">Volver a la tienda</a>`;
      form.querySelector(".checkout-main")?.setAttribute("hidden", "hidden");
    } catch (error) {
      submitting = false;
      renderSummary(error.message || "No fue posible crear el pedido.");
    }
  }

  form.addEventListener("submit", submit);
  form.addEventListener("change", (event) => {
    const option = event.target.closest(".payment-option input");
    if (option) {
      form.querySelectorAll(".payment-option").forEach((label) => label.classList.remove("is-selected"));
      option.closest(".payment-option")?.classList.add("is-selected");
    }
  });

  validateCart();
})();
