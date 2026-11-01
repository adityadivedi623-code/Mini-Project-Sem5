# Aditya AC Service college project

## Run on Windows
Install Node.js 24.x, extract the ZIP and open a terminal in the folder containing package.json:

```bat
npm install
npm run dev
```

Open http://localhost:3000. Press Ctrl+C to stop. No external npm dependencies are required. If port 3000 is busy, stop the other server or set PORT=3001 in .env.

## Customer navigation assistant
Click Ask Aditya AC Service. Try “I need AC repair”, “Show AC products” or “How do I book a service?”. Answers include a recommended page link.

Without a key, this is a keyword-based navigation helper, not generative AI. For real AI:

1. Run `copy .env.example .env`.
2. Enter your own OpenAI API key after OPENAI_API_KEY= in .env.
3. Restart npm run dev.

A successful AI response is labeled AI assistant. API use may incur charges. When enabled, questions go to the AI provider; avoid personal details. Each question is independent. Never share .env. If AI fails, the labeled helper remains available. No live AI test was possible without a user key.

API reference: https://developers.openai.com/api/docs/guides/structured-outputs

## Limits
Company details and catalog are illustrative. The inquiry form saves submissions in a local SQLite database and offers a text download. It does not send emails or confirm appointments. No payment, login or inventory exists. The server listens only on your computer and is intended for local demonstration. Production deployment would require access controls, rate limits and spending controls for AI.

Database-backed inquiries and the optional AI API add a backend beyond the original static-only proposal. Include it as an enhancement in your report and discuss the revised scope with your guide.

Image source: https://www.sofia-ac.com/ . Reuse rights have not been verified; obtain permission or replace before commercial use. Google Fonts needs internet, with offline fallback fonts available.

See PROJECT-EXPLANATION.md for presentation notes.

## SQLite database and saved inquiries

The database is created automatically at `data/enquiries.sqlite` when you start the server. Customer details remain saved when you stop and restart it. Keep the entire data folder when updating the project; replacing or deleting it loses your saved inquiries.

Run `npm run enquiries` in another terminal to see stored records. You may also open the SQLite file in a SQLite database viewer. There is no public customer-list endpoint or admin dashboard. The server never serves the database file.

The form sends JSON to POST /api/enquiries. The server checks required fields, phone, email, allowed service/type, units and storage consent, then inserts values with bound SQL parameters. A successful response includes a database reference ID. If saving fails, the form shows an error and keeps the input. A saved inquiry is not a confirmed booking.

Node 24.x is required because database.js uses the built-in node:sqlite module. There is no MySQL installation or third-party database dependency.
