"use strict";

(function () {
  const API = {};
  const SESSION_KEY = "rhema_customer_session";

  function getStoredSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveSession(payload, remember = false) {
    const session = payload?.token ? { token: payload.token, usuario: payload.usuario || null } : null;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    if (!session) return null;
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

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
      const session = getStoredSession();
      const response = await fetch(toUrl(endpoint), {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
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


  async function getPage(key) {
    const normalizedKey = String(key || "").trim() || "home";
    const payload = await request(`/pages/${encodeURIComponent(normalizedKey)}`);
    return payload?.page || payload?.data || payload;
  }

  async function getCmsPage(key = "home") {
    const normalizedKey = String(key || "home").trim() || "home";
    const payload = await request(`/cms/pages/${encodeURIComponent(normalizedKey)}`);
    return payload?.page || payload?.data || payload;
  }

  async function getCategories() {
    const payload = await request("/categorias");
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.categorias)) return payload.categorias;
    if (Array.isArray(payload?.categories)) return payload.categories;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  async function getSiteSettings() {
    return request("/configuracion-sitio");
  }

  async function getNavigation() {
    try {
      const payload = await request("/cms/_navigation");
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.navigation)) return payload.navigation;
    } catch (error) {
      console.warn("Navegación CMS no disponible, usando navegación anterior:", error.message);
    }
    const payload = await request("/pages/_navigation");
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.navigation)) return payload.navigation;
    return [];
  }

  async function getBanners() {
    const payload = await request("/banners");
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.banners)) return payload.banners;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  async function validateCart(items = []) {
    return request("/pedidos/validar-carrito", {
      method: "POST",
      body: { items }
    });
  }

  async function createOrder(payload = {}) {
    return request("/pedidos", {
      method: "POST",
      body: payload
    });
  }

  async function createCustomRequest(formData) {
    return request("/solicitudes-personalizadas", {
      method: "POST",
      body: formData,
      timeoutMs: 120000
    });
  }

  async function getCustomQuote(folio, contact = {}) {
    const query = new URLSearchParams();
    if (contact.correo) query.set("correo", contact.correo);
    if (contact.whatsapp) query.set("whatsapp", contact.whatsapp);
    return request(`/solicitudes-personalizadas/${encodeURIComponent(folio)}?${query.toString()}`);
  }

  async function respondCustomQuote(folio, payload = {}) {
    return request(`/solicitudes-personalizadas/${encodeURIComponent(folio)}/responder`, {
      method: "POST",
      body: payload
    });
  }

  async function createOrderFromQuote(folio, payload = {}) {
    return request(`/solicitudes-personalizadas/${encodeURIComponent(folio)}/crear-pedido`, {
      method: "POST",
      body: payload
    });
  }

  async function registerCustomer(payload = {}, remember = false) {
    const response = await request("/auth/registro", { method: "POST", body: payload });
    saveSession(response, remember);
    return response;
  }

  async function loginCustomer(payload = {}, remember = false) {
    const response = await request("/auth/login", { method: "POST", body: { ...payload, area: "cliente" } });
    saveSession(response, remember);
    return response;
  }

  async function getCustomerProfile() {
    return request("/cuenta/perfil");
  }

  async function updateCustomerProfile(payload = {}) {
    return request("/cuenta/perfil", { method: "PATCH", body: payload });
  }

  async function getCustomerOrders() {
    return request("/cuenta/pedidos");
  }

  async function getCustomerOrder(id) {
    return request(`/cuenta/pedidos/${encodeURIComponent(id)}`);
  }

  API.request = request;
  API.getProducts = getProducts;
  API.getProductBySlug = getProductBySlug;
  API.getProductById = getProductById;
  API.getBanners = getBanners;
  API.getSiteSettings = getSiteSettings;
  API.getNavigation = getNavigation;
  API.getPage = getPage;
  API.getCmsPage = getCmsPage;
  API.getCategories = getCategories;
  API.validateCart = validateCart;
  API.createOrder = createOrder;
  API.createCustomRequest = createCustomRequest;
  API.getCustomQuote = getCustomQuote;
  API.respondCustomQuote = respondCustomQuote;
  API.createOrderFromQuote = createOrderFromQuote;
  API.getStoredSession = getStoredSession;
  API.saveSession = saveSession;
  API.clearSession = clearSession;
  API.registerCustomer = registerCustomer;
  API.loginCustomer = loginCustomer;
  API.getCustomerProfile = getCustomerProfile;
  API.updateCustomerProfile = updateCustomerProfile;
  API.getCustomerOrders = getCustomerOrders;
  API.getCustomerOrder = getCustomerOrder;
  window.EmmaginaAPI = Object.freeze(API);
})();
