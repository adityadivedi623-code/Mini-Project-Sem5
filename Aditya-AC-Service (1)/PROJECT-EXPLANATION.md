# Project explanation and viva guide

## Objective
“Aditya AC Service helps customers understand AC services, explore example products and brands, and prepare service inquiries. The website adapts to mobile and desktop screens.”

## File guide
| File | Responsibility |
| --- | --- |
| index.html | Home introduction, services, process and FAQs |
| about.html | Company concept and principles |
| products.html | Illustrative catalog and category filters |
| services.html | Cleaning, repairs, installation and maintenance |
| brands.html | Example brand guide |
| contact.html | Validated inquiry form and downloadable summary |
| style.css | Shared colors, typography, cards, layouts and media queries |
| app.js | Mobile navigation, filters and inquiry download |
| assistant.css | Chat panel styling |
| assistant.js | Chat controls, messages, server requests and page links |
| server.js | Serves public files and handles /api/assistant |
| package.json | npm commands and project metadata |
| package-lock.json | npm-generated reproducibility metadata |
| .env.example | Optional private AI configuration template |
| favicon.svg / hero.webp | Browser icon / home image |

## Explain the technologies
HTML defines structure with headings, sections, links, forms and buttons. Each page has a shared header and footer and its own main content.

CSS controls appearance. :root variables store common colors. Grid and Flexbox arrange content. Media queries adapt layouts to narrow screens. Reusable classes include button, card and wrap.

JavaScript provides behavior. querySelector finds elements. addEventListener reacts to clicks and submissions. textContent displays plain text safely.

npm run dev executes node server.js. Node's built-in HTTP module serves local files. This is plain HTML/CSS/JavaScript, not React or Next.js.

## Presentation demonstration
1. Open all six pages using navigation.
2. Narrow the browser to show stacked cards and the hamburger menu.
3. Filter Products by Split AC, Window AC, then All. The function reads data-type and toggles the hidden property.
4. Select a service inquiry link. A URL parameter preselects the service.
5. Submit an empty form to show validation. Fill valid details and prepare the inquiry.
6. Download it. JavaScript creates a Blob (an in-memory file), a temporary download URL and releases the URL after use. The inquiry is also saved in SQLite before a receipt is shown.
7. Ask Aditya AC Service about AC repair and open the recommended page.

## Assistant flow
Question → assistant.js POST request → server.js validation → keyword helper or AI API → reply and allowed page → visible answer and link.

The helper matches keywords with regular expressions. It is not AI. The optional AI branch calls OpenAI's Responses API with website instructions and a structured output schema. The schema requests a reply and one of six allowed page names. Server and browser validate page names. The customer clicks the link; the assistant does not claim to book anything.

The API key stays server-side. The server uses an allowlist so private configuration files cannot be downloaded. Answers use textContent rather than injecting HTML. Chat logs are not saved. Each question is independent; this implementation does not send conversation history.

## Viva questions
**Static or dynamic?** The six page files are static, while inquiry storage and optional AI are dynamic server features. This expands the original proposal scope.

**Why SQLite?** It provides a persistent SQL database in a single local file without a separate database server. It stores inquiries, not confirmed bookings.

**Does the inquiry form email the company?** No. It saves to SQLite and offers a download. Email delivery needs an additional service.

**How does responsive design work?** Media queries change column layouts; JavaScript opens and closes navigation on mobile.

**Is the assistant always AI?** No. The keyword helper works without a key. Successful API responses are labeled AI assistant; failures are labeled as helper responses.

**Did you train a model?** No. This is an API integration, not a locally trained model.

**What remains incomplete?** Real business details, verified products/prices, live API verification with a key, message delivery and a secured production backend.

**What can be added later?** Real content, email delivery and secured hosting. Database-backed confirmed bookings require a scope change.

Understand the code and demonstrate it yourself. Disclose code assistance according to college requirements; do not claim capabilities the project does not have.

Aditya Divedi · Roll No. 11

## Database explanation for your presentation

- database.js creates the enquiries table and inserts validated requests.
- app.js sends the form as JSON to POST /api/enquiries.
- server.js receives the request and calls saveEnquiry.
- view-enquiries.js reads records privately through `npm run enquiries`.
- SQLite uses an auto-increment primary key. Each row stores name, phone, email, area, service, preferred date, AC type, unit count, details and a server timestamp.
- Parameter placeholders (?) keep customer text separate from SQL statements.
- Demonstrate a submission, restart the server, then show the same record with npm run enquiries.
- The database is server-side, not browser localStorage. Production hosting needs persistent disk or an appropriate managed database.
