"use strict";

(function () {
  function formatPrice(value) {
    return new Intl.NumberFormat(window.CONFIG?.locale || "es-CL", {
      style: "currency",
      currency: window.CONFIG?.currency || "CLP",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function firstImage(raw) {
    const images = raw?.imagenes || raw?.images || raw?.galeria || [];
    const list = Array.isArray(images) ? images : [images].filter(Boolean);
    const sorted = list.slice().sort((a, b) => {
      const ap = a?.principal || a?.isMain ? -1 : 0;
      const bp = b?.principal || b?.isMain ? -1 : 0;
      return ap - bp || (Number(a?.orden || 0) - Number(b?.orden || 0));
    });
    const first = sorted[0];
    if (!first) return raw?.imagenPrincipal || raw?.image || window.CONFIG?.placeholderImage;
    if (typeof first === "string") return first;
    return first.secure_url || first.url || first.src || first.href || raw?.imagenPrincipal || window.CONFIG?.placeholderImage;
  }

  function allImages(raw) {
    const images = raw?.imagenes || raw?.images || raw?.galeria || [];
    const list = Array.isArray(images) ? images : [images].filter(Boolean);
    const urls = list
      .slice()
      .sort((a, b) => {
        const ap = a?.principal || a?.isMain ? -1 : 0;
        const bp = b?.principal || b?.isMain ? -1 : 0;
        return ap - bp || (Number(a?.orden || 0) - Number(b?.orden || 0));
      })
      .map((img) => typeof img === "string" ? img : img?.secure_url || img?.url || img?.src || img?.href || "")
      .filter(Boolean);
    if (!urls.length) urls.push(firstImage(raw));
    return urls;
  }

  function normalizeCategories(raw) {
    const out = [];
    const primary = raw?.categoriaPrincipal || raw?.categoria || raw?.category;
    if (primary) out.push(String(primary));
    const extras = raw?.categorias || raw?.categories || [];
    (Array.isArray(extras) ? extras : [extras]).forEach((item) => {
      if (item && !out.includes(String(item))) out.push(String(item));
    });
    if (!out.length) out.push("Otros");
    return out;
  }

  function discountPercent(product) {
    const price = Number(product.precio || 0);
    const original = Number(product.precioOriginal || 0);
    if (!original || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  }

  function normalizeProduct(raw = {}) {
    const id = String(raw.id || raw._id || "");
    const nombre = String(raw.nombre || raw.name || "Producto Emmagina").trim();
    const precio = Number(raw.precio || raw.price || 0);
    const precioOriginal = Number(raw.precioOriginal || raw.originalPrice || 0);
    const categorias = normalizeCategories(raw);
    const slug = String(raw.slug || slugify(nombre));
    const stock = Number(raw.stock ?? raw.existencias ?? raw.inventory ?? 0);
    const personalizado = Boolean(raw.personalizable || raw.fabricadoAPedido || raw.aPedido || stock <= 0);
    const insignia = String(raw.insignia || raw.badge || (raw.lanzamiento ? "Lanzamiento" : raw.destacado ? "Destacado" : personalizado ? "A pedido" : "")).trim();
    const discount = discountPercent({ precio, precioOriginal });
    const rawBadges = Array.isArray(raw.badges) ? raw.badges : [];
    const badges = rawBadges
      .filter((badge) => badge && badge.activo !== false && badge.visible !== false && String(badge.texto || badge.text || badge.label || "").trim())
      .map((badge, index) => ({
        texto: String(badge.texto || badge.text || badge.label || "").trim().slice(0, 48),
        color: String(badge.color || badge.background || "#303744").trim() || "#303744",
        textoColor: String(badge.textoColor || badge.textColor || badge.colorTexto || "#ffffff").trim() || "#ffffff",
        orden: Number.isFinite(Number(badge.orden)) ? Number(badge.orden) : index + 1
      }))
      .sort((a, b) => a.orden - b.orden);

    const discountBadge = raw.badgeDescuento || raw.discountBadge || {};
    if (discount > 0 && discountBadge.activo !== false) {
      badges.push({
        texto: String(discountBadge.texto || discountBadge.text || `-${discount}%`).trim(),
        color: String(discountBadge.color || "#a87148").trim() || "#a87148",
        textoColor: String(discountBadge.textoColor || discountBadge.textColor || "#ffffff").trim() || "#ffffff",
        orden: Number.isFinite(Number(discountBadge.orden)) ? Number(discountBadge.orden) : 99
      });
      badges.sort((a, b) => a.orden - b.orden);
    }

    const availabilityText = String(raw.textoDisponibilidad || raw.availabilityText || raw.estadoComercialTexto || "").trim();

    return {
      id,
      _id: id,
      slug,
      nombre,
      descripcion: raw.descripcion || raw.description || "Producto impreso en 3D por Emmagina.",
      descripcionCorta: raw.descripcionCorta || raw.shortDescription || raw.descripcion || "Diseñado y fabricado con detalles cuidados.",
      precio,
      precioOriginal,
      categorias,
      categoriaPrincipal: raw.categoriaPrincipal || categorias[0],
      imagenPrincipal: firstImage(raw),
      imagenes: allImages(raw),
      stock,
      activo: raw.activo !== false,
      publicarCatalogo: raw.publicarCatalogo !== false,
      destacado: Boolean(raw.destacado || raw.featured),
      masVendido: Boolean(raw.masVendido || raw.bestSeller),
      masVisto: Boolean(raw.masVisto || raw.mostViewed),
      lanzamiento: Boolean(raw.lanzamiento || raw.launch),
      desde14990: Boolean(raw.desde14990 || precio <= 14990),
      personalizable: personalizado,
      insignia,
      badges,
      discount,
      availabilityText,
      variantes: Array.isArray(raw.variantes) ? raw.variantes : [],
      raw
    };
  }

  function isVisible(product) {
    return product && product.activo !== false && product.publicarCatalogo !== false;
  }

  window.EmmaginaData = Object.freeze({
    formatPrice,
    slugify,
    normalizeProduct,
    isVisible
  });
})();
