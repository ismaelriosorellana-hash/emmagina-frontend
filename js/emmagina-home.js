"use strict";

(async function () {
  const DEFAULT_CATEGORIES = [
    "Librería y Escritorio", "Juguetería", "Coleccionables", "Decoración", "Hogar",
    "Memories", "Vasos", "Para regalar", "Educativos", "Infantiles", "Babies",
    "Cristianos", "Niños", "Niñas", "Mascotas", "Herramientas", "Utilidades",
    "Accesorios para automóvil", "Accesorios para celular", "Todos"
  ];

  const all = [];
  let publicBanners = [];

  function by(selector) { return document.querySelector(selector); }

  function escape(value) {
    return window.EmmaginaUI.escapeHtml(value);
  }

  function textKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function cleanUrl(value, fallback = "#") {
    const url = String(value || "").trim();
    if (!url) return fallback;
    if (/^javascript:/i.test(url)) return fallback;
    return url;
  }

  function getContent(block) {
    return block?.content && typeof block.content === "object" ? block.content : {};
  }

  function normalizeBlockType(value) {
    const raw = String(value || "").trim();
    const key = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const aliases = {
      "hero-banner": "hero_banner",
      "hero_banner": "hero_banner",
      "hero": "hero_banner",
      "banner-principal": "hero_banner",
      "category-sidebar": "category_sidebar",
      "category_sidebar": "category_sidebar",
      "categorias": "category_sidebar",
      "lista-categorias": "category_sidebar",
      "category-grid": "category_grid",
      "category_grid": "category_grid",
      "grilla-categorias": "category_grid",
      "info-cards": "info_cards",
      "info_cards": "info_cards",
      "bloques-informativos": "info_cards",
      "tarjetas-informativas": "info_cards",
      "product-marquee": "product_marquee",
      "product_marquee": "product_marquee",
      "carrusel-productos": "product_marquee",
      "product-grid": "product_grid",
      "product_grid": "product_grid",
      "grilla-productos": "product_grid",
      "image-banner": "image_banner",
      "image_banner": "image_banner",
      "banner-imagen": "image_banner",
      "reviews-marquee": "reviews_marquee",
      "reviews_marquee": "reviews_marquee",
      "resenas": "reviews_marquee",
      "carrusel-resenas": "reviews_marquee",
      "html-block": "html_block",
      "html_block": "html_block",
      "custom-html": "custom_html",
      "custom_html": "custom_html",
      "contenido-html": "custom_html",
      "text-block": "text_block",
      "text_block": "text_block",
      "texto": "text_block",
      "faq-block": "faq_block",
      "faq_block": "faq_block",
      "contact-block": "contact_block",
      "contact_block": "contact_block",
      "cart-summary": "cart_summary",
      "cart_summary": "cart_summary",
      "checkout-form": "checkout_form",
      "checkout_form": "checkout_form",
      "spacer": "spacer",
      "separador": "spacer"
    };
    return aliases[key] || aliases[raw] || key.replace(/-/g, "_") || "custom_html";
  }

  function getStyle(block) {
    return block?.style && typeof block.style === "object" ? block.style : {};
  }

  function spacingStyle(source) {
    const style = getStyle(source);
    const parts = [];
    if (Number.isFinite(Number(style.marginTop))) parts.push(`margin-top:${Number(style.marginTop)}px`);
    if (Number.isFinite(Number(style.marginBottom))) parts.push(`margin-bottom:${Number(style.marginBottom)}px`);
    if (Number.isFinite(Number(style.paddingTop))) parts.push(`padding-top:${Number(style.paddingTop)}px`);
    if (Number.isFinite(Number(style.paddingBottom))) parts.push(`padding-bottom:${Number(style.paddingBottom)}px`);
    return parts.length ? ` style="${parts.join(";")}"` : "";
  }

  function uniqueById(list) {
    const seen = new Set();
    return list.filter((product) => {
      const key = String(product.id || product.slug || product.nombre || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function productKeys(product = {}) {
    return [product.id, product._id, product.slug, product.nombre, product.sku].filter(Boolean).map((value) => String(value));
  }

  function categoryMatchesProduct(product = {}, category = "") {
    const key = textKey(category).replace(/[^a-z0-9]+/g, "");
    if (!key) return false;
    const categories = [product.categoriaPrincipal, ...(Array.isArray(product.categorias) ? product.categorias : [])].filter(Boolean);
    return categories.some((cat) => {
      const value = textKey(cat);
      const compact = value.replace(/[^a-z0-9]+/g, "");
      return compact === key || compact.includes(key) || key.includes(compact);
    });
  }

  function selectProductsForBlock(content = {}, products = [], limit = 14) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const source = String(content.source || "filter");
    const ids = Array.isArray(content.productIds) ? content.productIds.map(String).filter(Boolean) : [];
    if (source === "manual" && ids.length) {
      const selected = visible.filter((product) => productKeys(product).some((key) => ids.includes(String(key))));
      return selected.slice(0, limit);
    }
    if (source === "category" && (content.categorySlug || content.categoryName || content.category)) {
      const category = content.categorySlug || content.categoryName || content.category;
      return fillMarqueeList(visible.filter((product) => categoryMatchesProduct(product, category)), visible, 4, limit);
    }
    return sectionProducts(content.filter || content.grupo || content.category || "todos", products, limit);
  }

  function bannerImage(banner) {
    return banner?.imagenEscritorio || banner?.imagen || banner?.image || banner?.url || "";
  }

  function bannerTarget(banner, fallback = "catalogo.html") {
    return banner?.destino || banner?.urlDestino || banner?.link || fallback;
  }

  function matchBanner(ubicacion, fallbackWords = []) {
    const words = fallbackWords.map(textKey);
    return publicBanners.find((banner) => banner?.activo !== false && banner.ubicacion === ubicacion)
      || publicBanners.find((banner) => {
        const key = textKey(`${banner?.nombre || ""} ${banner?.titulo || ""} ${banner?.eyebrow || ""}`);
        return banner?.activo !== false && words.some((word) => key.includes(word));
      })
      || null;
  }

  function bannersByLocation(ubicacion) {
    return publicBanners
      .filter((banner) => banner?.activo !== false && banner.ubicacion === ubicacion)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
  }

  function fillMarqueeList(selected, products, minItems = 8, limit = 14) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const base = uniqueById(selected.filter(window.EmmaginaData.isVisible));
    const selectedKeys = new Set(base.map((p) => String(p.id || p.slug || p.nombre || "")));
    const fillers = visible.filter((p) => !selectedKeys.has(String(p.id || p.slug || p.nombre || "")));
    const merged = base.concat(fillers);
    if (!merged.length) return [];
    const target = Math.min(Math.max(minItems, Math.min(limit, visible.length || minItems)), limit);
    const result = [];
    let i = 0;
    while (result.length < target) {
      result.push(merged[i % merged.length]);
      i += 1;
      if (merged.length === result.length && result.length >= minItems) break;
    }
    return result.slice(0, limit);
  }

  function sectionProducts(kind, products, limit = 14) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const key = textKey(kind);
    let selected = [];

    if (key === "destacados" || key === "featured") {
      selected = visible.filter((p) => p.destacado || textKey(p.insignia).includes("destacado"));
    } else if (key === "desde14990" || key === "desde-14990" || key === "entrada") {
      selected = visible.filter((p) => p.desde14990 || Number(p.precio) <= 14990);
    } else if (key === "lanzamiento" || key === "novedades") {
      selected = visible.filter((p) => p.lanzamiento || textKey(p.insignia).includes("lanzamiento"));
    } else if (key === "vendidos" || key === "masvendido" || key === "mas-vendido" || key === "mas vendidos") {
      selected = visible.filter((p) => p.masVendido);
    } else if (key === "vistos" || key === "masvisto" || key === "mas-visto" || key === "mas vistos") {
      selected = visible.filter((p) => p.masVisto);
    } else if (key.startsWith("categoria:")) {
      const category = key.replace("categoria:", "").trim();
      selected = visible.filter((p) => p.categorias?.some((cat) => textKey(cat) === category));
    } else if (key && key !== "todos") {
      selected = visible.filter((p) => p.categorias?.some((cat) => textKey(cat).includes(key)) || textKey(p.nombre).includes(key));
    } else {
      selected = visible;
    }

    return fillMarqueeList(selected, visible, 8, limit);
  }

  function renderMarqueeTrack(track, products, emptyMessage = "No hay productos disponibles por ahora.") {
    if (!track) return;
    if (!products.length) {
      track.innerHTML = `<div class="state-box"><p>${escape(emptyMessage)}</p></div>`;
      return;
    }
    const cards = products.map((p) => window.EmmaginaUI.productCard(p)).join("");
    track.innerHTML = `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`;
    track.style.setProperty("--marquee-duration", `${Math.max(34, products.length * 6)}s`);
    window.EmmaginaUI.attachCartButtons(all);
  }

  function renderProductMarquee(id, title, products) {
    const root = by(`[data-home-marquee='${id}']`);
    if (!root) return;
    const track = root.querySelector("[data-marquee-track]");
    const selected = products.length ? products : all.slice(0, 12);
    renderMarqueeTrack(track, selected, `No hay productos disponibles para ${title}.`);
  }

  function categoriesHtml(categories = DEFAULT_CATEGORIES) {
    const list = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
    return list.map((item) => {
      const label = typeof item === "string" ? item : item?.label || item?.nombre || "Categoría";
      const href = typeof item === "string"
        ? (label === "Todos" ? "catalogo.html" : `catalogo.html?categoria=${encodeURIComponent(label)}`)
        : cleanUrl(item?.href || item?.url || item?.link, `catalogo.html?categoria=${encodeURIComponent(label)}`);
      const childClass = category.categoriaPadre ? " is-subcategory" : "";
      return `<a class="${childClass.trim()}" href="${escape(href)}"><span>${category.categoriaPadre ? "↳ " : ""}${escape(label)}</span></a>`;
    }).join("");
  }

  function imageFromContent(content, fallback = window.CONFIG.placeholderImage) {
    return content.imageDesktop || content.image || content.imagen || content.imageUrl || content.url || fallback;
  }

  function renderCategorySidebarBlock(block) {
    const content = getContent(block);
    const style = getStyle(block);
    const categories = content.categories || content.categorias || DEFAULT_CATEGORIES;
    const hiddenMobile = style.mobileVisible === false ? " category-panel-mobile-hidden" : "";
    return `<aside class="category-panel${hiddenMobile}" aria-label="Categorías principales" data-block-id="${escape(block._id || block.id || "")}">
      <h2>${escape(content.heading || content.title || "Categorías")}</h2>
      <nav class="category-list">${categoriesHtml(categories)}</nav>
      ${content.showViewAll === false ? "" : `<a class="category-view-all" href="${escape(cleanUrl(content.viewAllUrl, "catalogo.html"))}">${escape(content.viewAllText || "Ver todas")}</a>`}
    </aside>`;
  }

  function renderCategoryGridBlock(block) {
    const content = getContent(block);
    const categories = content.categories || content.categorias || DEFAULT_CATEGORIES;
    return `<section class="section section-muted builder-section category-grid-section" data-block-id="${escape(block._id || block.id || "")}">
      <div class="section-heading"><div><p class="kicker">Rhema Diseños</p><h2>${escape(content.title || content.heading || "Categorías")}</h2></div></div>
      <div class="explore-grid">${categories.slice(0, 12).map((item) => {
        const label = typeof item === "string" ? item : item?.label || item?.nombre || "Categoría";
        const href = typeof item === "string" ? `catalogo.html?categoria=${encodeURIComponent(label)}` : cleanUrl(item?.href || item?.url, `catalogo.html?categoria=${encodeURIComponent(label)}`);
        const image = typeof item === "object" ? item?.image || item?.imagen || window.CONFIG.placeholderImage : window.CONFIG.placeholderImage;
        return `<a class="explore-card" href="${escape(href)}"><img class="explore-image" src="${escape(image)}" alt="${escape(label)}" loading="lazy"><h3>${escape(label)}</h3></a>`;
      }).join("")}</div>
    </section>`;
  }

  function renderHeroBlock(block, options = {}) {
    const content = getContent(block);
    const style = getStyle(block);
    const heightDesktop = Math.max(160, Math.min(760, toNumber(style.heightDesktop || content.heightDesktop, 323)));
    const image = imageFromContent(content, "assets/producto-referencia-emmagina.png");
    const title = content.title || "Ideas que toman forma";
    const subtitle = content.subtitle || content.eyebrow || "Impresión 3D · regalos · recuerdos";
    const buttonText = content.buttonText || "Ver tienda";
    const buttonUrl = cleanUrl(content.buttonUrl || content.url || content.href, "catalogo.html");
    const categories = content.categories || content.categorias || DEFAULT_CATEGORIES;
    const includeCategories = options.includeCategories !== false;

    return `<section class="hero-section builder-section" data-block-id="${escape(block._id || block.id || "")}">
      <div class="hero-layout ${includeCategories ? "" : "hero-layout-single"}" style="--hero-height:${heightDesktop}px">
        ${includeCategories ? `<aside class="category-panel" aria-label="Categorías principales"><h2>${escape(content.categoryTitle || "Categorías")}</h2><nav class="category-list">${categoriesHtml(categories)}</nav></aside>` : ""}
        <a class="hero-card hero-card-banner" href="${escape(buttonUrl)}" aria-label="${escape(title)}">
          <img src="${escape(image)}" alt="${escape(content.alt || title)}" loading="eager" style="object-position:${escape(content.imagePosition || style.objectPosition || "center")}">
          <span class="hero-overlay"><span class="kicker">${escape(subtitle)}</span><strong>${escape(title)}</strong><span class="hero-button">${escape(buttonText)}</span></span>
        </a>
      </div>
    </section>`;
  }

  function renderHeroCardOnly(block) {
    const content = getContent(block);
    const style = getStyle(block);
    const image = imageFromContent(content, "assets/producto-referencia-emmagina.png");
    const title = content.title || "Ideas que toman forma";
    const subtitle = content.subtitle || content.eyebrow || "Impresión 3D · regalos · recuerdos";
    const buttonText = content.buttonText || "Ver tienda";
    const buttonUrl = cleanUrl(content.buttonUrl || content.url || content.href, "catalogo.html");
    return `<a class="hero-card hero-card-banner" href="${escape(buttonUrl)}" aria-label="${escape(title)}" data-block-id="${escape(block._id || block.id || "")}">
      <img src="${escape(image)}" alt="${escape(content.alt || title)}" loading="eager" style="object-position:${escape(content.imagePosition || style.objectPosition || "center")}">
      <span class="hero-overlay"><span class="kicker">${escape(subtitle)}</span><strong>${escape(title)}</strong><span class="hero-button">${escape(buttonText)}</span></span>
    </a>`;
  }

  function renderInfoCardsBlock(block) {
    const content = getContent(block);
    const cards = Array.isArray(content.cards) && content.cards.length ? content.cards : [
      { title: "Destacados", text: "Productos seleccionados para regalar o decorar.", image: "" },
      { title: "Los más vendidos", text: "Lo favorito de nuestros clientes.", image: "" },
      { title: "Los más vistos", text: "Opciones que más despiertan interés.", image: "" }
    ];

    return `<section class="section section-muted home-info-section builder-section" data-block-id="${escape(block._id || block.id || "")}" aria-labelledby="info-${escape(block._id || block.id || "block")}">
      <div class="section-heading">
        <div><p class="kicker">${escape(content.kicker || "Información")}</p><h2 id="info-${escape(block._id || block.id || "block")}">${escape(content.title || "Explora Rhema Diseños")}</h2></div>
      </div>
      <div class="explore-grid">
        ${cards.slice(0, 6).map((card) => {
          const title = card.title || card.titulo || "Información";
          const text = card.text || card.descripcion || card.description || "Conoce una sección de Rhema Diseños.";
          const image = card.image || card.imagen || card.url || window.CONFIG.placeholderImage;
          const href = cleanUrl(card.href || card.urlDestino || card.link, "catalogo.html");
          return `<a class="explore-card" href="${escape(href)}">
            <img class="explore-image" src="${escape(image)}" alt="${escape(title)}" loading="lazy">
            <h3>${escape(title)}</h3>
            <p>${escape(text)}</p>
          </a>`;
        }).join("")}
      </div>
    </section>`;
  }

  function renderProductMarqueeBlock(block, products) {
    const content = getContent(block);
    const title = content.title || block.name || "Productos";
    const filter = content.filter || content.grupo || content.category || "todos";
    const limit = Math.max(4, Math.min(30, toNumber(content.limit, 14)));
    const selected = selectProductsForBlock(content, products, limit);
    const cards = selected.map((p) => window.EmmaginaUI.productCard(p)).join("");
    const track = selected.length
      ? `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`
      : `<div class="state-box"><p>No hay productos disponibles por ahora.</p></div>`;
    const duration = Math.max(34, selected.length * 6);

    return `<section class="section section-muted product-marquee builder-section" data-block-id="${escape(block._id || block.id || "")}" aria-label="${escape(title)}"${spacingStyle(block)}>
      <header class="carousel-head"><div><p class="kicker">${escape(content.kicker || "Rhema Diseños")}</p><h2>${escape(title)}</h2></div></header>
      <div class="marquee-viewport"><div class="marquee-track" style="--marquee-duration:${duration}s">${track}</div></div>
    </section>`;
  }

  function renderProductGridBlock(block, products) {
    const content = getContent(block);
    const title = content.title || block.name || "Productos";
    const filter = content.filter || content.grupo || content.category || "todos";
    const limit = Math.max(4, Math.min(36, toNumber(content.limit, 12)));
    const selected = selectProductsForBlock(content, products, limit).slice(0, limit);
    const cards = selected.map((p) => window.EmmaginaUI.productCard(p)).join("");
    return `<section class="section section-muted builder-section product-grid-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}>
      <header class="carousel-head"><div><p class="kicker">${escape(content.kicker || "Rhema Diseños")}</p><h2>${escape(title)}</h2></div></header>
      ${selected.length ? `<div class="product-grid">${cards}</div>` : `<div class="state-box"><p>No hay productos disponibles por ahora.</p></div>`}
    </section>`;
  }

  function renderImageBannerBlock(block) {
    const content = getContent(block);
    const style = getStyle(block);
    const title = content.title || block.name || "Rhema Diseños";
    const image = imageFromContent(content, "assets/producto-referencia-emmagina.png");
    const href = cleanUrl(content.buttonUrl || content.href || content.url, "pedido-personalizado.html");
    const buttonText = content.buttonText || "Pedir el mío";
    const height = Math.max(54, Math.min(360, toNumber(style.heightDesktop || content.heightDesktop, 112)));

    return `<section class="section scene-lines-section builder-section" data-block-id="${escape(block._id || block.id || "")}">
      <a class="line-banner" href="${escape(href)}" aria-label="${escape(title)}" style="height:${height}px">
        <img src="${escape(image)}" alt="${escape(content.alt || title)}" loading="lazy" style="object-position:${escape(content.imagePosition || style.objectPosition || "center")}">
        <span class="line-banner-button">${escape(buttonText)}</span>
      </a>
    </section>`;
  }

  function normalizeReview(product, review = {}) {
    const rating = Number(review.rating || review.estrellas || review.puntuacion || review.score || 0);
    const text = String(review.texto || review.comentario || review.review || review.descripcion || "").trim();
    if (!text || rating < 4) return null;
    return {
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      text,
      author: String(review.nombre || review.autor || review.cliente || "Cliente Rhema Diseños").trim(),
      productName: product.nombre,
      productUrl: window.ProductLinks.detail(product)
    };
  }

  function collectReviews(products, minRating = 4) {
    const reviews = [];
    for (const product of products) {
      const raw = product.raw || product;
      const list = raw.resenas || raw.reseñas || raw.reviews || raw.valoraciones || [];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const normalized = normalizeReview(product, item);
        if (normalized && normalized.rating >= minRating) reviews.push(normalized);
      }
    }
    return reviews.sort((a, b) => b.rating - a.rating).slice(0, 12);
  }

  function renderReviewsBlock(block, products) {
    const content = getContent(block);
    const title = content.title || "Mejores reseñas";
    const reviews = collectReviews(products, toNumber(content.minRating, 4));
    if (!reviews.length && content.hideWhenEmpty !== false) return "";
    const cards = reviews.map((review) => {
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
      return `<article class="review-card">
        <div class="review-stars" aria-label="${review.rating} de 5 estrellas">${stars}</div>
        <blockquote>“${escape(review.text)}”</blockquote>
        <footer><strong>${escape(review.author)}</strong><a href="${escape(review.productUrl)}">${escape(review.productName)}</a></footer>
      </article>`;
    }).join("") || `<div class="state-box"><p>Aún no hay reseñas visibles.</p></div>`;

    return `<section class="section reviews-marquee builder-section" data-block-id="${escape(block._id || block.id || "")}" aria-labelledby="reviews-${escape(block._id || block.id || "block")}">
      <div class="section-heading"><div><p class="kicker">${escape(content.kicker || "Confianza")}</p><h2 id="reviews-${escape(block._id || block.id || "block")}">${escape(title)}</h2></div></div>
      <div class="marquee-viewport"><div class="marquee-track" style="--marquee-duration:${Math.max(32, reviews.length * 7 || 38)}s"><div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div></div></div>
    </section>`;
  }

  function renderTextBlock(block) {
    const content = getContent(block);
    return `<section class="section builder-section text-block-section" data-block-id="${escape(block._id || block.id || "")}"><div class="html-block"><h2>${escape(content.title || block.name || "Texto")}</h2><p>${escape(content.text || content.body || "")}</p></div></section>`;
  }

  function renderFaqBlock(block) {
    const content = getContent(block);
    const items = Array.isArray(content.items) ? content.items : [];
    return `<section class="section builder-section faq-block-section" data-block-id="${escape(block._id || block.id || "")}"><div class="section-heading"><div><p class="kicker">Ayuda</p><h2>${escape(content.title || "Preguntas frecuentes")}</h2></div></div><div class="faq-list">${items.map((item) => `<details><summary>${escape(item.question || item.pregunta || "Pregunta")}</summary><p>${escape(item.answer || item.respuesta || "Respuesta")}</p></details>`).join("")}</div></section>`;
  }

  function renderContactBlock(block) {
    const content = getContent(block);
    return `<section class="section builder-section contact-block-section" data-block-id="${escape(block._id || block.id || "")}"><div class="html-block"><h2>${escape(content.title || "Contáctanos")}</h2><p>${escape(content.text || "Escríbenos y responderemos pronto.")}</p><a class="primary-link" href="contacto.html">Ir a contacto</a></div></section>`;
  }

  function renderSpacerBlock(block) {
    const content = getContent(block);
    const style = getStyle(block);
    const height = Math.max(0, Math.min(260, toNumber(style.heightDesktop || content.height, 32)));
    return `<div class="builder-spacer" data-block-id="${escape(block._id || block.id || "")}" style="height:${height}px"></div>`;
  }

  function renderCartSummaryBlock(block) {
    const content = getContent(block);
    return `<section class="section builder-section" data-block-id="${escape(block._id || block.id || "")}"><div class="html-block"><h2>${escape(content.title || "Resumen del carrito")}</h2><p>Este bloque se muestra completo en la página Carrito.</p><a class="primary-link" href="carrito.html">Ver carrito</a></div></section>`;
  }

  function renderCheckoutFormBlock(block) {
    const content = getContent(block);
    return `<section class="section builder-section" data-block-id="${escape(block._id || block.id || "")}"><div class="html-block"><h2>${escape(content.title || "Finalizar compra")}</h2><p>Este bloque se muestra completo en el flujo de compra.</p><a class="primary-link" href="finalizar-compra.html">Finalizar compra</a></div></section>`;
  }

  function renderHtmlBlock(block) {
    const content = getContent(block);
    const html = String(content.html || content.body || "").trim();
    if (!html) return "";
    return `<section class="section builder-section" data-block-id="${escape(block._id || block.id || "")}"><div class="html-block">${html}</div></section>`;
  }

  function renderGenericBlock(block) {
    const name = block.name || block.type || "Bloque";
    return `<section class="section builder-section" data-block-id="${escape(block._id || block.id || "")}"><div class="generic-builder-block"><strong>${escape(name)}</strong><span>Este tipo de bloque todavía no tiene render público configurado.</span></div></section>`;
  }

  function renderBuilderBlock(block, products) {
    if (!block || block.isVisible === false) return "";
    const type = normalizeBlockType(block.type);
    switch (type) {
      case "category_sidebar": return renderCategorySidebarBlock(block);
      case "category_grid": return renderCategoryGridBlock(block);
      case "hero_banner": return renderHeroBlock(block);
      case "info_cards": return renderInfoCardsBlock(block);
      case "product_marquee": return renderProductMarqueeBlock(block, products);
      case "product_grid": return renderProductGridBlock(block, products);
      case "image_banner": return renderImageBannerBlock(block);
      case "reviews_marquee": return renderReviewsBlock(block, products);
      case "text_block": return renderTextBlock(block);
      case "faq_block": return renderFaqBlock(block);
      case "contact_block": return renderContactBlock(block);
      case "cart_summary": return renderCartSummaryBlock(block);
      case "checkout_form": return renderCheckoutFormBlock(block);
      case "spacer": return renderSpacerBlock(block);
      case "html_block":
      case "custom_html": return renderHtmlBlock(block);
      default: return renderGenericBlock({ ...block, type });
    }
  }

  function renderBuilderSection(section, products) {
    if (!section || section.isVisible === false) return "";
    const blocks = Array.isArray(section.blocks) ? section.blocks.filter((block) => block?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
    if (!blocks.length) return "";
    const layout = String(section.layout || "stack");
    if (layout === "hero_with_sidebar") {
      const category = blocks.find((block) => normalizeBlockType(block.type) === "category_sidebar");
      const hero = blocks.find((block) => normalizeBlockType(block.type) === "hero_banner");
      const rest = blocks.filter((block) => block !== category && block !== hero);
      const heroHeight = Math.max(160, Math.min(760, toNumber(getStyle(hero || {}).heightDesktop || getContent(hero || {}).heightDesktop, 323)));
      return `<section class="hero-section builder-section builder-section-group" data-section-id="${escape(section._id || section.id || "")}"${spacingStyle(section)}><div class="hero-layout" style="--hero-height:${heroHeight}px">${category ? renderCategorySidebarBlock(category) : ""}${hero ? renderHeroCardOnly(hero) : ""}</div>${rest.map((block) => renderBuilderBlock(block, products)).join("")}</section>`;
    }
    return `<section class="builder-section-group" data-section-id="${escape(section._id || section.id || "")}"${spacingStyle(section)}>${blocks.map((block) => renderBuilderBlock(block, products)).join("")}</section>`;
  }

  function renderBuilderHome(page, products) {
    const main = document.getElementById("main");
    if (!main) return false;
    const sections = Array.isArray(page?.sections) ? page.sections.slice().filter((section) => section?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
    if (sections.length) {
      const html = sections.map((section) => renderBuilderSection(section, products)).join("");
      if (!html.trim()) return false;
      main.innerHTML = html;
      window.EmmaginaUI.attachCartButtons(products);
      return true;
    }
    const blocks = Array.isArray(page?.blocks) ? page.blocks.slice() : [];
    const visibleBlocks = blocks.filter((block) => block?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    if (!visibleBlocks.length) return false;
    main.innerHTML = visibleBlocks.map((block) => renderBuilderBlock(block, products)).join("");
    window.EmmaginaUI.attachCartButtons(products);
    return true;
  }

  function applyHeroBanner() {
    const banner = matchBanner("hero-inicio", ["hero", "inicio", "principal"]);
    const image = by("[data-hero-image]");
    const link = by("[data-hero-link]");
    const kicker = by("[data-hero-kicker]");
    const title = by("[data-hero-title]");
    const button = by("[data-hero-button]");
    if (!banner || !image) return;
    const src = bannerImage(banner);
    if (src) image.src = src;
    image.alt = banner.titulo || banner.nombre || "Banner principal Rhema Diseños";
    image.style.objectPosition = banner.posicion || "center";
    if (link) link.href = bannerTarget(banner, "catalogo.html");
    if (kicker) kicker.hidden = true;
    if (title) title.hidden = true;
    if (button) button.textContent = banner.textoBoton || "Ver tienda";
  }

  function applyLineBanner(key, fallbackWords, fallbackUrl) {
    const banner = matchBanner(key, fallbackWords);
    const element = by(`[data-line-banner='${key}']`);
    if (!element) return;
    const image = element.querySelector("img");
    if (banner) {
      const src = bannerImage(banner);
      if (src && image) image.src = src;
      if (image) {
        image.alt = banner.titulo || banner.nombre || key;
        image.style.objectPosition = banner.posicion || "center";
      }
      element.href = bannerTarget(banner, fallbackUrl);
    }
  }

  function renderExplore(products) {
    const container = by("[data-explore-grid]");
    if (!container) return;
    const infoBanners = bannersByLocation("info-card").slice(0, 3);
    if (infoBanners.length) {
      container.innerHTML = infoBanners.map((banner) => {
        const image = bannerImage(banner) || window.CONFIG.placeholderImage;
        const title = banner.titulo || banner.nombre || "Información";
        const text = banner.eyebrow || "Conoce una sección de Rhema Diseños.";
        return `<a class="explore-card" href="${escape(bannerTarget(banner, "catalogo.html"))}">
          <img class="explore-image" src="${escape(image)}" alt="${escape(title)}" loading="lazy">
          <h3>${escape(title)}</h3>
          <p>${escape(text)}</p>
        </a>`;
      }).join("");
      return;
    }
    const cards = [
      { title: "Destacados", text: "Piezas seleccionadas para regalar o decorar.", kind: "destacados" },
      { title: "Los más vendidos", text: "Productos con mayor movimiento en la tienda.", kind: "vendidos" },
      { title: "Los más vistos", text: "Opciones que más despiertan interés.", kind: "vistos" }
    ];
    container.innerHTML = cards.map((card) => {
      const product = sectionProducts(card.kind, products)[0] || products[0] || {};
      const image = product.imagenPrincipal || window.CONFIG.placeholderImage;
      return `<a class="explore-card" href="catalogo.html?grupo=${encodeURIComponent(card.kind)}">
        <img class="explore-image" src="${escape(image)}" alt="${escape(card.title)}" loading="lazy">
        <h3>${escape(card.title)}</h3>
        <p>${escape(card.text)}</p>
      </a>`;
    }).join("");
  }


  function renderHomeCategories(categories = []) {
    const nav = document.querySelector(".rhema-category-list");
    if (!nav) return;
    const visible = (Array.isArray(categories) ? categories : [])
      .filter((category) => category && category.activa !== false && category.mostrarInicio !== false)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
    const source = visible.length ? visible : DEFAULT_CATEGORIES.map((nombre, index) => ({ nombre, orden: index * 10 }));
    nav.innerHTML = source.map((category) => {
      const label = String(category.nombre || category.label || category);
      const href = label === "Todos" ? "catalogo.html" : `catalogo.html?categoria=${encodeURIComponent(label)}`;
      const childClass = category.categoriaPadre ? " is-subcategory" : "";
      return `<a class="${childClass.trim()}" href="${escape(href)}"><span>${category.categoriaPadre ? "↳ " : ""}${escape(label)}</span></a>`;
    }).join("");
  }

  async function renderLegacyReviews() {
    const section = by("[data-reviews-section]");
    const track = by("[data-reviews-track]");
    if (!section || !track) return;
    try {
      const payload = await window.EmmaginaAPI.request("/resenas/mejores");
      const reviews = Array.isArray(payload?.resenas) ? payload.resenas : [];
      if (!reviews.length) { section.hidden = true; return; }
      section.hidden = false;
      const cards = reviews.map((review) => {
        const rating = Math.max(1, Math.min(5, Number(review.estrellas || 0)));
        const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
        const product = review.producto || {};
        const productUrl = product.slug ? `producto.html?slug=${encodeURIComponent(product.slug)}` : "catalogo.html";
        const date = new Date(review.publicadoEn || review.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
        return `<article class="review-card">
          <div class="review-stars" aria-label="${rating} de 5 estrellas">${stars}</div>
          <blockquote>“${escape(review.comentario || "")}”</blockquote>
          <footer><div><strong>${escape(review.clienteNombre || "Cliente")}</strong><time>${escape(date)}</time></div><a href="${escape(productUrl)}">${escape(product.nombre || "Ver producto")}</a></footer>
        </article>`;
      }).join("");
      track.innerHTML = `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`;
      track.style.setProperty("--marquee-duration", `${Math.max(32, reviews.length * 7)}s`);
    } catch (error) { console.warn("No fue posible cargar reseñas verificadas:", error.message); section.hidden = true; }
  }

  function renderLegacyHome(visible) {
    applyHeroBanner();
    applyLineBanner("linea-memories", ["memories", "memoria"], "pedido-personalizado.html");
    applyLineBanner("linea-alma", ["alma"], "catalogo.html?categoria=Linea%20Alma");
    renderExplore(visible);
    renderProductMarquee("desde14990", "Desde $14.990", sectionProducts("desde14990", visible));
    renderProductMarquee("lanzamiento", "Lanzamiento", sectionProducts("lanzamiento", visible));
    renderProductMarquee("destacados", "Destacados", sectionProducts("destacados", visible));
    renderLegacyReviews();
  }

  try {
    document.querySelectorAll("[data-marquee-track]").forEach((track) => window.EmmaginaUI.setLoading(track, "Cargando productos..."));
    const [products, banners, categories] = await Promise.all([
      window.EmmaginaAPI.getProducts({ limit: 240 }),
      window.EmmaginaAPI.getBanners().catch(() => []),
      window.EmmaginaAPI.getCategories().catch(() => [])
    ]);

    all.push(...products);
    publicBanners = Array.isArray(banners) ? banners : [];
    renderHomeCategories(Array.isArray(categories?.categorias) ? categories.categorias : categories);
    const visible = all.filter(window.EmmaginaData.isVisible);

    renderLegacyHome(visible);
  } catch (error) {
    console.error("No fue posible cargar productos en inicio:", error);
    document.querySelectorAll("[data-home-marquee]").forEach((root) => window.EmmaginaUI.setError(root, error.message));
  }
})();
