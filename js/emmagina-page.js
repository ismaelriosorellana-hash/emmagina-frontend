"use strict";

(async function () {
  function by(selector) { return document.querySelector(selector); }
  function escape(value) { return window.EmmaginaUI.escapeHtml(value); }
  function getContent(block) { return block?.content && typeof block.content === "object" ? block.content : {}; }
  function getStyle(block) { return block?.style && typeof block.style === "object" ? block.style : {}; }
  function toNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function cleanUrl(value, fallback = "#") { const url = String(value || "").trim(); if (!url || /^javascript:/i.test(url)) return fallback; return url; }
  function normalizeBlockType(value) { return String(value || "custom_html").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-+|-+$/g, "").replace(/-/g, "_") || "custom_html"; }

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || params.get("page") || "home";

  function pageMeta(page) {
    document.title = `${page.title || "Página"} | Emmagina`;
    const description = document.querySelector("meta[name='description']");
    if (description) description.setAttribute("content", page.seo?.description || page.description || "Contenido de Emmagina.");
  }

  function categoriesHtml(categories = []) {
    const list = Array.isArray(categories) && categories.length ? categories : ["Todos"];
    return list.map((item) => {
      const label = typeof item === "string" ? item : item?.label || item?.nombre || "Categoría";
      const href = typeof item === "string" ? `catalogo.html?categoria=${encodeURIComponent(label)}` : cleanUrl(item?.href || item?.url || item?.link, `catalogo.html?categoria=${encodeURIComponent(label)}`);
      return `<a href="${escape(href)}"><span>${escape(label)}</span></a>`;
    }).join("");
  }

  function renderCategorySidebar(block) {
    const c = getContent(block);
    return `<section class="section builder-section"><aside class="category-panel"><h2>${escape(c.heading || c.title || "Categorías")}</h2><nav class="category-list">${categoriesHtml(c.categories || c.categorias)}</nav></aside></section>`;
  }

  function renderCategoryGrid(block) {
    const c = getContent(block);
    const list = c.categories || c.categorias || [];
    return `<section class="section section-muted home-info-section builder-section"><div class="section-heading"><div><p class="kicker">Emmagina</p><h2>${escape(c.title || c.heading || "Categorías")}</h2></div></div><div class="explore-grid">${list.map((item) => { const label = item.label || item.nombre || item; const href = item.href || item.url || `catalogo.html?categoria=${encodeURIComponent(label)}`; const image = item.image || item.imagen || "assets/producto-referencia-emmagina.png"; return `<a class="explore-card" href="${escape(href)}"><img class="explore-image" src="${escape(image)}" alt="${escape(label)}" loading="lazy"><h3>${escape(label)}</h3></a>`; }).join("")}</div></section>`;
  }

  function renderHero(block) {
    const c = getContent(block);
    const s = getStyle(block);
    const title = c.title || block.name || "Emmagina";
    const subtitle = c.subtitle || c.eyebrow || "Contenido editable";
    const image = c.imageDesktop || c.image || "assets/producto-referencia-emmagina.png";
    const href = cleanUrl(c.buttonUrl || c.href || c.url, "catalogo.html");
    const buttonText = c.buttonText || "Ver tienda";
    const height = Math.max(170, Math.min(760, toNumber(s.heightDesktop || c.heightDesktop, 300)));
    return `<section class="hero-section builder-section" data-block-id="${escape(block._id || "")}"><div class="hero-layout hero-layout-single" style="--hero-height:${height}px"><a class="hero-card hero-card-banner" href="${escape(href)}" aria-label="${escape(title)}"><img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="eager" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}"><span class="hero-overlay"><span class="kicker">${escape(subtitle)}</span><strong>${escape(title)}</strong><span class="hero-button">${escape(buttonText)}</span></span></a></div></section>`;
  }

  function renderImageBanner(block) {
    const c = getContent(block);
    const s = getStyle(block);
    const title = c.title || block.name || "Emmagina";
    const image = c.imageDesktop || c.image || "assets/producto-referencia-emmagina.png";
    const href = cleanUrl(c.buttonUrl || c.href || c.url, "catalogo.html");
    const height = Math.max(54, Math.min(360, toNumber(s.heightDesktop || c.heightDesktop, 112)));
    return `<section class="section scene-lines-section builder-section" data-block-id="${escape(block._id || "")}"><a class="line-banner" href="${escape(href)}" aria-label="${escape(title)}" style="height:${height}px"><img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="lazy" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}"><span class="line-banner-button">${escape(c.buttonText || "Ver más")}</span></a></section>`;
  }

  function renderInfoCards(block) {
    const c = getContent(block);
    const cards = Array.isArray(c.cards) && c.cards.length ? c.cards : [{ title: "Información", text: "Contenido editable", image: "", href: "catalogo.html" }];
    return `<section class="section section-muted home-info-section builder-section" data-block-id="${escape(block._id || "")}"><div class="section-heading"><div><p class="kicker">${escape(c.kicker || "Emmagina")}</p><h2>${escape(c.title || "Contenido")}</h2></div></div><div class="explore-grid">${cards.slice(0, 6).map((card) => `<a class="explore-card" href="${escape(cleanUrl(card.href || card.link, "catalogo.html"))}"><img class="explore-image" src="${escape(card.image || card.imagen || "assets/producto-referencia-emmagina.png")}" alt="${escape(card.title || "Tarjeta")}" loading="lazy"><h3>${escape(card.title || "Tarjeta")}</h3><p>${escape(card.text || card.description || "")}</p></a>`).join("")}</div></section>`;
  }

  function renderProductPlaceholder(block) {
    const c = getContent(block);
    return `<section class="section builder-section"><div class="html-block"><h2>${escape(c.title || block.name || "Productos")}</h2><p>Este bloque mostrará productos según el filtro: ${escape(c.filter || "todos")}.</p><a class="primary-link" href="catalogo.html">Ver catálogo</a></div></section>`;
  }

  function renderText(block) { const c = getContent(block); return `<section class="section builder-section"><div class="html-block"><h2>${escape(c.title || block.name || "Texto")}</h2><p>${escape(c.text || c.body || "")}</p></div></section>`; }
  function renderFaq(block) { const c = getContent(block); const items = Array.isArray(c.items) ? c.items : []; return `<section class="section builder-section"><div class="section-heading"><div><p class="kicker">Ayuda</p><h2>${escape(c.title || "Preguntas frecuentes")}</h2></div></div><div class="faq-list">${items.map((item) => `<details><summary>${escape(item.question || item.pregunta || "Pregunta")}</summary><p>${escape(item.answer || item.respuesta || "Respuesta")}</p></details>`).join("")}</div></section>`; }
  function renderHtml(block) { const c = getContent(block); const html = String(c.html || c.body || "").trim(); if (!html) return ""; return `<section class="section builder-section"><div class="html-block">${html}</div></section>`; }
  function renderSpacer(block) { const c = getContent(block); const s = getStyle(block); const h = Math.max(0, Math.min(260, toNumber(s.heightDesktop || c.height, 32))); return `<div class="builder-spacer" style="height:${h}px"></div>`; }
  function renderGeneric(block) { const name = block.name || block.type || "Bloque"; return `<section class="section builder-section"><div class="generic-builder-block"><strong>${escape(name)}</strong><span>Este bloque todavía no tiene render público configurado para páginas internas.</span></div></section>`; }

  function renderBlock(block) {
    if (!block || block.isVisible === false) return "";
    switch (normalizeBlockType(block.type)) {
      case "category_sidebar": return renderCategorySidebar(block);
      case "category_grid": return renderCategoryGrid(block);
      case "hero_banner": return renderHero(block);
      case "image_banner": return renderImageBanner(block);
      case "info_cards": return renderInfoCards(block);
      case "product_marquee":
      case "product_grid": return renderProductPlaceholder(block);
      case "text_block": return renderText(block);
      case "faq_block": return renderFaq(block);
      case "contact_block": return renderText({ ...block, content: { title: getContent(block).title || "Contáctanos", text: getContent(block).text || "Escríbenos y responderemos pronto." } });
      case "cart_summary": return renderText({ ...block, content: { title: getContent(block).title || "Resumen del carrito", text: "Este bloque se muestra completo en Carrito." } });
      case "checkout_form": return renderText({ ...block, content: { title: getContent(block).title || "Finalizar compra", text: "Este bloque se muestra completo en el flujo de compra." } });
      case "spacer": return renderSpacer(block);
      case "custom_html":
      case "html_block": return renderHtml(block);
      default: return renderGeneric(block);
    }
  }

  function visibleBlocks(page) {
    if (Array.isArray(page.sections) && page.sections.length) {
      return page.sections
        .filter((section) => section?.isVisible !== false)
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .flatMap((section) => (section.blocks || []).filter((block) => block?.isVisible !== false).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)));
    }
    return Array.isArray(page.blocks) ? page.blocks.slice().sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
  }

  try {
    const page = await window.EmmaginaAPI.getPage(slug);
    pageMeta(page);
    const main = by("#main");
    const blocks = visibleBlocks(page);
    if (!main || !blocks.length) return;
    main.innerHTML = blocks.map(renderBlock).join("") || `<header class="content-hero"><p class="kicker">Emmagina</p><h1>${escape(page.title || "Página")}</h1><p>${escape(page.description || "Contenido próximamente.")}</p></header>`;
  } catch (error) {
    const main = by("#main");
    if (main) main.innerHTML = `<header class="content-hero"><p class="kicker">Emmagina</p><h1>Página no disponible</h1><p>${escape(error.message || "No fue posible cargar esta página.")}</p><p><a class="btn btn-primary" href="index.html">Volver al inicio</a></p></header>`;
  }
})();
