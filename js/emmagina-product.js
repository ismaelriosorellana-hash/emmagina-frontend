"use strict";

(async function () {
  const root = document.querySelector("[data-product-detail]");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const id = params.get("id");
  const requestedVariant = params.get("variante") || params.get("variant");

  const escape = (value) => window.EmmaginaUI.escapeHtml(value);
  const money = (value) => window.EmmaginaData.formatPrice(value);

  let currentProduct = null;
  let currentVariant = null;
  let currentImages = [];

  function imageListFor(product, variant) {
    const variantImages = Array.isArray(variant?.imagenes) ? variant.imagenes : [];
    const generalImages = Array.isArray(product.imagenes) ? product.imagenes : [];
    const variantMain = variant?.imagenPrincipal ? [variant.imagenPrincipal] : [];
    const urls = [...variantMain, ...variantImages, ...generalImages]
      .map((item) => typeof item === "string" ? item : item?.url || item?.secure_url || item?.src || "")
      .filter(Boolean);
    return [...new Set(urls)].length ? [...new Set(urls)] : [product.imagenPrincipal].filter(Boolean);
  }

  function priceFor(product, variant) {
    return Number(variant?.precio ?? product.precioDesde ?? product.precio ?? 0);
  }

  function originalPriceFor(product, variant) {
    return Number(variant?.precioOriginal ?? product.precioOriginal ?? 0);
  }

  function stockFor(product, variant) {
    if (variant) return Number(variant.stockDisponible ?? variant.stock ?? 0) || 0;
    return Number(product.stockDisponible ?? product.stock ?? 0) || 0;
  }

  function stockText(product, variant) {
    const custom = variant?.estadoComercial || product.availabilityText || product.textoDisponibilidad;
    if (custom) return custom;
    const stock = stockFor(product, variant);
    if (product.fabricadoPedido || product.bajoPedido || product.personalizable) return "Fabricado a pedido";
    if (stock > 5) return "Disponible";
    if (stock > 0) return `Últimas ${stock} unidades`;
    return "Disponible bajo coordinación";
  }

  function renderDetailBadges(product) {
    const badges = Array.isArray(product.badges) ? product.badges : [];
    const html = badges.map((badge) => {
      const text = escape(badge.texto || "");
      if (!text) return "";
      const background = escape(badge.color || "#219EBC");
      const color = escape(badge.textoColor || "#ffffff");
      return `<span class="product-badge" style="background:${background};color:${color};">${text}</span>`;
    }).filter(Boolean).join("");

    return html ? `<div class="product-badges product-detail-badges">${html}</div>` : "";
  }

  function renderVariantSelector(product) {
    const variants = Array.isArray(product.variantes) ? product.variantes.filter((variant) => variant.activo !== false) : [];
    if (!variants.length) return "";

    return `
      <section class="pdp-card pdp-variant-panel" aria-label="Opciones del producto">
        <div class="pdp-section-heading">
          <span>Opciones</span>
          <strong data-selected-variant-name>${escape(currentVariant?.nombre || variants[0]?.nombre || "")}</strong>
        </div>
        <div class="pdp-variant-list">
          ${variants.map((variant, index) => {
            const selected = (currentVariant?.key || currentVariant?.id) === (variant.key || variant.id);
            const stock = stockFor(product, variant);
            const disabled = variant.activo === false;
            return `
              <button class="pdp-variant-option ${selected ? "is-selected" : ""}" type="button" data-variant-index="${index}" ${disabled ? "disabled" : ""}>
                ${variant.codigoHex ? `<span class="pdp-color-dot" style="background:${escape(variant.codigoHex)}"></span>` : ""}
                <span>
                  <strong>${escape(variant.nombre)}</strong>
                  <small>${money(priceFor(product, variant))}${stock > 0 ? ` · ${stock} disp.` : " · a pedido"}</small>
                </span>
              </button>`;
          }).join("")}
        </div>
      </section>`;
  }

  function renderCharacteristics(product) {
    const characteristics = Array.isArray(product.caracteristicas) ? product.caracteristicas : [];
    if (!characteristics.length) return "";
    return `
      <section class="pdp-card">
        <h2>Características</h2>
        <dl class="pdp-spec-grid">
          ${characteristics.map((item) => `
            <div>
              <dt>${escape(item.titulo || "Detalle")}</dt>
              <dd>${escape(item.valor || "")}</dd>
            </div>`).join("")}
        </dl>
      </section>`;
  }

  function renderBenefits(product) {
    const content = product.contenidoPDP || {};
    const benefits = Array.isArray(content.beneficios) ? content.beneficios : [];
    const title = content.tituloBeneficio || "Lo que debes saber";
    const text = content.textoBeneficio || "Producto preparado con cuidado para entregar una experiencia especial desde la compra hasta la entrega.";
    return `
      <section class="pdp-card pdp-benefits">
        <h2>${escape(title)}</h2>
        <p>${escape(text)}</p>
        ${benefits.length ? `<ul>${benefits.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}
      </section>`;
  }

  function renderCare(product) {
    const care = product.contenidoPDP?.cuidados || [];
    if (!Array.isArray(care) || !care.length) return "";
    return `
      <section class="pdp-card">
        <h2>Cuidados y recomendaciones</h2>
        <ul class="pdp-check-list">${care.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>
      </section>`;
  }

  function renderFaq(product) {
    const faqs = product.contenidoPDP?.preguntasFrecuentes || [];
    if (!Array.isArray(faqs) || !faqs.length) return "";
    return `
      <section class="pdp-card">
        <h2>Preguntas frecuentes</h2>
        <div class="pdp-faq-list">
          ${faqs.map((faq) => `
            <details>
              <summary>${escape(faq.pregunta)}</summary>
              <p>${escape(faq.respuesta)}</p>
            </details>`).join("")}
        </div>
      </section>`;
  }

  function renderDelivery(product) {
    const days = Number(currentVariant?.diasPreparacion || product.diasPreparacion || 3);
    return `
      <section class="pdp-card pdp-delivery-card">
        <h2>Entrega</h2>
        <div class="pdp-delivery-grid">
          <div><strong>${days} días hábiles</strong><span>Preparación estimada</span></div>
          <div><strong>Retiro o envío</strong><span>Según disponibilidad del producto</span></div>
          <div><strong>Confirmación</strong><span>Te contactaremos si falta algún dato</span></div>
        </div>
      </section>`;
  }

  function renderGallery(images, product) {
    const thumbs = images.map((img, index) => `
      <button type="button" class="${index === 0 ? "is-active" : ""}" data-thumb="${index}">
        <img src="${escape(img)}" alt="${escape(product.nombre)} ${index + 1}">
      </button>`).join("");

    return `
      <div class="product-gallery pdp-gallery">
        <div class="gallery-main pdp-main-image"><img data-main-image src="${escape(images[0])}" alt="${escape(product.nombre)}"></div>
        <div class="gallery-thumbs">${thumbs}</div>
      </div>`;
  }

  function selectedOptionPayload(product, variant) {
    if (!variant) return null;
    return {
      variantId: variant.key || variant.id || variant.sku || variant.nombre,
      variantName: variant.nombre,
      sku: variant.sku || "",
      type: variant.tipo || "opcion",
      options: variant.opciones || {},
      price: priceFor(product, variant),
      originalPrice: originalPriceFor(product, variant),
      image: variant.imagenPrincipal || product.imagenPrincipal,
      stock: stockFor(product, variant),
      status: stockText(product, variant),
      preparationDays: Number(variant.diasPreparacion || product.diasPreparacion || 3)
    };
  }

  function render(product) {
    currentProduct = product;
    const variants = Array.isArray(product.variantes) ? product.variantes.filter((variant) => variant.activo !== false) : [];
    currentVariant = variants.find((variant) => [variant.key, variant.id, variant.sku, variant.nombre].map(String).includes(String(requestedVariant))) || product.variantePredeterminada || variants[0] || null;
    currentImages = imageListFor(product, currentVariant);

    document.title = `${product.seo?.titulo || product.nombre} | Emmagina`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", product.seo?.descripcion || product.descripcionCorta || product.descripcion || "Producto Emmagina.");

    const price = priceFor(product, currentVariant);
    const original = originalPriceFor(product, currentVariant);
    const stock = stockFor(product, currentVariant);
    const buyMessage = product.contenidoPDP?.mensajeCompra || "Agrega al carrito y continúa con el checkout cuando esté disponible.";

    root.innerHTML = `
      <section class="pdp-shell">
        ${renderGallery(currentImages, product)}
        <aside class="product-panel pdp-buy-panel">
          <p class="kicker">${escape(product.categoriaPrincipal || "Emmagina")}</p>
          <h1>${escape(product.nombre)}</h1>
          ${renderDetailBadges(product)}
          <div class="detail-price" data-pdp-price>
            <strong>${product.tieneRangoPrecio && !currentVariant ? `Desde ${money(product.precioDesde)}` : money(price)}</strong>
            ${original > price ? `<span class="product-old-price">${money(original)}</span>` : ""}
          </div>
          <p class="pdp-short-description">${escape(product.descripcionCorta || product.descripcion || "Producto impreso en 3D por Emmagina.")}</p>
          <div class="pdp-status-row">
            <span class="pdp-status ${stock > 0 ? "is-available" : "is-custom"}">${escape(stockText(product, currentVariant))}</span>
            ${product.sku || currentVariant?.sku ? `<span>SKU: ${escape(currentVariant?.sku || product.sku)}</span>` : ""}
          </div>
          ${renderVariantSelector(product)}
          <div class="pdp-quantity-row">
            <label for="pdp-quantity">Cantidad</label>
            <input id="pdp-quantity" type="number" min="1" step="1" value="1">
          </div>
          <div class="detail-actions pdp-actions">
            <button class="btn btn-buy" type="button" data-pdp-add-cart>Agregar al carrito</button>
            <a class="btn btn-soft" href="pedido-personalizado.html">Crear una escena personalizada</a>
          </div>
          <p class="pdp-buy-note">${escape(buyMessage)}</p>
        </aside>
      </section>
      <section class="pdp-content-grid">
        <article class="pdp-card pdp-description-card">
          <h2>Descripción</h2>
          <p>${escape(product.descripcion || product.descripcionCorta || "Producto creado por Emmagina.")}</p>
        </article>
        ${renderBenefits(product)}
        ${renderCharacteristics(product)}
        ${renderDelivery(product)}
        ${renderCare(product)}
        ${renderFaq(product)}
      </section>
      <section class="pdp-related" data-related-products></section>`;

    attachEvents(product);
    loadRelated(product);
  }

  function updateVariant(index) {
    const variants = Array.isArray(currentProduct.variantes) ? currentProduct.variantes.filter((variant) => variant.activo !== false) : [];
    currentVariant = variants[Number(index)] || currentVariant;
    currentImages = imageListFor(currentProduct, currentVariant);

    const main = root.querySelector("[data-main-image]");
    if (main && currentImages[0]) main.src = currentImages[0];

    root.querySelectorAll("[data-thumb]").forEach((button) => button.remove());
    const thumbWrap = root.querySelector(".gallery-thumbs");
    if (thumbWrap) {
      thumbWrap.innerHTML = currentImages.map((img, i) => `
        <button type="button" class="${i === 0 ? "is-active" : ""}" data-thumb="${i}">
          <img src="${escape(img)}" alt="${escape(currentProduct.nombre)} ${i + 1}">
        </button>`).join("");
    }

    root.querySelector("[data-pdp-price]").innerHTML = `
      <strong>${money(priceFor(currentProduct, currentVariant))}</strong>
      ${originalPriceFor(currentProduct, currentVariant) > priceFor(currentProduct, currentVariant) ? `<span class="product-old-price">${money(originalPriceFor(currentProduct, currentVariant))}</span>` : ""}`;

    root.querySelector("[data-selected-variant-name]").textContent = currentVariant?.nombre || "";
    root.querySelectorAll("[data-variant-index]").forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.variantIndex) === Number(index));
    });

    const status = root.querySelector(".pdp-status");
    if (status) {
      status.textContent = stockText(currentProduct, currentVariant);
      status.classList.toggle("is-available", stockFor(currentProduct, currentVariant) > 0);
      status.classList.toggle("is-custom", stockFor(currentProduct, currentVariant) <= 0);
    }
  }

  function attachEvents(product) {
    const main = root.querySelector("[data-main-image]");
    root.addEventListener("click", (event) => {
      const thumb = event.target.closest("[data-thumb]");
      if (thumb && main) {
        root.querySelectorAll("[data-thumb]").forEach((button) => button.classList.remove("is-active"));
        thumb.classList.add("is-active");
        main.src = currentImages[Number(thumb.dataset.thumb) || 0];
        return;
      }

      const variantButton = event.target.closest("[data-variant-index]");
      if (variantButton) {
        updateVariant(variantButton.dataset.variantIndex);
        return;
      }

      const addButton = event.target.closest("[data-pdp-add-cart]");
      if (addButton) {
        const quantity = Number(root.querySelector("#pdp-quantity")?.value || 1) || 1;
        window.EmmaginaCart.add(product, quantity, selectedOptionPayload(product, currentVariant));
      }
    });
  }

  async function loadRelated(product) {
    const container = root.querySelector("[data-related-products]");
    if (!container || !product.id) return;
    try {
      const payload = await window.EmmaginaAPI.request(`/productos/${encodeURIComponent(product.id)}/relacionados?limit=4`);
      const products = (payload?.productos || []).map(window.EmmaginaData.normalizeProduct);
      if (!products.length) return;
      container.innerHTML = `
        <div class="section-heading"><p class="kicker">También te puede gustar</p><h2>Productos relacionados</h2></div>
        <div class="product-grid">${products.map(window.EmmaginaUI.productCard).join("")}</div>`;
      window.EmmaginaUI.attachCartButtons(products);
    } catch (error) {
      console.warn("No fue posible cargar relacionados", error);
    }
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
