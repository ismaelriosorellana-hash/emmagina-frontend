"use strict";

(function () {
    const state = {
        solicitudes: [],
        selected: null,
        searchTimer: null
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
        convertida_pedido: "Convertida a pedido",
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

    function money(value) {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function statusClass(status) {
        if (status === "convertida_pedido" || status === "aceptada") return "success";
        if (status === "cotizada" || status === "en_revision") return "warning";
        if (status === "rechazada" || status === "cerrada") return "danger";
        return "info";
    }

    function whatsappLink(value) {
        const digits = clean(value).replace(/\D/g, "");
        if (!digits) return "";
        const target = digits.startsWith("56") ? digits : `56${digits}`;
        return `https://wa.me/${target}`;
    }

    function valueFrom(id) {
        return clean(qs(id)?.value);
    }

    function numberFrom(id) {
        const raw = valueFrom(id).replace(/\D/g, "");
        return Number(raw) || 0;
    }

    async function loadRequests() {
        const table = qs("requests-table");
        window.AdminUI.showLoading(table, "Cargando solicitudes...");
        const params = new URLSearchParams();
        params.set("limit", "120");
        const search = valueFrom("requests-search");
        const status = valueFrom("requests-status");
        const type = valueFrom("requests-type");
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
            <table class="admin-table requests-table-pro">
                <thead>
                    <tr>
                        <th>Solicitud</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Cotización</th>
                        <th>Archivos</th>
                        <th>Fecha</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${state.solicitudes.map((item) => `
                        <tr>
                            <td>
                                <strong>${escapeHtml(item.folio)}</strong><br>
                                <small>${escapeHtml(labels[item.tipoSolicitud] || item.tipoSolicitud)} · ${escapeHtml(item.resumen || "")}</small>
                            </td>
                            <td>${escapeHtml(item.cliente?.nombre || "—")}<br><small>${escapeHtml(item.cliente?.whatsapp || "")}</small></td>
                            <td><span class="admin-status ${statusClass(item.estado)}">${escapeHtml(statusLabels[item.estado] || item.estado)}</span></td>
                            <td>
                                ${Number(item.cotizacion?.montoEstimado) ? `<strong>${money(item.cotizacion.montoEstimado)}</strong><br><small>${escapeHtml(item.cotizacion?.tiempoEstimado || "Sin tiempo")}</small>` : "—"}
                            </td>
                            <td>${Array.isArray(item.archivos) ? item.archivos.length : 0}</td>
                            <td>${window.AdminUI.dateTime(item.createdAt)}</td>
                            <td><button class="admin-button secondary small" data-open-request="${escapeHtml(item.id)}" type="button">Gestionar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    async function openRequest(id) {
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas/${id}`);
        renderDetail(result.solicitud);
    }

    function renderTimeline(item) {
        const history = Array.isArray(item.historial) ? item.historial.slice().reverse() : [];
        const notes = Array.isArray(item.notasInternas) ? item.notasInternas.slice().reverse() : [];
        const rows = [
            ...history.map((entry) => ({
                type: entry.evento || "evento",
                text: entry.detalle || "Actualización registrada.",
                date: entry.fecha
            })),
            ...notes.map((entry) => ({
                type: "nota",
                text: entry.nota,
                date: entry.creadaEn
            }))
        ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        if (!rows.length) return `<div class="request-muted">Sin notas internas todavía.</div>`;

        return rows.map((entry) => `
            <div class="request-timeline-item">
                <strong>${escapeHtml(entry.type)}</strong>
                <span>${window.AdminUI.dateTime(entry.date)}</span>
                <p>${escapeHtml(entry.text)}</p>
            </div>
        `).join("");
    }

    function renderDetail(item) {
        state.selected = item;
        qs("request-modal-title").textContent = item.folio;
        qs("request-modal-subtitle").textContent = `${labels[item.tipoSolicitud] || item.tipoSolicitud} · ${statusLabels[item.estado] || item.estado}`;
        const wa = whatsappLink(item.cliente?.whatsapp);
        const files = Array.isArray(item.archivos) ? item.archivos : [];
        const quote = item.cotizacion || {};
        const pedido = item.pedido || {};

        qs("request-detail").innerHTML = `
            <div class="request-detail-layout">
                <aside class="request-detail-side">
                    <section class="admin-card request-card compact">
                        <div class="admin-card-header"><h3>Cliente</h3></div>
                        <div class="admin-card-body">
                            <p><strong>Nombre:</strong> ${escapeHtml(item.cliente?.nombre || "—")}</p>
                            <p><strong>WhatsApp:</strong> ${wa ? `<a href="${escapeHtml(wa)}" target="_blank" rel="noopener">${escapeHtml(item.cliente?.whatsapp)}</a>` : escapeHtml(item.cliente?.whatsapp || "—")}</p>
                            <p><strong>Correo:</strong> ${item.cliente?.correo ? `<a href="mailto:${escapeHtml(item.cliente.correo)}">${escapeHtml(item.cliente.correo)}</a>` : "—"}</p>
                            <p><strong>Comuna:</strong> ${escapeHtml(item.cliente?.comuna || "—")}</p>
                        </div>
                    </section>
                    <section class="admin-card request-card compact">
                        <div class="admin-card-header"><h3>Estado</h3></div>
                        <div class="admin-card-body">
                            <label class="admin-field-label" for="request-new-status">Estado de solicitud</label>
                            <select id="request-new-status" class="admin-filter-select full-width">
                                ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${value === item.estado ? "selected" : ""}>${label}</option>`).join("")}
                            </select>
                            <label class="admin-field-label" for="request-new-priority">Prioridad</label>
                            <select id="request-new-priority" class="admin-filter-select full-width">
                                <option value="normal" ${item.prioridad !== "alta" ? "selected" : ""}>Normal</option>
                                <option value="alta" ${item.prioridad === "alta" ? "selected" : ""}>Alta</option>
                            </select>
                            <button class="admin-button full-width" id="request-save-status" type="button">Guardar estado</button>
                        </div>
                    </section>
                    <section class="admin-card request-card compact">
                        <div class="admin-card-header"><h3>Archivos</h3></div>
                        <div class="admin-card-body request-file-list">
                            ${files.length ? files.map((file) => `<a href="${escapeHtml(file.downloadUrl || file.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-paperclip"></i> ${escapeHtml(file.fileName || "archivo")}</a>`).join("") : "<p>No se subieron archivos.</p>"}
                        </div>
                    </section>
                </aside>

                <main class="request-detail-main">
                    <section class="admin-card request-card">
                        <div class="admin-card-header"><h3>Proyecto solicitado</h3></div>
                        <div class="admin-card-body request-project-grid">
                            <p><strong>Formato:</strong> ${escapeHtml(item.proyecto?.formato || "—")}</p>
                            <p><strong>Uso:</strong> ${escapeHtml(item.proyecto?.uso || "—")}</p>
                            <p><strong>Tamaño:</strong> ${escapeHtml(item.proyecto?.tamano || "—")}</p>
                            <p><strong>Color:</strong> ${escapeHtml(item.proyecto?.color || "—")}</p>
                            <p><strong>Cantidad:</strong> ${escapeHtml(item.proyecto?.cantidad || "1")}</p>
                            <p><strong>Personas/mascotas:</strong> ${escapeHtml(item.proyecto?.personas || "—")}</p>
                            <p class="full"><strong>Descripción:</strong><br>${escapeHtml(item.proyecto?.descripcion || "—")}</p>
                        </div>
                    </section>

                    <section class="admin-card request-card">
                        <div class="admin-card-header"><h3>Cotización</h3><small>Precio, tiempo y condiciones para enviar al cliente.</small></div>
                        <div class="admin-card-body request-quote-grid">
                            <label>Monto estimado CLP
                                <input id="quote-amount" type="number" min="0" step="100" value="${escapeHtml(quote.montoEstimado || "")}" placeholder="Ej: 24990">
                            </label>
                            <label>Tiempo estimado
                                <input id="quote-time" type="text" value="${escapeHtml(quote.tiempoEstimado || "")}" placeholder="Ej: 3 a 5 días hábiles">
                            </label>
                            <label>Validez en días
                                <input id="quote-validity" type="number" min="1" max="60" value="${escapeHtml(quote.validezDias || 7)}">
                            </label>
                            <label>Abono sugerido CLP
                                <input id="quote-deposit" type="number" min="0" step="100" value="${escapeHtml(quote.montoAbono || "")}" placeholder="Opcional">
                            </label>
                            <label class="request-check full">
                                <input id="quote-requires-deposit" type="checkbox" ${quote.requiereAbono ? "checked" : ""}>
                                Solicitar abono antes de fabricar
                            </label>
                            <label class="full">Observaciones para el cliente
                                <textarea id="quote-notes" rows="4" placeholder="Incluye recomendaciones, alcance, material o detalles importantes.">${escapeHtml(quote.observaciones || "")}</textarea>
                            </label>
                            <label class="full">Condiciones
                                <textarea id="quote-terms" rows="3" placeholder="Ej: El precio puede variar si cambia tamaño, color o archivo.">${escapeHtml(quote.condiciones || "")}</textarea>
                            </label>
                        </div>
                        <div class="admin-form-actions compact-actions">
                            <button class="admin-button secondary" id="request-save-quote" type="button">Guardar cotización</button>
                            <button class="admin-button" id="request-send-quote" type="button">Enviar cotización</button>
                        </div>
                    </section>

                    <section class="admin-card request-card">
                        <div class="admin-card-header"><h3>Convertir en pedido</h3><small>${pedido.numeroPedido ? `Ya convertido: ${escapeHtml(pedido.numeroPedido)}` : "Crea un pedido administrativo desde esta cotización."}</small></div>
                        <div class="admin-card-body request-convert-grid">
                            <label>Días de preparación
                                <input id="order-days" type="number" min="1" max="90" value="5">
                            </label>
                            <label>Entrega
                                <select id="order-delivery">
                                    <option value="retiro">Retiro / coordinar</option>
                                    <option value="envio">Envío</option>
                                </select>
                            </label>
                            <label class="full">Instrucciones de entrega
                                <textarea id="order-delivery-notes" rows="2" placeholder="Ej: Coordinar por WhatsApp antes de fabricar o entregar."></textarea>
                            </label>
                        </div>
                        <div class="admin-form-actions compact-actions">
                            <button class="admin-button ${pedido.numeroPedido ? "secondary" : ""}" id="request-convert-order" type="button" ${pedido.numeroPedido ? "disabled" : ""}>Crear pedido desde solicitud</button>
                            ${pedido.numeroPedido ? `<a class="admin-button secondary" href="pedidos.html?buscar=${encodeURIComponent(pedido.numeroPedido)}">Ver pedido</a>` : ""}
                        </div>
                    </section>

                    <section class="admin-card request-card">
                        <div class="admin-card-header"><h3>Notas internas e historial</h3></div>
                        <div class="admin-card-body">
                            <label>Nueva nota interna
                                <textarea id="request-new-note" rows="3" placeholder="Escribe una nota para el equipo. No se envía al cliente."></textarea>
                            </label>
                            <div class="admin-form-actions compact-actions">
                                <button class="admin-button secondary" id="request-add-note" type="button">Agregar nota</button>
                            </div>
                            <div class="request-timeline">${renderTimeline(item)}</div>
                        </div>
                    </section>
                </main>
            </div>
        `;
        window.AdminUI.openModal("request-modal");
    }

    function quotePayload() {
        return {
            montoEstimado: numberFrom("quote-amount"),
            tiempoEstimado: valueFrom("quote-time"),
            validezDias: Number(valueFrom("quote-validity")) || 7,
            requiereAbono: Boolean(qs("quote-requires-deposit")?.checked),
            montoAbono: numberFrom("quote-deposit"),
            observaciones: valueFrom("quote-notes"),
            condiciones: valueFrom("quote-terms")
        };
    }

    async function refreshSelected(updated) {
        state.selected = updated;
        state.solicitudes = state.solicitudes.map((item) => item.id === updated.id ? updated : item);
        renderTable();
        renderDetail(updated);
    }

    async function saveStatus() {
        if (!state.selected) return;
        const estado = valueFrom("request-new-status");
        const prioridad = valueFrom("request-new-priority");
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas/${state.selected.id}`, {
            method: "PATCH",
            body: { estado, prioridad }
        });
        await refreshSelected(result.solicitud);
        window.AdminUI.toast("Estado actualizado.", "success");
    }

    async function saveQuote(send = false) {
        if (!state.selected) return;
        const payload = quotePayload();
        if (!payload.montoEstimado) {
            window.AdminUI.toast("Ingresa un monto estimado antes de guardar la cotización.", "danger");
            return;
        }
        const endpoint = send
            ? `/admin/solicitudes-personalizadas/${state.selected.id}/cotizacion/enviar`
            : `/admin/solicitudes-personalizadas/${state.selected.id}`;
        const result = await window.AdminAPI.request(endpoint, {
            method: send ? "POST" : "PATCH",
            body: send ? payload : { cotizacion: payload, estado: state.selected.estado === "recibida" ? "en_revision" : state.selected.estado }
        });
        await refreshSelected(result.solicitud);
        window.AdminUI.toast(send ? "Cotización enviada y registrada." : "Cotización guardada.", "success");
    }

    async function addNote() {
        if (!state.selected) return;
        const nota = valueFrom("request-new-note");
        if (!nota) {
            window.AdminUI.toast("Escribe una nota antes de guardarla.", "danger");
            return;
        }
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas/${state.selected.id}/notas`, {
            method: "POST",
            body: { nota }
        });
        await refreshSelected(result.solicitud);
        window.AdminUI.toast("Nota agregada.", "success");
    }

    async function convertToOrder() {
        if (!state.selected) return;
        if (!window.AdminUI.confirmAction("¿Crear un pedido administrativo desde esta solicitud?")) return;
        const result = await window.AdminAPI.request(`/admin/solicitudes-personalizadas/${state.selected.id}/convertir-pedido`, {
            method: "POST",
            body: {
                diasPreparacion: Number(valueFrom("order-days")) || 5,
                metodoEntrega: valueFrom("order-delivery"),
                instruccionesEntrega: valueFrom("order-delivery-notes")
            }
        });
        await refreshSelected(result.solicitud);
        window.AdminUI.toast(`Pedido ${result.pedido?.numeroPedido || ""} creado.`, "success");
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
                openRequest(open.dataset.openRequest).catch((error) => window.AdminUI.toast(error.message, "danger"));
                return;
            }
            if (event.target.closest("#request-save-status")) saveStatus().catch((error) => window.AdminUI.toast(error.message, "danger"));
            if (event.target.closest("#request-save-quote")) saveQuote(false).catch((error) => window.AdminUI.toast(error.message, "danger"));
            if (event.target.closest("#request-send-quote")) saveQuote(true).catch((error) => window.AdminUI.toast(error.message, "danger"));
            if (event.target.closest("#request-add-note")) addNote().catch((error) => window.AdminUI.toast(error.message, "danger"));
            if (event.target.closest("#request-convert-order")) convertToOrder().catch((error) => window.AdminUI.toast(error.message, "danger"));
        });
    }

    document.addEventListener("admin:ready", () => {
        bindEvents();
        loadRequests().catch((error) => window.AdminUI.toast(error.message, "danger"));
    });
})();
