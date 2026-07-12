"use strict";

(function () {
  const form = document.querySelector("[data-memories-form]");
  if (!form) return;

  const cards = Array.from(document.querySelectorAll("[data-memory-format]"));
  const formatInput = form.querySelector("[data-memory-format-input]");
  const selection = document.querySelector("[data-memory-selection]");
  const fileInput = document.getElementById("memory-files");
  const fileList = document.querySelector("[data-memory-file-list]");
  const message = document.querySelector("[data-memories-message]");
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
    const format = String(value || "Litofanía con base");
    cards.forEach((card) => card.classList.toggle("is-selected", card.dataset.memoryFormat === format));
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
    if (!files.length) throw new Error("Sube al menos una fotografía para revisar tu solicitud Memories.");
    if (files.length > 8) throw new Error("Puedes subir hasta 8 archivos por solicitud.");
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) throw new Error(`El archivo ${file.name} supera el máximo de 20 MB.`);
    });
  }

  cards.forEach((card) => card.addEventListener("click", () => {
    setFormat(card.dataset.memoryFormat);
    document.getElementById("memories-request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  fileInput?.addEventListener("change", updateFileList);
  setFormat(formatInput?.value);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const files = Array.from(fileInput?.files || []);
      validateFiles(files);
      const formData = new FormData(form);
      const optionalText = String(formData.get("textoOpcional") || "").trim();
      const description = String(formData.get("descripcion") || "").trim();
      formData.set("descripcion", [description, optionalText ? `Texto opcional: ${optionalText}` : ""].filter(Boolean).join("\n"));
      formData.delete("textoOpcional");
      formData.set("origenUrl", window.location.href);

      submitButton.disabled = true;
      submitButton.textContent = "Enviando fotografías...";
      showMessage("info", "<p><strong>Estamos enviando tu solicitud.</strong></p><p>Puede tardar algunos segundos si las fotografías son pesadas.</p>");

      const result = await window.EmmaginaAPI.createCustomRequest(formData);
      const folio = result?.folio || result?.solicitud?.folio || "";
      showMessage("success", `
        <p><strong>Solicitud Memories recibida.</strong></p>
        ${folio ? `<p>Tu folio es <strong>${escapeHtml(folio)}</strong>. Guárdalo para seguimiento.</p>` : ""}
        <p>Revisaremos la calidad de las fotografías y te enviaremos una recomendación con precio y plazo.</p>
      `);
      form.reset();
      setFormat("Litofanía con base");
      updateFileList();
    } catch (error) {
      showMessage("error", `<p><strong>No pudimos enviar la solicitud.</strong></p><p>${escapeHtml(error.message || "Revisa los datos e intenta nuevamente.")}</p>`);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar solicitud Memories";
    }
  });
})();
