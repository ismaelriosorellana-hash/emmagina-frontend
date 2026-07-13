"use strict";

(function () {
  const form = document.querySelector("[data-order-tracking-form]");
  const result = document.querySelector("[data-order-tracking-result]");
  if (!form || !result) return;

  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  const date = (value) => {
    if (!value) return "Por confirmar";
    try {
      return new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(value));
    } catch {
      return "Por confirmar";
    }
  };

  const stages = [
    ["revision", "Revisión"],
    ["diseno", "Diseño"],
    ["preparacion", "Preparación"],
    ["impresion", "Impresión"],
    ["postprocesado", "Terminaciones"],
    ["control_calidad", "Control de calidad"],
    ["listo_entrega", "Listo para entrega"],
    ["en_ruta", "En ruta"],
    ["completado", "Completado"]
  ];

  function stageLabel(value) {
    return stages.find(([key]) => key === value)?.[1] || String(value || "En revisión").replaceAll("_", " ");
  }

  function render(order) {
    const currentIndex = Math.max(0, stages.findIndex(([key]) => key === order.produccion?.etapa));
    const progress = Math.max(0, Math.min(100, Number(order.produccion?.progreso || 0)));
    result.innerHTML = `
      <section class="tracking-order-card">
        <header class="tracking-order-head">
          <div>
            <p class="kicker">Pedido ${escape(order.numeroPedido)}</p>
            <h2>Hola, ${escape(order.cliente?.nombre || "cliente")}</h2>
            <p>${escape(order.produccion?.mensajeCliente || "Estamos preparando tu pedido.")}</p>
          </div>
          <span class="tracking-stage-badge">${escape(stageLabel(order.produccion?.etapa))}</span>
        </header>

        <div class="tracking-progress" aria-label="${progress}% de avance">
          <div style="width:${progress}%"></div>
        </div>
        <p class="tracking-progress-copy"><strong>${progress}% de avance</strong> · Actualizado ${date(order.produccion?.actualizadoAt)}</p>

        <div class="tracking-timeline">
          ${stages.map(([key, label], index) => `
            <article class="${index <= currentIndex ? "is-complete" : ""} ${index === currentIndex ? "is-current" : ""}">
              <span>${index + 1}</span>
              <strong>${escape(label)}</strong>
            </article>`).join("")}
        </div>

        <div class="tracking-summary-grid">
          <div><span>Estado del pago</span><strong>${escape(String(order.estadoPago || "pendiente").replaceAll("_", " "))}</strong></div>
          <div><span>Entrega</span><strong>${order.entrega?.metodo === "retiro" ? "Retiro coordinado" : "Envío"}</strong></div>
          <div><span>Comuna</span><strong>${escape(order.entrega?.comuna || "Por confirmar")}</strong></div>
          <div><span>Fecha estimada</span><strong>${date(order.produccion?.fechaEstimada)}</strong></div>
        </div>

        <section class="tracking-products">
          <h3>Productos del pedido</h3>
          ${(order.items || []).map((item) => `
            <div>
              ${item.imagen ? `<img src="${escape(item.imagen)}" alt="">` : ""}
              <span><strong>${escape(item.nombre)}</strong><small>Cantidad: ${Number(item.cantidad) || 1}</small></span>
            </div>`).join("")}
        </section>

        ${(order.historial || []).length ? `
          <details class="tracking-history">
            <summary>Ver historial del pedido</summary>
            <ol>
              ${order.historial.slice().reverse().map((entry) => `<li><strong>${escape(stageLabel(entry.estado))}</strong><span>${escape(entry.detalle || "Estado actualizado")}</span><small>${date(entry.fecha)}</small></li>`).join("")}
            </ol>
          </details>` : ""}
      </section>`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    result.innerHTML = '<div class="state-box"><p>Buscando tu pedido...</p></div>';
    try {
      const response = await window.EmmaginaAPI.request("/pedidos/seguimiento", {
        method: "POST",
        body: {
          numeroPedido: form.numeroPedido.value.trim(),
          contacto: form.contacto.value.trim()
        }
      });
      render(response);
    } catch (error) {
      result.innerHTML = `<div class="state-box"><h2>No pudimos mostrar el pedido</h2><p>${escape(error.message || "Revisa los datos e intenta nuevamente.")}</p></div>`;
    } finally {
      submit.disabled = false;
    }
  });
})();
