"use strict";

(function () {
    const state = {
        solicitudes: [],
        selected: null
    };

    const labels = {
        figura: "Figura / retrato 3D",
        servicio: "Impresión a pedido",
        idea: "Idea personalizada"
    };

    const statusLabels = {
        recibida: "Recibida",
        en_revision: "En revisión",
        cotizada: "Cotizada",
        aceptada: "Aceptada",
        rechazada: "Rechazada",
        cerrada: "Cerrada"
    };

    function qs(id) {
        return document.getElementById(id);
    }

    function clean(value) {
        return String(value ?? "").trim();
    }

    function escapeHtml(value) {
        return window.AdminUI.escapeHtml(value);
    }

    function whatsappLink(value) {
        const digits = clean(value).replace(/\D/g, "");
        if (!digits) return "";
        const target = digits.startsWith("56") ? digits : `56${digits}`;
        return `https://wa.me/${target}`;
    }

    async function loadRequests() {
        const table = qs("requests-table");
        window.AdminUI.showLoading(table, "Cargando solicitudes...");
        const params = new URLSearchParams();
        params.set("limit", "120");
        const search = clean(qs("requests-search")?.value);
        const status = clean(qs("requests-status")?.value);
        const type = clean(qs("requests-type")?.value);
        if (search) params.set("buscar", search);
        if (status) params.set("estado", status);
        if (type) params.set("tipoSolicitud", type);
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas?${params.toString()}`);
        state.solicitudes = Array.isArray(result.solicitudes) ? result.solicitudes : [];
        renderTable();
    }

    function renderTable() {
        const table = qs("requests-table");
        if (!state.solicitudes.length) {
            table.innerHTML = `<div class="admin-empty">No hay solicitudes para mostrar.</div>`;
            return;
        }
        table.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Archivos</th>
                        <th>Fecha</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${state.solicitudes.map((item) => `
                        <tr>
                            <td><strong>${escapeHtml(item.folio)}</strong><br><small>${escapeHtml(item.resumen || "")}</small></td>
                            <td>${escapeHtml(item.cliente?.nombre || "—")}<br><small>${escapeHtml(item.cliente?.whatsapp || "")}</small></td>
                            <td>${escapeHtml(labels[item.tipoSolicitud] || item.tipoSolicitud)}</td>
                            <td><span class="admin-status ${window.AdminUI.statusClass(item.estado)}">${escapeHtml(statusLabels[item.estado] || item.estado)}</span></td>
                            <td>${Array.isArray(item.archivos) ? item.archivos.length : 0}</td>
                            <td>${window.AdminUI.dateTime(item.createdAt)}</td>
                            <td><button class="admin-button secondary small" data-open-request="${escapeHtml(item.id)}" type="button">Ver</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    function renderDetail(item) {
        state.selected = item;
        qs("request-modal-title").textContent = item.folio;
        qs("request-modal-subtitle").textContent = `${labels[item.tipoSolicitud] || item.tipoSolicitud} · ${statusLabels[item.estado] || item.estado}`;
        const wa = whatsappLink(item.cliente?.whatsapp);
        const files = Array.isArray(item.archivos) ? item.archivos : [];
        qs("request-detail").innerHTML = `
            <div class="admin-form-grid">
                <section class="admin-card full">
                    <div class="admin-card-header"><h3>Cliente</h3></div>
                    <div class="admin-card-body">
                        <p><strong>Nombre:</strong> ${escapeHtml(item.cliente?.nombre || "—")}</p>
                        <p><strong>WhatsApp:</strong> ${wa ? `<a href="${escapeHtml(wa)}" target="_blank" rel="noopener">${escapeHtml(item.cliente?.whatsapp)}</a>` : escapeHtml(item.cliente?.whatsapp || "—")}</p>
                        <p><strong>Correo:</strong> ${item.cliente?.correo ? `<a href="mailto:${escapeHtml(item.cliente.correo)}">${escapeHtml(item.cliente.correo)}</a>` : "—"}</p>
                        <p><strong>Comuna:</strong> ${escapeHtml(item.cliente?.comuna || "—")}</p>
                    </div>
                </section>
                <section class="admin-card full">
                    <div class="admin-card-header"><h3>Proyecto</h3></div>
                    <div class="admin-card-body">
                        <p><strong>Tamaño:</strong> ${escapeHtml(item.proyecto?.tamano || "—")}</p>
                        <p><strong>Color:</strong> ${escapeHtml(item.proyecto?.color || "—")}</p>
                        <p><strong>Cantidad:</strong> ${escapeHtml(item.proyecto?.cantidad || "1")}</p>
                        <p><strong>Descripción:</strong><br>${escapeHtml(item.proyecto?.descripcion || "—")}</p>
                    </div>
                </section>
                <section class="admin-card full">
                    <div class="admin-card-header"><h3>Archivos</h3></div>
                    <div class="admin-card-body">
                        ${files.length ? files.map((file) => `<p><a href="${escapeHtml(file.downloadUrl || file.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-paperclip"></i> ${escapeHtml(file.fileName || "archivo")}</a> <small>${escapeHtml(file.mimeType || "")}</small></p>`).join("") : "<p>No se subieron archivos.</p>"}
                    </div>
                </section>
            </div>
            <div class="admin-form-actions">
                <select id="request-new-status" class="admin-filter-select">
                    ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${value === item.estado ? "selected" : ""}>${label}</option>`).join("")}
                </select>
                <button class="admin-button" id="request-save-status" type="button">Guardar estado</button>
            </div>
        `;
        window.AdminUI.openModal("request-modal");
    }

    async function saveStatus() {
        if (!state.selected) return;
        const estado = clean(qs("request-new-status")?.value);
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas/${state.selected.id}`, {
            method: "PATCH",
            body: { estado }
        });
        const updated = result.solicitud;
        state.solicitudes = state.solicitudes.map((item) => item.id === updated.id ? updated : item);
        renderTable();
        renderDetail(updated);
        window.AdminUI.toast("Estado actualizado.", "success");
    }

    function bindEvents() {
        qs("requests-refresh")?.addEventListener("click", () => loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger")));
        qs("requests-search")?.addEventListener("input", () => {
            window.clearTimeout(state.searchTimer);
            state.searchTimer = window.setTimeout(() => loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger")), 350);
        });
        qs("requests-status")?.addEventListener("change", () => loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger")));
        qs("requests-type")?.addEventListener("change", () => loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger")));
        document.addEventListener("click", (event) => {
            const open = event.target.closest("[data-open-request]");
            if (open) {
                const item = state.solicitudes.find((request) => request.id === open.dataset.openRequest);
                if (item) renderDetail(item);
                return;
            }
            if (event.target.closest("#request-save-status")) {
                saveStatus().catch((error) => window.AdminUI.toast(error.message, "danger"));
            }
        });
    }

    document.addEventListener("admin:ready", () => {
        bindEvents();
        loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger"));
    });
})();
