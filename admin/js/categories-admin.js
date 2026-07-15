"use strict";

(function () {
    const state = {
        categories: [],
        heroBanner: null
    };

    const $ = (selector) => document.querySelector(selector);

    function slugify(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function getPayload() {
        return {
            nombre: $("#category-name").value.trim(),
            slug: $("#category-slug").value.trim() || slugify($("#category-name").value),
            descripcion: $("#category-description").value.trim(),
            icono: $("#category-icon").value.trim() || "fa-solid fa-tag",
            imagen: $("#category-image").value.trim(),
            color: $("#category-color").value || "#8E456A",
            orden: Number($("#category-order").value) || 0,
            activa: $("#category-active").checked,
            mostrarMenu: $("#category-menu").checked,
            mostrarInicio: $("#category-home").checked,
            destacada: $("#category-featured").checked,
            categoriaPadre: $("#category-parent").value || null
        };
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        if (element.type === "checkbox") {
            element.checked = Boolean(value);
        } else {
            element.value = value ?? "";
        }
    }

    function resetForm(category = null) {
        setValue("category-id", category?.id || "");
        setValue("category-name", category?.nombre || "");
        setValue("category-slug", category?.slug || "");
        setValue("category-description", category?.descripcion || "");
        setValue("category-icon", category?.icono || "fa-solid fa-tag");
        setValue("category-image", category?.imagen || "");
        setValue("category-color", category?.color || "#8E456A");
        setValue("category-order", category?.orden ?? 0);
        const parent = $("#category-parent");
        if (parent) {
            parent.innerHTML = `<option value="">Categoría principal</option>` + state.categories.filter(item => item.id !== category?.id && !item.categoriaPadre).map(item => `<option value="${AdminUI.escapeHtml(item.id)}">${AdminUI.escapeHtml(item.nombre)}</option>`).join("");
            parent.value = category?.categoriaPadre || "";
        }
        setValue("category-active", category ? category.activa !== false : true);
        setValue("category-menu", category ? category.mostrarMenu !== false : true);
        setValue("category-home", category ? category.mostrarInicio !== false : true);
        setValue("category-featured", Boolean(category?.destacada));

        $("#category-modal-title").textContent = category
            ? "Editar categoría"
            : "Nueva categoría";
    }

    function visibilityPill(label, enabled) {
        return `<span class="admin-pill ${enabled ? "success" : "muted"}">${label}</span>`;
    }

    function renderTable() {
        const container = $("#categories-table");
        if (!container) return;

        if (!state.categories.length) {
            container.innerHTML = `
                <div class="admin-empty">
                    Aún no hay categorías guardadas. Crea la primera para controlar el menú y el carrusel de inicio.
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="admin-table admin-categories-table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Slug</th>
                        <th>Visibilidad</th>
                        <th>Orden</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.categories.map((category) => `
                        <tr>
                            <td>
                                <div class="admin-category-name">
                                    <span class="admin-category-icon" style="--category-color:${AdminUI.escapeHtml(category.color || "#8E456A")}">
                                        <i class="${AdminUI.escapeHtml(category.icono || "fa-solid fa-tag")}" aria-hidden="true"></i>
                                    </span>
                                    <div>
                                        <strong>${category.categoriaPadre ? "↳ " : ""}${AdminUI.escapeHtml(category.nombre)}</strong>
                                        <small>${AdminUI.escapeHtml(category.descripcion || "Sin descripción")}</small>
                                    </div>
                                </div>
                            </td>
                            <td><span>${AdminUI.escapeHtml(category.slug || "—")}</span>${category.categoriaPadreNombre ? `<small class="category-parent-label">Subcategoría de ${AdminUI.escapeHtml(category.categoriaPadreNombre)}</small>` : ""}</td>
                            <td>
                                <div class="admin-pill-row">
                                    ${visibilityPill("Activa", category.activa !== false)}
                                    ${visibilityPill("Menú", category.mostrarMenu !== false)}
                                    ${visibilityPill("Inicio", category.mostrarInicio !== false)}
                                    ${visibilityPill("Destacada", Boolean(category.destacada))}
                                </div>
                            </td>
                            <td>${Number(category.orden || 0)}</td>
                            <td>
                                <div class="admin-actions">
                                    <button class="admin-button secondary small" type="button" data-edit-category="${AdminUI.escapeHtml(category.id)}">
                                        <i class="fa-solid fa-pen"></i>
                                        Editar
                                    </button>
                                    <button class="admin-button danger small" type="button" data-delete-category="${AdminUI.escapeHtml(category.id)}">
                                        <i class="fa-solid fa-trash"></i>
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    async function loadCategories() {
        try {
            const response = await AdminAPI.request("/admin/categorias");
            state.categories = Array.isArray(response?.categorias)
                ? response.categorias
                : [];
            renderTable();
        } catch (error) {
            AdminUI.toast(error.message, "danger");
        }
    }

    async function saveCategory(event) {
        event.preventDefault();

        const id = $("#category-id").value;
        const payload = getPayload();

        if (!payload.nombre) {
            AdminUI.toast("El nombre es obligatorio.", "warning");
            return;
        }

        try {
            await AdminAPI.request(
                id ? `/admin/categorias/${id}` : "/admin/categorias",
                {
                    method: id ? "PUT" : "POST",
                    body: payload
                }
            );

            AdminUI.closeModal("category-modal");
            AdminUI.toast("Categoría guardada.", "success");
            await loadCategories();
        } catch (error) {
            AdminUI.toast(error.message, "danger");
        }
    }

    async function deleteCategory(id) {
        const confirmed = await AdminUI.confirmAction(
            "¿Eliminar esta categoría? Los productos no se eliminarán, pero el acceso dejará de mostrarse."
        );

        if (!confirmed) return;

        try {
            await AdminAPI.request(`/admin/categorias/${id}`, {
                method: "DELETE"
            });
            AdminUI.toast("Categoría eliminada.", "success");
            await loadCategories();
        } catch (error) {
            AdminUI.toast(error.message, "danger");
        }
    }


    async function installBaseCategories() {
        const confirmed = await AdminUI.confirmAction(
            "Se crearán o actualizarán las 20 categorías base y las categorías antiguas quedarán desactivadas. Los productos no se eliminarán. ¿Continuar?"
        );
        if (!confirmed) return;
        try {
            const response = await AdminAPI.request("/admin/categorias/base", { method: "POST", body: {} });
            AdminUI.toast(response?.mensaje || "Categorías base instaladas.", "success");
            await loadCategories();
        } catch (error) {
            AdminUI.toast(error.message, "danger");
        }
    }


    function updateHeroPreview() {
        const preview = $("#hero-banner-preview");
        const url = $("#hero-banner-url")?.value.trim();
        if (!preview) return;
        preview.innerHTML = url ? `<img src="${AdminUI.escapeHtml(url)}" alt="Vista previa del Hero">` : "Sin imagen configurada";
    }

    async function loadHeroBanner() {
        try {
            const banners = await AdminAPI.request("/admin/banners");
            state.heroBanner = (Array.isArray(banners) ? banners : []).find(item => item.ubicacion === "hero-inicio") || null;
            setValue("hero-banner-url", state.heroBanner?.imagenEscritorio || "");
            setValue("hero-banner-button", state.heroBanner?.textoBoton || "Ver productos");
            setValue("hero-banner-target", state.heroBanner?.destino || "catalogo.html");
            setValue("hero-banner-position", state.heroBanner?.posicion || "center");
            setValue("hero-banner-active", state.heroBanner ? state.heroBanner.activo !== false : true);
            updateHeroPreview();
        } catch (error) {
            console.warn("No fue posible cargar el banner del Hero:", error);
        }
    }

    async function uploadHeroImage() {
        const file = $("#hero-banner-file")?.files?.[0];
        if (!file) { AdminUI.toast("Selecciona una imagen.", "warning"); return; }
        const form = new FormData(); form.append("imagenes", file); form.append("nombre", "hero-rhema");
        try {
            const data = await AdminAPI.request("/uploads/productos", { method: "POST", body: form });
            const url = data.urls?.[0] || data.assets?.[0]?.url || data.assets?.[0]?.secure_url || "";
            if (!url) throw new Error("No se recibió una URL válida.");
            $("#hero-banner-url").value = url; updateHeroPreview();
            AdminUI.toast("Imagen cargada. Guarda el banner.", "success");
        } catch (error) { AdminUI.toast(error.message, "danger"); }
    }

    async function saveHeroBanner(event) {
        event.preventDefault();
        const payload = {
            nombre: "Hero principal",
            ubicacion: "hero-inicio",
            titulo: "",
            eyebrow: "",
            textoBoton: $("#hero-banner-button").value.trim() || "Ver productos",
            destino: $("#hero-banner-target").value.trim() || "catalogo.html",
            imagenEscritorio: $("#hero-banner-url").value.trim(),
            imagenMovil: $("#hero-banner-url").value.trim(),
            posicion: $("#hero-banner-position").value || "center",
            activo: $("#hero-banner-active").checked,
            orden: 0
        };
        if (!payload.imagenEscritorio) { AdminUI.toast("Carga una imagen para el Hero.", "warning"); return; }
        try {
            const id = state.heroBanner?._id || state.heroBanner?.id;
            const saved = await AdminAPI.request(id ? `/admin/banners/${id}` : "/admin/banners", { method: id ? "PUT" : "POST", body: payload });
            state.heroBanner = saved; AdminUI.toast("Banner del Hero guardado.", "success");
        } catch (error) { AdminUI.toast(error.message, "danger"); }
    }

    function bindEvents() {
        $("#category-base")?.addEventListener("click", installBaseCategories);
        $("#hero-banner-form")?.addEventListener("submit", saveHeroBanner);
        $("#hero-banner-upload")?.addEventListener("click", uploadHeroImage);
        $("#hero-banner-url")?.addEventListener("input", updateHeroPreview);

        $("#category-new")?.addEventListener("click", () => {
            resetForm();
            AdminUI.openModal("category-modal");
        });

        $("#category-form")?.addEventListener("submit", saveCategory);

        $("#category-name")?.addEventListener("input", () => {
            const slug = $("#category-slug");
            if (slug.dataset.edited === "true") return;
            slug.value = slugify($("#category-name").value);
        });

        $("#category-slug")?.addEventListener("input", () => {
            $("#category-slug").dataset.edited = "true";
        });

        document.addEventListener("click", (event) => {
            const edit = event.target.closest("[data-edit-category]");
            if (edit) {
                const category = state.categories.find((item) => item.id === edit.dataset.editCategory);
                if (category) {
                    resetForm(category);
                    AdminUI.openModal("category-modal");
                }
                return;
            }

            const remove = event.target.closest("[data-delete-category]");
            if (remove) {
                deleteCategory(remove.dataset.deleteCategory);
            }
        });
    }

    document.addEventListener("admin:ready", () => {
        AdminUI.closeModal("category-modal");
        bindEvents();
        loadCategories();
        loadHeroBanner();
    });
})();
