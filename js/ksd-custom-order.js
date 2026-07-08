"use strict";
(function () {
    function value(form, name) {
        return String(new FormData(form).get(name) || "").trim();
    }

    function toast(message) {
        const element = document.getElementById("toast");
        if (!element) return;
        element.textContent = message;
        element.hidden = false;
        window.setTimeout(() => { element.hidden = true; }, 3200);
    }

    function init() {
        const form = document.getElementById("ksd-order-form");
        if (!form) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const message = [
                "Hola Emmagina, quiero crear una escena 3D personalizada.",
                "",
                `Nombre: ${value(form, "nombre")}`,
                `WhatsApp: ${value(form, "whatsapp")}`,
                `Correo: ${value(form, "correo") || "No indicado"}`,
                `Comuna/Ciudad: ${value(form, "comuna") || "No indicado"}`,
                "",
                `Producto: ${value(form, "producto")}`,
                `Personas: ${value(form, "personas")}`,
                `Placa: ${value(form, "placa") || "Sin definir"}`,
                "",
                `Momento a recrear: ${value(form, "momento")}`,
                `Contexto/lugar/acción: ${value(form, "contexto") || "Sin referencia adicional"}`,
                `Entrega: ${value(form, "entrega")}`,
                `Fecha ideal: ${value(form, "fecha") || "Flexible"}`,
                "",
                "Adjuntaré las fotos de referencia por este chat."
            ].join("\n");

            const phone = String(window.CONFIG?.whatsapp || "56900000000").replace(/\D/g, "");
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            toast("Mensaje preparado. Se abrirá WhatsApp para continuar.");
            window.open(url, "_blank", "noopener,noreferrer");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
