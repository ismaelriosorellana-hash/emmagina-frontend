"use strict";

(function () {
  const form = document.querySelector("[data-scene-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.querySelector("[data-scene-message]");
    if (message) {
      message.innerHTML = `<div class="state-box"><p><strong>Solicitud registrada para revisión.</strong></p><p>En la siguiente etapa conectaremos este formulario al backend para guardar fotos y estados de producción.</p></div>`;
    }
    form.reset();
  });
})();
