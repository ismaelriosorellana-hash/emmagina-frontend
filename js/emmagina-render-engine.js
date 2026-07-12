"use strict";

(function () {
  const Engine = {};

  function displayBrandText(value) {
    return String(value ?? "")
      .replace(/EMMAGINA/g, "RHEMA DISEÑOS")
      .replace(/Emmagina/g, "Rhema Diseños")
      .replace(/Crea tu Escena/g, "Crea tu Figura")
      .replace(/3D Store/g, "Diseños 3D");
  }

  function escape(value) {
    return displayBrandText(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function textKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeType(value) {
    const raw = textKey(value).replace(/-/g, "_");
    const aliases = {
      hero: "hero_banner",
      hero_banner: "hero_banner",
      hero_section: "hero_banner",
      category_sidebar: "category_sidebar",
      category_grid: "category_grid",
      info_cards: "info_cards",
      product_carousel: "product_carousel",
      product_marquee: "product_carousel",
      products_carousel: "product_carousel",
      product_grid: "product_grid",
      image_banner: "image_banner",
      reviews_carousel: "reviews_carousel",
      reviews_marquee: "reviews_carousel",
      text_block: "text_block",
      faq_block: "faq_block",
      contact_block: "contact_block",
      cart_summary: "cart_summary",
      checkout_form: "checkout_form",
      spacer: "spacer",
      custom_html: "custom_html",
      html_block: "custom_html"
    };
    return aliases[raw] || raw || "custom_html";
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function sortByOrder(list) {
    return asArray(list).slice().filter((item) => item && item.visible !== false && item.isVisible !== false).sort((a, b) => Number(a.orden ?? a.position ?? 0) - Number(b.orden ?? b.position ?? 0));
  }

  function content(block) {
    return block?.contenido && typeof block.contenido === "object"
      ? block.contenido
      : block?.content && typeof block.content === "object"
        ? block.content
        : {};
  }

  function style(block) {
    return block?.estilo && typeof block.estilo === "object"
      ? block.estilo
      : block?.style && typeof block.style === "object"
        ? block.style
        : {};
  }

  function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeUrl(value, fallback = "#") {
    const url = String(value || "").trim();
    if (!url || /^javascript:/i.test(url)) return fallback;
    return url;
  }

  function inlineSpacing(source) {
    const s = style(source);
    const parts = [];
    if (Number.isFinite(Number(s.marginTop))) parts.push(`margin-top:${Number(s.marginTop)}px`);
    if (Number.isFinite(Number(s.marginBottom))) parts.push(`margin-bottom:${Number(s.marginBottom)}px`);
    if (Number.isFinite(Number(s.paddingTop))) parts.push(`padding-top:${Number(s.paddingTop)}px`);
    if (Number.isFinite(Number(s.paddingBottom))) parts.push(`padding-bottom:${Number(s.paddingBottom)}px`);
    return parts.length ? ` style="${parts.join(";")}"` : "";
  }

  function productIds(product = {}) {
    return [product.id, product._id, product.slug, product.sku, product.nombre].filter(Boolean).map(String);
  }

  function normalizedCategoryName(category) {
    if (!category) return "";
    if (typeof category === "string") return category;
    return category.nombre || category.name || category.titulo || category.title || category.slug || "";
  }

  function normalizedCategoryUrl(category) {
    if (!category || typeof category === "string") return `catalogo.html?categoria=${encodeURIComponent(normalizedCategoryName(category))}`;
    return category.url || category.href || `catalogo.html?categoria=${encodeURIComponent(category.slug || category.nombre || category.name || "")}`;
  }

  function normalizeManualCategory(item) {
    if (typeof item === "string") return { name: item, url: `catalogo.html?categoria=${encodeURIComponent(item)}`, image: "" };
    return {
      name: item?.nombre || item?.name || item?.titulo || item?.title || "Categoría",
      url: item?.url || item?.href || normalizedCategoryUrl(item),
      image: ""
    };
  }

  function categoriesForBlock(block, ctx) {
    const c = content(block);
    const origin = String(c.origen || c.source || "manual");
    if (origin === "manual" && asArray(c.categorias).length) return asArray(c.categorias).map(normalizeManualCategory);
    const source = asArray(ctx.categories).map(normalizeManualCategory);
    if (!source.length && asArray(window.CONFIG?.CATEGORIES).length) return window.CONFIG.CATEGORIES.map(normalizeManualCategory);
    return source.slice(0, Math.max(1, number(c.limite || c.limit, 12)));
  }

  function productCategoryValue(product = {}) {
    return [product.categoriaPrincipal, ...(Array.isArray(product.categorias) ? product.categorias : [])].filter(Boolean).join(" ");
  }

  function matchesCategory(product = {}, category = "") {
    const needle = textKey(category);
    if (!needle) return false;
    const hay = textKey(productCategoryValue(product));
    return hay.includes(needle) || needle.includes(hay);
  }

  function uniqueProducts(products) {
    const seen = new Set();
    return asArray(products).filter((product) => {
      const key = String(product.id || product._id || product.slug || product.nombre || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function productsForBlock(block, ctx) {
    const c = content(block);
    const all = uniqueProducts(asArray(ctx.products).filter((p) => !window.EmmaginaData?.isVisible || window.EmmaginaData.isVisible(p)));
    const limit = Math.max(1, Math.min(48, number(c.limite || c.limit || c.cantidad, 12)));
    const origin = String(c.origen || c.source || c.filter || "destacados");
    const manualIds = asArray(c.productos || c.productIds || c.products).map(String).filter(Boolean);
    let selected = [];

    if (origin === "manual" && manualIds.length) {
      selected = all.filter((p) => productIds(p).some((id) => manualIds.includes(id)));
    } else if (origin === "categoria" || origin === "category" || c.categoriaId || c.categorySlug || c.categoryName) {
      const category = c.categoriaNombre || c.categoryName || c.categoriaSlug || c.categorySlug || c.categoriaId || c.category || "";
      selected = all.filter((p) => matchesCategory(p, category));
    } else {
      const key = textKey(origin);
      if (["destacados", "featured"].includes(key)) selected = all.filter((p) => p.destacado || textKey(p.insignia).includes("destacado"));
      else if (["nuevos", "lanzamiento", "novedades"].includes(key)) selected = all.filter((p) => p.lanzamiento || textKey(p.insignia).includes("nuevo") || textKey(p.insignia).includes("lanzamiento"));
      else if (["ofertas", "descuentos"].includes(key)) selected = all.filter((p) => Number(p.precioOriginal) > Number(p.precio));
      else if (["desde14990", "desde-14990", "entrada"].includes(key)) selected = all.filter((p) => Number(p.precio) <= 14990);
      else selected = all;
    }

    const merged = uniqueProducts(selected.concat(all));
    return merged.slice(0, limit);
  }

  function renderProductCards(products) {
    if (!products.length) return `<div class="state-box"><p>No hay productos disponibles por ahora.</p></div>`;
    return products.map((p) => window.EmmaginaUI?.productCard ? window.EmmaginaUI.productCard(p) : `<article class="product-card"><h3>${escape(p.nombre)}</h3></article>`).join("");
  }

  const components = {
    category_sidebar(block, ctx) {
      const c = content(block);
      const s = style(block);
      const categories = categoriesForBlock(block, ctx);
      const mobileHidden = s.mostrarMobile === false ? " category-panel-mobile-hidden" : "";
      return `<aside class="category-panel cms-block${mobileHidden}" data-block-id="${escape(block.id || "")}">
        <h2>${escape(c.titulo || c.title || "Categorías")}</h2>
        <nav class="category-list">
          ${categories.map((cat) => `<a href="${escape(safeUrl(cat.url, "catalogo.html"))}"><span>${escape(cat.name)}</span></a>`).join("")}
        </nav>
        ${c.mostrarVerTodas === false ? "" : `<a class="category-view-all" href="${escape(safeUrl(c.verTodasUrl || c.viewAllUrl, "catalogo.html"))}">${escape(c.verTodasTexto || c.viewAllText || "Ver todas")}</a>`}
      </aside>`;
    },

    category_grid(block, ctx) {
      const c = content(block);
      const categories = categoriesForBlock(block, ctx);
      return `<section class="section category-grid-section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}>
        <div class="section-heading"><div><p class="kicker">Explora</p><h2>${escape(c.titulo || c.title || "Categorías")}</h2></div></div>
        <div class="explore-grid">
          ${categories.map((cat) => `<a class="explore-card" href="${escape(safeUrl(cat.url, "catalogo.html"))}">${cat.image ? `<img src="${escape(cat.image)}" alt="${escape(cat.name)}" loading="lazy">` : `<span class="explore-image cms-placeholder-image"></span>`}<h3>${escape(cat.name)}</h3></a>`).join("")}
        </div>
      </section>`;
    },

    hero_banner(block) {
      const c = content(block);
      const s = style(block);
      const height = Math.max(180, Math.min(760, number(s.alturaDesktop || c.alturaDesktop || s.heightDesktop, 420)));
      const image = c.imagenDesktop || c.imageDesktop || c.imagen || c.image || "";
      const title = c.titulo || c.title || "Rhema Diseños";
      const subtitle = c.subtitulo || c.subtitle || "Regalos, decoración y soluciones personalizadas impresas en 3D.";
      const url = safeUrl(c.botonUrl || c.buttonUrl, "catalogo.html");
      const btn = c.botonTexto || c.buttonText || "Ver tienda";
      const imageClass = image ? "" : " hero-card-no-image";
      return `<a class="hero-card hero-card-banner cms-block${imageClass}" data-block-id="${escape(block.id || "")}" href="${escape(url)}" style="--hero-height:${height}px;background:${escape(s.fondo || c.fondo || "#EAF4F8")}">
        ${image ? `<img src="${escape(image)}" alt="${escape(title)}" loading="eager">` : `<span class="hero-shapes" aria-hidden="true"><i></i><i></i><i></i></span>`}
        <span class="hero-overlay"><span class="kicker">${escape(c.kicker || "Impresión 3D · regalos · soluciones")}</span><strong>${escape(title)}</strong><span>${escape(subtitle)}</span>${btn ? `<span class="hero-button">${escape(btn)}</span>` : ""}</span>
      </a>`;
    },

    info_cards(block) {
      const c = content(block);
      const cards = asArray(c.tarjetas || c.cards).length ? asArray(c.tarjetas || c.cards) : [
        { titulo: "Productos a pedido", texto: "Piezas fabricadas con cuidado y enfoque en el detalle." },
        { titulo: "Regalos memorables", texto: "Ideas personalizadas para sorprender y decorar." },
        { titulo: "Atención cercana", texto: "Te ayudamos a transformar una idea en producto." }
      ];
      return `<section class="section section-muted home-info-section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}>
        <div class="section-heading"><div><p class="kicker">Información</p><h2>${escape(c.titulo || c.title || "Elige cómo crear con nosotros")}</h2></div></div>
        <div class="explore-grid">
          ${cards.map((card) => `<a class="explore-card" href="${escape(safeUrl(card.url || card.href, "#"))}">${card.imagen || card.image ? `<img src="${escape(card.imagen || card.image)}" alt="${escape(card.titulo || card.title || "")}" loading="lazy">` : `<span class="explore-image cms-placeholder-image"></span>`}<h3>${escape(card.titulo || card.title || "Título")}</h3><p>${escape(card.texto || card.text || "")}</p></a>`).join("")}
        </div>
      </section>`;
    },

    product_carousel(block, ctx) {
      const c = content(block);
      const products = productsForBlock(block, ctx);
      const cards = renderProductCards(products);
      return `<section class="section product-marquee cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}>
        <header class="carousel-head"><div><p class="kicker">Catálogo</p><h2>${escape(c.titulo || c.title || "Productos destacados")}</h2></div></header>
        <div class="marquee-viewport"><div class="marquee-track" style="--marquee-duration:${Math.max(36, products.length * 6)}s"><div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div></div></div>
      </section>`;
    },

    product_grid(block, ctx) {
      const c = content(block);
      const products = productsForBlock(block, ctx);
      return `<section class="section product-grid-section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}>
        <header class="carousel-head"><div><p class="kicker">Catálogo</p><h2>${escape(c.titulo || c.title || "Productos")}</h2></div></header>
        <div class="product-grid">${renderProductCards(products)}</div>
      </section>`;
    },

    image_banner(block) {
      const c = content(block);
      const image = c.imagenDesktop || c.imageDesktop || c.imagen || c.image || "";
      const url = safeUrl(c.botonUrl || c.buttonUrl, "catalogo.html");
      return `<section class="section scene-lines-section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}>
        <a class="line-banner" href="${escape(url)}" aria-label="${escape(c.titulo || c.title || "Banner")}">
          ${image ? `<img src="${escape(image)}" alt="${escape(c.titulo || c.title || "Banner")}" loading="lazy">` : ""}
          <span class="line-banner-button">${escape(c.botonTexto || c.buttonText || "Ver más")}</span>
        </a>
      </section>`;
    },

    reviews_carousel(block) {
      const c = content(block);
      const reviews = asArray(c.resenas || c.reviews);
      if (!reviews.length) return "";
      const cards = reviews.map((r) => `<article class="review-card"><strong>${escape(r.nombre || r.name || "Cliente")}</strong><p>${escape(r.texto || r.text || "")}</p></article>`).join("");
      return `<section class="section reviews-marquee cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}><div class="section-heading"><div><p class="kicker">Confianza</p><h2>${escape(c.titulo || c.title || "Lo que dicen nuestros clientes")}</h2></div></div><div class="marquee-viewport"><div class="marquee-track"><div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div></div></div></section>`;
    },

    text_block(block) {
      const c = content(block);
      return `<section class="section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}><div class="html-block"><h2>${escape(c.titulo || c.title || "Título")}</h2><p>${escape(c.texto || c.text || "")}</p></div></section>`;
    },

    faq_block(block) {
      const c = content(block);
      const items = asArray(c.items || c.preguntas || c.faqs);
      return `<section class="section cms-block" data-block-id="${escape(block.id || "")}"${inlineSpacing(block)}><div class="section-heading"><div><p class="kicker">Ayuda</p><h2>${escape(c.titulo || c.title || "Preguntas frecuentes")}</h2></div></div><div class="faq-list">${items.map((item) => `<details><summary>${escape(item.pregunta || item.question || "Pregunta")}</summary><p>${escape(item.respuesta || item.answer || "")}</p></details>`).join("")}</div></section>`;
    },

    contact_block(block) {
      const c = content(block);
      return `<section class="section cms-block" data-block-id="${escape(block.id || "")}"><div class="html-block"><h2>${escape(c.titulo || c.title || "Contáctanos")}</h2><p>${escape(c.texto || c.text || "Escríbenos y responderemos pronto.")}</p><a class="primary-link" href="contacto.html">Ir a contacto</a></div></section>`;
    },

    cart_summary(block) {
      return components.text_block({ ...block, contenido: { titulo: "Resumen del carrito", texto: "El resumen completo se muestra en la página Carrito." } });
    },

    checkout_form(block) {
      return components.text_block({ ...block, contenido: { titulo: "Finalizar compra", texto: "El formulario completo se muestra en el flujo de compra." } });
    },

    spacer(block) {
      const c = content(block);
      const height = Math.max(0, Math.min(260, number(c.alto || c.height || style(block).heightDesktop, 32)));
      return `<div class="builder-spacer cms-block" data-block-id="${escape(block.id || "")}" style="height:${height}px"></div>`;
    },

    custom_html(block) {
      const c = content(block);
      const html = String(c.html || c.body || "").trim();
      return html ? `<section class="section cms-block" data-block-id="${escape(block.id || "")}"><div class="html-block">${html}</div></section>` : "";
    }
  };

  function renderBlock(block, ctx) {
    const type = normalizeType(block?.tipo || block?.type);
    const renderer = components[type];
    if (renderer) return renderer(block, ctx);
    return `<section class="section cms-block"><div class="generic-builder-block"><strong>${escape(block?.nombre || block?.name || type || "Bloque")}</strong><span>Este tipo de bloque todavía no tiene componente público.</span></div></section>`;
  }

  function renderSection(section, ctx) {
    const blocks = sortByOrder(section?.bloques || section?.blocks);
    if (!blocks.length) return "";
    const layout = String(section.layout || section.distribucion || "stack");
    if (layout === "hero_with_sidebar") {
      const category = blocks.find((block) => normalizeType(block.tipo || block.type) === "category_sidebar");
      const hero = blocks.find((block) => normalizeType(block.tipo || block.type) === "hero_banner");
      const rest = blocks.filter((block) => block !== category && block !== hero);
      const heroStyle = style(hero || {});
      const heroContent = content(hero || {});
      const height = Math.max(180, Math.min(760, number(heroStyle.alturaDesktop || heroContent.alturaDesktop || 420)));
      return `<section class="hero-section cms-section cms-section-hero" data-section-id="${escape(section.id || "")}"${inlineSpacing(section)}><div class="hero-layout" style="--hero-height:${height}px">${category ? renderBlock(category, ctx) : ""}${hero ? renderBlock(hero, ctx) : ""}</div>${rest.map((block) => renderBlock(block, ctx)).join("")}</section>`;
    }
    const gridClass = layout === "grid" ? " builder-block-grid" : "";
    return `<section class="cms-section builder-section-group${gridClass}" data-section-id="${escape(section.id || "")}"${inlineSpacing(section)}>${blocks.map((block) => renderBlock(block, ctx)).join("")}</section>`;
  }

  function renderRegion(region, ctx) {
    const sections = sortByOrder(region?.secciones || region?.sections);
    return sections.map((section) => renderSection(section, ctx)).join("");
  }

  function renderLayout(layout, ctx = {}) {
    const regions = sortByOrder(layout?.regiones || layout?.regions);
    return regions.map((region) => renderRegion(region, ctx)).join("");
  }

  function applyMeta(page) {
    const seo = page?.seo || {};
    if (seo.titulo || page?.titulo) document.title = `${displayText(seo.titulo || page.titulo)} | Rhema Diseños`;
    const description = seo.descripcion || "";
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }

  async function renderPageFromCms(options = {}) {
    const root = typeof options.mount === "string" ? document.querySelector(options.mount) : options.mount;
    if (!root || !window.EmmaginaAPI?.getCmsPage) return false;
    const original = root.innerHTML;
    try {
      const key = options.key || root.dataset.cmsPage || "home";
      const [page, products, categories] = await Promise.all([
        window.EmmaginaAPI.getCmsPage(key),
        window.EmmaginaAPI.getProducts({ limit: 240 }).catch(() => []),
        window.EmmaginaAPI.getCategories?.().catch(() => []) || []
      ]);
      const layout = page?.layout || page?.layoutPublicado || page?.layoutBorrador;
      const html = renderLayout(layout, { page, products, categories });
      if (!html.trim()) throw new Error("La página CMS no tiene bloques visibles.");
      applyMeta(page);
      root.innerHTML = html;
      window.EmmaginaUI?.attachCartButtons?.(products);
      root.dataset.cmsRendered = "true";
      return true;
    } catch (error) {
      console.warn("No fue posible renderizar CMS universal:", error.message);
      if (!options.keepFallback) root.innerHTML = original;
      return false;
    }
  }

  Engine.renderLayout = renderLayout;
  Engine.renderBlock = renderBlock;
  Engine.renderSection = renderSection;
  Engine.renderPageFromCms = renderPageFromCms;
  Engine.normalizeType = normalizeType;
  window.EmmaginaRenderEngine = Object.freeze(Engine);
})();
