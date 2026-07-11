"use strict";

(function () {
  const KEY = "emmagina.cart.v3";
  const LEGACY_KEYS = ["emmagina.cart.v2", "emmagina.cart.v1"];

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function sanitizeText(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function normalizeOption(product, selectedOption = null) {
    const option = selectedOption || pickFirstOption(product);
    if (!option) return null;
    return {
      variantId: sanitizeText(option.variantId || option.id || option.key || option.sku || option.nombre || "base"),
      variantName: sanitizeText(option.variantName || option.nombre || option.name || "Opción principal"),
      sku: sanitizeText(option.sku),
      type: sanitizeText(option.type || option.tipo || "opcion"),
      options: option.options || option.opciones || {},
      price: Math.max(0, Math.round(toNumber(option.price ?? option.precio ?? product.precio ?? 0))),
      originalPrice: Math.max(0, Math.round(toNumber(option.originalPrice ?? option.precioOriginal ?? product.precioOriginal ?? 0))),
      image: sanitizeText(option.image || option.imagenPrincipal || product.imagenPrincipal || ""),
      stock: Math.max(0, Math.round(toNumber(option.stock ?? option.stockDisponible ?? 0))),
      status: sanitizeText(option.status || option.estadoComercial || option.textoDisponibilidad || ""),
      preparationDays: Math.max(1, Math.round(toNumber(option.preparationDays || option.diasPreparacion || product.diasPreparacion || 3, 3)))
    };
  }

  function pickFirstOption(product) {
    const variants = Array.isArray(product?.variantes) ? product.variantes.filter((variant) => variant && variant.activo !== false) : [];
    const variant = variants.find((item) => Number(item.stockDisponible || item.stock || 0) > 0) || variants[0] || null;
    if (!variant) return null;
    return {
      variantId: variant.id || variant._id || variant.key || variant.sku || variant.nombre || "opcion-1",
      variantName: variant.nombre || variant.name || variant.color || variant.talla || "Opción principal",
      sku: variant.sku || "",
      type: variant.tipo || "opcion",
      options: variant.opciones || {},
      price: Number(variant.precio ?? variant.price ?? product.precio ?? 0),
      originalPrice: Number(variant.precioOriginal ?? product.precioOriginal ?? 0),
      image: variant.imagenPrincipal || product.imagenPrincipal || "",
      stock: Number(variant.stockDisponible ?? variant.stock ?? 0) || 0,
      status: variant.estadoComercial || product.availabilityText || product.textoDisponibilidad || "",
      preparationDays: variant.diasPreparacion || product.diasPreparacion || 3
    };
  }

  function normalizeItem(item = {}) {
    const option = item.option ? normalizeOption(item, item.option) : null;
    const productId = sanitizeText(item.productId || item.productoId || item.id || item._id || item.slug || item.name || item.nombre);
    const lineKey = sanitizeText(item.lineKey || `${productId}::${option?.variantId || "base"}`);
    const price = Math.max(0, Math.round(toNumber(item.price ?? item.precio ?? item.precioUnitario ?? option?.price ?? 0)));
    const quantity = Math.max(1, Math.round(toNumber(item.quantity ?? item.cantidad, 1)));
    return {
      lineKey,
      productId,
      slug: sanitizeText(item.slug),
      name: sanitizeText(item.name || item.nombre || "Producto Emmagina"),
      price,
      image: sanitizeText(item.image || item.imagen || option?.image || window.CONFIG?.placeholderImage),
      quantity,
      option,
      personalizable: item.personalizable === true,
      customization: item.customization || item.personalizacion || null,
      addedAt: item.addedAt || new Date().toISOString()
    };
  }

  function readRaw() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(current) && current.length) return current;
    } catch {}

    for (const legacyKey of LEGACY_KEYS) {
      try {
        const legacy = JSON.parse(localStorage.getItem(legacyKey) || "[]");
        if (Array.isArray(legacy) && legacy.length) return legacy;
      } catch {}
    }

    return [];
  }

  function read() {
    return readRaw().map(normalizeItem).filter((item) => item.productId || item.slug || item.name);
  }

  function write(items) {
    const normalized = Array.isArray(items) ? items.map(normalizeItem) : [];
    localStorage.setItem(KEY, JSON.stringify(normalized));
    LEGACY_KEYS.forEach((legacyKey) => localStorage.removeItem(legacyKey));
    updateBadges();
    window.dispatchEvent(new CustomEvent("emmagina:cart", { detail: normalized }));
  }

  function add(product, quantity = 1, selectedOption = null) {
    if (!product) return false;
    const option = normalizeOption(product, selectedOption);
    const id = sanitizeText(product.id || product._id || product.slug || product.nombre || product.name);
    const optionKey = option?.variantId || "base";
    const lineKey = `${id}::${optionKey}`;
    const items = read();
    const existing = items.find((item) => item.lineKey === lineKey);
    const safeQuantity = Math.max(1, Math.round(toNumber(quantity, 1)));
    const price = Math.max(0, Math.round(toNumber(option?.price ?? product.precio ?? product.price ?? 0)));
    const stock = Number(option?.stock || product.stockDisponible || product.stock || 0) || 0;

    if (existing) {
      existing.quantity += safeQuantity;
      if (stock > 0) existing.quantity = Math.min(existing.quantity, stock);
      existing.price = price;
      existing.option = option;
    } else {
      items.push({
        lineKey,
        productId: id,
        slug: sanitizeText(product.slug),
        name: sanitizeText(product.nombre || product.name || "Producto Emmagina"),
        price,
        image: sanitizeText(option?.image || product.imagenPrincipal || product.image || window.CONFIG?.placeholderImage),
        quantity: stock > 0 ? Math.min(safeQuantity, stock) : safeQuantity,
        option,
        personalizable: product.personalizable === true,
        customization: null,
        addedAt: new Date().toISOString()
      });
    }

    write(items);
    toast(`${sanitizeText(product.nombre || product.name, "Producto")} agregado al carrito`);
    return true;
  }

  function remove(lineKey) {
    write(read().filter((item) => item.lineKey !== lineKey));
  }

  function setQuantity(lineKey, quantity) {
    const items = read();
    const item = items.find((entry) => entry.lineKey === lineKey);
    if (!item) return;
    const stock = Number(item.option?.stock || 0) || 0;
    const next = Math.max(1, Math.round(toNumber(quantity, 1)));
    item.quantity = stock > 0 ? Math.min(next, stock) : next;
    write(items);
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function subtotal() {
    return read().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  }

  function total() {
    return subtotal();
  }

  function toOrderItems() {
    return read().map((item) => ({
      lineaId: item.lineKey,
      productoId: item.productId,
      nombre: item.name,
      imagen: item.image,
      varianteId: item.option?.variantId || "",
      color: item.option?.variantName || "",
      talla: item.option?.options?.talla || item.option?.options?.size || "",
      sku: item.option?.sku || "",
      cantidad: item.quantity,
      precioUnitario: item.price,
      personalizacion: item.customization || null
    }));
  }

  function updateBadges() {
    document.querySelectorAll("[data-cart-count], #cart-count").forEach((el) => {
      el.textContent = String(count());
    });
  }

  let toastTimer = null;
  function toast(message) {
    let el = document.querySelector(".em-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "em-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
  }

  window.EmmaginaCart = Object.freeze({
    read,
    write,
    add,
    remove,
    setQuantity,
    clear,
    count,
    subtotal,
    total,
    toOrderItems,
    updateBadges
  });

  document.addEventListener("DOMContentLoaded", updateBadges);
})();
