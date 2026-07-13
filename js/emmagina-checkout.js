"use strict";

(function () {
  const form = document.querySelector("[data-checkout-form]");
  const summary = document.querySelector("[data-checkout-summary]");
  if (!form || !summary) return;

  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  const money = (value) => window.EmmaginaData.formatPrice(value);
  const deliverySelect = form.elements.metodoEntrega;
  const addressField = form.querySelector("[data-address-field]");
  const addressInput = form.elements.direccion;
  const comunaInput = form.elements.comuna;
  const dateField = form.querySelector("[data-preferred-date-field]");
  const dateInput = form.elements.fechaPreferida;
  const dateHelp = form.querySelector("[data-preferred-date-help]");
  let validation = null;
  let submitting = false;

  function items() { return window.EmmaginaCart.read(); }
  function orderItems() { return window.EmmaginaCart.toOrderItems(); }

  function maxPreparationDays() {
    const apiDays = Number(validation?.diasPreparacionMaximos || 0);
    const cartDays = items().reduce((max, item) => Math.max(max, Number(item.option?.preparationDays || 3)), 1);
    return Math.max(1, apiDays || cartDays || 3);
  }

  function addBusinessDays(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    let remaining = Math.max(0, Number(days) || 0);
    while (remaining > 0) {
      date.setDate(date.getDate() + 1);
      const weekday = date.getDay();
      if (weekday !== 0 && weekday !== 6) remaining -= 1;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function deliveryMethod() {
    return String(deliverySelect?.value || "envio") === "retiro" ? "retiro" : "envio";
  }

  function shippingPreview(subtotal) {
    if (deliveryMethod() === "retiro") return { cost: 0, label: "Retiro coordinado" };
    const cost = Number(subtotal) >= 25000 ? 0 : 4000;
    return { cost, label: cost > 0 ? money(cost) : "Gratis" };
  }

  function syncDeliveryFields() {
    const isPickup = deliveryMethod() === "retiro";
    if (addressField) addressField.hidden = isPickup;
    if (addressInput) {
      addressInput.required = !isPickup;
      if (isPickup) addressInput.value = "";
    }
    if (comunaInput) comunaInput.required = !isPickup;
    if (dateField) dateField.hidden = !isPickup;
    if (dateInput) {
      const minimum = addBusinessDays(maxPreparationDays());
      dateInput.min = minimum;
      dateInput.required = isPickup;
      if (!isPickup) dateInput.value = "";
      if (dateHelp) dateHelp.textContent = `Primera fecha disponible: ${new Date(`${minimum}T12:00:00`).toLocaleDateString("es-CL")} (${maxPreparationDays()} días hábiles de preparación).`;
    }
  }

  function renderSummary(message = "") {
    const cartItems = items();
    if (!cartItems.length) {
      summary.innerHTML = `<h2>Resumen</h2><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="catalogo.html">Volver a la tienda</a>`;
      return;
    }
    const subtotal = Number(validation?.subtotal ?? window.EmmaginaCart.subtotal());
    const preview = shippingPreview(subtotal);
    const total = subtotal + preview.cost;
    summary.innerHTML = `
      <h2>Resumen</h2>
      <div class="checkout-items">${cartItems.map((item) => `<article><img src="${escape(item.image || window.CONFIG.placeholderImage)}" alt="${escape(item.name)}"><div><strong>${escape(item.name)}</strong><span>${escape(item.option?.variantName || "Opción principal")} · ${Number(item.quantity) || 1} un.</span></div><b>${money(Number(item.price || 0) * Number(item.quantity || 1))}</b></article>`).join("")}</div>
      <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      <div class="summary-line"><span>Entrega</span><strong>${preview.label}</strong></div>
      <div class="summary-total"><span>Total estimado</span><strong>${money(total)}</strong></div>
      ${message ? `<p class="cart-info">${escape(message)}</p>` : ""}
      <button class="btn btn-primary btn-checkout" type="submit" ${submitting ? "disabled" : ""}>${submitting ? "Creando pedido..." : "Crear pedido"}</button>
      <a class="btn btn-soft" href="carrito.html">Volver al carrito</a>
      <small>Los precios, stock y costo final de entrega se validan nuevamente al crear el pedido.</small>`;
  }

  async function prefillAccount() {
    if (!window.EmmaginaAPI.getStoredSession?.()?.token) return;
    try {
      const payload = await window.EmmaginaAPI.getCustomerProfile();
      const user = payload?.usuario || {};
      const map = { nombre: user.nombre, email: user.email, telefono: user.telefono, rut: user.rut, direccion: user.direccion, comuna: user.comuna };
      Object.entries(map).forEach(([name, value]) => {
        const input = form.elements[name];
        if (input && !input.value && value) input.value = value;
      });
    } catch (error) {
      console.warn("No fue posible completar los datos de la cuenta:", error.message);
    }
  }

  async function validateCart() {
    if (!items().length) return renderSummary();
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
      syncDeliveryFields();
      renderSummary("Carrito validado correctamente.");
    } catch (error) {
      validation = null;
      syncDeliveryFields();
      renderSummary(error.message || "No fue posible validar el carrito.");
    }
  }

  function formPayload() {
    const data = new FormData(form);
    const metodoEntrega = deliveryMethod();
    return {
      cliente: {
        nombre: String(data.get("nombre") || "").trim(), email: String(data.get("email") || "").trim(), telefono: String(data.get("telefono") || "").trim(), rut: String(data.get("rut") || "").trim(), direccion: metodoEntrega === "envio" ? String(data.get("direccion") || "").trim() : "", comuna: String(data.get("comuna") || "").trim()
      },
      entrega: {
        metodo: metodoEntrega,
        direccion: metodoEntrega === "envio" ? String(data.get("direccion") || "").trim() : "",
        comuna: String(data.get("comuna") || "").trim(),
        zonaEnvio: metodoEntrega === "envio" ? "santiago" : "",
        fechaPreferida: metodoEntrega === "retiro" ? String(data.get("fechaPreferida") || "") : ""
      },
      items: orderItems(), metodoPago: String(data.get("metodoPago") || "transferencia"), observaciones: String(data.get("observaciones") || "").trim(), origen: "web"
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    syncDeliveryFields();
    if (!form.reportValidity()) return;
    submitting = true;
    renderSummary("Creando pedido...");
    try {
      const response = await window.EmmaginaAPI.createOrder(formPayload());
      window.EmmaginaCart.clear();
      summary.innerHTML = `<h2>Pedido recibido</h2><p class="cart-success">${escape(response.mensaje || "Tu pedido fue creado correctamente.")}</p><div class="checkout-confirmation"><span>Número de pedido</span><strong>${escape(response.numeroPedido || "—")}</strong></div><div class="summary-total"><span>Total</span><strong>${money(response.total || 0)}</strong></div>${response.venceAt ? `<p>El stock quedó reservado mientras envías el comprobante.</p>` : ""}<a class="btn btn-primary" href="seguimiento-pedido.html">Ver seguimiento</a><a class="btn btn-soft" href="catalogo.html">Volver a la tienda</a>`;
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
    if (event.target === deliverySelect) {
      syncDeliveryFields();
      renderSummary();
    }
  });

  Promise.resolve(prefillAccount()).finally(() => {
    syncDeliveryFields();
    validateCart();
  });
})();
