"use strict";

(async function () {

  function renderDetailBadges(product) {
    const badges = Array.isArray(product.badges) ? product.badges : [];
    const html = badges.map((badge) => {
      const text = window.EmmaginaUI.escapeHtml(badge.texto || "");
      if (!text) return "";
      const background = window.EmmaginaUI.escapeHtml(badge.color || "#303744");
      const color = window.EmmaginaUI.escapeHtml(badge.textoColor || "#ffffff");
      return `<span class="product-badge" style="background:${background};color:${color};">${text}</span>`;
    }).filter(Boolean).join("");

    return html ? `<div class="product-badges" style="position:static;margin:10px 0 4px;">${html}</div>` : "";
  }
  const root = document.querySelector("[data-product-detail]");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const id = params.get("id");

  function render(product) {
    document.title = `${product.nombre} | Emmagina`;
    const images = product.imagenes?.length ? product.imagenes : [product.imagenPrincipal];
    root.innerHTML = `
      <div class="product-gallery">
        <div class="gallery-main"><img data-main-image src="${window.EmmaginaUI.escapeHtml(images[0])}" alt="${window.EmmaginaUI.escapeHtml(product.nombre)}"></div>
        <div class="gallery-thumbs">
          ${images.map((img, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" data-thumb="${index}"><img src="${window.EmmaginaUI.escapeHtml(img)}" alt="${window.EmmaginaUI.escapeHtml(product.nombre)} ${index + 1}"></button>`).join("")}
        </div>
      </div>
      <aside class="product-panel">
        <p class="kicker">${window.EmmaginaUI.escapeHtml(product.categoriaPrincipal || "Emmagina")}</p>
        <h1>${window.EmmaginaUI.escapeHtml(product.nombre)}</h1>
        ${renderDetailBadges(product)}
        <div class="detail-price"><strong>${window.EmmaginaData.formatPrice(product.precio)}</strong>${product.precioOriginal > product.precio ? `<span class="product-old-price">${window.EmmaginaData.formatPrice(product.precioOriginal)}</span>` : ""}</div>
        <p>${window.EmmaginaUI.escapeHtml(product.descripcion || product.descripcionCorta || "Producto impreso en 3D.")}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" type="button" data-add-cart="${window.EmmaginaUI.escapeHtml(product.id)}">Agregar al carrito</button>
          <a class="btn btn-soft" href="pedido-personalizado.html">Crear una escena personalizada</a>
        </div>
        <ul class="info-list">
          <li><strong>Disponibilidad:</strong> ${window.EmmaginaUI.escapeHtml(product.availabilityText || (product.personalizable ? "Fabricado a pedido" : "Producto visible en vitrina"))}</li>
          <li><strong>Material:</strong> Impresión 3D en PLA según producto.</li>
          <li><strong>Acabado:</strong> Puede incluir lijado y pintura artesanal según versión.</li>
          <li><strong>Importante:</strong> Las piezas personalizadas son interpretaciones artísticas inspiradas en referencias.</li>
        </ul>
      </aside>`;

    const main = root.querySelector("[data-main-image]");
    root.querySelectorAll("[data-thumb]").forEach((button) => {
      button.addEventListener("click", () => {
        root.querySelectorAll("[data-thumb]").forEach((b) => b.classList.remove("is-active"));
        button.classList.add("is-active");
        main.src = images[Number(button.dataset.thumb) || 0];
      });
    });
    window.EmmaginaUI.attachCartButtons([product]);
  }

  try {
    window.EmmaginaUI.setLoading(root, "Cargando producto...");
    let product = null;
    if (slug) product = await window.EmmaginaAPI.getProductBySlug(slug);
    else if (id) product = await window.EmmaginaAPI.getProductById(id);
    else throw new Error("Producto no especificado.");
    render(product);
  } catch (error) {
    console.error(error);
    window.EmmaginaUI.setError(root, "No fue posible cargar la ficha del producto.");
  }
})();
