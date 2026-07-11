"use strict";

(function () {
    const VERSION = "4.3.0";

    const state = {
        pages: [],
        page: null,
        selectedSectionId: "",
        selectedBlockId: "",
        draggedBlockId: "",
        catalog: { categorias: [], productos: [], filtros: [] }
    };

    const sectionTypes = {
        hero_section: {
            label: "Hero / Portada",
            icon: "fa-wand-magic-sparkles",
            layout: "hero_with_sidebar",
            description: "Ideal para portada, categorías laterales y banners principales."
        },
        content_section: {
            label: "Contenido",
            icon: "fa-align-left",
            layout: "stack",
            description: "Textos, tarjetas, bloques informativos y contenido editorial."
        },
        products_section: {
            label: "Productos",
            icon: "fa-box-open",
            layout: "stack",
            description: "Carruseles, grillas y vitrinas de productos."
        },
        brand_section: {
            label: "Líneas de marca",
            icon: "fa-images",
            layout: "stack",
            description: "Banners para Memories, Alma u otras campañas."
        },
        reviews_section: {
            label: "Reseñas",
            icon: "fa-star",
            layout: "stack",
            description: "Bloques de testimonios y prueba social."
        },
        generic_section: {
            label: "Sección libre",
            icon: "fa-layer-group",
            layout: "stack",
            description: "Para crear estructuras personalizadas."
        }
    };

    const blockTypes = {
        category_sidebar: {
            label: "Lista lateral de categorías",
            short: "Categorías lateral",
            icon: "fa-list",
            group: "Navegación",
            name: "Lista lateral de categorías",
            description: "Menú de categorías junto al Hero.",
            content: {
                heading: "Categorías",
                source: "manual",
                categories: [
                    { label: "Accesorios", href: "catalogo.html?categoria=Accesorios", image: "" },
                    { label: "Coleccionables", href: "catalogo.html?categoria=Coleccionables", image: "" },
                    { label: "Decoración", href: "catalogo.html?categoria=Decoraci%C3%B3n", image: "" },
                    { label: "Línea Memories", href: "catalogo.html?categoria=Linea%20Memories", image: "" },
                    { label: "Línea Alma", href: "catalogo.html?categoria=Linea%20Alma", image: "" },
                    { label: "Todos", href: "catalogo.html", image: "" }
                ],
                showViewAll: true,
                viewAllText: "Ver todas",
                viewAllUrl: "catalogo.html"
            },
            style: { desktopVisible: true, mobileVisible: false, marginTop: 0, marginBottom: 0 }
        },
        category_grid: {
            label: "Grilla de categorías",
            short: "Grilla categorías",
            icon: "fa-grip",
            group: "Navegación",
            name: "Grilla de categorías",
            description: "Tarjetas visuales para categorías destacadas.",
            content: {
                title: "Categorías destacadas",
                categories: [
                    { label: "Todos", href: "catalogo.html", image: "" }
                ]
            },
            style: { marginTop: 0, marginBottom: 24 }
        },
        hero_banner: {
            label: "Hero / Banner principal",
            short: "Hero",
            icon: "fa-panorama",
            group: "Portada",
            name: "Hero principal",
            description: "Imagen principal con título, subtítulo y botón.",
            content: {
                title: "Emmagina",
                subtitle: "Productos impresos en 3D para regalar, decorar y crear recuerdos.",
                imageDesktop: "",
                imageMobile: "",
                alt: "Banner principal Emmagina",
                imagePosition: "center",
                buttonText: "Comprar ahora",
                buttonUrl: "catalogo.html"
            },
            style: { heightDesktop: 323, heightMobile: 220, marginTop: 0, marginBottom: 0 }
        },
        info_cards: {
            label: "Tarjetas informativas",
            short: "Tarjetas",
            icon: "fa-table-cells-large",
            group: "Contenido",
            name: "Tarjetas informativas",
            description: "Bloques con imagen, título, texto y enlace.",
            content: {
                kicker: "Información",
                title: "Explora Emmagina",
                cards: [
                    { title: "Destacados", text: "Selección especial de productos.", image: "", href: "catalogo.html?grupo=destacados" },
                    { title: "Más vendidos", text: "Lo favorito de nuestros clientes.", image: "", href: "catalogo.html?grupo=vendidos" },
                    { title: "Más vistos", text: "Lo más explorado de la tienda.", image: "", href: "catalogo.html?grupo=vistos" }
                ]
            },
            style: { marginTop: 0, marginBottom: 24 }
        },
        product_marquee: {
            label: "Carrusel de productos",
            short: "Carrusel",
            icon: "fa-arrows-left-right-to-line",
            group: "Productos",
            name: "Carrusel de productos",
            description: "Vitrina horizontal automática de productos.",
            content: { kicker: "Emmagina", title: "Productos destacados", filter: "destacados", limit: 12 },
            style: { marginTop: 0, marginBottom: 24 }
        },
        product_grid: {
            label: "Grilla de productos",
            short: "Grilla productos",
            icon: "fa-boxes-stacked",
            group: "Productos",
            name: "Grilla de productos",
            description: "Listado visual de productos en columnas.",
            content: { kicker: "Emmagina", title: "Productos", filter: "todos", limit: 12 },
            style: { marginTop: 0, marginBottom: 24 }
        },
        image_banner: {
            label: "Banner de imagen",
            short: "Banner",
            icon: "fa-image",
            group: "Campañas",
            name: "Banner de imagen",
            description: "Banner promocional con imagen y botón.",
            content: {
                title: "Línea especial",
                subtitle: "Personaliza un recuerdo único.",
                imageDesktop: "",
                imageMobile: "",
                alt: "Banner Emmagina",
                imagePosition: "center",
                buttonText: "Pedir el mío",
                buttonUrl: "pedido-personalizado.html"
            },
            style: { heightDesktop: 112, heightMobile: 88, marginTop: 0, marginBottom: 18 }
        },
        reviews_marquee: {
            label: "Carrusel de reseñas",
            short: "Reseñas",
            icon: "fa-comments",
            group: "Confianza",
            name: "Carrusel de reseñas",
            description: "Muestra reseñas desde productos publicados.",
            content: { title: "Lo que dicen nuestros clientes", minRating: 4, hideWhenEmpty: true },
            style: { marginTop: 0, marginBottom: 24 }
        },
        text_block: {
            label: "Texto simple",
            short: "Texto",
            icon: "fa-font",
            group: "Contenido",
            name: "Texto simple",
            description: "Título y párrafo editable.",
            content: { title: "Título", text: "Escribe el contenido de este bloque.", align: "left" },
            style: { marginTop: 0, marginBottom: 24 }
        },
        faq_block: {
            label: "Preguntas frecuentes",
            short: "FAQ",
            icon: "fa-circle-question",
            group: "Contenido",
            name: "Preguntas frecuentes",
            description: "Lista editable de preguntas y respuestas.",
            content: { title: "Preguntas frecuentes", items: [{ question: "Pregunta", answer: "Respuesta" }] },
            style: { marginTop: 0, marginBottom: 24 }
        },
        contact_block: {
            label: "Formulario de contacto",
            short: "Contacto",
            icon: "fa-envelope",
            group: "Conversión",
            name: "Formulario de contacto",
            description: "Bloque de contacto o ayuda.",
            content: { title: "Contáctanos", text: "Escríbenos y responderemos pronto.", email: "", whatsapp: "" },
            style: { marginTop: 0, marginBottom: 24 }
        },
        cart_summary: {
            label: "Resumen del carrito",
            short: "Carrito",
            icon: "fa-cart-shopping",
            group: "Compra",
            name: "Resumen del carrito",
            description: "Acceso o resumen para páginas de compra.",
            content: { title: "Resumen del carrito" },
            style: { marginTop: 0, marginBottom: 24 }
        },
        checkout_form: {
            label: "Formulario de compra",
            short: "Checkout",
            icon: "fa-credit-card",
            group: "Compra",
            name: "Formulario de compra",
            description: "Acceso al flujo de compra.",
            content: { title: "Finalizar compra" },
            style: { marginTop: 0, marginBottom: 24 }
        },
        spacer: {
            label: "Separador / espacio",
            short: "Separador",
            icon: "fa-up-down",
            group: "Diseño",
            name: "Separador",
            description: "Espacio vertical para ordenar el diseño.",
            content: { height: 32 },
            style: { heightDesktop: 32, heightMobile: 24, marginTop: 0, marginBottom: 0 }
        },
        custom_html: {
            label: "HTML controlado",
            short: "HTML",
            icon: "fa-code",
            group: "Avanzado",
            name: "Contenido HTML",
            description: "Contenido HTML controlado para casos especiales.",
            content: { title: "Contenido", html: "<p>Contenido editable</p>" },
            style: { marginTop: 0, marginBottom: 24 }
        }
    };

    function $(selector, root = document) { return root.querySelector(selector); }
    function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
    function escapeHtml(value) { return (window.AdminUI?.escapeHtml || ((v) => String(v ?? "")))(value); }
    function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
    function toNumber(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
    function asBool(value, fallback = false) {
        if (typeof value === "boolean") return value;
        if (value === "true") return true;
        if (value === "false") return false;
        return fallback;
    }
    function idOf(item) { return String(item?._id || item?.id || ""); }
    function normalizeString(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
    function safeKey(value) { return normalizeString(value).replace(/[^a-z0-9_]+/g, "-").replace(/^-+|-+$/g, ""); }
    function sortByPosition(items = []) { return [...(Array.isArray(items) ? items : [])].sort((a, b) => Number(a.position || 0) - Number(b.position || 0)); }
    function stringify(value) { return JSON.stringify(value || {}, null, 2); }
    function parseJson(text) {
        try { return JSON.parse(text || "{}"); }
        catch { throw new Error("JSON inválido. Revisa comas, llaves y comillas."); }
    }
    function formatDate(value) {
        if (!value) return "Sin publicar";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Sin publicar";
        return date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
    }


    function formatPrice(value) {
        return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value) || 0);
    }

    function catalogCategories() {
        return Array.isArray(state.catalog?.categorias) ? state.catalog.categorias : [];
    }

    function catalogProducts() {
        return Array.isArray(state.catalog?.productos) ? state.catalog.productos : [];
    }

    function keyOfCatalogItem(item = {}) {
        return String(item.id || item._id || item.slug || item.nombre || item.label || "");
    }

    function categoryHref(category = {}) {
        return category.href || `catalogo.html?categoria=${encodeURIComponent(category.nombre || category.label || category.slug || "")}`;
    }

    function categoryToBlockItem(category = {}) {
        return {
            id: category.id || category._id || "",
            slug: category.slug || safeKey(category.nombre || category.label || ""),
            label: category.label || category.nombre || "Categoría",
            href: categoryHref(category),
            image: category.image || category.imagen || "",
            color: category.color || "",
            icono: category.icono || ""
        };
    }

    function selectedCategoryKeys(content = {}) {
        const keys = new Set((Array.isArray(content.categoryIds) ? content.categoryIds : []).map(String));
        (Array.isArray(content.categories) ? content.categories : []).forEach((item) => {
            const value = typeof item === "string" ? item : item.id || item._id || item.slug || item.label || item.nombre;
            if (value) keys.add(String(value));
        });
        return keys;
    }

    function categoriesBySource(source = "manual", selectedKeys = new Set()) {
        let categories = catalogCategories();
        if (source === "real_home") categories = categories.filter((item) => item.mostrarInicio !== false && item.activa !== false);
        else if (source === "real_menu") categories = categories.filter((item) => item.mostrarMenu !== false && item.activa !== false);
        else if (source === "real_featured") categories = categories.filter((item) => item.destacada === true && item.activa !== false);
        else if (selectedKeys.size) {
            categories = categories.filter((item) => {
                const keys = [item.id, item._id, item.slug, item.nombre, item.label].filter(Boolean).map(String);
                return keys.some((key) => selectedKeys.has(key));
            });
        } else {
            categories = [];
        }
        return categories.map(categoryToBlockItem);
    }

    function categoryPickerHtml(content = {}) {
        const selected = selectedCategoryKeys(content);
        const categories = catalogCategories();
        if (!categories.length) return `<div class="admin-help compact">No hay categorías reales cargadas todavía. Puedes editarlas manualmente abajo.</div>`;
        return `<section class="site-editor-data-picker" id="site-editor-category-picker">
            <div class="site-editor-picker-head"><strong>Categorías reales</strong><span>Selecciona categorías existentes para no escribir enlaces manuales.</span></div>
            <div class="site-editor-chip-grid">${categories.map((category) => {
                const keys = [category.id, category._id, category.slug, category.nombre, category.label].filter(Boolean).map(String);
                const checked = keys.some((key) => selected.has(key));
                return `<label class="site-editor-chip"><input type="checkbox" data-category-pick value="${escapeHtml(category.id || category.slug || category.nombre)}" ${checked ? "checked" : ""}><span>${escapeHtml(category.nombre || category.label || "Categoría")}</span></label>`;
            }).join("")}</div>
        </section>`;
    }

    function categorySelectOptions(current = "") {
        const categories = catalogCategories();
        const fixed = [{ value: "", label: "Todas las categorías" }];
        return fixed.concat(categories.map((category) => ({ value: category.slug || category.nombre, label: category.nombre || category.label || category.slug })));
    }

    function productFilterOptions(current = "") {
        const filters = Array.isArray(state.catalog?.filtros) && state.catalog.filtros.length ? state.catalog.filtros : [
            { value: "todos", label: "Todos los productos" },
            { value: "destacados", label: "Destacados" },
            { value: "desde14990", label: "Desde $14.990" },
            { value: "lanzamiento", label: "Lanzamiento" },
            { value: "vendidos", label: "Más vendidos" },
            { value: "vistos", label: "Más vistos" }
        ];
        return filters;
    }

    function selectedProductKeys(content = {}) {
        return new Set((Array.isArray(content.productIds) ? content.productIds : []).map(String));
    }

    function productPickerHtml(content = {}) {
        const products = catalogProducts();
        const selected = selectedProductKeys(content);
        if (!products.length) return `<div class="admin-help compact">No hay productos reales cargados todavía. Revisa el módulo Productos.</div>`;
        const ordered = products.slice().sort((a, b) => {
            const ac = selected.has(String(a.id)) || selected.has(String(a.slug)) ? -1 : 0;
            const bc = selected.has(String(b.id)) || selected.has(String(b.slug)) ? -1 : 0;
            return ac - bc || String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
        }).slice(0, 120);
        return `<section class="site-editor-data-picker" id="site-editor-product-picker">
            <div class="site-editor-picker-head"><strong>Productos específicos</strong><span>Úsalo cuando quieras elegir productos exactos. Si no marcas nada, el bloque usa el filtro o categoría.</span></div>
            <div class="site-editor-product-picker-list">${ordered.map((product) => {
                const checked = selected.has(String(product.id)) || selected.has(String(product._id)) || selected.has(String(product.slug));
                const image = product.imagenPrincipal || "../assets/producto-referencia-emmagina.png";
                return `<label class="site-editor-product-choice"><input type="checkbox" data-product-pick value="${escapeHtml(product.id || product.slug || product.nombre)}" ${checked ? "checked" : ""}><img src="${escapeHtml(image)}" alt="" loading="lazy"><span><strong>${escapeHtml(product.nombre || "Producto")}</strong><small>${escapeHtml(formatPrice(product.precio))} · ${escapeHtml((product.categorias || []).slice(0, 2).join(", ") || product.categoriaPrincipal || "Sin categoría")}</small></span></label>`;
            }).join("")}</div>
        </section>`;
    }

    async function loadCatalogData() {
        try {
            const data = await AdminAPI.request("/admin/editor-sitio/catalogo");
            state.catalog = {
                categorias: Array.isArray(data?.categorias) ? data.categorias : [],
                productos: Array.isArray(data?.productos) ? data.productos : [],
                filtros: Array.isArray(data?.filtros) ? data.filtros : []
            };
        } catch (error) {
            console.warn("No se pudieron cargar categorías/productos reales para el Editor del Sitio.", error);
            state.catalog = { categorias: [], productos: [], filtros: [] };
        }
    }

    function setStatus(message = "", type = "") {
        const status = $("#site-editor-status");
        if (!status) return;
        status.textContent = message;
        status.className = `admin-inline-status ${type}`.trim();
    }

    function normalizeType(value, fallback = "custom_html") {
        const raw = String(value || fallback).trim();
        const key = safeKey(raw);
        const aliases = {
            "category-sidebar": "category_sidebar", "category_sidebar": "category_sidebar", categorias: "category_sidebar", "lista-categorias": "category_sidebar",
            "category-grid": "category_grid", "category_grid": "category_grid", "grilla-categorias": "category_grid",
            "hero-banner": "hero_banner", "hero_banner": "hero_banner", hero: "hero_banner",
            "info-cards": "info_cards", "info_cards": "info_cards", tarjetas: "info_cards",
            "product-marquee": "product_marquee", "product_marquee": "product_marquee", carrusel: "product_marquee",
            "product-grid": "product_grid", "product_grid": "product_grid",
            "image-banner": "image_banner", "image_banner": "image_banner",
            "reviews-marquee": "reviews_marquee", "reviews_marquee": "reviews_marquee", resenas: "reviews_marquee",
            "text-block": "text_block", "text_block": "text_block", texto: "text_block",
            "faq-block": "faq_block", "faq_block": "faq_block", preguntas: "faq_block",
            "contact-block": "contact_block", "contact_block": "contact_block",
            "cart-summary": "cart_summary", "cart_summary": "cart_summary",
            "checkout-form": "checkout_form", "checkout_form": "checkout_form",
            spacer: "spacer", separador: "spacer",
            "custom-html": "custom_html", "custom_html": "custom_html", "html-block": "html_block", "html_block": "html_block",
            "hero-section": "hero_section", "hero_section": "hero_section",
            "content-section": "content_section", "content_section": "content_section",
            "products-section": "products_section", "products_section": "products_section",
            "brand-section": "brand_section", "brand_section": "brand_section",
            "reviews-section": "reviews_section", "reviews_section": "reviews_section",
            "generic-section": "generic_section", "generic_section": "generic_section"
        };
        return aliases[key] || aliases[raw] || key.replace(/-/g, "_") || fallback;
    }

    function blockMeta(type) { return blockTypes[normalizeType(type)] || blockTypes.custom_html; }
    function sectionMeta(type) { return sectionTypes[normalizeType(type, "generic_section")] || sectionTypes.generic_section; }
    function blockLabel(type) { return blockMeta(type).label || type || "Bloque"; }
    function sectionLabel(type) { return sectionMeta(type).label || type || "Sección"; }

    function flattenBlocks(page = state.page) {
        if (Array.isArray(page?.sections) && page.sections.length) {
            return sortByPosition(page.sections).flatMap((section) => sortByPosition(section.blocks || []).map((block) => ({
                ...block,
                sectionId: idOf(section),
                sectionName: section.name,
                sectionType: section.type
            })));
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

    function activePageKey() { return state.page?._id || state.page?.key || state.page?.slug || "home"; }
    function getSelectedSection() {
        return (state.page?.sections || []).find((section) => idOf(section) === String(state.selectedSectionId)) || state.page?.sections?.[0] || null;
    }
    function getSelectedBlock() {
        return flattenBlocks().find((block) => idOf(block) === String(state.selectedBlockId)) || null;
    }
    function publicPath(page = state.page) {
        if (!page) return "../index.html";
        if (page.key === "home" || page.slug === "inicio") return "../index.html";
        return `../pagina.html?slug=${encodeURIComponent(page.slug || page.key || "")}`;
    }

    function blockSummary(block) {
        const content = block.content || {};
        const type = normalizeType(block.type);
        if (type === "category_sidebar" || type === "category_grid") return `${Array.isArray(content.categories) ? content.categories.length : 0} categorías`;
        if (type === "product_marquee" || type === "product_grid") return `Filtro: ${content.filter || "todos"} · ${content.limit || 12} productos`;
        if (type === "info_cards") return `${Array.isArray(content.cards) ? content.cards.length : 0} tarjetas`;
        if (type === "faq_block") return `${Array.isArray(content.items) ? content.items.length : 0} preguntas`;
        if (type === "reviews_marquee") return `Desde ${content.minRating || 4} estrellas`;
        if (content.subtitle) return content.subtitle;
        if (content.text) return content.text;
        if (content.buttonText) return `${content.buttonText} → ${content.buttonUrl || "#"}`;
        return blockMeta(type).description || "Bloque editable";
    }

    function mediaFromBlock(block) {
        const content = block?.content || {};
        if (content.imageDesktop || content.image || content.imagen) return content.imageDesktop || content.image || content.imagen;
        if (Array.isArray(content.cards)) return content.cards.find((card) => card.image)?.image || "";
        if (Array.isArray(content.categories)) return content.categories.find((cat) => cat.image)?.image || "";
        return "";
    }

    function booleanSelectHtml(field, label, value = false) {
        return `<div class="admin-field"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><select id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}"><option value="true" ${value === true ? "selected" : ""}>Sí</option><option value="false" ${value !== true ? "selected" : ""}>No</option></select></div>`;
    }
    function fieldHtml(field, label, value = "", type = "text", attrs = "") {
        return `<div class="admin-field"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${attrs}></div>`;
    }
    function selectFieldHtml(field, label, value, options = []) {
        return `<div class="admin-field"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><select id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}">${options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return `<option value="${escapeHtml(item.value)}" ${String(value ?? "") === String(item.value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`;
        }).join("")}</select></div>`;
    }
    function textareaFieldHtml(field, label, value = "", rows = 4) {
        return `<div class="admin-field full"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><textarea id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" rows="${Number(rows) || 4}">${escapeHtml(value)}</textarea></div>`;
    }
    function uploadFieldHtml(field, label, value = "", help = "") {
        const preview = value ? `<a class="site-editor-image-preview" href="${escapeHtml(value)}" target="_blank" rel="noopener"><img src="${escapeHtml(value)}" alt="Vista previa"></a>` : "";
        return `<div class="admin-field full"><label for="field-${escapeHtml(field)}">${escapeHtml(label)}</label><input id="field-${escapeHtml(field)}" data-content-field="${escapeHtml(field)}" value="${escapeHtml(value)}" placeholder="URL Cloudinary">${help ? `<small>${escapeHtml(help)}</small>` : ""}<div class="pagebuilder-upload-row"><input type="file" accept="image/*" data-upload-target="${escapeHtml(field)}"><button class="admin-button secondary small" type="button" data-upload-button="${escapeHtml(field)}"><i class="fa-solid fa-cloud-arrow-up"></i> Subir</button>${preview}</div></div>`;
    }

    function repeaterRowHtml(listName, item = {}, index = 0) {
        const safeList = escapeHtml(listName);
        if (listName === "categories") {
            return `<article class="site-editor-repeater-item" data-array-index="${index}">
                <div class="site-editor-repeater-head"><strong>Categoría ${index + 1}</strong><button type="button" class="pagebuilder-mini-button danger" data-remove-row>Eliminar</button></div>
                <div class="admin-form-grid one">
                    <div class="admin-field"><label>Nombre</label><input data-array-list="${safeList}" data-array-field="label" value="${escapeHtml(item.label || item.nombre || "")}" placeholder="Ej: Decoración"></div>
                    <div class="admin-field"><label>URL</label><input data-array-list="${safeList}" data-array-field="href" value="${escapeHtml(item.href || item.url || "")}" placeholder="catalogo.html?categoria=Decoración"></div>
                    <div class="admin-field full"><label>Imagen / ícono</label><input data-array-list="${safeList}" data-array-field="image" value="${escapeHtml(item.image || item.imagen || "")}" placeholder="URL Cloudinary opcional"><div class="pagebuilder-upload-row"><input type="file" accept="image/*" data-upload-array-list="${safeList}" data-upload-array-index="${index}" data-upload-array-field="image"><button type="button" class="admin-button secondary small" data-upload-array-button><i class="fa-solid fa-cloud-arrow-up"></i> Subir</button></div></div>
                </div>
            </article>`;
        }
        if (listName === "cards") {
            return `<article class="site-editor-repeater-item" data-array-index="${index}">
                <div class="site-editor-repeater-head"><strong>Tarjeta ${index + 1}</strong><button type="button" class="pagebuilder-mini-button danger" data-remove-row>Eliminar</button></div>
                <div class="admin-form-grid one">
                    <div class="admin-field"><label>Título</label><input data-array-list="${safeList}" data-array-field="title" value="${escapeHtml(item.title || item.titulo || "")}" placeholder="Ej: Más vendidos"></div>
                    <div class="admin-field"><label>Texto</label><textarea data-array-list="${safeList}" data-array-field="text" rows="2" placeholder="Descripción breve">${escapeHtml(item.text || item.descripcion || item.description || "")}</textarea></div>
                    <div class="admin-field"><label>URL destino</label><input data-array-list="${safeList}" data-array-field="href" value="${escapeHtml(item.href || item.url || item.link || "")}" placeholder="catalogo.html"></div>
                    <div class="admin-field full"><label>Imagen</label><input data-array-list="${safeList}" data-array-field="image" value="${escapeHtml(item.image || item.imagen || "")}" placeholder="URL Cloudinary"><div class="pagebuilder-upload-row"><input type="file" accept="image/*" data-upload-array-list="${safeList}" data-upload-array-index="${index}" data-upload-array-field="image"><button type="button" class="admin-button secondary small" data-upload-array-button><i class="fa-solid fa-cloud-arrow-up"></i> Subir</button></div></div>
                </div>
            </article>`;
        }
        if (listName === "items") {
            return `<article class="site-editor-repeater-item" data-array-index="${index}">
                <div class="site-editor-repeater-head"><strong>Pregunta ${index + 1}</strong><button type="button" class="pagebuilder-mini-button danger" data-remove-row>Eliminar</button></div>
                <div class="admin-form-grid one">
                    <div class="admin-field"><label>Pregunta</label><input data-array-list="${safeList}" data-array-field="question" value="${escapeHtml(item.question || item.pregunta || "")}" placeholder="Ej: ¿Cuánto demora mi pedido?"></div>
                    <div class="admin-field"><label>Respuesta</label><textarea data-array-list="${safeList}" data-array-field="answer" rows="3" placeholder="Respuesta breve">${escapeHtml(item.answer || item.respuesta || "")}</textarea></div>
                </div>
            </article>`;
        }
        return "";
    }

    function repeaterHtml(listName, title, items = [], help = "") {
        const safeItems = Array.isArray(items) && items.length ? items : [{}];
        return `<section class="site-editor-repeater" data-array-repeater="${escapeHtml(listName)}">
            <div class="site-editor-repeater-title"><div><p class="admin-section-kicker">${escapeHtml(title)}</p>${help ? `<span>${escapeHtml(help)}</span>` : ""}</div><button type="button" class="admin-button secondary small" data-add-row="${escapeHtml(listName)}"><i class="fa-solid fa-plus"></i> Agregar</button></div>
            <div class="site-editor-repeater-list" data-array-list-root="${escapeHtml(listName)}">${safeItems.map((item, index) => repeaterRowHtml(listName, item, index)).join("")}</div>
        </section>`;
    }

    function collectArray(listName) {
        return $all(`[data-array-list-root="${listName}"] .site-editor-repeater-item`).map((row) => {
            const item = {};
            $all(`[data-array-list="${listName}"]`, row).forEach((input) => {
                const key = input.dataset.arrayField;
                if (!key) return;
                item[key] = input.value;
            });
            return item;
        }).filter((item) => Object.values(item).some((value) => String(value || "").trim() !== ""));
    }

    function renderBlockTypeOptions(current = "") {
        const groups = {};
        Object.entries(blockTypes).forEach(([value, meta]) => {
            if (!groups[meta.group]) groups[meta.group] = [];
            groups[meta.group].push({ value, meta });
        });
        return Object.entries(groups).map(([group, items]) => `<optgroup label="${escapeHtml(group)}">${items.map(({ value, meta }) => `<option value="${value}" ${normalizeType(current) === value ? "selected" : ""}>${escapeHtml(meta.label)}</option>`).join("")}</optgroup>`).join("");
    }

    function renderSectionTypeOptions(current = "") {
        return Object.entries(sectionTypes).map(([value, meta]) => `<option value="${value}" ${normalizeType(current, "generic_section") === value ? "selected" : ""}>${escapeHtml(meta.label)}</option>`).join("");
    }

    async function loadPages(preferKey = "") {
        setStatus("Cargando páginas...", "");
        const pages = await AdminAPI.request("/admin/editor-sitio/pages");
        state.pages = Array.isArray(pages) ? pages : [];
        renderPageList();
        const currentStillExists = state.page && state.pages.some((page) => [page._id, page.id, page.key, page.slug].map(String).includes(String(preferKey || activePageKey())));
        const target = preferKey || (currentStillExists ? activePageKey() : "home");
        if (target) await loadPage(target, false);
        setStatus("Editor del Sitio conectado.", "success");
    }

    async function loadPage(key, showLoading = true) {
        if (showLoading) setStatus("Cargando página...", "");
        const page = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(key || "home")}`);
        state.page = normalizePage(page);
        if (!state.selectedSectionId || !state.page.sections.some((section) => idOf(section) === String(state.selectedSectionId))) {
            state.selectedSectionId = idOf(state.page.sections[0]) || "";
        }
        if (!state.selectedBlockId || !flattenBlocks().some((block) => idOf(block) === String(state.selectedBlockId))) {
            const section = getSelectedSection();
            state.selectedBlockId = idOf(section?.blocks?.[0]) || "";
        }
        renderAll();
        if (showLoading) setStatus("Página cargada.", "success");
    }

    function renderPageList() {
        const list = $("#site-editor-page-list");
        if (!list) return;
        if (!state.pages.length) {
            list.innerHTML = `<div class="admin-empty">No hay páginas. Usa Reparar conexión.</div>`;
            return;
        }
        list.innerHTML = state.pages.map((page) => {
            const key = page._id || page.key || page.slug;
            const active = String(key) === String(activePageKey()) || String(page.key) === String(state.page?.key);
            const status = page.isPublished === false ? "Borrador" : (page.hasUnpublishedChanges ? "Cambios sin publicar" : "Publicada");
            const nav = page.showInNavigation ? " · Menú" : "";
            const version = Number(page.version || 0) ? ` · v${Number(page.version || 0)}` : "";
            return `<button class="site-editor-page-item${active ? " active" : ""}${page.hasUnpublishedChanges ? " has-draft" : ""}" type="button" data-page-key="${escapeHtml(key)}">
                <strong>${escapeHtml(page.title || "Página")}</strong>
                <span>${escapeHtml(page.slug || page.key || "")}</span>
                <em>${escapeHtml(status + nav + version)} · ${Number(page.sectionsCount || 0)} secciones</em>
            </button>`;
        }).join("");
    }

    function renderPageFields() {
        const page = state.page;
        if (!page) return;
        $("#site-editor-page-title").value = page.title || "";
        $("#site-editor-page-slug").value = page.slug || "";
        $("#site-editor-page-slug").disabled = page.key === "home";
        $("#site-editor-page-navigation-label").value = page.navigationLabel || page.title || "";
        $("#site-editor-page-sort-order").value = page.sortOrder || 50;
        $("#site-editor-page-published").checked = page.isPublished !== false;
        $("#site-editor-page-published").disabled = page.key === "home";
        $("#site-editor-page-nav").checked = page.showInNavigation === true;
        $("#site-editor-page-nav").disabled = page.key === "home";
        $("#site-editor-page-description").value = page.description || "";
        $("#site-editor-page-seo-title").value = page.seo?.title || "";
        $("#site-editor-page-seo-description").value = page.seo?.description || "";
        $("#site-editor-canvas-title").textContent = page.title || "Página";
        const link = $("#site-editor-public-link");
        if (link) link.href = publicPath(page);
        const badge = $("#site-editor-publish-badge");
        if (badge) {
            const pending = page.hasUnpublishedChanges === true;
            const version = Number(page.version || 0);
            badge.textContent = pending ? `Cambios sin publicar${version ? ` · v${version}` : ""}` : `Publicado${version ? ` · v${version}` : ""}`;
            badge.className = `site-editor-publish-badge ${pending ? "warning" : "success"}`;
            badge.title = page.publishedAt ? `Última publicación: ${formatDate(page.publishedAt)}` : "Esta página todavía no tiene publicación guardada.";
        }
        const help = $("#site-editor-publish-help");
        if (help) help.textContent = page.hasUnpublishedChanges === true ? "Hay cambios guardados como borrador. Publica para que se vean en la tienda." : `La tienda está usando la versión publicada${page.publishedAt ? ` el ${formatDate(page.publishedAt)}` : ""}.`;
        const deleteButton = $("#site-editor-delete-page");
        if (deleteButton) deleteButton.disabled = page.canDelete === false;
    }

    function renderLayers() {
        const list = $("#site-editor-block-list");
        if (!list) return;
        const sections = sortByPosition(state.page?.sections || []);
        if (!sections.length) {
            list.innerHTML = `<div class="admin-empty">Esta página todavía no tiene secciones.</div>`;
            return;
        }
        list.innerHTML = sections.map((section, sectionIndex) => {
            const sectionId = idOf(section);
            const meta = sectionMeta(section.type);
            const activeSection = sectionId === String(state.selectedSectionId) ? " active" : "";
            const blocks = sortByPosition(section.blocks || []);
            return `<section class="site-editor-layer-section${activeSection}" data-section-id="${escapeHtml(sectionId)}">
                <header class="site-editor-layer-section-head" data-select-section="${escapeHtml(sectionId)}">
                    <div class="site-editor-layer-title"><span class="site-editor-icon"><i class="fa-solid ${escapeHtml(meta.icon)}"></i></span><div><strong>${sectionIndex + 1}. ${escapeHtml(section.name || meta.label)}</strong><span>${escapeHtml(meta.label)} · ${blocks.length} bloques ${section.isVisible === false ? "· Oculta" : ""}</span></div></div>
                    <div class="pagebuilder-block-actions section-actions"><button class="pagebuilder-mini-button" type="button" data-section-move="up" data-section-id="${escapeHtml(sectionId)}" title="Subir sección"><i class="fa-solid fa-arrow-up"></i></button><button class="pagebuilder-mini-button" type="button" data-section-move="down" data-section-id="${escapeHtml(sectionId)}" title="Bajar sección"><i class="fa-solid fa-arrow-down"></i></button><button class="pagebuilder-mini-button" type="button" data-duplicate-section="${escapeHtml(sectionId)}" title="Duplicar sección"><i class="fa-regular fa-copy"></i></button><button class="pagebuilder-mini-button" type="button" data-toggle-section="${escapeHtml(sectionId)}" title="Mostrar / ocultar sección"><i class="fa-solid ${section.isVisible === false ? "fa-eye" : "fa-eye-slash"}"></i></button></div>
                </header>
                <div class="site-editor-layer-blocks">
                    ${blocks.map((block, blockIndex) => {
                        const id = idOf(block);
                        const blockInfo = blockMeta(block.type);
                        const active = id === String(state.selectedBlockId) ? " active" : "";
                        return `<article class="pagebuilder-block-item${active}" draggable="true" data-block-id="${escapeHtml(id)}" data-section-id="${escapeHtml(sectionId)}">
                            <div class="pagebuilder-block-main"><span class="site-editor-icon soft"><i class="fa-solid ${escapeHtml(blockInfo.icon)}"></i></span><div><strong>${escapeHtml(block.name || blockInfo.short || blockInfo.label)}</strong><span>${blockIndex + 1}. ${escapeHtml(blockInfo.short || blockInfo.label)} ${block.isVisible === false ? "· Oculto" : ""}</span></div></div>
                            <div class="pagebuilder-block-actions block-actions"><button class="pagebuilder-mini-button" type="button" data-move="up" data-block-id="${escapeHtml(id)}" title="Subir bloque"><i class="fa-solid fa-arrow-up"></i></button><button class="pagebuilder-mini-button" type="button" data-move="down" data-block-id="${escapeHtml(id)}" title="Bajar bloque"><i class="fa-solid fa-arrow-down"></i></button><button class="pagebuilder-mini-button" type="button" data-duplicate-block="${escapeHtml(id)}" title="Duplicar bloque"><i class="fa-regular fa-copy"></i></button><button class="pagebuilder-mini-button" type="button" data-toggle-block="${escapeHtml(id)}" title="Mostrar / ocultar bloque"><i class="fa-solid ${block.isVisible === false ? "fa-eye" : "fa-eye-slash"}"></i></button></div>
                        </article>`;
                    }).join("") || `<div class="admin-empty small">Sin bloques.</div>`}
                    <button class="admin-button secondary small site-editor-add-block-to-section" type="button" data-add-block-section="${escapeHtml(sectionId)}"><i class="fa-solid fa-plus"></i> Agregar bloque aquí</button>
                </div>
            </section>`;
        }).join("");
    }

    function renderPreview() {
        const root = $("#site-editor-preview");
        if (!root) return;
        const sections = sortByPosition(state.page?.sections || []);
        if (!sections.length) {
            root.innerHTML = `<div class="admin-empty">No hay secciones para previsualizar.</div>`;
            return;
        }
        root.innerHTML = sections.map((section) => {
            const sectionId = idOf(section);
            const meta = sectionMeta(section.type);
            const blocks = sortByPosition(section.blocks || []);
            const activeSection = sectionId === String(state.selectedSectionId) ? " active" : "";
            return `<section class="pagebuilder-preview-section${activeSection}" data-select-section="${escapeHtml(sectionId)}">
                <header><div class="site-editor-layer-title"><span class="site-editor-icon"><i class="fa-solid ${escapeHtml(meta.icon)}"></i></span><div><h4>${escapeHtml(section.name || meta.label)}</h4><p>${escapeHtml(meta.description)}</p></div></div><span class="admin-status-pill ${section.isVisible === false ? "danger" : "success"}">${section.isVisible === false ? "Oculta" : "Visible"}</span></header>
                <div class="pagebuilder-preview-section-blocks layout-${escapeHtml(section.layout || "stack")}">${blocks.map((block) => {
                    const content = block.content || {};
                    const blockInfo = blockMeta(block.type);
                    const active = idOf(block) === String(state.selectedBlockId) ? " active" : "";
                    const img = mediaFromBlock(block);
                    return `<article class="pagebuilder-preview-block${active}" data-select-block="${escapeHtml(idOf(block))}">
                        <header><div class="site-editor-layer-title"><span class="site-editor-icon soft"><i class="fa-solid ${escapeHtml(blockInfo.icon)}"></i></span><div><h4>${escapeHtml(block.name || content.title || blockInfo.label)}</h4><p>${escapeHtml(blockSummary(block))}</p></div></div><span class="admin-status-pill ${block.isVisible === false ? "danger" : "success"}">${block.isVisible === false ? "Oculto" : "Visible"}</span></header>${img ? `<img class="pagebuilder-preview-image" src="${escapeHtml(img)}" alt="Vista previa" loading="lazy">` : ""}</article>`;
                }).join("") || `<div class="admin-empty small">Sin bloques.</div>`}</div>
            </section>`;
        }).join("");
    }

    function renderSpecificFields(block) {
        const root = $("#site-editor-specific-fields");
        if (!root || !block) return;
        const type = normalizeType(block.type);
        const content = { ...clone(blockMeta(type).content), ...clone(block.content) };
        const heading = `<div class="site-editor-editor-heading"><span class="site-editor-icon"><i class="fa-solid ${escapeHtml(blockMeta(type).icon)}"></i></span><div><strong>${escapeHtml(blockMeta(type).label)}</strong><p>${escapeHtml(blockMeta(type).description)}</p></div></div>`;

        if (type === "category_sidebar" || type === "category_grid") {
            const sourceOptions = [
                { value: "manual", label: "Lista manual editable" },
                { value: "real_home", label: "Categorías reales visibles en inicio" },
                { value: "real_menu", label: "Categorías reales visibles en menú" },
                { value: "real_featured", label: "Categorías reales destacadas" },
                { value: "selected", label: "Categorías reales seleccionadas abajo" }
            ];
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml(type === "category_grid" ? "title" : "heading", "Título visible", content.heading || content.title || "Categorías")}${selectFieldHtml("source", "Origen de categorías", content.source || "manual", sourceOptions)}${booleanSelectHtml("showViewAll", "Mostrar botón Ver todas", content.showViewAll !== false)}${fieldHtml("viewAllText", "Texto botón", content.viewAllText || "Ver todas")}${fieldHtml("viewAllUrl", "URL botón", content.viewAllUrl || "catalogo.html")}</div>${categoryPickerHtml(content)}${repeaterHtml("categories", "Lista visible", content.categories || [], "Puedes ajustar manualmente nombre, enlace e imagen. Si eliges categorías reales, se actualiza al guardar.")}`;
            return;
        }

        if (type === "hero_banner") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("title", "Título", content.title || "")}${fieldHtml("subtitle", "Subtítulo", content.subtitle || "")}${fieldHtml("buttonText", "Texto botón", content.buttonText || "")}${fieldHtml("buttonUrl", "URL botón", content.buttonUrl || "catalogo.html")}${fieldHtml("alt", "Texto alternativo imagen", content.alt || "")}${selectFieldHtml("imagePosition", "Posición imagen", content.imagePosition || "center", [{ value: "center", label: "Centro" }, { value: "top", label: "Arriba" }, { value: "bottom", label: "Abajo" }, { value: "left", label: "Izquierda" }, { value: "right", label: "Derecha" }])}</div>${uploadFieldHtml("imageDesktop", "Imagen escritorio", content.imageDesktop || "")}${uploadFieldHtml("imageMobile", "Imagen móvil", content.imageMobile || "", "Opcional. Si está vacía se usa la imagen de escritorio.")}`;
            return;
        }

        if (type === "image_banner") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("title", "Título", content.title || "")}${fieldHtml("subtitle", "Subtítulo", content.subtitle || "")}${fieldHtml("buttonText", "Texto botón", content.buttonText || "")}${fieldHtml("buttonUrl", "URL botón", content.buttonUrl || "pedido-personalizado.html")}${fieldHtml("alt", "Texto alternativo imagen", content.alt || "")}${selectFieldHtml("imagePosition", "Posición imagen", content.imagePosition || "center", ["center", "top", "bottom", "left", "right"])}</div>${uploadFieldHtml("imageDesktop", "Imagen escritorio", content.imageDesktop || "")}${uploadFieldHtml("imageMobile", "Imagen móvil", content.imageMobile || "")}`;
            return;
        }

        if (type === "info_cards") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("kicker", "Etiqueta superior", content.kicker || "Información")}${fieldHtml("title", "Título de sección", content.title || "Explora Emmagina")}</div>${repeaterHtml("cards", "Tarjetas", content.cards || [], "Cada tarjeta puede tener imagen, texto y enlace.")}`;
            return;
        }

        if (type === "product_marquee" || type === "product_grid") {
            const sourceOptions = [
                { value: "filter", label: "Filtro automático" },
                { value: "category", label: "Categoría real" },
                { value: "manual", label: "Productos seleccionados" }
            ];
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("kicker", "Etiqueta superior", content.kicker || "Emmagina")}${fieldHtml("title", "Título", content.title || "")}${selectFieldHtml("source", "Origen de productos", content.source || (content.productIds?.length ? "manual" : content.categorySlug ? "category" : "filter"), sourceOptions)}${selectFieldHtml("filter", "Filtro automático", content.filter || "todos", productFilterOptions(content.filter))}${selectFieldHtml("categorySlug", "Categoría real", content.categorySlug || content.category || "", categorySelectOptions(content.categorySlug || content.category))}${fieldHtml("limit", "Cantidad máxima", content.limit || 12, "number", "min='1' max='36'")}</div>${productPickerHtml(content)}<p class="admin-help compact">El bloque puede mostrar un filtro, una categoría real o productos exactos. No necesitas escribir nombres técnicos.</p>`;
            return;
        }

        if (type === "reviews_marquee") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("title", "Título", content.title || "Lo que dicen nuestros clientes")}${fieldHtml("minRating", "Evaluación mínima", content.minRating || 4, "number", "min='1' max='5'")}${booleanSelectHtml("hideWhenEmpty", "Ocultar si no hay reseñas", content.hideWhenEmpty !== false)}</div>`;
            return;
        }

        if (type === "text_block") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("title", "Título", content.title || "")}${selectFieldHtml("align", "Alineación", content.align || "left", [{ value: "left", label: "Izquierda" }, { value: "center", label: "Centro" }, { value: "right", label: "Derecha" }])}</div>${textareaFieldHtml("text", "Texto", content.text || "", 7)}`;
            return;
        }

        if (type === "faq_block") {
            root.innerHTML = `${heading}${fieldHtml("title", "Título", content.title || "Preguntas frecuentes")}${repeaterHtml("items", "Preguntas", content.items || [], "Agrega preguntas y respuestas sin editar JSON.")}`;
            return;
        }

        if (type === "contact_block") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("title", "Título", content.title || "Contáctanos")}${fieldHtml("email", "Correo visible", content.email || "")}${fieldHtml("whatsapp", "WhatsApp visible", content.whatsapp || "")}</div>${textareaFieldHtml("text", "Texto", content.text || "", 4)}`;
            return;
        }

        if (type === "spacer") {
            root.innerHTML = `${heading}<div class="admin-form-grid two">${fieldHtml("height", "Alto del espacio", content.height || 32, "number", "min='0' max='260'")}</div>`;
            return;
        }

        if (type === "cart_summary" || type === "checkout_form") {
            root.innerHTML = `${heading}<div class="admin-form-grid one">${fieldHtml("title", "Título", content.title || blockMeta(type).name)}</div><p class="admin-help compact">Este bloque funciona como acceso o marcador visual. El flujo completo vive en su página correspondiente.</p>`;
            return;
        }

        root.innerHTML = `${heading}${fieldHtml("title", "Título", content.title || "")}${textareaFieldHtml("html", "HTML controlado", content.html || "", 9)}<p class="admin-help compact">Usa HTML simple y seguro. Evita scripts.</p>`;
    }

    function renderSectionMiniEditor(section) {
        const root = $("#site-editor-section-panel");
        if (!root) return;
        if (!section) {
            root.innerHTML = `<div class="admin-empty small">Selecciona una sección para editar su nombre y layout.</div>`;
            return;
        }
        const meta = sectionMeta(section.type);
        const hasSelectedBlock = Boolean(getSelectedBlock());
        const openAttr = hasSelectedBlock ? "" : " open";
        root.innerHTML = `<details class="site-editor-section-details"${openAttr}><summary><span><i class="fa-solid ${escapeHtml(meta.icon)}"></i> Sección: ${escapeHtml(section.name || meta.label)}</span></summary>
            <div class="site-editor-style-panel slim">
                <div class="admin-form-grid one">
                    <div class="admin-field"><label for="section-name">Nombre de sección</label><input id="section-name" value="${escapeHtml(section.name || "")}"></div>
                    <div class="admin-field"><label for="section-type">Tipo de sección</label><select id="section-type">${renderSectionTypeOptions(section.type)}</select></div>
                    <div class="admin-field"><label for="section-layout">Distribución</label><select id="section-layout"><option value="stack" ${section.layout === "stack" ? "selected" : ""}>Apilado vertical</option><option value="hero_with_sidebar" ${section.layout === "hero_with_sidebar" ? "selected" : ""}>Hero con lateral</option><option value="grid" ${section.layout === "grid" ? "selected" : ""}>Grilla</option></select></div>
                    <div class="admin-field"><label for="section-visible">Visibilidad</label><select id="section-visible"><option value="true" ${section.isVisible !== false ? "selected" : ""}>Visible</option><option value="false" ${section.isVisible === false ? "selected" : ""}>Oculta</option></select></div>
                </div>
                <div class="admin-actions-row compact"><button class="admin-button secondary small" id="site-editor-save-section" type="button">Guardar sección</button><button class="admin-button secondary small" id="site-editor-duplicate-section" type="button"><i class="fa-regular fa-copy"></i> Duplicar</button><button class="admin-button danger small" id="site-editor-delete-section" type="button">Eliminar</button></div>
            </div>
        </details>`;
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
        const type = normalizeType(block.type);
        $("#site-editor-selected-title").textContent = block.name || blockLabel(block.type);
        $("#block-name").value = block.name || "";
        $("#block-type").innerHTML = renderBlockTypeOptions(type);
        $("#block-type").value = type;
        $("#block-visible").value = block.isVisible === false ? "false" : "true";
        $("#block-content-json").value = stringify(block.content);
        $("#block-style-json").value = stringify(block.style);
        renderSpecificFields(block);
        $all("[data-style-field]").forEach((input) => {
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
        if (!state.page) return AdminUI.toast("Primero carga o crea una página.", "warning");
        const button = $("#site-editor-save-page");
        const currentKey = activePageKey();
        const payload = {
            title: $("#site-editor-page-title").value.trim() || "Página",
            slug: $("#site-editor-page-slug").value.trim(),
            description: $("#site-editor-page-description").value.trim(),
            isPublished: $("#site-editor-page-published").checked,
            showInNavigation: $("#site-editor-page-nav").checked,
            navigationLabel: $("#site-editor-page-navigation-label").value.trim(),
            sortOrder: Number($("#site-editor-page-sort-order")?.value || 50),
            seo: { title: $("#site-editor-page-seo-title").value.trim(), description: $("#site-editor-page-seo-description").value.trim() }
        };
        try {
            if (button) button.disabled = true;
            setStatus("Guardando página...", "");
            state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(currentKey)}`, { method: "PATCH", body: payload }));
            await loadPages(state.page._id || state.page.key || state.page.slug || currentKey);
            AdminUI.toast("Borrador de página guardado.", "success");
            setStatus("Borrador guardado. Publica para reflejarlo en la tienda.", "success");
        } finally { if (button) button.disabled = false; }
    }

    async function createPage() {
        const title = prompt("Nombre de la nueva página", "Nueva página");
        if (!title) return;
        state.page = normalizePage(await AdminAPI.request("/admin/editor-sitio/pages", { method: "POST", body: { title, slug: "", isPublished: false, pageType: "custom", showInNavigation: false, sortOrder: 50 } }));
        state.selectedSectionId = idOf(state.page.sections[0]) || "";
        state.selectedBlockId = idOf(state.page.sections[0]?.blocks?.[0]) || "";
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
        $all("[data-content-field]").forEach((input) => {
            const key = input.dataset.contentField;
            if (!key) return;
            if (input.tagName === "SELECT" && (input.value === "true" || input.value === "false")) content[key] = input.value === "true";
            else if (input.type === "number") content[key] = Number(input.value || 0);
            else if (input.type === "checkbox") content[key] = input.checked;
            else content[key] = input.value;
        });
        if ($("[data-array-list-root='categories']")) {
            const pickedKeys = new Set($all("[data-category-pick]:checked").map((input) => String(input.value)));
            const source = String(content.source || "manual");
            const realCategories = source === "manual" && !pickedKeys.size ? [] : categoriesBySource(source, pickedKeys);
            const manualCategories = collectArray("categories").map((item) => ({ label: item.label || "Categoría", href: item.href || `catalogo.html?categoria=${encodeURIComponent(item.label || "")}`, image: item.image || "" }));
            content.categoryIds = [...pickedKeys];
            content.categories = realCategories.length ? realCategories : manualCategories;
        }
        if ($("[data-array-list-root='cards']")) content.cards = collectArray("cards").map((item) => ({ title: item.title || "Tarjeta", text: item.text || "", href: item.href || "catalogo.html", image: item.image || "" }));
        if ($("[data-array-list-root='items']")) content.items = collectArray("items").map((item) => ({ question: item.question || "Pregunta", answer: item.answer || "" }));
        if ($("#site-editor-product-picker")) {
            content.productIds = $all("[data-product-pick]:checked").map((input) => String(input.value));
            if (content.categorySlug) {
                const category = catalogCategories().find((item) => String(item.slug || item.nombre) === String(content.categorySlug));
                content.categoryName = category?.nombre || content.categorySlug;
            }
        }
        delete content.categoriesText;
        return content;
    }

    function mergeStyleFields(style) {
        $all("[data-style-field]").forEach((input) => {
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
            const selectedType = normalizeType($("#block-type").value);
            const defaults = blockMeta(selectedType);
            content = mergeSpecificFields({ ...clone(defaults.content), ...parseJson($("#block-content-json").value) });
            style = mergeStyleFields({ ...clone(defaults.style), ...parseJson($("#block-style-json").value) });
        } catch (error) { AdminUI.toast(error.message, "danger"); return; }
        const payload = { name: $("#block-name").value.trim() || blockLabel($("#block-type").value), type: normalizeType($("#block-type").value), isVisible: $("#block-visible").value === "true", sectionId: block.sectionId || state.selectedSectionId, content, style };
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(idOf(block))}`, { method: "PATCH", body: payload });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || state.selectedSectionId;
        state.selectedBlockId = data.block?._id || idOf(block);
        AdminUI.toast("Bloque guardado como borrador.", "success");
        setStatus("Bloque guardado como borrador. Publica para verlo en la tienda.", "success");
        renderAll();
    }

    async function addSection() {
        if (!state.page) return;
        const type = $("#site-editor-new-section-type")?.value || "generic_section";
        const meta = sectionMeta(type);
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections`, { method: "POST", body: { type, name: meta.label, layout: meta.layout, isVisible: true } });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || idOf(state.page.sections.at(-1)) || "";
        state.selectedBlockId = "";
        AdminUI.toast("Sección agregada.", "success");
        renderAll();
    }

    async function saveSection() {
        const section = getSelectedSection();
        if (!section || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/${encodeURIComponent(idOf(section))}`, {
            method: "PATCH",
            body: { name: $("#section-name").value.trim() || section.name, type: $("#section-type").value, isVisible: $("#section-visible").value === "true", layout: $("#section-layout").value }
        });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || idOf(section);
        AdminUI.toast("Sección guardada como borrador.", "success");
        renderAll();
    }

    async function deleteSection() {
        const section = getSelectedSection();
        if (!section || !state.page) return;
        const ok = await AdminUI.confirmAction(`¿Eliminar la sección "${section.name}" y todos sus bloques?`);
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/${encodeURIComponent(idOf(section))}`, { method: "DELETE" });
        state.page = normalizePage(data.page || data);
        state.selectedSectionId = idOf(state.page.sections[0]) || "";
        state.selectedBlockId = idOf(state.page.sections[0]?.blocks?.[0]) || "";
        AdminUI.toast("Sección eliminada.", "success");
        renderAll();
    }

    async function addBlock(sectionId = state.selectedSectionId) {
        if (!state.page) return;
        const type = $("#site-editor-new-block-type")?.value || "image_banner";
        const defaults = blockMeta(type);
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks`, { method: "POST", body: { sectionId, type, name: defaults.name, position: 999, content: clone(defaults.content), style: clone(defaults.style), isVisible: true } });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || sectionId;
        state.selectedBlockId = data.block?._id || data.block?.id || "";
        AdminUI.toast("Bloque agregado.", "success");
        renderAll();
    }


    function cleanForDuplicate(value) {
        if (Array.isArray(value)) return value.map(cleanForDuplicate);
        if (!value || typeof value !== "object") return value;
        const result = {};
        Object.entries(value).forEach(([key, item]) => {
            if (["_id", "id", "sectionId", "createdAt", "updatedAt"].includes(key)) return;
            result[key] = cleanForDuplicate(item);
        });
        return result;
    }

    async function duplicateBlock(blockId = state.selectedBlockId) {
        const block = flattenBlocks().find((item) => idOf(item) === String(blockId));
        if (!block || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks`, {
            method: "POST",
            body: {
                sectionId: block.sectionId || state.selectedSectionId,
                type: normalizeType(block.type),
                name: `Copia de ${block.name || blockLabel(block.type)}`,
                position: 999,
                isVisible: block.isVisible !== false,
                content: cleanForDuplicate(block.content || {}),
                style: cleanForDuplicate(block.style || {}),
                settings: cleanForDuplicate(block.settings || {})
            }
        });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || block.sectionId || state.selectedSectionId;
        state.selectedBlockId = data.block?._id || data.block?.id || "";
        AdminUI.toast("Bloque duplicado como borrador.", "success");
        renderAll();
    }

    async function duplicateSection(sectionId = state.selectedSectionId) {
        const section = (state.page?.sections || []).find((item) => idOf(item) === String(sectionId));
        if (!section || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections`, {
            method: "POST",
            body: {
                type: normalizeType(section.type, "generic_section"),
                name: `Copia de ${section.name || sectionLabel(section.type)}`,
                layout: section.layout || "stack",
                isVisible: section.isVisible !== false,
                content: cleanForDuplicate(section.content || {}),
                style: cleanForDuplicate(section.style || {}),
                settings: cleanForDuplicate(section.settings || {}),
                blocks: (section.blocks || []).map((block, index) => ({
                    type: normalizeType(block.type),
                    name: block.name || blockLabel(block.type),
                    position: index + 1,
                    isVisible: block.isVisible !== false,
                    content: cleanForDuplicate(block.content || {}),
                    style: cleanForDuplicate(block.style || {}),
                    settings: cleanForDuplicate(block.settings || {})
                }))
            }
        });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || data.section?.id || idOf(state.page.sections.at(-1)) || "";
        state.selectedBlockId = idOf(getSelectedSection()?.blocks?.[0]) || "";
        AdminUI.toast("Sección duplicada como borrador.", "success");
        renderAll();
    }

    async function toggleBlockVisibility(blockId) {
        const block = flattenBlocks().find((item) => idOf(item) === String(blockId));
        if (!block || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(idOf(block))}`, {
            method: "PATCH",
            body: { sectionId: block.sectionId || state.selectedSectionId, isVisible: block.isVisible === false }
        });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.block?.sectionId || block.sectionId || state.selectedSectionId;
        state.selectedBlockId = data.block?._id || idOf(block);
        AdminUI.toast(block.isVisible === false ? "Bloque visible." : "Bloque oculto.", "success");
        renderAll();
    }

    async function toggleSectionVisibility(sectionId) {
        const section = (state.page?.sections || []).find((item) => idOf(item) === String(sectionId));
        if (!section || !state.page) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/${encodeURIComponent(idOf(section))}`, {
            method: "PATCH",
            body: { isVisible: section.isVisible === false }
        });
        state.page = normalizePage(data.page);
        state.selectedSectionId = data.section?._id || idOf(section);
        AdminUI.toast(section.isVisible === false ? "Sección visible." : "Sección oculta.", "success");
        renderAll();
    }

    async function deleteBlock() {
        const block = getSelectedBlock();
        if (!block || !state.page) return;
        const ok = await AdminUI.confirmAction("¿Eliminar este bloque? Esta acción no se puede deshacer.");
        if (!ok) return;
        const data = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/blocks/${encodeURIComponent(idOf(block))}`, { method: "DELETE" });
        state.page = normalizePage(data.page);
        state.selectedBlockId = idOf(flattenBlocks()[0]) || "";
        AdminUI.toast("Bloque eliminado.", "success");
        renderAll();
    }

    async function reorderSectionsList(sections) {
        if (!state.page) return;
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/sections/reorder`, { method: "PUT", body: { sections: sections.map((section, index) => ({ sectionId: idOf(section), position: index + 1 })) } }));
        renderAll();
    }

    async function reorderBlocks(section, blocks) {
        if (!state.page || !section) return;
        state.page = normalizePage(await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/reorder`, { method: "PUT", body: { blocks: blocks.map((block, index) => ({ blockId: idOf(block), sectionId: idOf(section), position: index + 1 })) } }));
        renderAll();
    }

    async function moveSection(sectionId, direction) {
        const sections = sortByPosition(state.page?.sections || []);
        const index = sections.findIndex((section) => idOf(section) === String(sectionId));
        const target = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= sections.length) return;
        [sections[index], sections[target]] = [sections[target], sections[index]];
        await reorderSectionsList(sections);
    }

    async function moveBlock(blockId, direction) {
        const block = flattenBlocks().find((item) => idOf(item) === String(blockId));
        const section = (state.page?.sections || []).find((item) => idOf(item) === String(block?.sectionId));
        if (!section) return;
        const blocks = sortByPosition(section.blocks || []);
        const index = blocks.findIndex((item) => idOf(item) === String(blockId));
        const target = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= blocks.length) return;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        await reorderBlocks(section, blocks);
    }

    async function uploadToCloudinary(file, name = "editor-sitio") {
        const form = new FormData();
        form.append("imagenes", file);
        form.append("nombre", name);
        const data = await AdminAPI.request("/uploads/productos", { method: "POST", body: form });
        const url = data.urls?.[0] || data.assets?.[0]?.url || data.assets?.[0]?.secure_url || "";
        if (!url) throw new Error("Cloudinary no devolvió una URL válida.");
        return url;
    }

    async function uploadImage(field) {
        const input = document.querySelector(`[data-upload-target="${field}"]`);
        const urlInput = document.querySelector(`[data-content-field="${field}"]`);
        if (!input?.files?.[0]) return AdminUI.toast("Selecciona una imagen primero.", "warning");
        const url = await uploadToCloudinary(input.files[0], `editor-sitio-${field}`);
        urlInput.value = url;
        AdminUI.toast("Imagen subida. Guarda el bloque para aplicar el cambio.", "success");
    }

    async function uploadArrayImage(button) {
        const row = button.closest(".site-editor-repeater-item");
        const fileInput = row?.querySelector("[data-upload-array-list]");
        if (!fileInput?.files?.[0]) return AdminUI.toast("Selecciona una imagen primero.", "warning");
        const list = fileInput.dataset.uploadArrayList;
        const field = fileInput.dataset.uploadArrayField;
        const target = row.querySelector(`[data-array-list="${list}"][data-array-field="${field}"]`);
        const url = await uploadToCloudinary(fileInput.files[0], `editor-sitio-${list}-${field}`);
        if (target) target.value = url;
        AdminUI.toast("Imagen subida. Guarda el bloque para aplicar el cambio.", "success");
    }

    async function publishCurrentPage() {
        if (!state.page) return AdminUI.toast("Primero carga una página.", "warning");
        const ok = await AdminUI.confirmAction("¿Publicar los cambios de esta página en la tienda?");
        if (!ok) return;
        const button = $("#site-editor-publish-page");
        try {
            if (button) button.disabled = true;
            setStatus("Publicando cambios...", "");
            const result = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/publish`, { method: "POST", body: {} });
            state.page = normalizePage(result.page || result);
            await loadPages(state.page._id || state.page.key || state.page.slug);
            AdminUI.toast("Cambios publicados en la tienda.", "success");
            setStatus("Página publicada correctamente.", "success");
        } finally {
            if (button) button.disabled = false;
        }
    }

    async function loadHistoryPanel(openPanel = true) {
        if (!state.page) return;
        const panel = $("#site-editor-history-panel");
        const list = $("#site-editor-history-list");
        if (openPanel && panel) panel.open = true;
        if (list) list.innerHTML = `<div class="admin-empty small">Cargando historial...</div>`;
        const result = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/history`);
        const history = Array.isArray(result.history) ? result.history : [];
        if (!list) return;
        if (!history.length) {
            list.innerHTML = `<div class="admin-empty small">Todavía no hay publicaciones guardadas. Publica una vez para crear la primera versión.</div>`;
            return;
        }
        list.innerHTML = history.map((item) => `<article class="site-editor-history-item">
            <div>
                <strong>${escapeHtml(item.label || `Versión ${item.version || ""}`)}</strong>
                <span>${escapeHtml(formatDate(item.createdAt))} · ${Number(item.sectionsCount || 0)} secciones · ${Number(item.blocksCount || 0)} bloques</span>
            </div>
            <button class="admin-button secondary small" type="button" data-restore-revision="${escapeHtml(item.id)}">Restaurar</button>
        </article>`).join("");
    }

    async function restoreRevision(revisionId) {
        if (!state.page || !revisionId) return;
        const ok = await AdminUI.confirmAction("¿Restaurar esta versión como borrador? No se publicará hasta que presiones Publicar.");
        if (!ok) return;
        const result = await AdminAPI.request(`/admin/editor-sitio/pages/${encodeURIComponent(activePageKey())}/history/${encodeURIComponent(revisionId)}/restore`, { method: "POST", body: {} });
        state.page = normalizePage(result.page || result);
        state.selectedSectionId = idOf(state.page.sections[0]) || "";
        state.selectedBlockId = idOf(state.page.sections[0]?.blocks?.[0]) || "";
        await loadPages(state.page._id || state.page.key || state.page.slug);
        AdminUI.toast("Versión restaurada como borrador.", "success");
        setStatus("Versión restaurada. Publica para aplicarla en la tienda.", "success");
    }

    async function repairEditor() {
        const button = $("#site-editor-repair");
        try {
            if (button) button.disabled = true;
            setStatus("Reparando conexión del Editor del Sitio...", "");
            const result = await AdminAPI.request("/admin/editor-sitio/_repair", { method: "POST", body: {} });
            state.page = normalizePage(result.page || result);
            state.selectedSectionId = idOf(state.page.sections[0]) || "";
            state.selectedBlockId = idOf(state.page.sections[0]?.blocks?.[0]) || "";
            await loadPages(state.page._id || "home");
            AdminUI.toast("Editor del Sitio reparado y sincronizado.", "success");
            setStatus("Editor del Sitio reparado y conectado.", "success");
        } finally { if (button) button.disabled = false; }
    }

    function appendRepeaterRow(listName) {
        const root = $(`[data-array-list-root="${listName}"]`);
        if (!root) return;
        const index = root.querySelectorAll(".site-editor-repeater-item").length;
        root.insertAdjacentHTML("beforeend", repeaterRowHtml(listName, {}, index));
    }

    function refreshCurrentBlockFieldsForType() {
        const block = getSelectedBlock();
        if (!block) return;
        const type = normalizeType($("#block-type").value);
        const defaults = blockMeta(type);
        const temp = { ...block, type, name: block.name || defaults.name, content: { ...clone(defaults.content), ...clone(block.content) }, style: { ...clone(defaults.style), ...clone(block.style) } };
        $("#block-content-json").value = stringify(temp.content);
        $("#block-style-json").value = stringify(temp.style);
        if (!$("#block-name").value.trim()) $("#block-name").value = defaults.name;
        renderSpecificFields(temp);
    }

    function showError(error) {
        console.error(error);
        const status = error?.status ? `Error ${error.status}: ` : "";
        const detail = error?.details?.requestId ? ` · ID: ${error.details.requestId}` : "";
        const message = `${status}${error.message || "No fue posible completar la acción."}${detail}`;
        setStatus(message, "danger");
        AdminUI.toast(message, "danger");
    }

    function bindEvents() {
        $("#site-editor-refresh")?.addEventListener("click", () => loadPages(activePageKey()).catch(showError));
        $("#site-editor-repair")?.addEventListener("click", () => repairEditor().catch(showError));
        $("#site-editor-save-page")?.addEventListener("click", () => savePage().catch(showError));
        $("#site-editor-publish-page")?.addEventListener("click", () => publishCurrentPage().catch(showError));
        $("#site-editor-history")?.addEventListener("click", () => loadHistoryPanel(true).catch(showError));
        $("#site-editor-new-page")?.addEventListener("click", () => createPage().catch(showError));
        $("#site-editor-delete-page")?.addEventListener("click", () => deletePage().catch(showError));
        $("#site-editor-add-section")?.addEventListener("click", () => addSection().catch(showError));
        $("#site-editor-add-block")?.addEventListener("click", () => addBlock().catch(showError));
        $("#site-editor-block-form")?.addEventListener("submit", (event) => saveBlock(event).catch(showError));
        $("#site-editor-delete-block")?.addEventListener("click", () => deleteBlock().catch(showError));
        $("#site-editor-duplicate-block")?.addEventListener("click", () => duplicateBlock().catch(showError));
        $("#block-type")?.addEventListener("change", refreshCurrentBlockFieldsForType);

        document.addEventListener("click", async (event) => {
            const restore = event.target.closest("[data-restore-revision]");
            if (restore) { await restoreRevision(restore.dataset.restoreRevision).catch(showError); return; }
            const saveSectionButton = event.target.closest("#site-editor-save-section");
            if (saveSectionButton) { await saveSection().catch(showError); return; }
            const deleteSectionButton = event.target.closest("#site-editor-delete-section");
            if (deleteSectionButton) { await deleteSection().catch(showError); return; }
            const duplicateSectionButton = event.target.closest("#site-editor-duplicate-section");
            if (duplicateSectionButton) { await duplicateSection().catch(showError); return; }
            const duplicateSectionLayer = event.target.closest("[data-duplicate-section]");
            if (duplicateSectionLayer) { await duplicateSection(duplicateSectionLayer.dataset.duplicateSection).catch(showError); return; }
            const toggleSectionLayer = event.target.closest("[data-toggle-section]");
            if (toggleSectionLayer) { await toggleSectionVisibility(toggleSectionLayer.dataset.toggleSection).catch(showError); return; }
            const duplicateBlockLayer = event.target.closest("[data-duplicate-block]");
            if (duplicateBlockLayer) { await duplicateBlock(duplicateBlockLayer.dataset.duplicateBlock).catch(showError); return; }
            const toggleBlockLayer = event.target.closest("[data-toggle-block]");
            if (toggleBlockLayer) { await toggleBlockVisibility(toggleBlockLayer.dataset.toggleBlock).catch(showError); return; }
            const addRow = event.target.closest("[data-add-row]");
            if (addRow) { appendRepeaterRow(addRow.dataset.addRow); return; }
            const removeRow = event.target.closest("[data-remove-row]");
            if (removeRow) { removeRow.closest(".site-editor-repeater-item")?.remove(); return; }
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
            if (upload) { await uploadImage(upload.dataset.uploadButton).catch(showError); return; }
            const uploadArray = event.target.closest("[data-upload-array-button]");
            if (uploadArray) { await uploadArrayImage(uploadArray).catch(showError); }
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
            const section = (state.page.sections || []).find((item) => idOf(item) === String(target.dataset.sectionId));
            if (!section) return;
            const blocks = sortByPosition(section.blocks || []);
            const from = blocks.findIndex((block) => idOf(block) === String(state.draggedBlockId));
            const to = blocks.findIndex((block) => idOf(block) === String(target.dataset.blockId));
            if (from < 0 || to < 0 || from === to) return;
            const [moved] = blocks.splice(from, 1);
            blocks.splice(to, 0, moved);
            await reorderBlocks(section, blocks).catch(showError);
        });
    }

    async function init() {
        const blockSelect = $("#site-editor-new-block-type");
        if (blockSelect) blockSelect.innerHTML = renderBlockTypeOptions("product_marquee");
        const sectionSelect = $("#site-editor-new-section-type");
        if (sectionSelect) sectionSelect.innerHTML = renderSectionTypeOptions("products_section");
        bindEvents();
        await loadCatalogData();
        try { await loadPages("home"); }
        catch (error) {
            state.pages = [];
            state.page = null;
            renderPageList();
            showError(error);
            setStatus("No se pudo cargar el Editor del Sitio. Verifica que el backend v2.9 esté desplegado y presiona Reparar conexión.", "danger");
        }
        console.info(`Editor del Sitio ${VERSION} cargado`);
    }

    document.addEventListener("admin:ready", init);
})();
