"use strict";

(function () {
  const form = document.querySelector("[data-quote-form]");
  const result = document.querySelector("[data-quote-result]");
  const folioInput = document.querySelector("[data-quote-folio]");
  if (!form || !result) return;

  const money = (value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  let lookup = null;
  let current = null;

  const statusLabels = {
    recibida: "Solicitud recibida",
    en_revision: "En revisión",
    cotizada: "Cotización disponible",
    aceptada: "Cotización aceptada",
    convertida_pedido: "Convertida en pedido",
    rechazada: "Cotización rechazada",
    cerrada: "Solicitud cerrada"
  };

  function date(value) {
    if (!value) return "No informado";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "No informado" : parsed.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
  }

  function setLoading(message) {
    result.innerHTML = `<div class="state-box"><p>${escape(message)}</p></div>`;
  }

  function showError(message) {
    result.innerHTML = `<div class="state-box state-error"><p><strong>No pudimos consultar la cotización.</strong></p><p>${escape(message)}</p></div>`;
  }

  function statusClass(item) {
    if (item.cotizacion?.vencida) return "is-expired";
    if (item.estado === "cotizada") return "is-ready";
    if (["aceptada", "convertida_pedido"].includes(item.estado)) return "is-accepted";
    if (item.estado === "rechazada") return "is-rejected";
    return "";
  }

  function render(item) {
    current = item;
    const quote = item.cotizacion;
    const canRespond = item.estado === "cotizada" && quote && !quote.vencida;
    const statusText = quote?.vencida ? "Cotización vencida" : statusLabels[item.estado] || item.estado;

    result.innerHTML = `
      <article class="quote-card">
        <header class="quote-card-header">
          <div><p class="kicker">Folio ${escape(item.folio)}</p><h2>${quote ? "Tu cotización" : "Estado de tu solicitud"}</h2></div>
          <span class="quote-status ${statusClass(item)}">${escape(statusText)}</span>
        </header>
        <p class="quote-summary">${escape(item.resumen || "Solicitud personalizada Rhema Diseños.")}</p>
        ${quote ? `
          <div class="quote-amount-box"><span>Monto propuesto</span><strong>${money(quote.montoEstimado)}</strong></div>
          <div class="quote-grid">
            <div class="quote-detail"><span>Tiempo estimado</span><strong>${escape(quote.tiempoEstimado || "Por coordinar")}</strong></div>
            <div class="quote-detail"><span>Válida hasta</span><strong>${date(quote.venceEn)}</strong></div>
            ${quote.requiereAbono ? `<div class="quote-detail"><span>Abono solicitado</span><strong>${money(quote.montoAbono)}</strong></div>` : ""}
            <div class="quote-detail"><span>Fecha de envío</span><strong>${date(quote.enviadaEn)}</strong></div>
            ${quote.observaciones ? `<div class="quote-detail full"><span>Observaciones</span><p>${escape(quote.observaciones)}</p></div>` : ""}
            ${quote.condiciones ? `<div class="quote-detail full"><span>Condiciones</span><p>${escape(quote.condiciones)}</p></div>` : ""}
          </div>` : `<div class="quote-note">Todavía no hay una cotización disponible. Rhema Diseños está revisando tu solicitud.</div>`}
        ${item.pedido?.numeroPedido ? `<div class="quote-note"><strong>Pedido creado:</strong> ${escape(item.pedido.numeroPedido)}. Puedes continuar el seguimiento desde la sección de pedidos.</div>` : ""}
        ${canRespond ? `
          <div class="quote-actions">
            <button class="btn btn-primary" type="button" data-quote-accept>Aceptar cotización</button>
            <button class="btn btn-soft" type="button" data-quote-reject>Rechazar o pedir cambios</button>
          </div>
          <form class="quote-reject-form" data-reject-form hidden>
            <label>Comentario opcional
              <textarea name="motivo" rows="3" placeholder="Cuéntanos qué deseas modificar o por qué no continuarás."></textarea>
            </label>
            <button class="btn btn-soft" type="submit">Confirmar rechazo</button>
          </form>` : ""}
        ${quote?.vencida ? `<div class="quote-note">Esta propuesta superó su período de validez. Contáctanos para solicitar una actualización.</div>` : ""}
      </article>`;
  }

  async function respond(action, reason = "") {
    if (!current || !lookup) return;
    setLoading(action === "aceptar" ? "Registrando aceptación..." : "Registrando respuesta...");
    try {
      const payload = await window.EmmaginaAPI.respondCustomQuote(current.folio, { ...lookup, accion: action, motivo: reason });
      render(payload.solicitud);
    } catch (error) {
      showError(error.message || "No fue posible registrar tu respuesta.");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const folio = String(data.get("folio") || "").trim().toUpperCase();
    const correo = String(data.get("correo") || "").trim().toLowerCase();
    const whatsapp = String(data.get("whatsapp") || "").trim();
    if (!folio) return showError("Ingresa el folio de tu solicitud.");
    if (!correo && !whatsapp) return showError("Ingresa el correo o WhatsApp usado al enviar la solicitud.");
    lookup = { correo, whatsapp };
    setLoading("Consultando solicitud...");
    try {
      const payload = await window.EmmaginaAPI.getCustomQuote(folio, lookup);
      render(payload.solicitud);
    } catch (error) {
      showError(error.message || "No fue posible consultar la solicitud.");
    }
  });

  result.addEventListener("click", (event) => {
    if (event.target.closest("[data-quote-accept]")) {
      if (window.confirm("¿Confirmas que deseas aceptar esta cotización?")) respond("aceptar");
      return;
    }
    if (event.target.closest("[data-quote-reject]")) {
      const rejectForm = result.querySelector("[data-reject-form]");
      if (rejectForm) rejectForm.hidden = !rejectForm.hidden;
    }
  });

  result.addEventListener("submit", (event) => {
    const rejectForm = event.target.closest("[data-reject-form]");
    if (!rejectForm) return;
    event.preventDefault();
    const reason = String(new FormData(rejectForm).get("motivo") || "").trim();
    if (window.confirm("¿Confirmas que deseas rechazar esta cotización?")) respond("rechazar", reason);
  });

  const query = new URLSearchParams(location.search);
  const presetFolio = query.get("folio");
  if (presetFolio && folioInput) folioInput.value = presetFolio.toUpperCase();
})();
