/**
 * Aditya AC Service development server (Node.js built-in modules only).
 * 1. Serve the HTML/CSS/JavaScript files.
 * 2. Handle /api/assistant without exposing the optional AI key to the browser.
 * Run with: npm run dev
 */
const { saveEnquiry } = require("./database");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Read optional local settings. Never serve .env as a public file.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

// Only this allowlist is public: configuration and server source stay private.
const publicFiles = new Set([
  "index.html",
  "about.html",
  "products.html",
  "services.html",
  "brands.html",
  "contact.html",
  "style.css",
  "app.js",
  "assistant.js",
  "assistant.css",
  "favicon.svg",
  "hero.webp",
  "images/cassette.jpg",
  "images/cleaning.jpg",
  "images/installation.png",
  "images/split.jpg",
  "images/window.jpg",
]);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};
const routes = [
  "index.html",
  "about.html",
  "products.html",
  "services.html",
  "brands.html",
  "contact.html",
];

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

// A transparent, keyword-based fallback. This function is NOT a language model.
function navigationHelp(message) {
  const text = message.toLowerCase();
  if (/book|appointment|contact|quote|price|cost|enquir/.test(text)) {
    return {
      reply:
        "Use the inquiry page to prepare a service request or ask for a quote. The form saves your inquiry in the company server database and offers a download. It does not confirm an appointment or send an email.",
      page: "contact.html",
    };
  }
  if (/brand|daikin|voltas|lg|samsung|carrier|blue star/.test(text)) {
    return {
      reply:
        "The brand guide lists example brands. Availability and warranty must be confirmed with the company; no authorized dealership is claimed.",
      page: "brands.html",
    };
  }
  if (/buy|product|model|ton|capacity|window|split/.test(text)) {
    return {
      reply:
        "Explore illustrative AC system types in the product catalog. You can filter by split, window or commercial AC and request a quote.",
      page: "products.html",
    };
  }
  if (/repair|clean|service|maint|install|cool|leak|noise|gas/.test(text)) {
    return {
      reply:
        "The services page covers cleaning, repair, installation, leak inspection and maintenance. A technician should diagnose the issue before recommending repairs.",
      page: "services.html",
    };
  }
  if (/about|company|who/.test(text)) {
    return {
      reply:
        "Read about the Aditya AC Service company concept and its service principles on the About page.",
      page: "about.html",
    };
  }
  return {
    reply:
      "I can guide you to services, AC products, brands, company information or the inquiry page. What would you like to find?",
    page: "index.html",
  };
}

async function assistant(request, response) {
  // Local demo server: accept requests only from the same browser origin.
  if (
    request.headers.origin &&
    request.headers.origin !== `http://${request.headers.host}`
  ) {
    return sendJson(response, 403, { error: "Origin not allowed." });
  }
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 4096)
      return sendJson(response, 413, { error: "Message too large." });
  }
  let message;
  try {
    message = JSON.parse(body).message;
  } catch {
    return sendJson(response, 400, { error: "Invalid JSON." });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 500) {
    return sendJson(response, 400, {
      error: "Enter a message of 1–500 characters.",
    });
  }
  const fallback = navigationHelp(message);
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 200, {
      ...fallback,
      mode: "Navigation helper (no AI key configured)",
    });
  }
  try {
    const result = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 250,
        instructions:
          "You are the Aditya AC Service website navigation assistant. Reply briefly in the customer language. Only guide users around this academic AC company demonstration. Pages: index.html home; about.html company concept; products.html illustrative split/window/commercial catalog; services.html cleaning, repair, installation, leak inspection, annual maintenance and sales consultation; brands.html example Daikin/LG/Voltas/Blue Star/Samsung/Carrier; contact.html database-backed inquiry form. No verified products, prices, real phone/email/address, bookings, payments, dealership, certifications or customer reviews. The inquiry form saves requests to the local server database but does not confirm bookings or send emails. Do not invent facts or provide repair instructions. For hazards advise switching off power if safe and contacting a professional. Choose one allowed page for the customer to open; never claim you booked or navigated automatically.",
        input: message,
        text: {
          format: {
            type: "json_schema",
            name: "navigation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reply: { type: "string" },
                page: { type: "string", enum: routes },
              },
              required: ["reply", "page"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!result.ok) throw new Error("AI service unavailable");
    const data = await result.json();
    const output = data.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text");
    const answer = JSON.parse(output?.text || "{}");
    if (typeof answer.reply !== "string" || !routes.includes(answer.page))
      throw new Error("Invalid AI response");
    return sendJson(response, 200, {
      reply: answer.reply,
      page: answer.page,
      mode: "AI assistant",
    });
  } catch {
    // Never pretend a fallback answer was produced by AI.
    return sendJson(response, 200, {
      ...fallback,
      mode: "Navigation helper (AI unavailable)",
    });
  }
}

// Save submitted inquiries; no public listing endpoint exposes customer records.
async function receiveEnquiry(request, response) {
  if (
    request.headers.origin &&
    request.headers.origin !== `http://${request.headers.host}`
  ) {
    return sendJson(response, 403, { error: "Origin not allowed." });
  }
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8192)
      return sendJson(response, 413, { error: "Inquiry too large." });
  }
  let input;
  try {
    input = JSON.parse(body);
  } catch {
    return sendJson(response, 400, { error: "Invalid JSON." });
  }
  try {
    return sendJson(response, 201, saveEnquiry(input));
  } catch (error) {
    if (error.code || error.errcode)
      return sendJson(response, 500, {
        error: "Unable to save inquiry. Please try again.",
      });
    return sendJson(response, 400, { error: error.message });
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/api/enquiries" && request.method === "POST")
      return await receiveEnquiry(request, response);
    if (url.pathname === "/api/assistant" && request.method === "POST")
      return await assistant(request, response);
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      return response.end("Method not allowed");
    }
    const file =
      url.pathname === "/"
        ? "index.html"
        : decodeURIComponent(url.pathname.slice(1));
    if (!publicFiles.has(file)) {
      response.writeHead(404);
      return response.end("File not found");
    }
    const bytes = await fs.promises.readFile(path.join(__dirname, file));
    response.writeHead(200, {
      "Content-Type": `${types[path.extname(file)] || "application/octet-stream"}; charset=utf-8`,
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    if (!response.headersSent) response.writeHead(500);
    response.end("Unable to process request");
  }
});
const port = Number(process.env.PORT) || 3000;
// Loopback-only: this is a college development server, not a public production service.
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Aditya AC Service is running at http://localhost:${port}\nPress Ctrl+C to stop.`,
  ),
);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Stop the other server or change PORT in .env.`
      : error.message,
  );
  process.exit(1);
});
