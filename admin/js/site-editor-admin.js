"use strict";

(function () {
    const state = {
        pages: [],
        page: null,
        selectedSectionId: "",
        selectedBlockId: "",
        draggedBlockId: ""
    };

    const sectionTypes = {
        hero_section: { label: "Sección Hero", layout: "hero_with_sidebar" },
        content_section: { label: "Sección de contenido", layout: "stack" },
        products_section: { label: "Sección de productos", layout: "stack" },
        brand_section: { label: "Líneas de marca", layout: "stack" },
        reviews_section: { label: "Sección de reseñas", layout: "stack" },
        generic_section: { label: "Sección genérica", layout: "stack" }
    };

    const blockTypes = {
        category_sidebar: {
            label: "Lista lateral de categorías",
            name: "Lista lateral de categorías",
            content: {
                heading: "Categorías",
                source: "manual",
                categories: [
                    { label: "Accesorios", href: "catalogo.html?categoria=Accesorios" },
                    { label: "Coleccionables", href: "catalogo.html?categoria=Coleccionables" },
                    { label: "Decoración", href: "catalogo.html?categoria=Decoraci%C3%B3n" },
                    { label: "Línea Memories", href: "catalogo.html?categoria=Linea%20Memories" },
                    { label: "Línea Alma", href: "catalogo.html?categoria=Linea%20Alma" },
                    { label: "Todos", href: "catalogo.html" }
                ],
                showViewAll: true,
                viewAllText: "Ver todas",
                viewAllUrl: "catalogo.html"
            },
            style: { desktopVisible: true, mobileVisible: false }
        },
        category_grid: {
            label: "Grilla de categorías",
            name: "Grilla de categorías",
            content: { title: "Categorías", categories: [{ label: "Todos", href: "catalogo.html", image: "" }] },
            style: { marginTop: 0, marginBottom: 24 }
        },
        hero_banner: {
            label: "Hero / Banner principal",
            name: "Hero principal",
            content: { title: "Emmagina", subtitle: "Productos impresos en 3D para regalar, decorar y crear recuerdos.", imageDesktop: "", imageMobile: "", buttonText: "Comprar ahora", buttonUrl: "catalogo.html" },
            style: { heightDesktop: 323, heightMobile: 220, marginTop: 0, marginBottom: 24 }
        },
        info_cards: {
            label: "Tarjetas informativas",
            name: "Tarjetas informativas",
            content: {
                title: "Explora Emmagina",
                cards: [
                    { title: "Destacados", text: "Selección especial de productos", image: "", href: "catalogo.html?grupo=destacados" },
                    { title: "Más vendidos", text: "Lo favorito de nuestros clientes", image: "", href: "catalogo.html?grupo=vendidos" },
                    { title: "Más vistos", text: "Lo más explorado de la tienda", image: "", href: "catalogo.html?grupo=vistos" }
                ]
            },
            style: { marginTop: 0, marginBottom: 24 }
        },
        product_marquee: { label: "Carrusel de productos", name: "Carrusel de productos", content: { title: "Productos", filter: "destacados", limit: 12 }, style: { marginTop: 0, marginBottom: 24 } },
        product_grid: { label: "Grilla de productos", name: "Grilla de productos", content: { title: "Productos", filter: "todos", limit: 12 }, style: { marginTop: 0, marginBottom: 24 } },
        image_banner: { label: "Banner de imagen", name: "Banner de imagen", content: { title: "Línea especial", imageDesktop: "", imageMobile: "", buttonText: "Pedir el mío", buttonUrl: "pedido-personalizado.html" }, style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 } },
        reviews_marquee: { label: "Carrusel de reseñas", name: "Carrusel de reseñas", content: { title: "Lo que dicen nuestros clientes", minRating: 4, hideWhenEmpty: true }, style: { marginTop: 0, marginBottom: 24 } },
        text_block: { label: "Texto simple", name: "Texto simple", content: { title: "Título", text: "Escribe el contenido de este bloque." }, style: { marginTop: 0, marginBottom: 24 } },
        faq_block: { label: "Preguntas frecuentes", name: "Preguntas frecuentes", content: { title: "Preguntas frecuentes", items: [{ question: "Pregunta", answer: "Respuesta" }] }, style: { marginTop: 0, marginBottom: 24 } },
        contact_block: { label: "Formulario de contacto", name: "Formulario de contacto", content: { title: "Contáctanos", text: "Escríbenos y responderemos pronto." }, style: { marginTop: 0, marginBottom: 24 } },
        cart_summary: { label: "Resumen del carrito", name: "Resumen del carrito", content: { title: "Resumen" }, style: { marginTop: 0, marginBottom: 24 } },
        checkout_form: { label: "Formulario de compra", name: "Formulario de compra", content: { title: "Finalizar compra" }, style: { marginTop: 0, marginBottom: 24 } },
        spacer: { label: "Separador / espacio", name: "Separador", content: { height: 32 }, style: { heightDesktop: 32, heightMobile: 24, marginTop: 0, marginBottom: 0 } },
        custom_html: { label: "Bloque HTML controlado", name: "Contenido HTML", content: { title: "Contenido", html: "<p>Contenido editable</p>" }, style: { marginTop: 0, marginBottom: 24 } }
    };

    function $(selector) { return document.querySelector(selector); }
    function escapeHtml(value) { return AdminUI.escapeHtml(value); }
    function clone(value) { return JSON.parse(JSON.stringify(value || {})); }

    function setStatus(message = "", type = "") {
        const status = $("#site-editor-status");
        if (!status) return;
        status.textContent = message;
        status.className = `admin-inline-status ${type}`.trim();
    }

    function sortByPosition(items = []) {
        return [...items].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    }

    function stringify(value) { return JSON.stringify(value || {}, null, 2); }

    function parseJson(text) {
        try { return JSON.parse(text || "{}"); }
        catch { throw new Error("JSON inválido. Revisa comas, llaves y comillas."); }
    }

    function activePageKey() { return state.page?._id || state.page?.key || state.page?.slug || "home"; }

    function normalizeType(value, fallback = "custom_html") {
        const raw = String(value || fallback).trim();
        const key = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-+|-+$/g, "");
        const aliases = {
            "category-sidebar": "category_sidebar", "category_sidebar": "category_sidebar", categorias: "category_sidebar",
            "category-grid": "category_grid", "category_grid": "category_grid",
            "hero-banner": "hero_banner", "hero_banner": "hero_banner", hero: "hero_banner",
            "info-cards": "info_cards", "info_cards": "info_cards",
            "product-marquee": "product_marquee", "product_marquee": "product_marquee",
            "product-grid": "product_grid", "product_grid": "product_grid",
            "image-banner": "image_banner", "image_banner": "image_banner",
            "reviews-marquee": "reviews_marquee", "reviews_marquee": "reviews_marquee",
            "text-block": "text_block", "text_block": "text_block",
            "faq-block": "faq_block", "faq_block": "faq_block",
            "contact-block": "contact_block", "contact_block": "contact_block",
            "cart-summary": "cart_summary", "cart_summary": "cart_summary",
            "checkout-form": "checkout_form", "checkout_form": "checkout_form",
            spacer: "spacer", separador: "spacer",
            "custom-html": "custom_html", "custom_html": "custom_html", "html-block": "html_block", "html_block": "html_block"
        };
        return aliases[key] || aliases[raw] || key.replace(/-/g, "_") || fallback;
    }

    function flattenBlocks(page = state.page) {
        if (Array.isArray(page?.sections) && page.sections.length) {
            return sortByPosition(page.sections).flatMap((section) => sortByPosition(section.blocks || []).map((block) => ({ ...block, sectionId: section._id || section.id, sectionName: section.name, sectionType: section.type })));
        }
        return sortByPosition(page?.blocks || []);
    }

    function normalizePage(page) {
        const normalized = page || {};
        normalized.sections = sortByPosition(normalized.sections || []);
        normalized.sections.forEach((section) => { section.blocks = sortByPosition(section.blocks || []); });
        normalized.blocks = flattenBlocks(normalized);
        normalized.canDelete = normalized.canDelete !== false && normalized.isSystem !== true && normalized.key !== "home";
        return normalized;
    }

    function getSelectedSection() {
        return (state.page?.sections || []).find((section) => String(section._id || section.id) === String(state.selectedSectionId)) || state.page?.sections?.[0] || null;
    }

    function getSelectedBlock() {
        return flattenBlocks().find((block) => String(block._id || block.id) === String(state.selectedBlockId)) || null;
    }

    function publicPath(page = state.page) {
        if (!page) return "../index.html";
        if (page.key === "home" || page.slug === "inicio") return "../index.html";
        return `../pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
    }

    function blockLabel(type) { return blockTypes[normalizeType(type)]?.label || type || "Bloque"; }
    function sectionLabel(type) { return sectionTypes[normalizeType(type, "generic_section")]?.label || type || "Sección"; }

    async function loadPages(preferKey = "") {
        setStatus("Cargando páginas...", "");
        const pages = await AdminAPI.request("/admin/editor-sitio/pages");
        state.pages = Array.isArray(pages) ? pages : [];
        renderPageList();
        const currentStillExists = state.page && state.pages.some((page) => [page.key, page.slug, page._id].map(String).includes(String(activePageKey())));
        if (!state.page || !currentStillExists || preferKey) {
            const first = state.pages.find((page) => page.key === preferKey || page.slug === preferKey || String(page._id) === String(preferKey)) || state.pages[0];
            await loadPage(first?._id || first?.key || preferKey || "home");
        }
        setStatus("Editor conectado al backend.", "success");
    }

    async function loadPage(pageId = "home") {
        setStatus("Cargando página...", "");
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(pageId)}`));
        state.selectedSectionId = state.page.sections[0]?._id || "";
        state.selectedBlockId = state.page.sections[0]?.blocks?.[0]?._id || state.page.blocks[0]?._id || "";
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
                <span>/${escapeHtml(page.slug || page.key || "")} · ${escapeHtml(status)}${escapeHtml(system)} · ${Number(page.sectionsCount || 0)} secciones · ${Number(page.blocksCount || 0)} bloques</span>
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
        const sections = sortByPosition(state.page?.sections || []);
        if (!list) return;
        if (!sections.length) {
            list.innerHTML = `<div class="admin-empty">Esta página todavía no tiene secciones.</div>`;
            return;
        }
        list.innerHTML = sections.map((section, sectionIndex) => {
            const sectionId = String(section._id || section.id);
            const activeSection = sectionId === String(state.selectedSectionId) ? " active" : "";
            const hiddenSection = section.isVisible === false ? " · Oculta" : "";
            const blocks = sortByPosition(section.blocks || []);
            return `<section class="site-editor-layer-section${activeSection}" data-section-id="${escapeHtml(sectionId)}">
                <header class="site-editor-layer-section-head" data-select-section="${escapeHtml(sectionId)}">
                    <div><strong>${sectionIndex + 1}. ${escapeHtml(section.name || sectionLabel(section.type))}</strong><span>${escapeHtml(sectionLabel(section.type))}${hiddenSection} · ${blocks.length} bloques</span></div>
                    <div class="pagebuilder-block-actions">
                        <button class="pagebuilder-mini-button" type="button" data-section-move="up" data-section-id="${escapeHtml(sectionId)}">↑</button>
                        <button class="pagebuilder-mini-button" type="button" data-section-move="down" data-section-id="${escapeHtml(sectionId)}">↓</button>
                    </div>
                </header>
                <div class="site-editor-layer-blocks">
                    ${blocks.map((block, blockIndex) => {
                        const id = String(block._id || block.id);
                        const active = id === String(state.selectedBlockId) ? " active" : "";
                        const hidden = block.isVisible === false ? " · Oculto" : "";
                        return `<article class="pagebuilder-block-item${active}" draggable="true" data-block-id="${escapeHtml(id)}" data-section-id="${escapeHtml(sectionId)}">
                            <div class="pagebuilder-block-main"><strong>${escapeHtml(block.name || blockLabel(block.type))}</strong><span>${blockIndex + 1}. ${escapeHtml(blockLabel(block.type))}${hidden}</span></div>
                            <div class="pagebuilder-block-actions">
                                <button class="pagebuilder-mini-button" type="button" data-move="up" data-block-id="${escapeHtml(id)}">↑</button>
                                <button class="pagebuilder-mini-button" type="button" data-move="down" data-block-id="${escapeHtml(id)}">↓</button>
                            </div>
                        </article>`;
                    }).join("") || `<div class="admin-empty small">Sin bloques.</div>`}
                    <button class="admin-button secondary small site-editor-add-block-to-section" type="button" data-add-block-section="${escapeHtml(sectionId)}"><i class="fa-solid fa-plus"></i> Agregar bloque aquí</button>
                </div>
            </section>`;
        }).join("");
    }

    function blockSummary(block) {
        const content = block.content || {};
        const type = normalizeType(block.type);
        if (type === "category_sidebar" || type === "category_grid") return `${Array.isArray(content.categories) ? content.categories.length : 0} categorías`;
        if (type === "product_marquee" || type === "product_grid") return `Filtro: ${content.filter || "todos"} · Límite: ${content.limit || 12}`;
        if (type === "info_cards") return `${Array.isArray(content.cards) ? content.cards.length : 0} tarjetas`;
        if (type === "reviews_marquee") return `Reseñas desde ${content.minRating || 4} estrellas`;
        if (content.subtitle) return content.subtitle;
        if (content.html) return "Contenido HTML editable";
        if (content.text) return content.text;
        if (content.buttonText) return `${content.buttonText} → ${content.buttonUrl || "#"}`;
        return "Bloque editable";
    }

    function renderPreview() {
        const root = $("#site-editor-preview");
        const sections = sortByPosition(state.page?.sections || []);
        if (!root) return;
        if (!sections.length) {
            root.innerHTML = `<div class="admin-empty">No hay secciones para previsualizar.</div>`;
            return;
        }
        root.innerHTML = sections.map((section) => {
            const sectionId = String(section._id || section.id);
            const activeSection = sectionId === String(state.selectedSectionId) ? " active" : "";
            return `<section class="pagebuilder-preview-section${activeSection}" data-select-section="${escapeHtml(sectionId)}">
                <header><div><h4>${escapeHtml(section.name || sectionLabel(section.type))}</h4><p>${escapeHtml(sectionLabel(section.type))} · ${sortByPosition(section.blocks || []).length} bloques</p></div><span class="admin-status-pill ${section.isVisible === false ? "danger" : "success"}">${section.isVisible === false ? "Oculta" : "Visible"}</span></header>
                <div class="pagebuilder-preview-section-blocks">
                    ${sortByPosition(section.blocks || []).map((block) => {
                        const content = block.content || {};
                        const active = String(block._id || block.id) === String(state.selectedBlockId) ? " active" : "";
                        const img = content.imageDesktop || content.image || (Array.isArray(content.cards) ? content.cards.find((card) => card.image)?.image : "");
                        return `<article class="pagebuilder-preview-block${active}" data-select-block="${escapeHtml(block._id || block.id)}"><header><div><h4>${escapeHtml(block.name || content.title || blockLabel(block.type))}</h4><p>${escapeHtml(blockSummary(block))}</p></div><span class="admin-status-pill ${block.isVisible === false ? "danger" : "success"}">${block.isVisible === false ? "Oculto" : "Visible"}</span></header>${img ? `<img class="pagebuilder-preview-image" src="${escapeHtml(img)}" alt="Vista previa">` : ""}</article>`;
                    }).join("") || `<div class="admin-empty small">Sin bloques.</div>`}
                </div>
            </section>`;
        }).join("");
    }

    function fieldHtml(field, label, value = "", type = "text") {
        return `<div class="admin-field"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"></div>`;
    }

    function textareaFieldHtml(field, label, value = "", rows = 4) {
        return `<div class="admin-field full"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><textarea id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" rows="${Number(rows) || 4}">${escapeHtml(value)}</textarea></div>`;
    }

    function uploadFieldHtml(field, label, value = "") {
        return `<div class="admin-field full"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" value="${escapeHtml(value)}" placeholder="URL Cloudinary"><div class="pagebuilder-upload-row"><input type="file" accept="image/*" data-upload-target="${escapeHtml(field)}"><button class="admin-button secondary small" type="button" data-upload-button="${escapeHtml(field)}">Subir a Cloudinary</button></div></div>`;
    }

    function categoriesTextareaValue(content) {
        const list = Array.isArray(content.categories) ? content.categories : [];
        return list.map((item) => typeof item === "string" ? item : `${item.label || item.nombre || "Categoría"}|${item.href || item.url || "catalogo.html"}|${item.image || ""}`).join("\n");
    }

    function parseCategoriesText(text) {
        return String(text || "").split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
            const parts = line.split("|").map((part) => part.trim());
            return { label: parts[0] || "Categoría", href: parts[1] || `catalogo.html?categoria=${encodeURIComponent(parts[0] || "")}`, image: parts[2] || "" };
        });
    }

    function renderSpecificFields(block) {
        const root = $("#site-editor-specific-fields");
        if (!root || !block) return;
        const content = block.content || {};
        const type = normalizeType(block.type);
        if (type === "category_sidebar" || type === "category_grid") {
            root.innerHTML = `${fieldHtml("heading", "Título del bloque", content.heading || content.title || "Categorías")}${textareaFieldHtml("categoriesText", "Categorías: una por línea con formato Nombre|URL|Imagen opcional", categoriesTextareaValue(content), 8)}${fieldHtml("viewAllText", "Texto botón ver todas", content.viewAllText || "Ver todas")}${fieldHtml("viewAllUrl", "URL botón ver todas", content.viewAllUrl || "catalogo.html")}`;
            return;
        }
        if (["hero_banner", "image_banner"].includes(type)) {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${fieldHtml("subtitle", "Subtítulo", content.subtitle || "")}${uploadFieldHtml("imageDesktop", "Imagen escritorio", content.imageDesktop || "")}${uploadFieldHtml("imageMobile", "Imagen móvil", content.imageMobile || "")}${fieldHtml("buttonText", "Texto botón", content.buttonText || "")}${fieldHtml("buttonUrl", "URL botón", content.buttonUrl || "")}`;
            return;
        }
        if (["product_marquee", "product_grid"].includes(type)) {
            const filters = ["todos", "destacados", "desde14990", "lanzamiento", "vendidos", "vistos", "Linea Alma", "Linea Memories"];
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}<div class="admin-field"><label for="field-filter">Filtro</label><select id="field-filter" data-content-field="filter">${filters.map((option) => `<option value="${escapeHtml(option)}" ${String(content.filter || "") === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>${fieldHtml("limit", "Límite", content.limit || 12, "number")}`;
            return;
        }
        if (type === "reviews_marquee") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${fieldHtml("minRating", "Evaluación mínima", content.minRating || 4, "number")}`;
            return;
        }
        if (type === "text_block") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${textareaFieldHtml("text", "Texto", content.text || "", 6)}`;
            return;
        }
        if (type === "faq_block") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "Preguntas frecuentes")}<div class="admin-help">Edita las preguntas desde el JSON de contenido usando items: [{question, answer}].</div>`;
            return;
        }
        if (type === "custom_html" || type === "html_block") {
            root.innerHTML = `${fieldHtml("title", "Título", content.title || "")}${textareaFieldHtml("html", "HTML controlado", content.html || "", 8)}`;
            return;
        }
        root.innerHTML = `<div class="admin-help">Edita las propiedades desde el JSON de contenido.</div>`;
    }

    function renderProperties() {
        const form = $("#site-editor-block-form");
        const empty = $("#site-editor-empty-state");
        const block = getSelectedBlock();
        const section = getSelectedSection();
        if (!form || !empty) return;
        renderSectionMiniEditor(section);
        if (!block) {
            form.hidden = true;
            empty.hidden = false;
            $("#site-editor-selected-title").textContent = section ? `Sección: ${section.name}` : "Sin selección";
            return;
        }
        form.hidden = false;
        empty.hidden = true;
        $("#site-editor-selected-title").textContent = block.name || blockLabel(block.type);
        $("#block-name").value = block.name || "";
        $("#block-type").value = normalizeType(block.type);
        $("#block-visible").value = block.isVisible === false ? "false" : "true";
        $("#block-content-json").value = stringify(block.content);
        $("#block-style-json").value = stringify(block.style);
        renderSpecificFields(block);
        document.querySelectorAll("[data-style-field]").forEach((input) => {
            const key = input.dataset.styleField;
            input.value = block.style?.[key] ?? "";
        });
    }

    function renderSectionMiniEditor(section) {
        const root = $("#site-editor-section-panel");
        if (!root) return;
        if (!section) {
            root.innerHTML = `<div class="admin-empty small">Selecciona una sección.</div>`;
            return;
        }
        root.innerHTML = `<div class="site-editor-style-panel"><p class="admin-section-kicker">Sección seleccionada</p><div class="admin-form-grid one"><div class="admin-field"><label for="section-name">Nombre de sección</label><input id="section-name" value="${escapeHtml(section.name || "")}"></div><div class="admin-field"><label for="section-type">Tipo de sección</label><select id="section-type">${Object.entries(sectionTypes).map(([value, meta]) => `<option value="${value}" ${normalizeType(section.type, "generic_section") === value ? "selected" : ""}>${escapeHtml(meta.label)}</option>`).join("")}</select></div><div class="admin-field"><label for="section-visible">Visibilidad</label><select id="section-visible"><option value="true" ${section.isVisible !== false ? "selected" : ""}>Visible</option><option value="false" ${section.isVisible === false ? "selected" : ""}>Oculta</option></select></div><div class="admin-field"><label for="section-layout">Layout</label><select id="section-layout"><option value="stack" ${section.layout === "stack" ? "selected" : ""}>Apilado</option><option value="hero_with_sidebar" ${section.layout === "hero_with_sidebar" ? "selected" : ""}>Hero con lateral</option><option value="grid" ${section.layout === "grid" ? "selected" : ""}>Grilla</option></select></div></div><div class="admin-actions-row"><button class="admin-button secondary small" id="site-editor-save-section" type="button">Guardar sección</button><button class="admin-button danger small" id="site-editor-delete-section" type="button">Eliminar sección</button></div></div>`;
    }

    function renderAll() {
        renderPageList();
        renderPageFields();
        renderLayers();
        renderPreview();
        renderProperties();
    }

    async function savePage() {
        if (!state.page) return AdminUI.toast("Primero carga o crea una página.", "warning");
        const button = $("#site-editor-save-page");
        const currentKey = activePageKey();
        const payload = { title: $("#site-editor-page-title").value.trim() || "Página", slug: $("#site-editor-page-slug").value.trim(), description: $("#site-editor-page-description").value.trim(), isPublished: $("#site-editor-page-published").checked, showInNavigation: $("#site-editor-page-nav").checked, navigationLabel: $("#site-editor-page-navigation-label").value.trim(), seo: { title: $("#site-editor-page-seo-title").value.trim(), description: $("#site-editor-page-seo-description").value.trim() } };
        try {
            if (button) button.disabled = true;
            setStatus("Guardando página...", "");
            state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(currentKey)}`, { method: "PATCH", body: payload }));
            await loadPages(state.page._id || state.page.key || state.page.slug || currentKey);
            AdminUI.toast("Página guardada.", "success");
            setStatus("Página guardada correctamente.", "success");
        } finally { if (button) button.disabled = false; }
    }

    async function createPage() {
        const title = prompt("Nombre de la nueva página", "Nueva página");
        if (!title) return;
        state.page = normalizePage(await AdminAPI.request("/admin/editor-sitio/pages", { method: "POST", body: { title, slug: "", isPublished: false, pageType: "custom", showInNavigation: false } }));
        state.selectedSectionId = state.page.sections[0]?._id || "";
        state.selectedBlockId = state.page.sections[0]?.blocks?.[0]?._id || "";
        await loadPages(state.page._id || state.page.key);
        AdminUI.toast("Página creada como borrador.", "success");
    }

    async function deletePage() {
        if (!state.page || state.page.canDelete === false) return AdminUI.toast("Esta página no se puede eliminar.", "warning");
        const ok = await AdminUI.confirmAction(`¿Eliminar la página "${state.page.title}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}`, { method: "DELETE" });
        state.page = null;
        state.selectedSectionId = "";
        state.selectedBlockId = "";
        await loadPages("home");
        AdminUI.toast("Página eliminada.", "success");
    }

    function mergeSpecificFields(content) {
        document.querySelectorAll("[data-content-field]").forEach((input) => {
            const key = input.dataset.contentField;
            if (!key) return;
            if (key === "categoriesText") content.categories = parseCategoriesText(input.value);
            else if (input.type === "number") content[key] = Number(input.value || 0);
            else content[key] = input.value;
        });
        delete content.categoriesText;
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
        } catch (error) { AdminUI.toast(error.message, "danger"); return; }
        const payload = { name: $("#block-name").value.trim() || blockLabel($("#block-type").value), type: normalizeType($("#block-type").value), isVisible: $("#block-visible").value === "true", sectionId: block.sectionId || state.selectedSectionId, content, style };
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(block._id || block.id)}`, { method: "PATCH", body: payload });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || state.selectedSectionId;
        state.selectedBlockId = data.block?._id || block._id || block.id;
        AdminUI.toast("Bloque guardado.", "success");
        renderAll();
    }

    async function addSection() {
        if (!state.page) return;
        const select = prompt("Tipo de sección:\n1 = Hero\n2 = Contenido\n3 = Productos\n4 = Líneas de marca\n5 = Reseñas\n6 = Genérica", "3");
        if (!select) return;
        const map = { "1": "hero_section", "2": "content_section", "3": "products_section", "4": "brand_section", "5": "reviews_section", "6": "generic_section" };
        const type = map[select] || normalizeType(select, "generic_section");
        const meta = sectionTypes[type] || sectionTypes.generic_section;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections`, { method: "POST", body: { type, name: meta.label, layout: meta.layout, isVisible: true } });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || state.page.sections.at(-1)?._id || "";
        state.selectedBlockId = "";
        AdminUI.toast("Sección agregada.", "success");
        renderAll();
    }

    async function saveSection() {
        const section = getSelectedSection();
        if (!section || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/${encodeURIComponent(section._id || section.id)}`, { method: "PATCH", body: { name: $("#section-name").value.trim() || section.name, type: $("#section-type").value, isVisible: $("#section-visible").value === "true", layout: $("#section-layout").value } });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || section._id || section.id;
        AdminUI.toast("Sección guardada.", "success");
        renderAll();
    }

    async function deleteSection() {
        const section = getSelectedSection();
        if (!section || !state.page) return;
        const ok = await AdminUI.confirmAction(`¿Eliminar la sección "${section.name}" y todos sus bloques?`);
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/${encodeURIComponent(section._id || section.id)}`, { method: "DELETE" });
        state.page = normalizePage(data.page || data);
        state.selectedSectionId = state.page.sections[0]?._id || "";
        state.selectedBlockId = state.page.sections[0]?.blocks?.[0]?._id || "";
        AdminUI.toast("Sección eliminada.", "success");
        renderAll();
    }

    async function addBlock(sectionId = state.selectedSectionId) {
        if (!state.page) return;
        const selector = $("#site-editor-new-block-type");
        const type = selector?.value || "image_banner";
        const defaults = blockTypes[type] || blockTypes.custom_html;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks`, { method: "POST", body: { sectionId, type, name: defaults.name, position: 999, content: clone(defaults.content), style: clone(defaults.style), isVisible: true } });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || sectionId;
        state.selectedBlockId = data.block?._id || data.block?.id || "";
        AdminUI.toast("Bloque agregado.", "success");
        renderAll();
    }

    async function deleteBlock() {
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        const ok = await AdminUI.confirmAction("¿Eliminar este bloque? Esta acción no se puede deshacer.");
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(block._id || block.id)}`, { method: "DELETE" });
        state.page = normalizePage(data.page);
        state.selectedBlockId = flattenBlocks()[0]?._id || "";
        AdminUI.toast("Bloque eliminado.", "success");
        renderAll();
    }

    async function reorderSectionsList(sections) {
        if (!state.page) return;
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/reorder`, { method: "PUT", body: { sections: sections.map((section, index) => ({ sectionId: section._id || section.id, position: index + 1 })) } }));
        renderAll();
    }

    async function reorderBlocks(section, blocks) {
        if (!state.page || !section) return;
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/reorder`, { method: "PUT", body: { blocks: blocks.map((block, index) => ({ blockId: block._id || block.id, sectionId: section._id || section.id, position: index + 1 })) } }));
        renderAll();
    }

    async function moveSection(sectionId, direction) {
        const sections = sortByPosition(state.page?.sections || []);
        const index = sections.findIndex((section) => String(section._id || section.id) === String(sectionId));
        const target = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= sections.length) return;
        [sections[index], sections[target]] = [sections[target], sections[index]];
        await reorderSectionsList(sections);
    }

    async function moveBlock(blockId, direction) {
        const block = flattenBlocks().find((item) => String(item._id || item.id) === String(blockId));
        const section = (state.page?.sections || []).find((item) => String(item._id || item.id) === String(block?.sectionId));
        if (!section) return;
        const blocks = sortByPosition(section.blocks || []);
        const index = blocks.findIndex((item) => String(item._id || item.id) === String(blockId));
        const target = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= blocks.length) return;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        await reorderBlocks(section, blocks);
    }

    async function uploadImage(field) {
        const input = document.querySelector(`[data-upload-target="${field}"]`);
        const urlInput = document.querySelector(`[data-content-field="${field}"]`);
        if (!input?.files?.[0]) return AdminUI.toast("Selecciona una imagen primero.", "warning");
        const form = new FormData();
        form.append("imagenes", input.files[0]);
        form.append("nombre", `editor-sitio-${field}`);
        const data = await AdminAPI.request("/uploads/productos", { method: "POST", body: form });
        const url = data.urls?.[0] || data.assets?.[0]?.url || data.assets?.[0]?.secure_url || "";
        if (!url) return AdminUI.toast("Cloudinary no devolvió una URL válida.", "danger");
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
            state.selectedSectionId = state.page.sections[0]?._id || "";
            state.selectedBlockId = state.page.sections[0]?.blocks?.[0]?._id || "";
            await loadPages(state.page._id || "home");
            AdminUI.toast("Editor del Sitio reparado y sincronizado.", "success");
            setStatus("Editor del Sitio reparado y conectado.", "success");
        } finally { if (button) button.disabled = false; }
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

    function bindEvents() {
        $("#site-editor-refresh")?.addEventListener("click", () => loadPages(activePageKey()).catch(showError));
        $("#site-editor-repair")?.addEventListener("click", () => repairEditor().catch(showError));
        $("#site-editor-save-page")?.addEventListener("click", () => savePage().catch(showError));
        $("#site-editor-new-page")?.addEventListener("click", () => createPage().catch(showError));
        $("#site-editor-delete-page")?.addEventListener("click", () => deletePage().catch(showError));
        $("#site-editor-add-section")?.addEventListener("click", () => addSection().catch(showError));
        $("#site-editor-add-block")?.addEventListener("click", () => addBlock().catch(showError));
        $("#site-editor-block-form")?.addEventListener("submit", (event) => saveBlock(event).catch(showError));
        $("#site-editor-delete-block")?.addEventListener("click", () => deleteBlock().catch(showError));

        document.addEventListener("click", async (event) => {
            const saveSectionButton = event.target.closest("#site-editor-save-section");
            if (saveSectionButton) { await saveSection().catch(showError); return; }
            const deleteSectionButton = event.target.closest("#site-editor-delete-section");
            if (deleteSectionButton) { await deleteSection().catch(showError); return; }
            const pageItem = event.target.closest("[data-page-key]");
            if (pageItem) { await loadPage(pageItem.dataset.pageKey).catch(showError); return; }
            const selectSection = event.target.closest("[data-select-section]");
            if (selectSection && !event.target.closest("button")) { state.selectedSectionId = selectSection.dataset.selectSection; state.selectedBlockId = ""; renderAll(); return; }
            const addToSection = event.target.closest("[data-add-block-section]");
            if (addToSection) { state.selectedSectionId = addToSection.dataset.addBlockSection; await addBlock(state.selectedSectionId).catch(showError); return; }
            const select = event.target.closest("[data-select-block]");
            if (select) { state.selectedBlockId = select.dataset.selectBlock; const block = getSelectedBlock(); state.selectedSectionId = block?.sectionId || state.selectedSectionId; renderAll(); return; }
            const layer = event.target.closest(".pagebuilder-block-item");
            if (layer && !event.target.closest("button")) { state.selectedBlockId = layer.dataset.blockId; state.selectedSectionId = layer.dataset.sectionId || state.selectedSectionId; renderAll(); return; }
            const move = event.target.closest("[data-move]");
            if (move) { await moveBlock(move.dataset.blockId, move.dataset.move).catch(showError); return; }
            const sectionMove = event.target.closest("[data-section-move]");
            if (sectionMove) { await moveSection(sectionMove.dataset.sectionId, sectionMove.dataset.sectionMove).catch(showError); return; }
            const upload = event.target.closest("[data-upload-button]");
            if (upload) await uploadImage(upload.dataset.uploadButton).catch(showError);
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
        document.addEventListener("dragover", (event) => { if (event.target.closest(".pagebuilder-block-list")) event.preventDefault(); });
        document.addEventListener("drop", async (event) => {
            const target = event.target.closest(".pagebuilder-block-item");
            if (!target || !state.draggedBlockId || !state.page) return;
            event.preventDefault();
            const section = (state.page.sections || []).find((item) => String(item._id || item.id) === String(target.dataset.sectionId));
            if (!section) return;
            const blocks = sortByPosition(section.blocks || []);
            const from = blocks.findIndex((block) => String(block._id || block.id) === String(state.draggedBlockId));
            const to = blocks.findIndex((block) => String(block._id || block.id) === String(target.dataset.blockId));
            if (from < 0 || to < 0 || from === to) return;
            const [moved] = blocks.splice(from, 1);
            blocks.splice(to, 0, moved);
            await reorderBlocks(section, blocks).catch(showError);
        });
    }

    async function init() {
        bindEvents();
        try { await loadPages("home"); }
        catch (error) {
            state.pages = [];
            state.page = null;
            renderAll();
            showError(error);
            setStatus("No se pudo cargar el Editor del Sitio desde el backend. Verifica que el backend v2.4 esté desplegado y presiona Reparar conexión.", "danger");
        }
    }

    document.addEventListener("admin:ready", init);
})();
