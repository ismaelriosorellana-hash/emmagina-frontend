"use strict";

(function () {
    const state = {
        pages: [],
        page: null,
        selectedBlockId: "",
        draggedBlockId: ""
    };

    const blockLabels = {
        hero_banner: "Hero / Banner principal",
        info_cards: "Tarjetas informativas",
        product_marquee: "Carrusel de productos",
        image_banner: "Banner de imagen",
        reviews_marquee: "Carrusel de reseñas",
        checkout_form: "Formulario checkout",
        custom_html: "HTML controlado"
    };

    const defaultBlocks = {
        hero_banner: {
            name: "Nuevo hero",
            content: {
                title: "Título principal",
                subtitle: "Texto de apoyo",
                imageDesktop: "",
                imageMobile: "",
                buttonText: "Ver tienda",
                buttonUrl: "catalogo.html"
            },
            style: {
                heightDesktop: 323,
                heightMobile: 220
            }
        },
        info_cards: {
            name: "Tarjetas informativas",
            content: {
                cards: [
                    { title: "Destacados", text: "Texto", image: "" },
                    { title: "Más vendidos", text: "Texto", image: "" },
                    { title: "Más vistos", text: "Texto", image: "" }
                ]
            },
            style: {}
        },
        product_marquee: {
            name: "Carrusel de productos",
            content: {
                title: "Productos",
                filter: "destacados",
                limit: 12
            },
            style: {}
        },
        image_banner: {
            name: "Banner de imagen",
            content: {
                title: "Línea especial",
                imageDesktop: "",
                imageMobile: "",
                buttonText: "Pedir el mío",
                buttonUrl: "pedido-personalizado.html"
            },
            style: {
                heightDesktop: 112,
                heightMobile: 88
            }
        },
        reviews_marquee: {
            name: "Carrusel de reseñas",
            content: {
                title: "Lo que dicen nuestros clientes",
                minRating: 4
            },
            style: {}
        },
        checkout_form: {
            name: "Formulario checkout",
            content: {
                title: "Finalizar compra",
                showShipping: true,
                showPayment: true
            },
            style: {}
        },
        custom_html: {
            name: "HTML controlado",
            content: {
                html: "<p>Contenido editable</p>"
            },
            style: {}
        }
    };

    function $(selector) {
        return document.querySelector(selector);
    }

    function escapeHtml(value) {
        return AdminUI.escapeHtml(value);
    }

    function sortBlocks(blocks = []) {
        return [...blocks].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    }

    function getSelectedBlock() {
        return (state.page?.blocks || []).find((block) => String(block._id) === String(state.selectedBlockId)) || null;
    }

    function stringify(value) {
        return JSON.stringify(value || {}, null, 2);
    }

    function parseJson(text, fallback = {}) {
        try {
            return JSON.parse(text || "{}");
        } catch (error) {
            throw new Error("JSON inválido. Revisa comas, llaves y comillas.");
        }
    }

    async function loadPages() {
        state.pages = await AdminAPI.request("/admin/pages");
        renderPageSelect();
    }

    async function loadPage(pageId = "home") {
        try {
            state.page = await AdminAPI.request(`/admin/pages/${encodeURIComponent(pageId)}`);
            state.page.blocks = sortBlocks(state.page.blocks || []);
            state.selectedBlockId = state.page.blocks[0]?._id || "";
        } catch (error) {
            if (error.status === 404) {
                state.page = null;
                state.selectedBlockId = "";
                AdminUI.toast("La página aún no existe. Crea la Home base desde el botón Bloque o ejecuta el seed.", "warning");
            } else {
                throw error;
            }
        }
        renderAll();
    }

    function renderPageSelect() {
        const select = $("#pagebuilder-page-select");
        if (!select) return;
        const pages = state.pages.length ? state.pages : [{ key: "home", title: "Inicio" }];
        select.innerHTML = pages.map((page) => `<option value="${escapeHtml(page.key || page.slug || page._id)}">${escapeHtml(page.title || page.key)}</option>`).join("");
        if (state.page?.key) select.value = state.page.key;
    }

    function renderPageFields() {
        if (!state.page) {
            $("#pagebuilder-page-title").value = "";
            $("#pagebuilder-page-slug").value = "";
            $("#pagebuilder-page-published").checked = false;
            $("#pagebuilder-canvas-title").textContent = "Página no cargada";
            return;
        }
        $("#pagebuilder-page-title").value = state.page.title || "";
        $("#pagebuilder-page-slug").value = state.page.slug || "";
        $("#pagebuilder-page-published").checked = state.page.isPublished !== false;
        $("#pagebuilder-canvas-title").textContent = state.page.title || state.page.key || "Página";
    }

    function renderLayers() {
        const list = $("#pagebuilder-block-list");
        if (!list) return;
        const blocks = sortBlocks(state.page?.blocks || []);
        if (!blocks.length) {
            list.innerHTML = `<div class="admin-empty">Esta página todavía no tiene bloques.</div>`;
            return;
        }
        list.innerHTML = blocks.map((block, index) => {
            const id = String(block._id);
            const active = id === String(state.selectedBlockId) ? " active" : "";
            const hidden = block.isVisible === false ? " · Oculto" : "";
            return `<article class="pagebuilder-block-item${active}" draggable="true" data-block-id="${escapeHtml(id)}">
                <div class="pagebuilder-block-main">
                    <strong>${escapeHtml(block.name || blockLabels[block.type] || block.type)}</strong>
                    <span>${index + 1}. ${escapeHtml(blockLabels[block.type] || block.type)}${hidden}</span>
                </div>
                <div class="pagebuilder-block-actions">
                    <button class="pagebuilder-mini-button" type="button" data-move="up" data-block-id="${escapeHtml(id)}" aria-label="Subir">↑</button>
                    <button class="pagebuilder-mini-button" type="button" data-move="down" data-block-id="${escapeHtml(id)}" aria-label="Bajar">↓</button>
                </div>
            </article>`;
        }).join("");
    }

    function blockSummary(block) {
        const content = block.content || {};
        if (block.type === "product_marquee") return `Filtro: ${content.filter || "todos"} · Límite: ${content.limit || 12}`;
        if (block.type === "info_cards") return `${Array.isArray(content.cards) ? content.cards.length : 0} tarjetas informativas`;
        if (block.type === "reviews_marquee") return `Reseñas desde ${content.minRating || 4} estrellas`;
        if (content.subtitle) return content.subtitle;
        if (content.buttonText) return `${content.buttonText} → ${content.buttonUrl || "#"}`;
        return "Bloque editable";
    }

    function renderCanvas() {
        const preview = $("#pagebuilder-preview");
        if (!preview) return;
        const blocks = sortBlocks(state.page?.blocks || []);
        if (!blocks.length) {
            preview.innerHTML = `<div class="admin-empty">No hay bloques para previsualizar.</div>`;
            return;
        }
        preview.innerHTML = blocks.map((block) => {
            const content = block.content || {};
            const active = String(block._id) === String(state.selectedBlockId) ? " active" : "";
            const img = content.imageDesktop || content.image || (Array.isArray(content.cards) ? content.cards.find((card) => card.image)?.image : "");
            return `<article class="pagebuilder-preview-block${active}" data-select-block="${escapeHtml(block._id)}">
                <header>
                    <div>
                        <h4>${escapeHtml(block.name || content.title || blockLabels[block.type] || block.type)}</h4>
                        <p>${escapeHtml(blockSummary(block))}</p>
                    </div>
                    <span class="admin-status-pill ${block.isVisible === false ? "danger" : "success"}">${block.isVisible === false ? "Oculto" : "Visible"}</span>
                </header>
                ${img ? `<img class="pagebuilder-preview-image" src="${escapeHtml(img)}" alt="Vista previa">` : ""}
            </article>`;
        }).join("");
    }

    function fieldHtml(id, label, value = "", type = "text") {
        return `<div class="admin-field">
            <label for="${id}">${escapeHtml(label)}</label>
            <input id="${id}" data-content-field="${escapeHtml(id.replace("field-", ""))}" type="${type}" value="${escapeHtml(value)}">
        </div>`;
    }

    function uploadFieldHtml(field, label, value = "") {
        const id = `field-${field}`;
        return `<div class="admin-field full">
            <label for="${id}">${escapeHtml(label)}</label>
            <input id="${id}" data-content-field="${escapeHtml(field)}" value="${escapeHtml(value)}" placeholder="URL Cloudinary">
            <div class="pagebuilder-upload-row">
                <input type="file" accept="image/*" data-upload-target="${escapeHtml(field)}">
                <button class="admin-button secondary small" type="button" data-upload-button="${escapeHtml(field)}">Subir a Cloudinary</button>
            </div>
        </div>`;
    }

    function renderSpecificFields(block) {
        const root = $("#pagebuilder-specific-fields");
        if (!root || !block) return;
        const c = block.content || {};
        if (["hero_banner", "image_banner"].includes(block.type)) {
            root.innerHTML = `
                ${fieldHtml("field-title", "Título", c.title || "")}
                ${fieldHtml("field-subtitle", "Subtítulo", c.subtitle || "")}
                ${uploadFieldHtml("imageDesktop", "Imagen escritorio", c.imageDesktop || "")}
                ${uploadFieldHtml("imageMobile", "Imagen móvil", c.imageMobile || "")}
                ${fieldHtml("field-buttonText", "Texto botón", c.buttonText || "")}
                ${fieldHtml("field-buttonUrl", "URL botón", c.buttonUrl || "")}
            `;
            return;
        }
        if (block.type === "product_marquee") {
            root.innerHTML = `
                ${fieldHtml("field-title", "Título", c.title || "")}
                <div class="admin-field">
                    <label for="field-filter">Filtro</label>
                    <select id="field-filter" data-content-field="filter">
                        ${["todos", "destacados", "desde14990", "lanzamiento", "vendidos", "vistos", "Linea Alma", "Linea Memories"].map((option) => `<option value="${escapeHtml(option)}" ${String(c.filter || "") === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
                    </select>
                </div>
                ${fieldHtml("field-limit", "Límite", c.limit || 12, "number")}
            `;
            return;
        }
        if (block.type === "reviews_marquee") {
            root.innerHTML = `
                ${fieldHtml("field-title", "Título", c.title || "")}
                ${fieldHtml("field-minRating", "Evaluación mínima", c.minRating || 4, "number")}
            `;
            return;
        }
        if (block.type === "info_cards") {
            root.innerHTML = `<div class="admin-help">Edita este bloque desde el JSON de contenido. Cada tarjeta usa title, text e image.</div>`;
            return;
        }
        root.innerHTML = `<div class="admin-help">Edita las propiedades específicas desde el JSON de contenido.</div>`;
    }

    function renderProperties() {
        const form = $("#pagebuilder-block-form");
        const empty = $("#pagebuilder-empty-state");
        const block = getSelectedBlock();
        if (!block) {
            form.hidden = true;
            empty.hidden = false;
            $("#pagebuilder-selected-title").textContent = "Sin selección";
            return;
        }
        form.hidden = false;
        empty.hidden = true;
        $("#pagebuilder-selected-title").textContent = block.name || blockLabels[block.type] || block.type;
        $("#block-name").value = block.name || "";
        $("#block-type").value = block.type || "custom_html";
        $("#block-visible").value = block.isVisible === false ? "false" : "true";
        $("#block-content-json").value = stringify(block.content);
        $("#block-style-json").value = stringify(block.style);
        renderSpecificFields(block);
    }

    function renderAll() {
        renderPageSelect();
        renderPageFields();
        renderLayers();
        renderCanvas();
        renderProperties();
    }

    async function savePageMeta() {
        if (!state.page) {
            await createDefaultHome();
            return;
        }
        const payload = {
            title: $("#pagebuilder-page-title").value.trim() || "Página",
            slug: $("#pagebuilder-page-slug").value.trim() || state.page.slug,
            isPublished: $("#pagebuilder-page-published").checked
        };
        state.page = await AdminAPI.request(`/admin/pages/${encodeURIComponent(state.page.key || state.page._id)}`, {
            method: "PATCH",
            body: payload
        });
        AdminUI.toast("Página guardada.", "success");
        await loadPages();
        renderAll();
    }

    function mergeSpecificFields(content) {
        document.querySelectorAll("[data-content-field]").forEach((input) => {
            const key = input.dataset.contentField;
            if (!key) return;
            if (input.type === "number") content[key] = Number(input.value || 0);
            else content[key] = input.value;
        });
        return content;
    }

    async function saveBlock(event) {
        event.preventDefault();
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        let content;
        let style;
        try {
            content = parseJson($("#block-content-json").value, {});
            style = parseJson($("#block-style-json").value, {});
            content = mergeSpecificFields(content);
        } catch (error) {
            AdminUI.toast(error.message, "danger");
            return;
        }
        const payload = {
            name: $("#block-name").value.trim(),
            type: $("#block-type").value,
            isVisible: $("#block-visible").value === "true",
            content,
            style
        };
        const data = await AdminAPI.request(`/admin/pages/${encodeURIComponent(state.page.key || state.page._id)}/blocks/${encodeURIComponent(block._id)}`, {
            method: "PATCH",
            body: payload
        });
        state.page = data.page;
        state.page.blocks = sortBlocks(state.page.blocks || []);
        AdminUI.toast("Bloque guardado.", "success");
        renderAll();
    }

    async function addBlock() {
        if (!state.page) {
            await createDefaultHome();
        }
        const type = prompt("Tipo de bloque: hero_banner, info_cards, product_marquee, image_banner, reviews_marquee, checkout_form", "image_banner");
        if (!type) return;
        const defaults = defaultBlocks[type] || defaultBlocks.custom_html;
        const data = await AdminAPI.request(`/admin/pages/${encodeURIComponent(state.page.key || state.page._id)}/blocks`, {
            method: "POST",
            body: {
                type,
                name: defaults.name,
                position: (state.page.blocks || []).length + 1,
                content: defaults.content,
                style: defaults.style,
                isVisible: true
            }
        });
        state.page = data.page;
        state.page.blocks = sortBlocks(state.page.blocks || []);
        state.selectedBlockId = data.block?._id || state.page.blocks.at(-1)?._id || "";
        AdminUI.toast("Bloque agregado.", "success");
        renderAll();
    }

    async function deleteBlock() {
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        const ok = await AdminUI.confirmAction("¿Eliminar este bloque?", "Esta acción no se puede deshacer.");
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/pages/${encodeURIComponent(state.page.key || state.page._id)}/blocks/${encodeURIComponent(block._id)}`, {
            method: "DELETE"
        });
        state.page = data.page;
        state.page.blocks = sortBlocks(state.page.blocks || []);
        state.selectedBlockId = state.page.blocks[0]?._id || "";
        AdminUI.toast("Bloque eliminado.", "success");
        renderAll();
    }

    async function reorderByList(blocks) {
        if (!state.page) return;
        state.page = await AdminAPI.request(`/admin/pages/${encodeURIComponent(state.page.key || state.page._id)}/reorder`, {
            method: "PUT",
            body: {
                blocks: blocks.map((block, index) => ({ blockId: block._id, position: index + 1 }))
            }
        });
        state.page.blocks = sortBlocks(state.page.blocks || []);
        renderAll();
    }

    async function moveBlock(blockId, direction) {
        const blocks = sortBlocks(state.page?.blocks || []);
        const index = blocks.findIndex((block) => String(block._id) === String(blockId));
        if (index < 0) return;
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= blocks.length) return;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        await reorderByList(blocks);
    }

    async function createDefaultHome() {
        const page = await AdminAPI.request("/admin/pages", {
            method: "POST",
            body: {
                key: "home",
                title: "Inicio",
                slug: "inicio",
                isPublished: true,
                blocks: []
            }
        });
        state.page = page;
        await loadPages();
        renderAll();
        AdminUI.toast("Página Home creada.", "success");
    }

    async function uploadImage(field) {
        const input = document.querySelector(`[data-upload-target="${field}"]`);
        const urlInput = document.querySelector(`[data-content-field="${field}"]`);
        if (!input?.files?.[0]) {
            AdminUI.toast("Selecciona una imagen primero.", "warning");
            return;
        }
        const form = new FormData();
        form.append("imagenes", input.files[0]);
        form.append("nombre", `pagebuilder-${field}`);
        const data = await AdminAPI.request("/uploads/productos", {
            method: "POST",
            body: form
        });
        const url = data.urls?.[0] || data.assets?.[0]?.url || data.assets?.[0]?.secure_url || "";
        if (!url) {
            AdminUI.toast("Cloudinary no devolvió una URL válida.", "danger");
            return;
        }
        urlInput.value = url;
        AdminUI.toast("Imagen subida. Guarda el bloque para aplicar el cambio.", "success");
    }

    function bindEvents() {
        $("#pagebuilder-page-select")?.addEventListener("change", (event) => loadPage(event.target.value));
        $("#pagebuilder-refresh")?.addEventListener("click", () => loadPage(state.page?.key || "home"));
        $("#pagebuilder-save-page")?.addEventListener("click", savePageMeta);
        $("#pagebuilder-add-block")?.addEventListener("click", addBlock);
        $("#pagebuilder-block-form")?.addEventListener("submit", saveBlock);
        $("#pagebuilder-delete-block")?.addEventListener("click", deleteBlock);

        document.addEventListener("click", async (event) => {
            const select = event.target.closest("[data-select-block]");
            if (select) {
                state.selectedBlockId = select.dataset.selectBlock;
                renderAll();
                return;
            }
            const layer = event.target.closest(".pagebuilder-block-item");
            if (layer && !event.target.closest("button")) {
                state.selectedBlockId = layer.dataset.blockId;
                renderAll();
                return;
            }
            const move = event.target.closest("[data-move]");
            if (move) {
                await moveBlock(move.dataset.blockId, move.dataset.move);
                return;
            }
            const upload = event.target.closest("[data-upload-button]");
            if (upload) {
                await uploadImage(upload.dataset.uploadButton);
            }
        });

        document.addEventListener("dragstart", (event) => {
            const item = event.target.closest(".pagebuilder-block-item");
            if (!item) return;
            state.draggedBlockId = item.dataset.blockId;
            item.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
        });
        document.addEventListener("dragend", (event) => {
            event.target.closest(".pagebuilder-block-item")?.classList.remove("dragging");
            state.draggedBlockId = "";
        });
        document.addEventListener("dragover", (event) => {
            if (event.target.closest(".pagebuilder-block-list")) event.preventDefault();
        });
        document.addEventListener("drop", async (event) => {
            const target = event.target.closest(".pagebuilder-block-item");
            if (!target || !state.draggedBlockId || !state.page) return;
            event.preventDefault();
            const blocks = sortBlocks(state.page.blocks || []);
            const from = blocks.findIndex((block) => String(block._id) === String(state.draggedBlockId));
            const to = blocks.findIndex((block) => String(block._id) === String(target.dataset.blockId));
            if (from < 0 || to < 0 || from === to) return;
            const [moved] = blocks.splice(from, 1);
            blocks.splice(to, 0, moved);
            await reorderByList(blocks);
        });
    }

    async function init() {
        try {
            await loadPages();
            const initial = state.pages[0]?.key || "home";
            await loadPage(initial);
            bindEvents();
        } catch (error) {
            AdminUI.toast(error.message || "No fue posible iniciar el Page Builder.", "danger");
        }
    }

    document.addEventListener("admin:ready", init);
})();
