"use strict";

(function () {
  const summary = document.getElementById("launch-summary");
  const checks = document.getElementById("launch-checks");
  const refresh = document.getElementById("launch-refresh");
  if (!summary || !checks) return;

  const esc = (value) => window.AdminCommon.escapeHtml(value);

  function badge(check) {
    if (check.ok) return '<span class="admin-badge success">Correcto</span>';
    if (check.severity === "critical") return '<span class="admin-badge danger">Crítico</span>';
    return '<span class="admin-badge warning">Pendiente</span>';
  }

  function render(data) {
    const stateLabel = data.readiness === "listo" ? "Listo" : data.readiness === "pruebas" ? "En pruebas" : "Bloqueado";
    summary.innerHTML = `
      <article class="admin-stat-card"><span>Estado</span><strong>${esc(stateLabel)}</strong></article>
      <article class="admin-stat-card"><span>Correctos</span><strong>${Number(data.summary?.correctos || 0)}</strong></article>
      <article class="admin-stat-card"><span>Observaciones</span><strong>${Number(data.summary?.observaciones || 0)}</strong></article>
      <article class="admin-stat-card"><span>Críticos</span><strong>${Number(data.summary?.criticos || 0)}</strong></article>
      <article class="admin-stat-card"><span>Productos publicados</span><strong>${Number(data.metrics?.publishedProducts || 0)}</strong></article>
      <article class="admin-stat-card"><span>Pedidos</span><strong>${Number(data.metrics?.totalOrders || 0)}</strong></article>`;

    checks.innerHTML = (data.checks || []).map((check) => `
      <article class="admin-card">
        <div class="admin-card-body">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:start">
            <strong>${esc(check.title)}</strong>${badge(check)}
          </div>
          <p>${esc(check.detail)}</p>
          ${check.action && !check.ok ? `<small>${esc(check.action)}</small>` : ""}
        </div>
      </article>`).join("");
  }

  async function load() {
    window.AdminCommon.showLoading(checks, "Revisando preparación de lanzamiento...");
    try {
      const data = await window.AdminAPI.request("/admin/lanzamiento/estado");
      render(data);
    } catch (error) {
      checks.innerHTML = `<div class="admin-empty">${esc(error.message || "No fue posible cargar el diagnóstico.")}</div>`;
    }
  }

  refresh?.addEventListener("click", load);
  load();
})();
