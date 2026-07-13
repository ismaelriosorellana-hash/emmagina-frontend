"use strict";

(function () {
  const API = window.EmmaginaAPI;
  const page = document.body.dataset.accountPage || "";
  const escape = (value) => window.EmmaginaUI.escapeHtml(value ?? "");
  const money = (value) => window.EmmaginaData.formatPrice(Number(value || 0));

  function showMessage(target, message, type = "info") {
    if (!target) return;
    target.hidden = false;
    target.className = `account-message is-${type}`;
    target.textContent = message;
  }

  function setBusy(button, busy, text) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = text;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function updateHeader() {
    const session = API.getStoredSession?.();
    document.querySelectorAll(".login-link").forEach((link) => {
      link.href = session?.token ? "cuenta.html" : "acceso.html";
      link.textContent = session?.token ? "Mi cuenta" : "Iniciar sesión";
    });
  }

  function redirectAuthenticated() {
    if (API.getStoredSession?.()?.token && page === "access") {
      location.replace("cuenta.html");
      return true;
    }
    return false;
  }

  function initAccess() {
    if (redirectAuthenticated()) return;
    const tabs = document.querySelectorAll("[data-auth-tab]");
    const panels = document.querySelectorAll("[data-auth-panel]");
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      const name = tab.dataset.authTab;
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      panels.forEach((panel) => panel.hidden = panel.dataset.authPanel !== name);
    }));

    const loginForm = document.querySelector("[data-login-form]");
    const registerForm = document.querySelector("[data-register-form]");
    const message = document.querySelector("[data-auth-message]");

    loginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = loginForm.querySelector("button[type='submit']");
      setBusy(button, true, "Ingresando...");
      message.hidden = true;
      try {
        const data = new FormData(loginForm);
        await API.loginCustomer({ email: data.get("email"), password: data.get("password") }, data.get("remember") === "on");
        location.href = "cuenta.html";
      } catch (error) {
        showMessage(message, error.message || "No fue posible iniciar sesión.", "error");
      } finally {
        setBusy(button, false);
      }
    });

    registerForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = registerForm.querySelector("button[type='submit']");
      setBusy(button, true, "Creando cuenta...");
      message.hidden = true;
      try {
        const data = new FormData(registerForm);
        if (data.get("password") !== data.get("passwordConfirm")) throw new Error("Las contraseñas no coinciden.");
        await API.registerCustomer({
          nombre: data.get("nombre"),
          email: data.get("email"),
          telefono: data.get("telefono"),
          comuna: data.get("comuna"),
          password: data.get("password")
        }, data.get("remember") === "on");
        location.href = "cuenta.html";
      } catch (error) {
        showMessage(message, error.message || "No fue posible crear la cuenta.", "error");
      } finally {
        setBusy(button, false);
      }
    });
  }

  function statusLabel(value) {
    const labels = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      validacion_diseno: "Validación de diseño",
      en_produccion: "En producción",
      listo: "Listo",
      enviado: "Enviado",
      entregado: "Entregado",
      cancelado: "Cancelado",
      pagado: "Pagado",
      rechazado: "Rechazado",
      vencido: "Vencido"
    };
    return labels[value] || String(value || "Sin estado").replaceAll("_", " ");
  }

  function orderCard(order) {
    const products = Array.isArray(order.productos) ? order.productos.map((item) => escape(item.nombre)).join(", ") : "";
    return `<article class="account-order-card">
      <div>
        <p class="kicker">${escape(order.numeroPedido)}</p>
        <h3>${products || `${Number(order.cantidadProductos || 0)} producto(s)`}</h3>
        <p>${new Date(order.fecha).toLocaleDateString("es-CL")} · ${escape(statusLabel(order.estadoPedido))}</p>
      </div>
      <div class="account-order-side">
        <strong>${money(order.total)}</strong>
        <span class="account-status">${escape(statusLabel(order.estadoPago))}</span>
        <a class="btn btn-soft btn-small" href="pedido.html?id=${encodeURIComponent(order.id)}">Ver pedido</a>
      </div>
    </article>`;
  }

  async function initAccount() {
    const session = API.getStoredSession?.();
    if (!session?.token) {
      location.replace("acceso.html?return=cuenta.html");
      return;
    }

    const message = document.querySelector("[data-account-message]");
    const ordersBox = document.querySelector("[data-account-orders]");
    const profileForm = document.querySelector("[data-profile-form]");
    const greeting = document.querySelector("[data-account-name]");

    document.querySelector("[data-logout]")?.addEventListener("click", () => {
      API.clearSession();
      location.replace("acceso.html");
    });

    try {
      const [profilePayload, ordersPayload] = await Promise.all([API.getCustomerProfile(), API.getCustomerOrders()]);
      const user = profilePayload.usuario || {};
      if (greeting) greeting.textContent = user.nombre || "cliente";
      ["nombre", "email", "telefono", "rut", "direccion", "comuna"].forEach((field) => {
        const input = profileForm?.elements[field];
        if (input) input.value = user[field] || "";
      });
      const orders = Array.isArray(ordersPayload.pedidos) ? ordersPayload.pedidos : [];
      ordersBox.innerHTML = orders.length ? orders.map(orderCard).join("") : `<div class="account-empty"><h3>Aún no tienes pedidos vinculados</h3><p>Los próximos pedidos creados mientras tengas tu sesión iniciada aparecerán aquí.</p><a class="btn btn-primary" href="catalogo.html">Ir a la tienda</a></div>`;
      document.querySelector("[data-order-count]").textContent = String(orders.length);
      document.querySelector("[data-active-order-count]").textContent = String(orders.filter((order) => !["entregado", "cancelado"].includes(order.estadoPedido)).length);
    } catch (error) {
      if (error.status === 401) {
        API.clearSession();
        location.replace("acceso.html?expired=1");
        return;
      }
      showMessage(message, error.message || "No fue posible cargar tu cuenta.", "error");
    }

    profileForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = profileForm.querySelector("button[type='submit']");
      setBusy(button, true, "Guardando...");
      try {
        const data = new FormData(profileForm);
        const result = await API.updateCustomerProfile({
          nombre: data.get("nombre"), telefono: data.get("telefono"), rut: data.get("rut"), direccion: data.get("direccion"), comuna: data.get("comuna")
        });
        const current = API.getStoredSession();
        API.saveSession({ token: current.token, usuario: result.usuario }, Boolean(localStorage.getItem("rhema_customer_session")));
        showMessage(message, "Tus datos fueron actualizados.", "success");
        if (greeting) greeting.textContent = result.usuario?.nombre || "cliente";
      } catch (error) {
        showMessage(message, error.message || "No fue posible actualizar tus datos.", "error");
      } finally {
        setBusy(button, false);
      }
    });
  }


  async function initOrderDetail() {
    const session = API.getStoredSession?.();
    if (!session?.token) {
      location.replace("acceso.html?return=pedido.html");
      return;
    }
    const message = document.querySelector("[data-account-message]");
    const target = document.querySelector("[data-account-order-detail]");
    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      showMessage(message, "No se indicó qué pedido deseas revisar.", "error");
      if (target) target.innerHTML = "";
      return;
    }
    try {
      const payload = await API.getCustomerOrder(id);
      const order = payload.pedido || {};
      const items = Array.isArray(order.items) ? order.items : [];
      const history = Array.isArray(order.historial) ? order.historial : [];
      target.innerHTML = `
        <div class="account-order-detail-head">
          <div><p class="kicker">${escape(order.numeroPedido || "Pedido")}</p><h2>${escape(statusLabel(order.estadoPedido))}</h2><p>Pago: ${escape(statusLabel(order.estadoPago))}</p></div>
          <strong>${money(order.total)}</strong>
        </div>
        <div class="account-detail-grid">
          <section><h3>Productos</h3><div class="account-detail-list">${items.map((item) => `<article><div><strong>${escape(item.nombre)}</strong><span>Cantidad: ${Number(item.cantidad || 1)}</span></div><strong>${money(Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 1))}</strong></article>`).join("") || "<p>No hay productos para mostrar.</p>"}</div></section>
          <section><h3>Entrega</h3><p><strong>${escape(order.entrega?.metodo === "retiro" ? "Retiro coordinado" : "Envío")}</strong></p><p>${escape(order.entrega?.comuna || order.cliente?.comuna || "Por coordinar")}</p></section>
        </div>
        <section class="account-history"><h3>Historial</h3>${history.map((entry) => `<div><span>${new Date(entry.fecha).toLocaleString("es-CL")}</span><strong>${escape(statusLabel(entry.estado))}</strong><p>${escape(entry.detalle || "")}</p></div>`).join("") || "<p>Aún no hay movimientos públicos.</p>"}</section>`;
    } catch (error) {
      if (error.status === 401) {
        API.clearSession();
        location.replace("acceso.html?expired=1");
        return;
      }
      showMessage(message, error.message || "No fue posible cargar el pedido.", "error");
      if (target) target.innerHTML = "";
    }
  }

  updateHeader();
  if (page === "access") initAccess();
  if (page === "account") initAccount();
  if (page === "order") initOrderDetail();
})();
