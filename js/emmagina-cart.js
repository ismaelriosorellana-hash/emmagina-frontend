"use strict";

(function () {
  const KEY = "emmagina.cart.v2";

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadges();
    window.dispatchEvent(new CustomEvent("emmagina:cart", { detail: items }));
  }

  function pickFirstOption(product) {
    const variant = Array.isArray(product.variantes) && product.variantes.length ? product.variantes[0] : null;
    return variant ? {
      variantId: variant.id || variant._id || variant.sku || variant.nombre || "opcion-1",
      variantName: variant.nombre || variant.name || variant.color || variant.talla || "Opción principal",
      price: Number(variant.precio || variant.price || product.precio || 0) || product.precio
    } : null;
  }

  function add(product, quantity = 1) {
    if (!product) return false;
    const option = pickFirstOption(product);
    const id = String(product.id || product._id || product.slug || product.nombre || "");
    const optionKey = option?.variantId || "base";
    const lineKey = `${id}::${optionKey}`;
    const items = read();
    const existing = items.find((item) => item.lineKey === lineKey);
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    if (existing) {
      existing.quantity += safeQuantity;
    } else {
      items.push({
        lineKey,
        productId: id,
        slug: product.slug || "",
        name: product.nombre,
        price: Number(option?.price || product.precio || 0),
        image: product.imagenPrincipal,
        quantity: safeQuantity,
        option,
        personalizable: product.personalizable === true
      });
    }

    write(items);
    toast(`${product.nombre} agregado al carrito`);
    return true;
  }

  function remove(lineKey) {
    write(read().filter((item) => item.lineKey !== lineKey));
  }

  function setQuantity(lineKey, quantity) {
    const items = read();
    const item = items.find((entry) => entry.lineKey === lineKey);
    if (!item) return;
    item.quantity = Math.max(1, Number(quantity) || 1);
    write(items);
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function total() {
    return read().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
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

  window.EmmaginaCart = Object.freeze({ read, write, add, remove, setQuantity, clear, count, total, updateBadges });
  document.addEventListener("DOMContentLoaded", updateBadges);
})();
