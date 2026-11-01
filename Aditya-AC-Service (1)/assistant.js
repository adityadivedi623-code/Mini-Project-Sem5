/** Customer navigation assistant: UI only. The server handles AI credentials. */
const assistantToggle = document.querySelector("#assistant-toggle");
const assistantPanel = document.querySelector("#assistant-panel");
const chatMessages = document.querySelector("#assistant-messages");
const chatForm = document.querySelector("#assistant-form");
const chatInput = document.querySelector("#assistant-input");
const modeLabel = document.querySelector("#assistant-mode");

// Use textContent for all answers so user/AI text cannot inject HTML.
function addMessage(text, author, page) {
  const bubble = document.createElement("div");
  bubble.className = `chat-message ${author}`;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  bubble.append(paragraph);
  const allowedPages = [
    "index.html",
    "about.html",
    "products.html",
    "services.html",
    "brands.html",
    "contact.html",
  ];
  if (allowedPages.includes(page)) {
    const link = document.createElement("a");
    link.href = page;
    link.textContent = "Open recommended page";
    bubble.append(link);
  }
  chatMessages.append(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setPanelOpen(open) {
  assistantPanel.hidden = !open;
  assistantToggle.setAttribute("aria-expanded", String(open));
  if (open) chatInput.focus();
}
assistantToggle.addEventListener("click", () =>
  setPanelOpen(assistantPanel.hidden),
);
document.querySelector("#assistant-close").addEventListener("click", () => {
  setPanelOpen(false);
  assistantToggle.focus();
});
assistantPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPanelOpen(false);
    assistantToggle.focus();
  }
});

async function askAssistant(message) {
  if (!message.trim()) return;
  addMessage(message, "customer");
  chatInput.value = "";
  const submit = chatForm.querySelector("button");
  submit.disabled = true;
  modeLabel.textContent = "Finding the right page…";
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(25000),
    });
    const answer = await response.json();
    if (!response.ok) throw new Error(answer.error || "Request failed");
    modeLabel.textContent = answer.mode;
    addMessage(answer.reply, "helper", answer.page);
  } catch {
    modeLabel.textContent = "Assistant unavailable";
    addMessage(
      "Start the site with npm run dev and open http://localhost:3000. If it is already running, please try again.",
      "helper",
    );
  } finally {
    submit.disabled = false;
    chatInput.focus();
  }
}
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askAssistant(chatInput.value);
});
document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!chatForm.querySelector("button").disabled)
      askAssistant(button.dataset.question);
  });
});
addMessage(
  "Hi! What are you looking for? I can help you find AC services, products, brands or the inquiry form. Avoid sharing personal details in chat.",
  "helper",
);
