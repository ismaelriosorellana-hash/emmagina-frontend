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
        product_grid: "Grilla de productos",
        image_banner: "Banner de imagen",
        reviews_marquee: "Carrusel de reseñas",
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
            style: { heightDesktop: 323, heightMobile: 220, marginTop: 0, marginBottom: 24 }
        },
        info_cards: {
            name: "Tarjetas informativas",
            content: {
                title: "Explora Emmagina",
                cards: [
                    { title: "Destacados", text: "Texto", image: "", href: "catalogo.html" },
                    { title: "Más vendidos", text: "Texto", image: "", href: "catalogo.html" },
                    { title: "Más vistos", text: "Texto", image: "", href: "catalogo.html" }
                ]
            },
            style: { marginTop: 0, marginBottom: 24 }
        },
        product_marquee: {
            name: "Carrusel de productos",
            content: { title: "Productos", filter: "destacados", limit: 12 },
            style: { marginTop: 0, marginBottom: 24 }
        },
        product_grid: {
            name: "Grilla de productos",
            content: { title: "Productos", filter: "todos", limit: 12 },
            style: { marginTop: 0, marginBottom: 24 }
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
            style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 }
        },
        reviews_marquee: {
            name: "Carrusel de reseñas",
            content: { title: "Lo que dicen nuestros clientes", minRating: 4 },
            style: { marginTop: 0, marginBottom: 24 }
        },
        custom_html: {
            name: "Contenido HTML",
            content: { title: "Contenido", html: "<p>Contenido editable</p>" },
            style: { marginTop: 0, marginBottom: 24 }
        }
    };

    function $(selector) { return document.querySelector(selector); }
    function escapeHtml(value) { return AdminUI.escapeHtml(value); }

    function setStatus(message = "", type = "") {
        const status = $("#site-editor-status");
        if (!status) return;
        status.textContent = message;
        status.className = `admin-inline-status ${type}`.trim();
    }

    function sortBlocks(blocks = []) {
        return [...blocks].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    }

    function stringify(value) {
        return JSON.stringify(value || {}, null, 2);
    }

    function parseJson(text) {
        try {
            return JSON.parse(text || "{}");
        } catch {
            throw new Error("JSON inválido. Revisa comas, llaves y comillas.");
        }
    }

    function activePageKey() {
        return state.page?._id || state.page?.key || state.page?.slug || "home";
    }

    function getSelectedBlock() {
        return (state.page?.blocks || []).find((block) => String(block._id) === String(state.selectedBlockId)) || null;
    }

    function publicPath(page = state.page) {
        if (!page) return "../index.html";
        if (page.key === "home" || page.slug === "inicio") return "../index.html";
        return `../pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
    }

    function normalizePage(page) {
        const normalized = page || {};
        normalized.blocks = sortBlocks(normalized.blocks || []);
        normalized.canDelete = normalized.canDelete !== false && normalized.isSystem !== true && normalized.key !== "home";
        return normalized;
    }

    async function loadPages(preferKey = "") {
        setStatus("Cargando páginas...", "");
        const pages = await AdminAPI.request("/admin/editor-sitio/pages");
        state.pages = Array.isArray(pages) ? pages : [];
        renderPageList();
        const currentStillExists = state.page && state.pages.some((page) => [page.key, page.slug, page._id].map(String).includes(String(activePageKey())));
        if (!state.page || !currentStillExists || preferKey) {
            const first = state.pages.find((page) => page.key === preferKey || page.slug === preferKey || String(page._id) === String(preferKey)) || state.pages[0];
            await loadPage(first?.key || preferKey || "home");
        }
        setStatus("Editor conectado al backend.", "success");
    }

    async function loadPage(pageId = "home") {
        setStatus("Cargando página...", "");
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(pageId)}`));
        state.selectedBlockId = state.page.blocks[0]?._id || "";
        renderAll();
        setStatus(`Página cargada: ${state.page.title || "Página"}.`, "success");
    }

    function renderPageList() {
        const root = $("#site-editor-page-list");
        if (!root) return;
        if (!state.pages.length) {
            root.innerHTML = `<div class="admin-empty">No hay páginas todavía.</div>`;
            return;
        }
        const current = activePageKey();
        root.innerHTML = state.pages.map((page) => {
            const active = [page.key, page.slug, page._id].map(String).includes(String(current)) ? " active" : "";
            const status = page.isPublished === false ? "Borrador" : "Publicada";
            const system = page.isSystem ? " · Sistema" : "";
            return `<button class="site-editor-page-item${active}" type="button" data-page-key="${escapeHtml(page._id || page.key || page.slug)}">
                <strong>${escapeHtml(page.title || page.key || "Página")}</strong>
                <span>/${escapeHtml(page.slug || page.key || "")} · ${escapeHtml(status)}${escapeHtml(system)} · ${Number(page.blocksCount || 0)} bloques</span>
            </button>`;
        }).join("");
    }

    function renderPageFields() {
        const page = state.page;
        const empty = !page;
        $("#site-editor-page-title").value = empty ? "" : (page.title || "");
        $("#site-editor-page-slug").value = empty ? "" : (page.slug || "");
        $("#site-editor-page-navigation-label").value = empty ? "" : (page.navigationLabel || page.title || "");
        $("#site-editor-page-description").value = empty ? "" : (page.description || "");
        $("#site-editor-page-seo-title").value = empty ? "" : (page.seo?.title || "");
        $("#site-editor-page-seo-description").value = empty ? "" : (page.seo?.description || "");
        $("#site-editor-page-published").checked = !empty && page.isPublished !== false;
        $("#site-editor-page-nav").checked = !empty && page.showInNavigation === true;
        $("#site-editor-canvas-title").textContent = empty ? "Página" : page.title || "Página";
        const link = $("#site-editor-public-link");
        if (link) link.href = publicPath(page);
        const deletePageButton = $("#site-editor-delete-page");
        if (deletePageButton) deletePageButton.disabled = !page || page.canDelete === false;
    }

    function renderLayers() {
        const list = $("#site-editor-block-list");
        const blocks = sortBlocks(state.page?.blocks || []);
        if (!list) return;
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
        if (block.type === "product_marquee" || block.type === "product_grid") return `Filtro: ${content.filter || "todos"} · Límite: ${content.limit || 12}`;
        if (block.type === "info_cards") return `${Array.isArray(content.cards) ? content.cards.length : 0} tarjetas`;
        if (block.type === "reviews_marquee") return `Reseñas desde ${content.minRating || 4} estrellas`;
        if (content.subtitle) return content.subtitle;
        if (content.html) return "Contenido HTML editable";
        if (content.buttonText) return `${content.buttonText} → ${content.buttonUrl || "#"}`;
        return "Bloque editable";
    }

    function renderPreview() {
        const root = $("#site-editor-preview");
        const blocks = sortBlocks(state.page?.blocks || []);
        if (!root) return;
        if (!blocks.length) {
            root.innerHTML = `<div class="admin-empty">No hay bloques para previsualizar.</div>`;
            return;
        }
        root.innerHTML = blocks.map((block) => {
            const content = block.content || {};
            const active = String(block._id) === String(state.selectedBlockId) ? " active" : "";
            const img = content.imageDesktop || content.image || (Array.isArray(content.cards) ? content.cards.find((card) => card.image)?.image : "");
            return `<article class="pagebuilder-preview-block${active}" data-select-block="${escapeHtml(block._id)}">
                <header>
                    <div><h4>${escapeHtml(block.name || content.title || blockLabels[block.type] || block.type)}</h4><p>${escapeHtml(blockSummary(block))}</p></div>
                    <span class="admin-status-pill ${block.isVisible === false ? "danger" : "success"}">${block.isVisible === false ? "Oculto" : "Visible"}</span>
                </header>
                ${img ? `<img class="pagebuilder-preview-image" src="${escapeHtml(img)}" alt="Vista previa">` : ""}
            </article>`;
        }).join("");
    }

    function fieldHtml(field, label, value = "", type = "text") {
        return `<div class="admin-field">
            <label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label>
            <input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}">
        </div>`;
    }

    function textareaFieldHtml(field, label, value = "", rows = 4) {
        return `<div class="admin-field full">
            <label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label>
            <textarea id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" rows="${Number(rows) || 4}">${escapeHtml(value)}</textarea>
        </div>`;
    }

    function uploadFieldHtml(field, label, value = "") {
        return `<div class="admin-field full">
            <label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label>
            <input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" value="${escapeHtml(value)}" placeholder="URL Cloudinary">
            <div class="pagebuilder-upload-row">
                <input type="file" accept="image/*" data-upload-target="${escapeHtml(field)}">
                <button class="admin-button secondary small" type="button" data-upload-button="${escapeHtml(field)}">Subir a Cloudinary</button>
            </div>
        </div>`;
    }

    function renderSpecificFields(block) {
        const root = $("#site-editor-specific-fields");
        if (!root || !block) return;
        const content = block.content || {};
        if (["hero_banner", "image_banner"].includes(block.type)) {
            root.innerHTML = `
                ${fieldHtml("title", "Título", content.title || "")}
                ${fieldHtml("subtitle", "Subtítulo", content.subtitle || "")}
                ${uploadFieldHtml("imageDesktop", "Imagen escritorio", content.imageDesktop || "")}
                ${uploadFieldHtml("imageMobile", "Imagen móvil", content.imageMobile || "")}
                ${fieldHtml("buttonText", "Texto botón", content.buttonText || "")}
                ${fieldHtml("buttonUrl", "URL botón", content.buttonUrl || "")}
            `;
            return;
        }
        if (["product_marquee", "product_grid"].includes(block.type)) {
            root.innerHTML = `
                ${fieldHtml("title", "Título", content.title || "")}
                <div class="admin-field">
                    <label for="field-filter">Filtro</label>
                    <select id="field-filter" data-content-field="filter">
                        ${["todos", "destacados", "desde14990", "lanzamiento", "vendidos", "vistos", "Linea Alma", "Linea Memories"].map((option) => `<option value="${escapeHtml(option)}" ${String(content.filter || "") === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
                    </select>
                </div>
                ${fieldHtml("limit", "Límite", content.limit || 12, "number")}
            `;
            return;
        }
        if (block.type === "reviews_marquee") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${fieldHtml("minRating", "Evaluación mínima", content.minRating || 4, "number")}`;
            return;
        }
        if (block.type === "custom_html") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${textareaFieldHtml("html", "HTML controlado", content.html || "", 8)}`;
            return;
        }
        if (block.type === "info_cards") {
            root.innerHTML = `<div class="admin-help">Por ahora este bloque se edita en el JSON de contenido. Usa cards con title, text, image y href.</div>`;
            return;
        }
        root.innerHTML = `<div class="admin-help">Edita las propiedades desde el JSON de contenido.</div>`;
    }

    function renderProperties() {
        const form = $("#site-editor-block-form");
        const empty = $("#site-editor-empty-state");
        const block = getSelectedBlock();
        if (!form || !empty) return;
        if (!block) {
            form.hidden = true;
            empty.hidden = false;
            $("#site-editor-selected-title").textContent = "Sin selección";
            return;
        }
        form.hidden = false;
        empty.hidden = true;
        $("#site-editor-selected-title").textContent = block.name || blockLabels[block.type] || block.type;
        $("#block-name").value = block.name || "";
        $("#block-type").value = block.type || "custom_html";
        $("#block-visible").value = block.isVisible === false ? "false" : "true";
        $("#block-content-json").value = stringify(block.content);
        $("#block-style-json").value = stringify(block.style);
        renderSpecificFields(block);
        document.querySelectorAll("[data-style-field]").forEach((input) => {
            const key = input.dataset.styleField;
            input.value = block.style?.[key] ?? "";
        });
    }

    function renderAll() {
        renderPageList();
        renderPageFields();
        renderLayers();
        renderPreview();
        renderProperties();
    }

    async function savePage() {
        if (!state.page) {
            AdminUI.toast("Primero carga o crea una página.", "warning");
            return;
        }
        const button = $("#site-editor-save-page");
        const currentKey = activePageKey();
        const payload = {
            title: $("#site-editor-page-title").value.trim() || "Página",
            slug: $("#site-editor-page-slug").value.trim(),
            description: $("#site-editor-page-description").value.trim(),
            isPublished: $("#site-editor-page-published").checked,
            showInNavigation: $("#site-editor-page-nav").checked,
            navigationLabel: $("#site-editor-page-navigation-label").value.trim(),
            seo: {
                title: $("#site-editor-page-seo-title").value.trim(),
                description: $("#site-editor-page-seo-description").value.trim()
            }
        };
        try {
            if (button) button.disabled = true;
            setStatus("Guardando página...", "");
            const saved = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(currentKey)}`, { method: "PATCH", body: payload });
            state.page = normalizePage(saved);
            await loadPages(state.page._id || state.page.key || state.page.slug || currentKey);
            AdminUI.toast("Página guardada.", "success");
            setStatus("Página guardada correctamente. Los cambios visibles de la Home se hacen desde cada bloque.", "success");
            renderAll();
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function createPage() {
        const title = prompt("Nombre de la nueva página", "Nueva página");
        if (!title) return;
        const page = await AdminAPI.request("/admin/editor-sitio/pages", {
            method: "POST",
            body: {
                title,
                slug: "",
                isPublished: false,
                pageType: "custom",
                showInNavigation: false
            }
        });
        state.page = normalizePage(page);
        state.selectedBlockId = state.page.blocks[0]?._id || "";
        await loadPages(state.page._id || state.page.key);
        AdminUI.toast("Página creada como borrador.", "success");
        renderAll();
    }

    async function deletePage() {
        if (!state.page || state.page.canDelete === false) {
            AdminUI.toast("Esta página no se puede eliminar.", "warning");
            return;
        }
        const ok = await AdminUI.confirmAction(`¿Eliminar la página "${state.page.title}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}`, { method: "DELETE" });
        state.page = null;
        state.selectedBlockId = "";
        await loadPages("home");
        AdminUI.toast("Página eliminada.", "success");
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

    function mergeStyleFields(style) {
        document.querySelectorAll("[data-style-field]").forEach((input) => {
            const key = input.dataset.styleField;
            if (!key) return;
            if (String(input.value).trim() === "") return;
            style[key] = Number(input.value || 0);
        });
        return style;
    }

    async function saveBlock(event) {
        event.preventDefault();
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        let content;
        let style;
        try {
            content = mergeSpecificFields(parseJson($("#block-content-json").value));
            style = mergeStyleFields(parseJson($("#block-style-json").value));
        } catch (error) {
            AdminUI.toast(error.message, "danger");
            return;
        }
        const payload = {
            name: $("#block-name").value.trim() || $("#block-type").value,
            type: $("#block-type").value,
            isVisible: $("#block-visible").value === "true",
            content,
            style
        };
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(block._id)}`, { method: "PATCH", body: payload });
        state.page = normalizePage(data.page);
        state.selectedBlockId = data.block?._id || block._id;
        AdminUI.toast("Bloque guardado.", "success");
        renderAll();
    }

    async function addBlock() {
        if (!state.page) return;
        const type = prompt("Tipo de bloque: hero_banner, info_cards, product_marquee, product_grid, image_banner, reviews_marquee, custom_html", "image_banner");
        if (!type) return;
        const defaults = defaultBlocks[type] || defaultBlocks.custom_html;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks`, {
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
        state.page = normalizePage(data.page);
        state.selectedBlockId = data.block?._id || state.page.blocks.at(-1)?._id || "";
        AdminUI.toast("Bloque agregado.", "success");
        renderAll();
    }

    async function deleteBlock() {
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        const ok = await AdminUI.confirmAction("¿Eliminar este bloque? Esta acción no se puede deshacer.");
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(block._id)}`, { method: "DELETE" });
        state.page = normalizePage(data.page);
        state.selectedBlockId = state.page.blocks[0]?._id || "";
        AdminUI.toast("Bloque eliminado.", "success");
        renderAll();
    }

    async function reorderByList(blocks) {
        if (!state.page) return;
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/reorder`, {
            method: "PUT",
            body: { blocks: blocks.map((block, index) => ({ blockId: block._id, position: index + 1 })) }
        }));
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

    async function uploadImage(field) {
        const input = document.querySelector(`[data-upload-target="${field}"]`);
        const urlInput = document.querySelector(`[data-content-field="${field}"]`);
        if (!input?.files?.[0]) {
            AdminUI.toast("Selecciona una imagen primero.", "warning");
            return;
        }
        const form = new FormData();
        form.append("imagenes", input.files[0]);
        form.append("nombre", `editor-sitio-${field}`);
        const data = await AdminAPI.request("/uploads/productos", { method: "POST", body: form });
        const url = data.urls?.[0] || data.assets?.[0]?.url || data.assets?.[0]?.secure_url || "";
        if (!url) {
            AdminUI.toast("Cloudinary no devolvió una URL válida.", "danger");
            return;
        }
        urlInput.value = url;
        AdminUI.toast("Imagen subida. Guarda el bloque para aplicar el cambio.", "success");
    }


    async function repairEditor() {
        const button = $("#site-editor-repair");
        try {
            if (button) button.disabled = true;
            setStatus("Reparando conexión del Editor del Sitio...", "");
            const result = await AdminAPI.request("/admin/editor-sitio/_repair", { method: "POST", body: {} });
            state.page = normalizePage(result.page || result);
            state.selectedBlockId = state.page.blocks[0]?._id || "";
            await loadPages(state.page._id || "home");
            AdminUI.toast("Editor del Sitio reparado y sincronizado.", "success");
            setStatus("Editor del Sitio reparado y conectado.", "success");
            renderAll();
        } finally {
            if (button) button.disabled = false;
        }
    }

    function bindEvents() {
        $("#site-editor-refresh")?.addEventListener("click", () => loadPages(activePageKey()).catch(showError));
        $("#site-editor-repair")?.addEventListener("click", () => repairEditor().catch(showError));
        $("#site-editor-save-page")?.addEventListener("click", () => savePage().catch(showError));
        $("#site-editor-new-page")?.addEventListener("click", () => createPage().catch(showError));
        $("#site-editor-delete-page")?.addEventListener("click", () => deletePage().catch(showError));
        $("#site-editor-add-block")?.addEventListener("click", () => addBlock().catch(showError));
        $("#site-editor-block-form")?.addEventListener("submit", (event) => saveBlock(event).catch(showError));
        $("#site-editor-delete-block")?.addEventListener("click", () => deleteBlock().catch(showError));

        document.addEventListener("click", async (event) => {
            const pageItem = event.target.closest("[data-page-key]");
            if (pageItem) {
                await loadPage(pageItem.dataset.pageKey).catch(showError);
                return;
            }
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
                await moveBlock(move.dataset.blockId, move.dataset.move).catch(showError);
                return;
            }
            const upload = event.target.closest("[data-upload-button]");
            if (upload) {
                await uploadImage(upload.dataset.uploadButton).catch(showError);
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
            await reorderByList(blocks).catch(showError);
        });
    }

    function showError(error) {
        console.error(error);
        const status = error?.status ? `Error ${error.status}: ` : "";
        let detail = "";
        if (error?.details?.requestId) detail = ` · ID: ${error.details.requestId}`;
        const message = `${status}${error.message || "No fue posible completar la acción."}${detail}`;
        setStatus(message, "danger");
        AdminUI.toast(message, "danger");
    }

    async function init() {
        bindEvents();
        try {
            await loadPages("home");
        } catch (error) {
            state.pages = [];
            state.page = null;
            renderAll();
            showError(error);
            setStatus("No se pudo cargar el Editor del Sitio desde el backend. Esta versión usa /api/admin/editor-sitio; revisa que el backend v2.2 esté desplegado y presiona Reparar conexión.", "danger");
        }
    }

    document.addEventListener("admin:ready", init);
})();
