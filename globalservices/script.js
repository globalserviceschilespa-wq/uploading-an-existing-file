const form = document.querySelector("#quote-form");
const service = document.querySelector("#service");
const company = document.querySelector("#company");
const description = document.querySelector("#description");
const result = document.querySelector("#quote-result");
const resultText = document.querySelector("#quote-text");
const status = document.querySelector("#result-status");
const copy = document.querySelector("#copy-button");
const download = document.querySelector("#download-button");

function clearResult() {
  result.hidden = true;
  status.textContent = "";
}

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    service.value = link.dataset.service;
    clearResult();
    requestAnimationFrame(() => service.focus({ preventScroll: true }));
  });
});

form.addEventListener("input", () => {
  description.setCustomValidity("");
  clearResult();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const project = description.value.trim();
  const organization = company.value.trim();

  if (!project) {
    description.setCustomValidity("Describe el trabajo que necesitas.");
    description.reportValidity();
    return;
  }

  const lines = [
    "Solicitud de cotización | Globalservices",
    "",
    `Servicio: ${service.value}`,
  ];
  if (organization) lines.push(`Empresa: ${organization}`);
  lines.push("", "Descripción del proyecto", project);

  resultText.value = lines.join("\n");
  status.textContent = "";
  result.hidden = false;
  resultText.focus();
});

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    status.textContent = "Solicitud copiada.";
  } catch {
    resultText.select();
    resultText.focus();
    status.textContent = "El texto está seleccionado. Usa la opción Copiar de tu dispositivo.";
  }
});

download.addEventListener("click", () => {
  const file = new Blob([resultText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "solicitud-globalservices.txt";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = "Descarga iniciada.";
});

form.querySelector('button[type="submit"]').disabled = false;
