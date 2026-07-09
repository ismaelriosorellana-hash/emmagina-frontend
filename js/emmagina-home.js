
"use strict";

(async function () {
  const all = [];
  let publicBanners = [];

  function by(selector) { return document.querySelector(selector); }

  function textKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
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

  function fillMarqueeList(selected, products, minItems = 8) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    const base = uniqueById(selected.filter(window.EmmaginaData.isVisible));
    const selectedKeys = new Set(base.map((p) => String(p.id || p.slug || p.nombre || "")));
    const fillers = visible.filter((p) => !selectedKeys.has(String(p.id || p.slug || p.nombre || "")));
    const merged = base.concat(fillers);
    if (!merged.length) return [];
    const result = [];
    let i = 0;
    while (result.length < Math.max(minItems, Math.min(14, visible.length || minItems))) {
      result.push(merged[i % merged.length]);
      i += 1;
      if (merged.length === result.length && result.length >= minItems) break;
    }
    return result.slice(0, 14);
  }

  function sectionProducts(kind, products) {
    const visible = uniqueById(products.filter(window.EmmaginaData.isVisible));
    let selected = [];
    if (kind === "destacados") selected = visible.filter((p) => p.destacado || String(p.insignia || "").toLowerCase().includes("destacado"));
    else if (kind === "desde14990") selected = visible.filter((p) => p.desde14990 || Number(p.precio) <= 14990);
    else if (kind === "lanzamiento") selected = visible.filter((p) => p.lanzamiento || String(p.insignia || "").toLowerCase().includes("lanzamiento"));
    else if (kind === "vendidos") selected = visible.filter((p) => p.masVendido);
    else if (kind === "vistos") selected = visible.filter((p) => p.masVisto);
    else selected = visible;
    return fillMarqueeList(selected, visible, 8);
  }

  function renderProductMarquee(id, title, products) {
    const root = by(`[data-home-marquee='${id}']`);
    if (!root) return;
    const track = root.querySelector("[data-marquee-track]");
    const selected = products.length ? products : all.slice(0, 12);
    if (!track) return;
    if (!selected.length) {
      track.innerHTML = `<div class="state-box"><p>No hay productos disponibles para ${window.EmmaginaUI.escapeHtml(title)}.</p></div>`;
      return;
    }

    const cards = selected.map((p) => window.EmmaginaUI.productCard(p)).join("");
    track.innerHTML = `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`;
    const duration = Math.max(34, selected.length * 6);
    track.style.setProperty("--marquee-duration", `${duration}s`);
    window.EmmaginaUI.attachCartButtons(all);
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
    image.alt = banner.titulo || banner.nombre || "Banner principal Emmagina";
    image.style.objectPosition = banner.posicion || "center";
    if (link) link.href = bannerTarget(banner, "catalogo.html");
    if (kicker) kicker.textContent = banner.eyebrow || "Emmagina";
    if (title) title.textContent = banner.titulo || "Ideas que toman forma";
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
        const text = banner.eyebrow || "Conoce una sección de Emmagina.";
        return `<a class="explore-card" href="${window.EmmaginaUI.escapeHtml(bannerTarget(banner, "catalogo.html"))}">
          <img class="explore-image" src="${window.EmmaginaUI.escapeHtml(image)}" alt="${window.EmmaginaUI.escapeHtml(title)}" loading="lazy">
          <h3>${window.EmmaginaUI.escapeHtml(title)}</h3>
          <p>${window.EmmaginaUI.escapeHtml(text)}</p>
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
        <img class="explore-image" src="${window.EmmaginaUI.escapeHtml(image)}" alt="${window.EmmaginaUI.escapeHtml(card.title)}" loading="lazy">
        <h3>${window.EmmaginaUI.escapeHtml(card.title)}</h3>
        <p>${window.EmmaginaUI.escapeHtml(card.text)}</p>
      </a>`;
    }).join("");
  }

  function normalizeReview(product, review = {}) {
    const rating = Number(review.rating || review.estrellas || review.puntuacion || review.score || 0);
    const text = String(review.texto || review.comentario || review.review || review.descripcion || "").trim();
    if (!text || rating < 4) return null;
    return {
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      text,
      author: String(review.nombre || review.autor || review.cliente || "Cliente Emmagina").trim(),
      productName: product.nombre,
      productUrl: window.ProductLinks.detail(product)
    };
  }

  function collectReviews(products) {
    const reviews = [];
    for (const product of products) {
      const raw = product.raw || product;
      const list = raw.resenas || raw.reseñas || raw.reviews || raw.valoraciones || [];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const normalized = normalizeReview(product, item);
        if (normalized) reviews.push(normalized);
      }
    }
    return reviews.sort((a, b) => b.rating - a.rating).slice(0, 12);
  }

  function renderReviews(products) {
    const section = by("[data-reviews-section]");
    const track = by("[data-reviews-track]");
    if (!section || !track) return;
    const reviews = collectReviews(products);
    if (!reviews.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    const cards = reviews.map((review) => {
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
      return `<article class="review-card">
        <div class="review-stars" aria-label="${review.rating} de 5 estrellas">${stars}</div>
        <blockquote>“${window.EmmaginaUI.escapeHtml(review.text)}”</blockquote>
        <footer>
          <strong>${window.EmmaginaUI.escapeHtml(review.author)}</strong>
          <a href="${window.EmmaginaUI.escapeHtml(review.productUrl)}">${window.EmmaginaUI.escapeHtml(review.productName)}</a>
        </footer>
      </article>`;
    }).join("");
    track.innerHTML = `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`;
    track.style.setProperty("--marquee-duration", `${Math.max(32, reviews.length * 7)}s`);
  }

  try {
    document.querySelectorAll("[data-marquee-track]").forEach((track) => window.EmmaginaUI.setLoading(track, "Cargando productos..."));
    const [products, banners] = await Promise.all([
      window.EmmaginaAPI.getProducts({ limit: 240 }),
      window.EmmaginaAPI.getBanners().catch(() => [])
    ]);
    all.push(...products);
    publicBanners = Array.isArray(banners) ? banners : [];
    const visible = all.filter(window.EmmaginaData.isVisible);

    applyHeroBanner();
    applyLineBanner("linea-memories", ["memories", "memoria"], "pedido-personalizado.html");
    applyLineBanner("linea-alma", ["alma"], "catalogo.html?categoria=Linea%20Alma");
    renderExplore(visible);
    renderProductMarquee("desde14990", "Desde $14.990", sectionProducts("desde14990", visible));
    renderProductMarquee("lanzamiento", "Lanzamiento", sectionProducts("lanzamiento", visible));
    renderProductMarquee("destacados", "Destacados", sectionProducts("destacados", visible));
    renderReviews(visible);
  } catch (error) {
    console.error("No fue posible cargar productos en inicio:", error);
    document.querySelectorAll("[data-home-marquee]").forEach((root) => window.EmmaginaUI.setError(root, error.message));
  }
})();
