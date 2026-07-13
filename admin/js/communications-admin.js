"use strict";

(function () {
    const statusRoot = document.getElementById("communications-status");
    const refreshButton = document.getElementById("communications-refresh");

    function yesNo(value) {
        return value ? "Configurado" : "Pendiente";
    }

    function card(label, value, detail, good = false) {
        return `
            <article class="admin-stat-card">
                <span>${AdminUI.escapeHtml(label)}</span>
                <strong>${AdminUI.escapeHtml(value)}</strong>
                <small>${AdminUI.escapeHtml(detail || "")}</small>
                <i class="fa-solid ${good ? "fa-circle-check" : "fa-circle-info"}" aria-hidden="true"></i>
            </article>`;
    }

    async function loadStatus() {
        if (!statusRoot) return;
        statusRoot.innerHTML = card("Estado", "Cargando…", "Consultando configuración");
        if (refreshButton) refreshButton.disabled = true;

        try {
            const payload = await AdminAPI.request("/admin/notificaciones/estado");
            const status = payload?.estado || payload || {};
            statusRoot.innerHTML = [
                card("Correo automático", status.configured ? "Operativo" : "Manual", status.mensaje || "", status.configured),
                card("Remitente", yesNo(status.fromConfigured), status.fromMasked || "EMAIL_FROM no configurado", status.fromConfigured),
                card("Resend", yesNo(status.resendConfigured), status.provider || "resend", status.resendConfigured),
                card("Aviso interno", yesNo(status.adminEmailConfigured), (status.adminEmailsMasked || []).join(", ") || "NOTIFICATION_ADMIN_EMAIL pendiente", status.adminEmailConfigured),
                card("WhatsApp soporte", yesNo(status.whatsappSupportConfigured), "Disponible como enlace manual", status.whatsappSupportConfigured),
                card("URL pública", yesNo(status.frontendUrlConfigured), "Necesaria para enlaces de seguimiento", status.frontendUrlConfigured)
            ].join("");
        } catch (error) {
            statusRoot.innerHTML = card("No disponible", "Error", error.message || "No fue posible leer el estado.");
        } finally {
            if (refreshButton) refreshButton.disabled = false;
        }
    }

    document.addEventListener("admin:ready", loadStatus);
    refreshButton?.addEventListener("click", loadStatus);
})();
