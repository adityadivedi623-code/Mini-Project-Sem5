/** SQLite persistence for inquiries. Data stays in data/enquiries.sqlite. */
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const directory = path.join(__dirname, "data");
fs.mkdirSync(directory, { recursive: true });
const database = new DatabaseSync(path.join(directory, "enquiries.sqlite"));
database.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    area TEXT NOT NULL,
    service TEXT NOT NULL,
    preferred_date TEXT NOT NULL DEFAULT '',
    ac_type TEXT NOT NULL,
    units INTEGER NOT NULL CHECK(units BETWEEN 1 AND 100),
    details TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);
const insert = database.prepare(`
  INSERT INTO enquiries (name, phone, email, area, service, preferred_date, ac_type, units, details)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const services = [
  "AC deep cleaning",
  "Repair & diagnostics",
  "Installation & relocation",
  "Gas leak inspection",
  "Annual maintenance",
  "AC sales consultation",
];
const types = ["Split AC", "Window AC", "Cassette / commercial AC", "Not sure"];
function saveEnquiry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid inquiry.");
  function text(key, max, required = false) {
    if (input[key] !== undefined && typeof input[key] !== "string")
      throw new Error(`Invalid ${key}.`);
    const value = (input[key] || "").trim();
    if ((required && !value) || value.length > max)
      throw new Error(`Please check ${key}.`);
    return value;
  }
  const name = text("name", 80, true);
  const phone = text("phone", 10, true);
  const email = text("email", 254);
  const area = text("area", 100, true);
  const service = text("service", 80, true);
  const date = text("date", 10);
  const type = text("type", 80, true);
  const details = text("details", 1500);
  const units = Number(input.units);
  if (!/^[6-9][0-9]{9}$/.test(phone))
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email.");
  if (!services.includes(service) || !types.includes(type))
    throw new Error("Choose a valid service and AC type.");
  if (!Number.isInteger(units) || units < 1 || units > 100)
    throw new Error("Units must be between 1 and 100.");
  if (input.consent !== true) throw new Error("Please accept inquiry storage.");
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)
  )
    throw new Error("Enter a valid preferred date.");
  // Bound parameters treat customer input as data, never as executable SQL.
  const result = insert.run(
    name,
    phone,
    email,
    area,
    service,
    date,
    type,
    units,
    details,
  );
  return { id: Number(result.lastInsertRowid), status: "received" };
}
module.exports = { database, saveEnquiry };
