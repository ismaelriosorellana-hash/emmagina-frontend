"use strict";

let adminProducts = [];
let variantCounter = 0;
let productSlugManuallyEdited = false;
let adminCategories = [];

const PRODUCT_TAB_LABELS = Object.freeze({
    general: "Información general",
    logistica: "Logística y despacho",
    seo: "SEO del producto",
    pdp: "Ficha venta",
    personalizacion: "Personalización",
    variantes: "Variantes"
});

document.addEventListener("admin:ready", () => {
    configureBulkProductTools();

    document.getElementById("product-new")
        ?.addEventListener("click", () => openProductForm());

    document.getElementById("product-refresh")
        ?.addEventListener("click", loadProducts);

    document.getElementById("product-search")
        ?.addEventListener("input", debounce(loadProducts, 300));

    document.getElementById("product-status")
        ?.addEventListener("change", loadProducts);

    document.getElementById("variant-add")
        ?.addEventListener("click", () => addVariant());

    document.getElementById("product-form")
        ?.addEventListener("submit", saveProduct);

    document.getElementById("product-upload-images")
        ?.addEventListener("click", uploadProductImages);

    document.getElementById("products-table")
        ?.addEventListener("click", handleTableClick);

    document.getElementById("product-variants")
        ?.addEventListener("click", handleVariantClick);

    document.getElementById("product-variants")
        ?.addEventListener("input", handleVariantInput);

    document.querySelectorAll("[data-product-tab]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                setActiveProductTab(button.dataset.productTab);
            });
        });

    document.getElementById("product-name")
        ?.addEventListener("input", handleProductNameInput);

    document.getElementById("product-slug")
        ?.addEventListener("input", () => {
            productSlugManuallyEdited = true;
            const input = document.getElementById("product-slug");
            input.value = slugify(input.value);
            updateProductFormStatus();
        });

    document.getElementById("product-slug-generate")
        ?.addEventListener("click", () => {
            const name = document.getElementById("product-name")?.value || "";
            document.getElementById("product-slug").value = slugify(name);
            productSlugManuallyEdited = false;
            updateProductFormStatus();
        });

    document.getElementById("product-sku")
        ?.addEventListener("input", (event) => {
            event.target.value = normalizeSkuClient(event.target.value);
            updateProductFormStatus();
        });

    document.getElementById("product-form")
        ?.addEventListener("input", updateProductFormStatus);

    document.getElementById("product-form")
        ?.addEventListener("change", updateProductFormStatus);

    loadAdminCategories();
    loadProducts();
});


async function loadAdminCategories() {
    try {
        const response = await AdminAPI.request("/admin/categorias");
        adminCategories = Array.isArray(response?.categorias) ? response.categorias : [];
        renderCategoryDatalist();
    } catch (error) {
        console.warn("No fue posible cargar categorías administrables:", error);
    }
}

function renderCategoryDatalist() {
    const list = document.getElementById("admin-product-categories-list");
    if (!list) return;

    list.innerHTML = adminCategories
        .filter((category) => category.activa !== false)
        .map((category) => `<option value="${AdminUI.escapeHtml(category.nombre)}"></option>`)
        .join("");
}

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140);
}

function normalizeSkuClient(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^[-._]+|[-._]+$/g, "")
        .slice(0, 80);
}

function numberFrom(id) {
    const value = Number(document.getElementById(id)?.value || 0);
    return Number.isFinite(value) ? value : 0;
}

function stringFrom(id) {
    return document.getElementById(id)?.value.trim() || "";
}

function checkedFrom(id) {
    return Boolean(document.getElementById(id)?.checked);
}

function setActiveProductTab(tabName = "general") {
    const safeTab = PRODUCT_TAB_LABELS[tabName] ? tabName : "general";

    document.querySelectorAll("[data-product-tab]")
        .forEach((button) => {
            const active = button.dataset.productTab === safeTab;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", String(active));
        });

    document.querySelectorAll("[data-product-panel]")
        .forEach((panel) => {
            const active = panel.dataset.productPanel === safeTab;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });

    const subtitle = document.getElementById("product-modal-subtitle");
    if (subtitle) subtitle.textContent = PRODUCT_TAB_LABELS[safeTab];
}

function handleProductNameInput() {
    if (!productSlugManuallyEdited) {
        document.getElementById("product-slug").value = slugify(
            document.getElementById("product-name").value
        );
    }

    updateProductFormStatus();
}

async function loadProducts() {
    const container = document.getElementById("products-table");
    AdminUI.showLoading(container, "Cargando productos...");

    try {
        const params = new URLSearchParams();
        const search = stringFrom("product-search");
        const status = document.getElementById("product-status")?.value || "";

        if (search) params.set("buscar", search);
        if (status) params.set("activo", status);

        const endpoint = `/admin/productos${params.toString() ? `?${params}` : ""}`;
        adminProducts = await AdminAPI.request(endpoint);
        renderProducts();
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(error.message)}
            </div>
        `;
    }
}

function firstImage(product) {
    const direct = Array.isArray(product.imagenes)
        ? product.imagenes[0]
        : null;

    if (typeof direct === "string") return direct;
    if (direct?.url) return direct.url;

    for (const variant of product.variantes || []) {
        const image = variant?.imagenes?.[0];
        if (typeof image === "string") return image;
        if (image?.url) return image.url;
        if (variant?.imagen) return variant.imagen;
    }

    return CONFIG.placeholderImage;
}

function productQuality(product) {
    const dimensions = product.dimensiones || {};
    const seo = product.seo || {};
    const checks = [
        Boolean(product.nombre),
        Number(product.precio) > 0,
        Boolean(product.sku),
        Boolean(product.categoriaPrincipal),
        String(product.descripcion || "").trim().length >= 40,
        normalizeImageUrls(product.imagenes).length > 0 || (product.variantes || []).some((item) => normalizeImageUrls(item.imagenes).length > 0),
        Number(product.pesoGramos) > 0,
        Number(dimensions.largoCm) > 0 && Number(dimensions.anchoCm) > 0 && Number(dimensions.altoCm) > 0,
        Boolean(seo.titulo),
        Boolean(seo.descripcion)
    ];

    const completed = checks.filter(Boolean).length;
    return {
        completed,
        total: checks.length,
        percent: Math.round((completed / checks.length) * 100)
    };
}

function renderProducts() {
    const container = document.getElementById("products-table");

    if (!adminProducts.length) {
        container.innerHTML = `<div class="admin-empty">No se encontraron productos.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table admin-product-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Ficha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${adminProducts.map((product) => {
                    const quality = productQuality(product);
                    const qualityClass = quality.percent >= 80
                        ? "success"
                        : quality.percent >= 50
                            ? "warning"
                            : "danger";

                    return `
                        <tr>
                            <td>
                                <div class="admin-table-product">
                                    <img src="${AdminUI.escapeHtml(firstImage(product))}" alt="">
                                    <div>
                                        <strong>${AdminUI.escapeHtml(product.nombre)}</strong>
                                        <small>SKU: ${AdminUI.escapeHtml(product.sku || "Pendiente")}</small>
                                        <small>${AdminUI.escapeHtml(product.marca || "Rhema Diseños")}</small>
                                    </div>
                                </div>
                            </td>
                            <td><strong>${AdminUI.money(product.precio)}</strong></td>
                            <td>
                                <span class="admin-status ${Number(product.stock) === 0 ? "danger" : Number(product.stock) <= 5 ? "warning" : "success"}">
                                    ${Number(product.stock) || 0}
                                </span>
                            </td>
                            <td>${AdminUI.escapeHtml(product.categoriaPrincipal || "—")}</td>
                            <td>
                                <span class="admin-status ${qualityClass}" title="${quality.completed} de ${quality.total} datos clave completos">
                                    ${quality.percent}%
                                </span>
                            </td>
                            <td>
                                <span class="admin-status ${product.activo !== false ? "success" : "danger"}">
                                    ${product.activo !== false ? "Activo" : "Inactivo"}
                                </span>
                            </td>
                            <td>
                                <div class="admin-toolbar-group">
                                    <button class="admin-button secondary small" type="button" data-edit-product="${product._id}">Editar</button>
                                    <button class="admin-button danger small" type="button" data-delete-product="${product._id}">Desactivar</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

function handleTableClick(event) {
    const edit = event.target.closest("[data-edit-product]");

    if (edit) {
        const product = adminProducts.find(
            (item) => String(item._id) === String(edit.dataset.editProduct)
        );
        openProductForm(product);
        return;
    }

    const remove = event.target.closest("[data-delete-product]");
    if (remove) deactivateProduct(remove.dataset.deleteProduct);
}

async function deactivateProduct(id) {
    if (!AdminUI.confirmAction("El producto dejará de aparecer en la tienda. ¿Continuar?")) {
        return;
    }

    try {
        await AdminAPI.request(`/admin/productos/${id}`, { method: "DELETE" });
        AdminUI.toast("Producto desactivado.", "success");
        loadProducts();
    } catch (error) {
        AdminUI.toast(error.message, "error");
    }
}

function setValue(id, value = "") {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
}

function setChecked(id, value) {
    const element = document.getElementById(id);
    if (element) element.checked = Boolean(value);
}

function openProductForm(product = null) {
    const form = document.getElementById("product-form");
    form.reset();
    setActiveProductTab("general");

    setValue("product-id", product?._id || "");
    document.getElementById("product-modal-title").textContent = product
        ? "Editar producto"
        : "Nuevo producto";

    setValue("product-name", product?.nombre || "");
    setValue("product-sku", product?.sku || "");
    setValue("product-brand", product?.marca || "Rhema Diseños");
    setValue("product-barcode", product?.codigoBarras || "");
    setValue("product-price", product?.precio ?? "");
    setValue("product-original-price", product?.precioOriginal || "");
    setValue("product-stock", product ? (product.stock ?? 0) : 10);
    setValue("product-order", product?.orden ?? 0);
    setValue("product-preparation-days", product?.diasPreparacion ?? 3);
    setValue("product-main-category", product?.categoriaPrincipal || "");
    setValue(
        "product-categories",
        Array.isArray(product?.categorias) ? product.categorias.join(", ") : product?.categorias || ""
    );
    setValue(
        "product-sizes",
        Array.isArray(product?.tallas) ? product.tallas.join(", ") : product?.tallas || ""
    );
    const primaryBadge = Array.isArray(product?.badges)
        ? product.badges.find((badge) => badge && badge.tipo !== "descuento")
        : null;
    const discountBadge = product?.badgeDescuento || {};

    setValue("product-badge", product?.insignia || primaryBadge?.texto || "");
    setValue("product-availability-text", product?.textoDisponibilidad || product?.availabilityText || "");
    setChecked("product-badge-enabled", primaryBadge ? primaryBadge.activo !== false : true);
    setValue("product-badge-order", primaryBadge?.orden ?? 1);
    setValue("product-badge-color", primaryBadge?.color || "#303744");
    setValue("product-badge-text-color", primaryBadge?.textoColor || "#ffffff");
    setChecked("product-discount-badge-enabled", discountBadge.activo !== false);
    setValue("product-discount-badge-text", discountBadge.texto || "");
    setValue("product-discount-badge-order", discountBadge.orden ?? 2);
    setValue("product-discount-badge-color", discountBadge.color || "#a87148");
    setValue("product-short-description", product?.descripcionCorta || product?.shortDescription || "");
    setValue("product-description", product?.descripcion || "");
    setValue("product-images", normalizeImageUrls(product?.imagenes).join("\n"));
    setValue("product-characteristics", characteristicsToText(product?.caracteristicas));

    const dimensions = product?.dimensiones || {};
    setValue("product-weight", product?.pesoGramos || "");
    setValue("product-length", dimensions.largoCm || "");
    setValue("product-width", dimensions.anchoCm || "");
    setValue("product-height", dimensions.altoCm || "");

    const slug = product?.slug || slugify(product?.nombre || "");
    setValue("product-slug", slug);
    productSlugManuallyEdited = Boolean(product);

    const seo = product?.seo || {};
    setValue("product-seo-title", seo.titulo || "");
    setValue("product-seo-description", seo.descripcion || "");
    setValue(
        "product-seo-keywords",
        Array.isArray(seo.palabrasClave) ? seo.palabrasClave.join(", ") : seo.palabrasClave || ""
    );
    setValue("product-seo-image", seo.imagen || "");
    setChecked("product-seo-noindex", seo.noIndex);

    const pdp = product?.contenidoPDP && typeof product.contenidoPDP === "object"
        ? product.contenidoPDP
        : {};
    setValue("product-benefit-title", pdp.tituloBeneficio || "");
    setValue("product-benefit-text", pdp.textoBeneficio || "");
    setValue("product-benefits", Array.isArray(pdp.beneficios) ? pdp.beneficios.join("\n") : "");
    setValue("product-care", Array.isArray(pdp.cuidados) ? pdp.cuidados.join("\n") : "");
    setValue("product-faqs", faqsToText(pdp.preguntasFrecuentes));
    setValue("product-buy-message", pdp.mensajeCompra || "");
    setValue("product-warranty", pdp.garantia || "");

    setChecked("product-active", product?.activo !== false);
    setChecked("product-publish", product?.publicarCatalogo !== false);
    setChecked("product-featured", product?.destacado);
    setChecked("product-scene-request", product?.habilitarEscenaPersonalizada);

    const delivery = product?.entrega && typeof product.entrega === "object"
        ? product.entrega
        : {};
    const shipping = delivery.envio && typeof delivery.envio === "object"
        ? delivery.envio
        : {};
    const pickup = delivery.retiro && typeof delivery.retiro === "object"
        ? delivery.retiro
        : {};

    setChecked("shipping-enabled", shipping.habilitado !== false);
    setValue(
        "shipping-instructions",
        shipping.instrucciones || CONFIG.DELIVERY_DEFAULTS.shipping.instructions
    );
    setChecked("pickup-enabled", pickup.habilitado !== false);
    setValue(
        "pickup-instructions",
        pickup.instrucciones || CONFIG.DELIVERY_DEFAULTS.pickup.instructions
    );

    const light = product?.personalizacionLigera && typeof product.personalizacionLigera === "object"
        ? product.personalizacionLigera
        : {};

    setChecked("light-enabled", light.habilitada);
    setChecked("light-name", light.permitirNombre);
    setChecked("light-image", light.permitirImagen);
    setChecked("light-observation", light.permitirObservacion);
    setValue("light-image-count", String(light.cantidadMaximaImagenes || 1));
    setValue("light-description", light.descripcion || "");
    setValue("light-notice", light.aviso || "");

    const variants = document.getElementById("product-variants");
    variants.innerHTML = "";
    variantCounter = 0;

    for (const variant of product?.variantes || []) {
        addVariant(variant, false);
    }

    updateVariantsEmptyState();
    updateProductFormStatus();
    AdminUI.openModal("product-modal");
}

function normalizeImageUrls(images) {
    if (!Array.isArray(images)) return [];

    return images
        .map((image) => {
            if (typeof image === "string") return image;
            return image?.url || image?.secure_url || image?.imagen || "";
        })
        .filter(Boolean);
}

function characteristicsToText(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "string") return item;
                return item?.titulo ? `${item.titulo}: ${item.valor || ""}` : "";
            })
            .filter(Boolean)
            .join("\n");
    }

    if (value && typeof value === "object") {
        return Object.entries(value)
            .map(([key, item]) => `${key}: ${item}`)
            .join("\n");
    }

    return value || "";
}

function addVariant(variant = {}, focus = true) {
    variantCounter += 1;
    const dimensions = variant.dimensiones || {};
    const container = document.getElementById("product-variants");
    const card = document.createElement("article");

    card.className = "admin-variant-card";
    card.dataset.variantIndex = String(variantCounter);
    card.innerHTML = `
        <div class="admin-variant-card-header">
            <div>
                <span>Variante</span>
                <strong>${variantCounter}</strong>
            </div>
            <button class="admin-button danger small" type="button" data-remove-variant>Quitar</button>
        </div>

        <div class="admin-form-grid">
            <div class="admin-field">
                <label>Nombre de la variante</label>
                <input data-variant-field="nombre" maxlength="120" value="${AdminUI.escapeHtml(variant.nombre || variant.color || "")}" placeholder="Ej. Azul marino / Tamaño M">
            </div>

            <div class="admin-field">
                <label>Tipo</label>
                <select data-variant-field="tipo">
                    <option value="opcion" ${String(variant.tipo || "opcion") === "opcion" ? "selected" : ""}>Opción</option>
                    <option value="color" ${String(variant.tipo || "") === "color" ? "selected" : ""}>Color</option>
                    <option value="talla" ${String(variant.tipo || "") === "talla" ? "selected" : ""}>Talla</option>
                    <option value="acabado" ${String(variant.tipo || "") === "acabado" ? "selected" : ""}>Acabado</option>
                    <option value="pack" ${String(variant.tipo || "") === "pack" ? "selected" : ""}>Pack</option>
                </select>
            </div>

            <div class="admin-field">
                <label>Código hexadecimal</label>
                <input data-variant-field="codigoHex" maxlength="20" value="${AdminUI.escapeHtml(variant.codigoHex || variant.colorHex || "")}" placeholder="#1E2A44">
            </div>

            <div class="admin-field">
                <label>Talla / tamaño</label>
                <input data-variant-field="talla" maxlength="80" value="${AdminUI.escapeHtml(variant.opciones?.talla || variant.opciones?.tamaño || variant.talla || "")}" placeholder="Ej. S, M, Grande">
            </div>

            <div class="admin-field">
                <label>Acabado</label>
                <input data-variant-field="acabado" maxlength="80" value="${AdminUI.escapeHtml(variant.opciones?.acabado || variant.acabado || "")}" placeholder="Ej. Pintado a mano">
            </div>

            <div class="admin-field">
                <label>Material</label>
                <input data-variant-field="material" maxlength="80" value="${AdminUI.escapeHtml(variant.opciones?.material || variant.material || "")}" placeholder="Ej. PLA">
            </div>

            <div class="admin-field">
                <label>SKU de variante</label>
                <input data-variant-field="sku" maxlength="80" value="${AdminUI.escapeHtml(variant.sku || "")}" placeholder="Se generará automáticamente">
            </div>

            <div class="admin-field">
                <label>Stock total</label>
                <input data-variant-field="stock" type="number" min="0" step="1" value="${Number(variant.stock ?? 0)}">
            </div>

            <div class="admin-field">
                <label>Stock reservado</label>
                <input data-variant-field="stockReservado" type="number" min="0" step="1" value="${Number(variant.stockReservado ?? 0)}">
            </div>

            <div class="admin-field">
                <label>Alerta stock bajo</label>
                <input data-variant-field="stockMinimo" type="number" min="0" step="1" value="${Number(variant.stockMinimo ?? 5)}">
            </div>

            <div class="admin-field">
                <label>Precio especial</label>
                <input data-variant-field="precio" type="number" min="0" step="1" value="${variant.precio ?? ""}" placeholder="Usar precio general">
            </div>

            <div class="admin-field">
                <label>Precio anterior variante</label>
                <input data-variant-field="precioOriginal" type="number" min="0" step="1" value="${variant.precioOriginal ?? ""}" placeholder="Opcional">
            </div>

            <div class="admin-field">
                <label>Estado visible</label>
                <input data-variant-field="estadoComercial" maxlength="80" value="${AdminUI.escapeHtml(variant.estadoComercial || "")}" placeholder="Disponible, Preventa, A pedido">
            </div>

            <div class="admin-field">
                <label>Peso embalado (g)</label>
                <input data-variant-field="pesoGramos" type="number" min="0" max="100000" step="1" value="${variant.pesoGramos || ""}" placeholder="Usar peso general">
            </div>

            <div class="admin-field">
                <label>Largo (cm)</label>
                <input data-variant-field="largoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.largoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field">
                <label>Ancho (cm)</label>
                <input data-variant-field="anchoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.anchoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field">
                <label>Alto (cm)</label>
                <input data-variant-field="altoCm" type="number" min="0" max="1000" step="0.1" value="${dimensions.altoCm || ""}" placeholder="General">
            </div>

            <div class="admin-field full">
                <label>Imágenes de la variante</label>
                <textarea data-variant-field="imagenes" rows="4" placeholder="Una URL por línea">${AdminUI.escapeHtml(normalizeImageUrls(variant.imagenes || [variant.imagen]).join("\n"))}</textarea>
            </div>
        </div>
    `;

    container.appendChild(card);
    updateVariantsEmptyState();
    updateProductFormStatus();

    if (focus) {
        card.querySelector('[data-variant-field="nombre"]')?.focus();
    }
}

function handleVariantClick(event) {
    const button = event.target.closest("[data-remove-variant]");
    if (!button) return;

    button.closest(".admin-variant-card")?.remove();
    updateVariantsEmptyState();
    updateProductFormStatus();
}

function handleVariantInput(event) {
    if (event.target.matches('[data-variant-field="sku"]')) {
        event.target.value = normalizeSkuClient(event.target.value);
    }

    updateProductFormStatus();
}

function updateVariantsEmptyState() {
    const hasVariants = document.querySelectorAll(".admin-variant-card").length > 0;
    const empty = document.getElementById("product-variants-empty");
    if (empty) empty.hidden = hasVariants;
}

function parseLineList(value) {
    return String(value || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseCharacteristics(value) {
    return parseLineList(value).map((line) => {
        const separator = line.indexOf(":");

        if (separator < 1) {
            return { titulo: "Detalle", valor: line };
        }

        return {
            titulo: line.slice(0, separator).trim(),
            valor: line.slice(separator + 1).trim()
        };
    });
}

function parseFaqs(value) {
    return parseLineList(value).map((line) => {
        const separator = line.indexOf("|");
        if (separator < 1) return null;
        return {
            pregunta: line.slice(0, separator).trim(),
            respuesta: line.slice(separator + 1).trim()
        };
    }).filter((item) => item && item.pregunta && item.respuesta);
}

function faqsToText(value) {
    if (!Array.isArray(value)) return "";
    return value.map((item) => {
        if (!item || typeof item !== "object") return "";
        return `${item.pregunta || ""} | ${item.respuesta || ""}`.trim();
    }).filter(Boolean).join("\n");
}

function collectVariants() {
    return [...document.querySelectorAll(".admin-variant-card")]
        .map((card) => {
            const get = (name) => card.querySelector(`[data-variant-field="${name}"]`)?.value.trim() || "";
            const name = get("nombre");
            if (!name) return null;

            const price = get("precio");
            const originalPrice = get("precioOriginal");
            const stock = Number(get("stock")) || 0;
            const reserved = Number(get("stockReservado")) || 0;

            return {
                key: normalizeSkuClient(get("sku")) || normalizeSkuClient(name),
                nombre: name,
                tipo: get("tipo") || "opcion",
                opciones: {
                    talla: get("talla"),
                    acabado: get("acabado"),
                    material: get("material")
                },
                codigoHex: get("codigoHex"),
                stock,
                stockReservado: reserved,
                stockDisponible: Math.max(0, stock - reserved),
                stockMinimo: Number(get("stockMinimo")) || 5,
                ...(price ? { precio: Number(price) } : {}),
                ...(originalPrice ? { precioOriginal: Number(originalPrice) } : {}),
                sku: normalizeSkuClient(get("sku")),
                activo: true,
                estadoComercial: get("estadoComercial"),
                pesoGramos: Number(get("pesoGramos")) || 0,
                dimensiones: {
                    largoCm: Number(get("largoCm")) || 0,
                    anchoCm: Number(get("anchoCm")) || 0,
                    altoCm: Number(get("altoCm")) || 0
                },
                imagenes: parseLineList(get("imagenes")).map((url, index) => ({
                    url,
                    principal: index === 0,
                    orden: index + 1
                }))
            };
        })
        .filter(Boolean);
}

function updateProductFormStatus() {
    const title = stringFrom("product-seo-title");
    const description = stringFrom("product-seo-description");
    const productName = stringFrom("product-name");
    const slug = stringFrom("product-slug") || slugify(productName);

    document.getElementById("product-seo-title-count").textContent = String(title.length);
    document.getElementById("product-seo-description-count").textContent = String(description.length);

    document.getElementById("product-seo-preview-title").textContent =
        title || `${productName || "Nombre del producto"} | Rhema Diseños`;

    document.getElementById("product-seo-preview-description").textContent =
        description || "Agrega una descripción SEO clara para explicar qué hace especial este producto.";

    document.getElementById("product-seo-preview-url").textContent =
        `rhemadisenos.cl/producto/${slug || "nombre-del-producto"}`;

    const checks = [
        { label: "nombre", ok: Boolean(productName) },
        { label: "precio", ok: numberFrom("product-price") > 0 },
        { label: "categoría", ok: Boolean(stringFrom("product-main-category")) },
        { label: "descripción", ok: stringFrom("product-description").length >= 40 || stringFrom("product-short-description").length >= 40 },
        {
            label: "imagen",
            ok:
                parseLineList(document.getElementById("product-images")?.value).length > 0 ||
                [...document.querySelectorAll(".admin-variant-card textarea[data-variant-field='imagenes']")]
                    .some((textarea) => parseLineList(textarea.value).length > 0)
        },
        { label: "peso", ok: numberFrom("product-weight") > 0 },
        { label: "medidas", ok: numberFrom("product-length") > 0 && numberFrom("product-width") > 0 && numberFrom("product-height") > 0 },
        { label: "título SEO", ok: Boolean(title) },
        { label: "descripción SEO", ok: Boolean(description) },
        { label: "método de entrega", ok: checkedFrom("shipping-enabled") || checkedFrom("pickup-enabled") }
    ];

    const completed = checks.filter((item) => item.ok).length;
    const percent = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((item) => !item.ok).map((item) => item.label);

    document.getElementById("product-completion-label").textContent = `Ficha ${percent}% completa`;
    document.getElementById("product-completion-help").textContent = missing.length
        ? `Pendiente: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : "."}`
        : "La ficha contiene todos los datos recomendados para esta etapa.";
    document.getElementById("product-completion-bar").style.width = `${percent}%`;
}


async function uploadProductImages() {
    const input = document.getElementById("product-image-files");
    const textarea = document.getElementById("product-images");
    const status = document.getElementById("product-upload-status");
    const button = document.getElementById("product-upload-images");

    const files = Array.from(input?.files || []);

    if (!files.length) {
        AdminUI.toast("Selecciona una o más imágenes para subir.", "error");
        return;
    }

    if (files.length > 5) {
        AdminUI.toast("Puedes subir máximo 5 imágenes por carga.", "error");
        return;
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    const invalid = files.find((file) => !allowed.has(file.type));

    if (invalid) {
        AdminUI.toast("Solo se permiten imágenes JPG, PNG o WEBP.", "error");
        return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("imagenes", file));

    const productSlug = stringFrom("product-slug") || slugify(stringFrom("product-name"));
    if (productSlug) formData.append("productSlug", productSlug);
    const productId = stringFrom("product-id");
    if (productId) formData.append("productId", productId);

    button.disabled = true;
    if (status) status.textContent = "Subiendo imágenes a Cloudinary...";

    try {
        const response = await AdminAPI.request("/uploads/productos", {
            method: "POST",
            body: formData
        });

        const urls = Array.isArray(response?.urls)
            ? response.urls
            : Array.isArray(response?.assets)
                ? response.assets.map((asset) => asset.url).filter(Boolean)
                : [];

        if (!urls.length) {
            throw new Error("Cloudinary no devolvió URLs válidas.");
        }

        const current = textarea.value.trim();
        textarea.value = [current, ...urls]
            .filter(Boolean)
            .join("\n");

        input.value = "";
        if (status) status.textContent = `${urls.length} imagen(es) subida(s). Guarda el producto para publicar los cambios.`;
        AdminUI.toast("Imágenes subidas a Cloudinary.", "success");
        updateProductFormStatus();
    } catch (error) {
        if (status) status.textContent = error.message || "No fue posible subir las imágenes.";
        AdminUI.toast(error.message || "No fue posible subir las imágenes.", "error");
    } finally {
        button.disabled = false;
    }
}

async function saveProduct(event) {
    event.preventDefault();

    const id = stringFrom("product-id");
    const lightEnabled = checkedFrom("light-enabled");
    const slug = stringFrom("product-slug") || slugify(stringFrom("product-name"));

    const data = {
        nombre: stringFrom("product-name"),
        slug,
        sku: normalizeSkuClient(stringFrom("product-sku")),
        marca: stringFrom("product-brand") || "Rhema Diseños",
        codigoBarras: stringFrom("product-barcode"),
        precio: numberFrom("product-price"),
        precioOriginal: numberFrom("product-original-price"),
        stock: numberFrom("product-stock"),
        orden: numberFrom("product-order"),
        diasPreparacion: Math.min(90, Math.max(1, numberFrom("product-preparation-days") || 3)),
        pesoGramos: Math.max(0, numberFrom("product-weight")),
        dimensiones: {
            largoCm: Math.max(0, numberFrom("product-length")),
            anchoCm: Math.max(0, numberFrom("product-width")),
            altoCm: Math.max(0, numberFrom("product-height"))
        },
        categoriaPrincipal: stringFrom("product-main-category"),
        categorias: stringFrom("product-categories")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        tallas: document.getElementById("product-sizes").value
            .split(/[,\n]/)
            .map((item) => item.trim().replace(/\s*-\s*/g, "-"))
            .filter((item, index, values) =>
                item &&
                /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+(?:-[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+)*$/.test(item) &&
                values.indexOf(item) === index
            ),
        insignia: stringFrom("product-badge"),
        textoDisponibilidad: stringFrom("product-availability-text"),
        badges: stringFrom("product-badge")
            ? [{
                tipo: "insignia",
                activo: checkedFrom("product-badge-enabled"),
                texto: stringFrom("product-badge"),
                color: stringFrom("product-badge-color") || "#303744",
                textoColor: stringFrom("product-badge-text-color") || "#ffffff",
                orden: numberFrom("product-badge-order") || 1
            }]
            : [],
        badgeDescuento: {
            tipo: "descuento",
            activo: checkedFrom("product-discount-badge-enabled"),
            texto: stringFrom("product-discount-badge-text"),
            color: stringFrom("product-discount-badge-color") || "#a87148",
            textoColor: "#ffffff",
            orden: numberFrom("product-discount-badge-order") || 2
        },
        descripcionCorta: stringFrom("product-short-description"),
        descripcion: stringFrom("product-description"),
        imagenes: parseLineList(document.getElementById("product-images").value)
            .map((url, index) => ({ url, principal: index === 0, orden: index + 1 })),
        caracteristicas: parseCharacteristics(document.getElementById("product-characteristics").value),
        activo: checkedFrom("product-active"),
        publicarCatalogo: checkedFrom("product-publish"),
        destacado: checkedFrom("product-featured"),
        habilitarEscenaPersonalizada: checkedFrom("product-scene-request"),
        seo: {
            titulo: stringFrom("product-seo-title"),
            descripcion: stringFrom("product-seo-description"),
            palabrasClave: stringFrom("product-seo-keywords")
                .split(/[,\n]/)
                .map((item) => item.trim())
                .filter(Boolean),
            imagen: stringFrom("product-seo-image"),
            noIndex: checkedFrom("product-seo-noindex")
        },
        contenidoPDP: {
            tituloBeneficio: stringFrom("product-benefit-title"),
            textoBeneficio: stringFrom("product-benefit-text"),
            beneficios: parseLineList(stringFrom("product-benefits")),
            cuidados: parseLineList(stringFrom("product-care")),
            preguntasFrecuentes: parseFaqs(stringFrom("product-faqs")),
            mensajeCompra: stringFrom("product-buy-message"),
            garantia: stringFrom("product-warranty")
        },
        entrega: {
            envio: {
                habilitado: checkedFrom("shipping-enabled"),
                instrucciones: stringFrom("shipping-instructions") || CONFIG.DELIVERY_DEFAULTS.shipping.instructions
            },
            retiro: {
                habilitado: checkedFrom("pickup-enabled"),
                instrucciones: stringFrom("pickup-instructions") || CONFIG.DELIVERY_DEFAULTS.pickup.instructions
            }
        },
        variantes: collectVariants(),
        personalizacionLigera: lightEnabled
            ? {
                habilitada: true,
                permitirNombre: checkedFrom("light-name"),
                permitirImagen: checkedFrom("light-image"),
                permitirObservacion: checkedFrom("light-observation"),
                cantidadMaximaImagenes: Number(document.getElementById("light-image-count").value) || 1,
                descripcion: stringFrom("light-description"),
                aviso: stringFrom("light-notice")
            }
            : { habilitada: false }
    };

    if (!data.nombre || data.precio < 0) {
        setActiveProductTab("general");
        AdminUI.toast("Revisa el nombre y el precio del producto.", "error");
        return;
    }

    if (!data.entrega.envio.habilitado && !data.entrega.retiro.habilitado) {
        setActiveProductTab("logistica");
        AdminUI.toast("Debes habilitar al menos un método de entrega.", "error");
        return;
    }

    const saveButton = document.getElementById("product-save");
    saveButton.disabled = true;

    try {
        const saved = await AdminAPI.request(
            id ? `/admin/productos/${id}` : "/admin/productos",
            {
                method: id ? "PATCH" : "POST",
                body: data
            }
        );

        AdminUI.toast(
            `Producto guardado. SKU: ${saved.sku || "generado"}.`,
            "success"
        );
        AdminUI.closeModal("product-modal");
        await loadProducts();
    } catch (error) {
        AdminUI.toast(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
}


let lastProductExcelPreviewValid = false;

function configureBulkProductTools() {
    const download = document.getElementById("product-template-download");
    if (download) {
        const base = String(window.CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
        download.href = `${base}/admin/productos/plantilla-excel?incluirActuales=true`;
        download.addEventListener("click", async (event) => {
            event.preventDefault();
            try {
                const response = await fetch(download.href, {
                    headers: { Authorization: `Bearer ${AdminAPI.getToken()}` }
                });
                if (!response.ok) throw new Error("No fue posible descargar la plantilla.");
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `plantilla-productos-rhema-${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            } catch (error) {
                AdminUI.toast(error.message, "error");
            }
        });
    }

    document.getElementById("product-excel-file")?.addEventListener("change", () => {
        lastProductExcelPreviewValid = false;
        const apply = document.getElementById("product-excel-apply");
        if (apply) apply.disabled = true;
        const result = document.getElementById("product-excel-result");
        if (result) result.innerHTML = "";
    });
    document.getElementById("product-excel-preview")?.addEventListener("click", () => submitProductExcel(false));
    document.getElementById("product-excel-apply")?.addEventListener("click", () => submitProductExcel(true));
}

async function submitProductExcel(applyChanges) {
    const fileInput = document.getElementById("product-excel-file");
    const file = fileInput?.files?.[0];
    if (!file) {
        AdminUI.toast("Selecciona una plantilla Excel.", "error");
        return;
    }
    if (applyChanges && !lastProductExcelPreviewValid) {
        AdminUI.toast("Primero ejecuta una vista previa sin errores.", "error");
        return;
    }
    if (applyChanges && !AdminUI.confirmAction("Se actualizará el catálogo según la plantilla. ¿Continuar?")) return;

    const previewButton = document.getElementById("product-excel-preview");
    const applyButton = document.getElementById("product-excel-apply");
    const result = document.getElementById("product-excel-result");
    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("aplicar", applyChanges ? "true" : "false");
    if (previewButton) previewButton.disabled = true;
    if (applyButton) applyButton.disabled = true;
    if (result) result.innerHTML = `<div class="admin-loading">${applyChanges ? "Aplicando cambios..." : "Validando plantilla..."}</div>`;

    try {
        const response = await AdminAPI.request("/admin/productos/importar-excel", { method: "POST", body: formData });
        const summary = response.resumen || {};
        const errors = response.errores || [];
        lastProductExcelPreviewValid = !applyChanges && errors.length === 0;
        if (applyButton) applyButton.disabled = !lastProductExcelPreviewValid;
        renderProductExcelResult(response);
        if (applyChanges) {
            lastProductExcelPreviewValid = false;
            await loadProducts();
            AdminUI.toast(`${response.aplicados?.length || 0} cambios aplicados.`, "success");
        } else {
            AdminUI.toast(errors.length ? "La plantilla contiene errores." : `${summary.filas || 0} filas listas para aplicar.`, errors.length ? "error" : "success");
        }
    } catch (error) {
        const details = error.details || {};
        renderProductExcelResult(details);
        lastProductExcelPreviewValid = false;
        AdminUI.toast(error.message, "error");
    } finally {
        if (previewButton) previewButton.disabled = false;
        if (applyButton && applyChanges) applyButton.disabled = true;
    }
}

function renderProductExcelResult(data = {}) {
    const container = document.getElementById("product-excel-result");
    if (!container) return;
    const summary = data.resumen || {};
    const errors = Array.isArray(data.errores) ? data.errores : [];
    const rows = Array.isArray(data.vistaPrevia) ? data.vistaPrevia : [];
    container.innerHTML = `
        <div class="admin-bulk-summary">
            <span><strong>${summary.filas || 0}</strong> filas</span>
            <span><strong>${summary.crear || 0}</strong> crear</span>
            <span><strong>${summary.actualizar || 0}</strong> actualizar</span>
            <span><strong>${summary.desactivar || 0}</strong> desactivar</span>
            <span class="${errors.length ? "is-error" : "is-ok"}"><strong>${errors.length}</strong> errores</span>
        </div>
        ${errors.length ? `<div class="admin-bulk-errors"><h4>Errores que debes corregir</h4>${errors.slice(0, 30).map((item) => `<p><strong>${AdminUI.escapeHtml(item.hoja || "Productos")} fila ${item.fila || "—"}:</strong> ${AdminUI.escapeHtml(item.campo || "Dato")} — ${AdminUI.escapeHtml(item.mensaje || "Error")}</p>`).join("")}</div>` : ""}
        ${rows.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fila</th><th>SKU</th><th>Producto</th><th>Acción</th><th>Resultado</th><th>Variantes</th></tr></thead><tbody>${rows.slice(0, 100).map((row) => `<tr><td>${row.fila}</td><td>${AdminUI.escapeHtml(row.sku)}</td><td>${AdminUI.escapeHtml(row.nombre)}</td><td>${AdminUI.escapeHtml(row.accion)}</td><td>${AdminUI.escapeHtml(row.resultado)}</td><td>${row.variantes || 0}</td></tr>`).join("")}</tbody></table></div>` : ""}
    `;
}
