"use strict";

(async function () {
  const DEFAULT_CATEGORIES = ["Accesorios", "Coleccionables", "Decoración", "Herramientas", "Línea Memories", "Librería", "Línea Alma", "Ofertas", "Vasos Temáticos", "Todos"];

  function by(selector) { return document.querySelector(selector); }
  function escape(value) { return window.EmmaginaUI.escapeHtml(value); }
  function getContent(block) { return block?.content && typeof block.content === "object" ? block.content : {}; }
  function getStyle(block) { return block?.style && typeof block.style === "object" ? block.style : {}; }
  function toNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function cleanUrl(value, fallback = "#") { const url = String(value || "").trim(); if (!url || /^javascript:/i.test(url)) return fallback; return url; }
  function textKey(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function normalizeBlockType(value) {
    const raw = String(value || "custom_html").trim();
    const key = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-+|-+$/g, "");
    const aliases = {
      "category-sidebar": "category_sidebar", category_sidebar: "category_sidebar", categorias: "category_sidebar",
      "category-grid": "category_grid", category_grid: "category_grid",
      "hero-banner": "hero_banner", hero_banner: "hero_banner", hero: "hero_banner",
      "info-cards": "info_cards", info_cards: "info_cards",
      "product-marquee": "product_marquee", product_marquee: "product_marquee",
      "product-grid": "product_grid", product_grid: "product_grid",
      "image-banner": "image_banner", image_banner: "image_banner",
      "reviews-marquee": "reviews_marquee", reviews_marquee: "reviews_marquee",
      "text-block": "text_block", text_block: "text_block",
      "faq-block": "faq_block", faq_block: "faq_block",
      "contact-block": "contact_block", contact_block: "contact_block",
      "cart-summary": "cart_summary", cart_summary: "cart_summary",
      "checkout-form": "checkout_form", checkout_form: "checkout_form",
      spacer: "spacer", separador: "spacer",
      "custom-html": "custom_html", custom_html: "custom_html", "html-block": "html_block", html_block: "html_block"
    };
    return aliases[key] || aliases[raw] || key.replace(/-/g, "_") || "custom_html";
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

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || params.get("page") || "home";

  function pageMeta(page) {
    document.title = `${page.title || "Página"} | Emmagina`;
    const description = document.querySelector("meta[name='description']");
    if (description) description.setAttribute("content", page.seo?.description || page.description || "Contenido de Emmagina.");
  }

  function categoriesHtml(categories = DEFAULT_CATEGORIES) {
    const list = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;
    return list.map((item) => {
      const label = typeof item === "string" ? item : item?.label || item?.nombre || "Categoría";
      const href = typeof item === "string" ? (label === "Todos" ? "catalogo.html" : `catalogo.html?categoria=${encodeURIComponent(label)}`) : cleanUrl(item?.href || item?.url || item?.link, `catalogo.html?categoria=${encodeURIComponent(label)}`);
      const image = typeof item === "object" ? item?.image || item?.imagen || "" : "";
      return `<a href="${escape(href)}">${image ? `<img src="${escape(image)}" alt="" loading="lazy">` : ""}<span>${escape(label)}</span></a>`;
    }).join("");
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
      return fillList(visible.filter((product) => categoryMatchesProduct(product, category)), visible, 4, limit);
    }
    return sectionProducts(content.filter || content.grupo || content.category || "todos", products, limit);
  }

  function fillList(selected, products, minItems = 8, limit = 14) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const base = uniqueById(selected.filter(window.EmmaginaData.isVisible));
    const selectedKeys = new Set(base.map((p) => String(p.id || p.slug || p.nombre || "")));
    const fillers = visible.filter((p) => !selectedKeys.has(String(p.id || p.slug || p.nombre || "")));
    const merged = base.concat(fillers);
    if (!merged.length) return [];
    const target = Math.min(Math.max(minItems, Math.min(limit, visible.length || minItems)), limit);
    const result = [];
    let i = 0;
    while (result.length < target) { result.push(merged[i % merged.length]); i += 1; if (merged.length === result.length && result.length >= minItems) break; }
    return result.slice(0, limit);
  }

  function sectionProducts(kind, products, limit = 14) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const key = textKey(kind);
    let selected = [];
    if (key === "destacados" || key === "featured") selected = visible.filter((p) => p.destacado || textKey(p.insignia).includes("destacado"));
    else if (key === "desde14990" || key === "desde-14990") selected = visible.filter((p) => p.desde14990 || Number(p.precio) <= 14990);
    else if (key === "lanzamiento" || key === "novedades") selected = visible.filter((p) => p.lanzamiento || textKey(p.insignia).includes("lanzamiento"));
    else if (["vendidos", "masvendido", "mas-vendido", "mas vendidos"].includes(key)) selected = visible.filter((p) => p.masVendido);
    else if (["vistos", "masvisto", "mas-visto", "mas vistos"].includes(key)) selected = visible.filter((p) => p.masVisto);
    else if (key && key !== "todos") selected = visible.filter((p) => p.categorias?.some((cat) => textKey(cat).includes(key)) || textKey(p.nombre).includes(key));
    else selected = visible;
    return fillList(selected, visible, 8, limit);
  }

  function renderCategorySidebar(block) {
    const c = getContent(block);
    const s = getStyle(block);
    const hiddenMobile = s.mobileVisible === false ? " category-panel-mobile-hidden" : "";
    return `<aside class="category-panel${hiddenMobile}" data-block-id="${escape(block._id || block.id || "")}"><h2>${escape(c.heading || c.title || "Categorías")}</h2><nav class="category-list">${categoriesHtml(c.categories || c.categorias)}</nav>${c.showViewAll === false ? "" : `<a class="category-view-all" href="${escape(cleanUrl(c.viewAllUrl, "catalogo.html"))}">${escape(c.viewAllText || "Ver todas")}</a>`}</aside>`;
  }

  function renderCategoryGrid(block) {
    const c = getContent(block);
    const list = c.categories || c.categorias || DEFAULT_CATEGORIES;
    return `<section class="section section-muted home-info-section builder-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}><div class="section-heading"><div><p class="kicker">Emmagina</p><h2>${escape(c.title || c.heading || "Categorías")}</h2></div></div><div class="explore-grid">${list.map((item) => { const label = typeof item === "string" ? item : item.label || item.nombre || "Categoría"; const href = typeof item === "string" ? `catalogo.html?categoria=${encodeURIComponent(label)}` : cleanUrl(item.href || item.url, `catalogo.html?categoria=${encodeURIComponent(label)}`); const image = typeof item === "object" ? item.image || item.imagen || window.CONFIG.placeholderImage : window.CONFIG.placeholderImage; return `<a class="explore-card" href="${escape(href)}"><img class="explore-image" src="${escape(image)}" alt="${escape(label)}" loading="lazy"><h3>${escape(label)}</h3></a>`; }).join("")}</div></section>`;
  }

  function renderHero(block, standalone = true) {
    const c = getContent(block); const s = getStyle(block);
    const title = c.title || block.name || "Emmagina";
    const subtitle = c.subtitle || c.eyebrow || "Contenido editable";
    const image = c.imageDesktop || c.image || window.CONFIG.placeholderImage;
    const href = cleanUrl(c.buttonUrl || c.href || c.url, "catalogo.html");
    const buttonText = c.buttonText || "Ver tienda";
    const height = Math.max(170, Math.min(760, toNumber(s.heightDesktop || c.heightDesktop, 300)));
    const card = `<a class="hero-card hero-card-banner" href="${escape(href)}" aria-label="${escape(title)}" data-block-id="${escape(block._id || block.id || "")}"><img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="eager" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}"><span class="hero-overlay"><span class="kicker">${escape(subtitle)}</span><strong>${escape(title)}</strong><span class="hero-button">${escape(buttonText)}</span></span></a>`;
    return standalone ? `<section class="hero-section builder-section"${spacingStyle(block)}><div class="hero-layout hero-layout-single" style="--hero-height:${height}px">${card}</div></section>` : card;
  }

  function renderInfoCards(block) {
    const c = getContent(block);
    const cards = Array.isArray(c.cards) && c.cards.length ? c.cards : [{ title: "Información", text: "Contenido editable", image: "", href: "catalogo.html" }];
    return `<section class="section section-muted home-info-section builder-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}><div class="section-heading"><div><p class="kicker">${escape(c.kicker || "Emmagina")}</p><h2>${escape(c.title || "Contenido")}</h2></div></div><div class="explore-grid">${cards.slice(0, 6).map((card) => `<a class="explore-card" href="${escape(cleanUrl(card.href || card.link, "catalogo.html"))}"><img class="explore-image" src="${escape(card.image || card.imagen || window.CONFIG.placeholderImage)}" alt="${escape(card.title || "Tarjeta")}" loading="lazy"><h3>${escape(card.title || "Tarjeta")}</h3><p>${escape(card.text || card.description || "")}</p></a>`).join("")}</div></section>`;
  }

  function renderProductMarquee(block, products) {
    const c = getContent(block); const title = c.title || block.name || "Productos"; const limit = Math.max(4, Math.min(30, toNumber(c.limit, 14))); const selected = selectProductsForBlock(c, products, limit);
    const cards = selected.map((p) => window.EmmaginaUI.productCard(p)).join("");
    const track = selected.length ? `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>` : `<div class="state-box"><p>No hay productos disponibles por ahora.</p></div>`;
    return `<section class="section section-muted product-marquee builder-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}><header class="carousel-head"><div><p class="kicker">${escape(c.kicker || "Emmagina")}</p><h2>${escape(title)}</h2></div></header><div class="marquee-viewport"><div class="marquee-track" style="--marquee-duration:${Math.max(34, selected.length * 6)}s">${track}</div></div></section>`;
  }

  function renderProductGrid(block, products) {
    const c = getContent(block); const title = c.title || block.name || "Productos"; const limit = Math.max(4, Math.min(36, toNumber(c.limit, 12))); const selected = selectProductsForBlock(c, products, limit).slice(0, limit);
    return `<section class="section section-muted builder-section product-grid-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}><header class="carousel-head"><div><p class="kicker">${escape(c.kicker || "Emmagina")}</p><h2>${escape(title)}</h2></div></header>${selected.length ? `<div class="product-grid">${selected.map((p) => window.EmmaginaUI.productCard(p)).join("")}</div>` : `<div class="state-box"><p>No hay productos disponibles por ahora.</p></div>`}</section>`;
  }

  function renderImageBanner(block) {
    const c = getContent(block); const s = getStyle(block); const title = c.title || block.name || "Emmagina"; const image = c.imageDesktop || c.image || window.CONFIG.placeholderImage; const href = cleanUrl(c.buttonUrl || c.href || c.url, "catalogo.html"); const height = Math.max(54, Math.min(360, toNumber(s.heightDesktop || c.heightDesktop, 112)));
    return `<section class="section scene-lines-section builder-section" data-block-id="${escape(block._id || block.id || "")}"${spacingStyle(block)}><a class="line-banner" href="${escape(href)}" aria-label="${escape(title)}" style="height:${height}px"><img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="lazy" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}"><span class="line-banner-button">${escape(c.buttonText || "Ver más")}</span></a></section>`;
  }

  function renderText(block) { const c = getContent(block); return `<section class="section builder-section text-block-section"${spacingStyle(block)}><div class="html-block"><h2>${escape(c.title || block.name || "Texto")}</h2><p>${escape(c.text || c.body || "")}</p></div></section>`; }
  function renderFaq(block) { const c = getContent(block); const items = Array.isArray(c.items) ? c.items : []; return `<section class="section builder-section faq-block-section"${spacingStyle(block)}><div class="section-heading"><div><p class="kicker">Ayuda</p><h2>${escape(c.title || "Preguntas frecuentes")}</h2></div></div><div class="faq-list">${items.map((item) => `<details><summary>${escape(item.question || item.pregunta || "Pregunta")}</summary><p>${escape(item.answer || item.respuesta || "Respuesta")}</p></details>`).join("")}</div></section>`; }
  function renderContact(block) { const c = getContent(block); return `<section class="section builder-section contact-block-section"${spacingStyle(block)}><div class="html-block"><h2>${escape(c.title || "Contáctanos")}</h2><p>${escape(c.text || "Escríbenos y responderemos pronto.")}</p><a class="primary-link" href="contacto.html">Ir a contacto</a></div></section>`; }
  function renderHtml(block) { const c = getContent(block); const html = String(c.html || c.body || "").trim(); return html ? `<section class="section builder-section"${spacingStyle(block)}><div class="html-block">${html}</div></section>` : ""; }
  function renderSpacer(block) { const c = getContent(block); const s = getStyle(block); const h = Math.max(0, Math.min(260, toNumber(s.heightDesktop || c.height, 32))); return `<div class="builder-spacer" style="height:${h}px"></div>`; }
  function renderGeneric(block) { const name = block.name || block.type || "Bloque"; return `<section class="section builder-section"><div class="generic-builder-block"><strong>${escape(name)}</strong><span>Este bloque todavía no tiene render público configurado para páginas internas.</span></div></section>`; }

  function renderBlock(block, products) {
    if (!block || block.isVisible === false) return "";
    switch (normalizeBlockType(block.type)) {
      case "category_sidebar": return renderCategorySidebar(block);
      case "category_grid": return renderCategoryGrid(block);
      case "hero_banner": return renderHero(block, true);
      case "image_banner": return renderImageBanner(block);
      case "info_cards": return renderInfoCards(block);
      case "product_marquee": return renderProductMarquee(block, products);
      case "product_grid": return renderProductGrid(block, products);
      case "text_block": return renderText(block);
      case "faq_block": return renderFaq(block);
      case "contact_block": return renderContact(block);
      case "cart_summary": return renderText({ ...block, content: { title: getContent(block).title || "Resumen del carrito", text: "Este bloque se muestra completo en Carrito." } });
      case "checkout_form": return renderText({ ...block, content: { title: getContent(block).title || "Finalizar compra", text: "Este bloque se muestra completo en el flujo de compra." } });
      case "spacer": return renderSpacer(block);
      case "custom_html": case "html_block": return renderHtml(block);
      default: return renderGeneric(block);
    }
  }

  function renderSection(section, products) {
    if (!section || section.isVisible === false) return "";
    const blocks = Array.isArray(section.blocks) ? section.blocks.filter((block) => block?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
    if (!blocks.length) return "";
    if (String(section.layout || "stack") === "hero_with_sidebar") {
      const category = blocks.find((block) => normalizeBlockType(block.type) === "category_sidebar");
      const hero = blocks.find((block) => normalizeBlockType(block.type) === "hero_banner");
      const rest = blocks.filter((block) => block !== category && block !== hero);
      const heroHeight = Math.max(160, Math.min(760, toNumber(getStyle(hero || {}).heightDesktop || getContent(hero || {}).heightDesktop, 323)));
      return `<section class="hero-section builder-section builder-section-group" data-section-id="${escape(section._id || section.id || "")}"${spacingStyle(section)}><div class="hero-layout" style="--hero-height:${heroHeight}px">${category ? renderCategorySidebar(category) : ""}${hero ? renderHero(hero, false) : ""}</div>${rest.map((block) => renderBlock(block, products)).join("")}</section>`;
    }
    const layoutClass = String(section.layout || "stack") === "grid" ? " builder-block-grid" : "";
    return `<section class="builder-section-group${layoutClass}" data-section-id="${escape(section._id || section.id || "")}"${spacingStyle(section)}>${blocks.map((block) => renderBlock(block, products)).join("")}</section>`;
  }

  try {
    const [page, products] = await Promise.all([
      window.EmmaginaAPI.getPage(slug),
      window.EmmaginaAPI.getProducts({ limit: 240 }).catch(() => [])
    ]);
    pageMeta(page);
    const main = by("#main");
    if (!main) return;
    const sections = Array.isArray(page.sections) ? page.sections.filter((section) => section?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
    const html = sections.length ? sections.map((section) => renderSection(section, products)).join("") : (page.blocks || []).map((block) => renderBlock(block, products)).join("");
    main.innerHTML = html || `<header class="content-hero"><p class="kicker">Emmagina</p><h1>${escape(page.title || "Página")}</h1><p>${escape(page.description || "Contenido próximamente.")}</p></header>`;
    window.EmmaginaUI.attachCartButtons(products);
  } catch (error) {
    const main = by("#main");
    if (main) main.innerHTML = `<header class="content-hero"><p class="kicker">Emmagina</p><h1>Página no disponible</h1><p>${escape(error.message || "No fue posible cargar esta página.")}</p><p><a class="btn btn-primary" href="index.html">Volver al inicio</a></p></header>`;
  }
})();
