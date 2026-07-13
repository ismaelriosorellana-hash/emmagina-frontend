"use strict";

(function () {
  const summary = document.getElementById("security-summary");
  const checksRoot = document.getElementById("security-checks");
  const refresh = document.getElementById("security-refresh");

  function card(label, value, detail, icon) {
    return `<article class="admin-stat-card"><span>${AdminUI.escapeHtml(label)}</span><strong>${AdminUI.escapeHtml(value)}</strong><small>${AdminUI.escapeHtml(detail || "")}</small><i class="fa-solid ${icon}" aria-hidden="true"></i></article>`;
  }

  function checkCard(item) {
    const state = item.ok ? "Correcto" : item.severity === "warning" ? "Pendiente" : "Requiere atención";
    const icon = item.ok ? "fa-circle-check" : item.severity === "warning" ? "fa-triangle-exclamation" : "fa-circle-xmark";
    return `<article class="admin-card"><div class="admin-card-body"><strong><i class="fa-solid ${icon}"></i> ${AdminUI.escapeHtml(item.label)}</strong><p>${AdminUI.escapeHtml(state)}</p><small>${AdminUI.escapeHtml(item.message || "")}</small></div></article>`;
  }

  async function load() {
    if (!summary || !checksRoot) return;
    refresh.disabled = true;
    summary.innerHTML = card("Estado", "Cargando…", "Consultando el backend", "fa-spinner");
    checksRoot.innerHTML = "";
    try {
      const payload = await AdminAPI.request("/admin/seguridad/estado");
      const counts = payload.resumen || {};
      summary.innerHTML = [
        card("Estado general", payload.estado || "—", payload.listoParaClientes ? "Sin bloqueos críticos" : "Hay bloqueos críticos", payload.listoParaClientes ? "fa-shield-halved" : "fa-triangle-exclamation"),
        card("Correctos", String(counts.ok || 0), "Comprobaciones aprobadas", "fa-circle-check"),
        card("Observaciones", String(counts.warnings || 0), "Pendientes no críticos", "fa-circle-info"),
        card("Críticos", String(counts.critical || 0), "Deben resolverse antes del lanzamiento", "fa-circle-xmark")
      ].join("");
      checksRoot.innerHTML = (payload.checks || []).map(checkCard).join("");
    } catch (error) {
      summary.innerHTML = card("No disponible", "Error", error.message || "No fue posible consultar seguridad.", "fa-circle-xmark");
    } finally {
      refresh.disabled = false;
    }
  }

  document.addEventListener("admin:ready", load);
  refresh?.addEventListener("click", load);
})();
