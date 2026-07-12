"use strict";

(function () {
  const form = document.querySelector("[data-alma-form]");
  if (!form) return;

  const cards = Array.from(document.querySelectorAll("[data-alma-format]"));
  const formatInput = form.querySelector("[data-alma-format-input]");
  const selection = document.querySelector("[data-alma-selection]");
  const fileInput = document.getElementById("alma-files");
  const fileList = document.querySelector("[data-alma-file-list]");
  const message = document.querySelector("[data-alma-message]");
  const submitButton = form.querySelector("button[type='submit']");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setFormat(value) {
    const format = String(value || "Figura individual");
    cards.forEach((card) => card.classList.toggle("is-selected", card.dataset.almaFormat === format));
    if (formatInput) formatInput.value = format;
    if (selection) selection.textContent = format;
  }

  function showMessage(type, html) {
    if (!message) return;
    message.innerHTML = `<div class="state-box ${type === "error" ? "state-error" : "state-success"}">${html}</div>`;
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updateFileList() {
    const files = Array.from(fileInput?.files || []);
    if (!fileList) return;
    if (!files.length) {
      fileList.textContent = "Sin archivos seleccionados.";
      return;
    }
    fileList.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)} · ${(file.size / 1024 / 1024).toFixed(1)} MB</span>`).join("");
  }

  function validateFiles(files) {
    if (!files.length) throw new Error("Sube al menos una fotografía o referencia para revisar tu solicitud Alma.");
    if (files.length > 10) throw new Error("Puedes subir hasta 10 archivos por solicitud.");
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) throw new Error(`El archivo ${file.name} supera el máximo de 20 MB.`);
    });
  }

  cards.forEach((card) => card.addEventListener("click", () => {
    setFormat(card.dataset.almaFormat);
    document.getElementById("alma-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  fileInput?.addEventListener("change", updateFileList);
  setFormat(formatInput?.value);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const files = Array.from(fileInput?.files || []);
      validateFiles(files);
      const formData = new FormData(form);
      const description = String(formData.get("descripcion") || "").trim();
      const style = String(formData.get("estilo") || "").trim();
      const accessories = String(formData.get("accesorios") || "").trim();
      const baseText = String(formData.get("textoBase") || "").trim();
      const idealDate = String(formData.get("fechaIdeal") || "").trim();

      formData.set("descripcion", [
        description,
        style ? `Estilo: ${style}` : "",
        accessories ? `Accesorios o elementos: ${accessories}` : "",
        baseText ? `Texto para la base: ${baseText}` : "",
        idealDate ? `Fecha ideal: ${idealDate}` : ""
      ].filter(Boolean).join("\n"));
      formData.delete("estilo");
      formData.delete("accesorios");
      formData.delete("textoBase");
      formData.delete("fechaIdeal");
      formData.set("origenUrl", window.location.href);

      submitButton.disabled = true;
      submitButton.textContent = "Enviando referencias...";
      showMessage("info", "<p><strong>Estamos enviando tu solicitud.</strong></p><p>Puede tardar algunos segundos si los archivos son pesados.</p>");

      const result = await window.EmmaginaAPI.createCustomRequest(formData);
      const folio = result?.folio || result?.solicitud?.folio || "";
      showMessage("success", `
        <p><strong>Solicitud Alma recibida.</strong></p>
        ${folio ? `<p>Tu folio es <strong>${escapeHtml(folio)}</strong>. Guárdalo para seguimiento.</p>` : ""}
        <p>Revisaremos las referencias y te enviaremos una propuesta con alcance, precio y plazo.</p>
      `);
      form.reset();
      setFormat("Figura individual");
      updateFileList();
    } catch (error) {
      showMessage("error", `<p><strong>No pudimos enviar la solicitud.</strong></p><p>${escapeHtml(error.message || "Revisa los datos e intenta nuevamente.")}</p>`);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar solicitud Alma";
    }
  });
})();
