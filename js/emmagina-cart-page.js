"use strict";

(function () {
  const list = document.querySelector("[data-cart-list]");
  const summary = document.querySelector("[data-cart-summary]");
  if (!list || !summary) return;

  function render() {
    const items = window.EmmaginaCart.read();
    if (!items.length) {
      list.innerHTML = `<div class="state-box"><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="catalogo.html">Ver catálogo</a></div>`;
      summary.innerHTML = `<h2>Resumen</h2><p>No hay productos agregados.</p>`;
      return;
    }
    list.innerHTML = items.map((item) => `
      <article class="cart-item" data-line="${window.EmmaginaUI.escapeHtml(item.lineKey)}">
        <img src="${window.EmmaginaUI.escapeHtml(item.image || window.CONFIG.placeholderImage)}" alt="${window.EmmaginaUI.escapeHtml(item.name)}">
        <div>
          <h3>${window.EmmaginaUI.escapeHtml(item.name)}</h3>
          <p>${window.EmmaginaData.formatPrice(item.price)} ${item.option?.variantName ? `· ${window.EmmaginaUI.escapeHtml(item.option.variantName)}` : ""}</p>
          <button class="btn btn-soft btn-small" type="button" data-remove="${window.EmmaginaUI.escapeHtml(item.lineKey)}">Quitar</button>
        </div>
        <div class="qty-control">
          <label>Cant.</label>
          <input type="number" min="1" value="${Number(item.quantity) || 1}" data-qty="${window.EmmaginaUI.escapeHtml(item.lineKey)}">
        </div>
      </article>`).join("");
    summary.innerHTML = `
      <h2>Resumen</h2>
      <p>${items.length} producto(s)</p>
      <h3>Total: ${window.EmmaginaData.formatPrice(window.EmmaginaCart.total())}</h3>
      <a class="btn btn-primary" href="finalizar-compra.html">Continuar compra</a>
      <button class="btn btn-soft" type="button" data-clear-cart>Vaciar carrito</button>`;
  }

  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      window.EmmaginaCart.remove(remove.dataset.remove);
      render();
    }
    if (event.target.closest("[data-clear-cart]")) {
      window.EmmaginaCart.clear();
      render();
    }
  });
  document.addEventListener("change", (event) => {
    const input = event.target.closest("[data-qty]");
    if (input) {
      window.EmmaginaCart.setQuantity(input.dataset.qty, input.value);
      render();
    }
  });
  window.addEventListener("emmagina:cart", render);
  render();
})();
