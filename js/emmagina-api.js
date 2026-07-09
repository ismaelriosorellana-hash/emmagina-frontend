"use strict";

(function () {
  const API = {};

  function cleanBase() {
    const base = String(window.CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
    if (!base) throw new Error("API_BASE_URL no está configurado.");
    return /\/api$/i.test(base) ? base : `${base}/api`;
  }

  function toUrl(endpoint = "") {
    const path = String(endpoint).replace(/^\/+/, "");
    return `${cleanBase()}/${path}`;
  }

  async function request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 65000);
    try {
      const response = await fetch(toUrl(endpoint), {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {})
        },
        body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        cache: "no-store"
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : await response.text();
      if (!response.ok) {
        const message = typeof data === "object" && data?.error ? data.error : `Error HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.details = data;
        throw error;
      }
      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function normalizeProductsResponse(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.productos)) return payload.productos;
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  async function getProducts(params = {}) {
    const query = new URLSearchParams();
    query.set("limit", String(params.limit || 200));
    if (params.category && params.category !== "Todos") query.set("categoria", params.category);
    if (params.search) query.set("buscar", params.search);
    if (params.sort) query.set("ordenar", params.sort);
    const payload = await request(`/productos?${query.toString()}`);
    return normalizeProductsResponse(payload).map(window.EmmaginaData.normalizeProduct);
  }

  async function getProductBySlug(slug) {
    const payload = await request(`/productos/slug/${encodeURIComponent(slug)}`);
    return window.EmmaginaData.normalizeProduct(payload);
  }

  async function getProductById(id) {
    const payload = await request(`/productos/${encodeURIComponent(id)}`);
    return window.EmmaginaData.normalizeProduct(payload);
  }

  async function getBanners() {
    const payload = await request("/banners");
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.banners)) return payload.banners;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  API.request = request;
  API.getProducts = getProducts;
  API.getProductBySlug = getProductBySlug;
  API.getProductById = getProductById;
  API.getBanners = getBanners;
  window.EmmaginaAPI = Object.freeze(API);
})();
