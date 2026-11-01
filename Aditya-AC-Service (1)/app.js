// WEBSITE INTERACTIONS: menu, product filter and inquiry download.
// Inquiries are saved by the server to SQLite after validation.

const menu = document.querySelector(".menutoggle");
menu?.addEventListener("click", () => {
  const open = document.querySelector("nav").classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
});
// Show catalog cards matching the selected AC category.
function filterProducts(value) {
  const buttons = [...document.querySelectorAll("[data-filter]")];
  if (!buttons.some((b) => b.dataset.filter === value))
    throw new Error("Unknown category");
  buttons.forEach((b) => {
    const active = b.dataset.filter === value;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  document
    .querySelectorAll(".product")
    .forEach((c) => (c.hidden = value !== "All" && c.dataset.type !== value));
  return {
    category: value,
    visible: [...document.querySelectorAll(".product:not([hidden]) h3")].map(
      (x) => x.textContent,
    ),
  };
}
document
  .querySelectorAll("[data-filter]")
  .forEach((b) =>
    b.addEventListener("click", () => filterProducts(b.dataset.filter)),
  );
// Read URL parameters from service/product links and prepare an inquiry.
const form = document.querySelector("#inquiry");
let inquiry = "";
if (form) {
  const params = new URLSearchParams(location.search);
  const s = params.get("service");
  if ([...form.elements.service.options].some((o) => o.value === s))
    form.elements.service.value = s;
  const item = params.get("product") || params.get("brand");
  if (item) form.elements.details.value = "Interested in: " + item;
  form.elements.date.min = new Date().toLocaleDateString("en-CA");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const submit = form.querySelector('button[type="submit"]');
    const status = document.querySelector("#inquiry-status");
    const result = document.querySelector("#result");
    result.hidden = true;
    submit.disabled = true;
    submit.textContent = "Saving inquiry…";
    status.textContent = "";
    let saved;
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          consent: form.querySelector(".check input").checked,
        }),
      });
      saved = await response.json();
      if (!response.ok)
        throw new Error(saved.error || "Unable to save inquiry.");
    } catch (error) {
      status.textContent =
        error.message === "Failed to fetch"
          ? "Cannot reach the server. Run npm run dev and open http://localhost:3000."
          : error.message;
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = "Submit inquiry";
    }
    status.textContent = `Inquiry #${saved.id} saved successfully. We have received your request; an appointment is not confirmed.`;
    inquiry =
      "ADITYA AC SERVICE INQUIRY\nReference: " +
      saved.id +
      "\n\n" +
      [
        "name",
        "phone",
        "email",
        "area",
        "service",
        "date",
        "type",
        "units",
        "details",
      ]
        .map(
          (k) =>
            k[0].toUpperCase() +
            k.slice(1) +
            ": " +
            (data.get(k) || "Not specified"),
        )
        .join("\n") +
      "\n\nAppointment not confirmed. Please confirm availability and pricing.";
    document.querySelector("#summary").textContent = inquiry;
    document.querySelector("#result").hidden = false;
    document
      .querySelector("#result")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  document.querySelector("#download").addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([inquiry], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Aditya AC Service-Service-Inquiry.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
// Optional browser-agent integration; ignored by unsupported browsers.
if (
  document.modelContext?.registerTool &&
  document.querySelector(".products")
) {
  try {
    Promise.resolve(
      document.modelContext.registerTool({
        name: "filter_ac_catalog",
        title: "Filter AC catalog",
        description:
          "Filter the visible illustrative AC catalog by system type.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["All", "Split AC", "Window AC", "Commercial AC"],
            },
          },
          required: ["category"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: ({ category }) => filterProducts(category),
      }),
    ).catch(() => {});
  } catch {}
}
