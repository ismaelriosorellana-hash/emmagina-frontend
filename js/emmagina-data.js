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

  function imageUrl(image) {
    if (!image) return "";
    if (typeof image === "string") return image;
    return image.secure_url || image.url || image.src || image.href || image.imagen || "";
  }

  function sortedImages(images) {
    const list = Array.isArray(images) ? images : [images].filter(Boolean);
    return list
      .slice()
      .sort((a, b) => {
        const ap = a?.principal || a?.isMain ? -1 : 0;
        const bp = b?.principal || b?.isMain ? -1 : 0;
        return ap - bp || (Number(a?.orden || 0) - Number(b?.orden || 0));
      })
      .map(imageUrl)
      .filter(Boolean);
  }

  function firstImage(raw) {
    const general = sortedImages(raw?.imagenes || raw?.images || raw?.galeria || []);
    if (general.length) return general[0];
    const variants = Array.isArray(raw?.variantes) ? raw.variantes : [];
    for (const variant of variants) {
      const direct = imageUrl(variant?.imagenPrincipal || variant?.imagen);
      if (direct) return direct;
      const variantImages = sortedImages(variant?.imagenes || variant?.images || []);
      if (variantImages.length) return variantImages[0];
    }
    return raw?.imagenPrincipal || raw?.image || window.CONFIG?.placeholderImage;
  }

  function allImages(raw) {
    const urls = [...sortedImages(raw?.imagenes || raw?.images || raw?.galeria || [])];
    const variants = Array.isArray(raw?.variantes) ? raw.variantes : [];
    variants.forEach((variant) => {
      const direct = imageUrl(variant?.imagenPrincipal || variant?.imagen);
      if (direct) urls.push(direct);
      sortedImages(variant?.imagenes || variant?.images || []).forEach((url) => urls.push(url));
    });
    const unique = [...new Set(urls.filter(Boolean))];
    if (!unique.length) unique.push(firstImage(raw));
    return unique;
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

  function normalizeVariant(raw = {}, product = {}) {
    const images = sortedImages(raw.imagenes || raw.images || raw.imagen || []);
    const mainImage = imageUrl(raw.imagenPrincipal) || images[0] || product.imagenPrincipal || window.CONFIG?.placeholderImage;
    const price = Number(raw.precio ?? raw.price ?? product.precio ?? 0) || 0;
    const originalPrice = Number(raw.precioOriginal ?? raw.originalPrice ?? product.precioOriginal ?? 0) || 0;
    const stock = Number(raw.stockDisponible ?? raw.stock ?? raw.existencias ?? 0) || 0;
    const name = String(raw.nombre || raw.name || raw.label || raw.color || raw.talla || "Opción").trim();

    return {
      ...raw,
      id: String(raw.id || raw._id || raw.key || raw.sku || name || "base"),
      key: String(raw.key || raw.id || raw._id || raw.sku || name || "base"),
      nombre: name,
      tipo: String(raw.tipo || raw.type || "opcion"),
      opciones: raw.opciones && typeof raw.opciones === "object" ? raw.opciones : {},
      codigoHex: String(raw.codigoHex || raw.colorHex || raw.hex || "").trim(),
      precio: price,
      precioOriginal: originalPrice,
      stock,
      stockDisponible: stock,
      stockMinimo: Number(raw.stockMinimo ?? 5) || 5,
      sku: String(raw.sku || "").trim(),
      activo: raw.activo !== false,
      estadoComercial: String(raw.estadoComercial || raw.status || "").trim(),
      imagenPrincipal: mainImage,
      imagenes: images.length ? images : [mainImage].filter(Boolean),
      diasPreparacion: Number(raw.diasPreparacion || product.diasPreparacion || 3) || 3
    };
  }

  function normalizeCharacteristics(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === "string") return { titulo: "Detalle", valor: item };
        if (!item || typeof item !== "object") return null;
        const titulo = String(item.titulo || item.title || item.nombre || "Detalle").trim();
        const valor = String(item.valor || item.value || item.texto || "").trim();
        return valor ? { titulo, valor } : null;
      })
      .filter(Boolean);
  }

  function normalizePdpContent(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const list = (items) => Array.isArray(items) ? items.map(String).map((item) => item.trim()).filter(Boolean) : String(items || "").split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    const faqs = Array.isArray(source.preguntasFrecuentes || source.faqs) ? (source.preguntasFrecuentes || source.faqs) : [];
    return {
      tituloBeneficio: String(source.tituloBeneficio || source.benefitTitle || "").trim(),
      textoBeneficio: String(source.textoBeneficio || source.benefitText || "").trim(),
      beneficios: list(source.beneficios || source.benefits),
      cuidados: list(source.cuidados || source.care),
      preguntasFrecuentes: faqs.map((item) => ({
        pregunta: String(item.pregunta || item.question || "").trim(),
        respuesta: String(item.respuesta || item.answer || "").trim()
      })).filter((item) => item.pregunta && item.respuesta),
      mensajeCompra: String(source.mensajeCompra || source.buyMessage || "").trim(),
      garantia: String(source.garantia || "").trim()
    };
  }

  function normalizeProduct(raw = {}) {
    const id = String(raw.id || raw._id || "");
    const nombre = String(raw.nombre || raw.name || "Producto Emmagina").trim();
    const precio = Number(raw.precio || raw.price || 0);
    const precioOriginal = Number(raw.precioOriginal || raw.originalPrice || 0);
    const categorias = normalizeCategories(raw);
    const slug = String(raw.slug || slugify(nombre));
    const imagenPrincipal = firstImage(raw);
    const baseProduct = { precio, precioOriginal, imagenPrincipal, diasPreparacion: raw.diasPreparacion || 3 };
    const variantes = (Array.isArray(raw.variantes) ? raw.variantes : []).map((variant) => normalizeVariant(variant, baseProduct)).filter((variant) => variant.activo !== false);
    const stock = Number(raw.stockDisponible ?? raw.stock ?? raw.existencias ?? variantes.reduce((sum, item) => sum + Number(item.stockDisponible || item.stock || 0), 0) ?? 0);
    const personalizado = Boolean(raw.personalizable || raw.fabricadoAPedido || raw.aPedido || raw.fabricadoPedido || raw.bajoPedido || stock <= 0);
    const insignia = String(raw.insignia || raw.badge || (raw.lanzamiento ? "Lanzamiento" : raw.destacado ? "Destacado" : personalizado ? "A pedido" : "")).trim();
    const discount = discountPercent({ precio, precioOriginal });
    const rawBadges = Array.isArray(raw.badges) ? raw.badges : [];
    const badges = rawBadges
      .filter((badge) => badge && badge.activo !== false && badge.visible !== false && String(badge.texto || badge.text || badge.label || "").trim())
      .map((badge, index) => ({
        texto: String(badge.texto || badge.text || badge.label || "").trim().slice(0, 48),
        color: String(badge.color || badge.background || "#219EBC").trim() || "#219EBC",
        textoColor: String(badge.textoColor || badge.textColor || badge.colorTexto || "#ffffff").trim() || "#ffffff",
        orden: Number.isFinite(Number(badge.orden)) ? Number(badge.orden) : index + 1
      }))
      .sort((a, b) => a.orden - b.orden);

    const discountBadge = raw.badgeDescuento || raw.discountBadge || {};
    if (discount > 0 && discountBadge.activo !== false) {
      badges.push({
        texto: String(discountBadge.texto || discountBadge.text || `-${discount}%`).trim(),
        color: String(discountBadge.color || "#FB8500").trim() || "#FB8500",
        textoColor: String(discountBadge.textoColor || discountBadge.textColor || "#023047").trim() || "#023047",
        orden: Number.isFinite(Number(discountBadge.orden)) ? Number(discountBadge.orden) : 99
      });
      badges.sort((a, b) => a.orden - b.orden);
    }

    const prices = variantes.length ? variantes.map((variant) => Number(variant.precio || precio)) : [Number(raw.precioDesde || precio || 0)];
    const precioDesde = Number(raw.precioDesde ?? Math.min(...prices));
    const precioHasta = Number(raw.precioHasta ?? Math.max(...prices));
    const availabilityText = String(raw.textoDisponibilidad || raw.availabilityText || raw.estadoComercialTexto || "").trim();

    return {
      id,
      _id: id,
      slug,
      nombre,
      sku: String(raw.sku || "").trim(),
      marca: String(raw.marca || "Emmagina").trim(),
      descripcion: raw.descripcion || raw.description || "Producto impreso en 3D por Emmagina.",
      descripcionCorta: raw.descripcionCorta || raw.shortDescription || raw.descripcion || "Diseñado y fabricado con detalles cuidados.",
      precio,
      precioOriginal,
      precioDesde,
      precioHasta,
      tieneRangoPrecio: precioDesde !== precioHasta,
      categorias,
      categoriaPrincipal: raw.categoriaPrincipal || categorias[0],
      imagenPrincipal,
      imagenes: allImages(raw),
      stock,
      stockDisponible: Number(raw.stockDisponible ?? stock),
      stockTotal: Number(raw.stockTotal ?? stock),
      enStock: raw.enStock !== undefined ? Boolean(raw.enStock) : stock > 0,
      activo: raw.activo !== false,
      publicarCatalogo: raw.publicarCatalogo !== false,
      destacado: Boolean(raw.destacado || raw.featured),
      masVendido: Boolean(raw.masVendido || raw.bestSeller),
      masVisto: Boolean(raw.masVisto || raw.mostViewed),
      lanzamiento: Boolean(raw.lanzamiento || raw.launch),
      desde14990: Boolean(raw.desde14990 || precioDesde <= 14990),
      personalizable: personalizado,
      fabricadoPedido: Boolean(raw.fabricadoPedido || raw.fabricadoAPedido || raw.madeToOrder),
      bajoPedido: Boolean(raw.bajoPedido),
      diasPreparacion: Number(raw.diasPreparacion || 3),
      insignia,
      badges,
      discount,
      availabilityText,
      variantes,
      tieneVariantes: variantes.length > 0,
      variantePredeterminada: variantes.find((variant) => Number(variant.stockDisponible || variant.stock || 0) > 0) || variantes[0] || null,
      caracteristicas: normalizeCharacteristics(raw.caracteristicas || raw.especificaciones || []),
      contenidoPDP: normalizePdpContent(raw.contenidoPDP || raw.pdp || {}),
      entrega: raw.entrega || {},
      personalizacionLigera: raw.personalizacionLigera || null,
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
    normalizeVariant,
    isVisible
  });
})();
