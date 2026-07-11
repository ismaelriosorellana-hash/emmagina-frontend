"use strict";

(async function () {
  function by(selector) { return document.querySelector(selector); }
  function escape(value) { return window.EmmaginaUI.escapeHtml(value); }
  function getContent(block) { return block?.content && typeof block.content === "object" ? block.content : {}; }
  function getStyle(block) { return block?.style && typeof block.style === "object" ? block.style : {}; }
  function toNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function cleanUrl(value, fallback = "#") {
    const url = String(value || "").trim();
    if (!url || /^javascript:/i.test(url)) return fallback;
    return url;
  }

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || params.get("page") || "home";

  function pageMeta(page) {
    document.title = `${page.title || "Página"} | Emmagina`;
    const description = document.querySelector("meta[name='description']");
    if (description) description.setAttribute("content", page.seo?.description || page.description || "Contenido de Emmagina.");
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
    return `<section class="hero-section builder-section" data-block-id="${escape(block._id || "")}">
      <div class="hero-layout" style="--hero-height:${height}px">
        <a class="hero-card hero-card-banner" href="${escape(href)}" aria-label="${escape(title)}">
          <img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="eager" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}">
          <span class="hero-overlay"><span class="kicker">${escape(subtitle)}</span><strong>${escape(title)}</strong><span class="hero-button">${escape(buttonText)}</span></span>
        </a>
      </div>
    </section>`;
  }

  function renderImageBanner(block) {
    const c = getContent(block);
    const s = getStyle(block);
    const title = c.title || block.name || "Emmagina";
    const image = c.imageDesktop || c.image || "assets/producto-referencia-emmagina.png";
    const href = cleanUrl(c.buttonUrl || c.href || c.url, "catalogo.html");
    const height = Math.max(54, Math.min(360, toNumber(s.heightDesktop || c.heightDesktop, 112)));
    return `<section class="section scene-lines-section builder-section" data-block-id="${escape(block._id || "")}">
      <a class="line-banner" href="${escape(href)}" aria-label="${escape(title)}" style="height:${height}px">
        <img src="${escape(image)}" alt="${escape(c.alt || title)}" loading="lazy" style="object-position:${escape(c.imagePosition || s.objectPosition || "center")}">
        <span class="line-banner-button">${escape(c.buttonText || "Ver más")}</span>
      </a>
    </section>`;
  }

  function renderInfoCards(block) {
    const c = getContent(block);
    const cards = Array.isArray(c.cards) && c.cards.length ? c.cards : [
      { title: "Información", text: "Contenido editable", image: "", href: "catalogo.html" }
    ];
    return `<section class="section section-muted home-info-section builder-section" data-block-id="${escape(block._id || "")}">
      <div class="section-heading"><div><p class="kicker">${escape(c.kicker || "Emmagina")}</p><h2>${escape(c.title || "Contenido")}</h2></div></div>
      <div class="explore-grid">
        ${cards.slice(0, 6).map((card) => `<a class="explore-card" href="${escape(cleanUrl(card.href || card.link, "catalogo.html"))}">
          <img class="explore-image" src="${escape(card.image || card.imagen || "assets/producto-referencia-emmagina.png")}" alt="${escape(card.title || "Tarjeta")}" loading="lazy">
          <h3>${escape(card.title || "Tarjeta")}</h3><p>${escape(card.text || card.description || "")}</p>
        </a>`).join("")}
      </div>
    </section>`;
  }

  function renderHtml(block) {
    const c = getContent(block);
    const html = String(c.html || c.body || "").trim();
    if (!html) return "";
    return `<section class="section builder-section" data-block-id="${escape(block._id || "")}"><div class="html-block">${html}</div></section>`;
  }

  function renderGeneric(block) {
    const name = block.name || block.type || "Bloque";
    return `<section class="section builder-section"><div class="generic-builder-block"><strong>${escape(name)}</strong><span>Este bloque todavía no tiene render público configurado para páginas internas.</span></div></section>`;
  }

  function renderBlock(block) {
    if (!block || block.isVisible === false) return "";
    switch (block.type) {
      case "hero_banner": return renderHero(block);
      case "image_banner": return renderImageBanner(block);
      case "info_cards": return renderInfoCards(block);
      case "custom_html":
      case "html_block": return renderHtml(block);
      default: return renderGeneric(block);
    }
  }

  try {
    const page = await window.EmmaginaAPI.getPage(slug);
    pageMeta(page);
    const main = by("#main");
    const blocks = Array.isArray(page.blocks) ? page.blocks.slice().sort((a, b) => Number(a.position || 0) - Number(b.position || 0)) : [];
    if (!main || !blocks.length) return;
    main.innerHTML = blocks.map(renderBlock).join("") || `<header class="content-hero"><p class="kicker">Emmagina</p><h1>${escape(page.title || "Página")}</h1><p>${escape(page.description || "Contenido próximamente.")}</p></header>`;
  } catch (error) {
    const main = by("#main");
    if (main) {
      main.innerHTML = `<header class="content-hero"><p class="kicker">Emmagina</p><h1>Página no disponible</h1><p>${escape(error.message || "No fue posible cargar esta página.")}</p><p><a class="btn btn-primary" href="index.html">Volver al inicio</a></p></header>`;
    }
  }
})();
