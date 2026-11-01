/** Private command-line view. Not exposed on the customer website. */
const { database } = require("./database");
const rows = database.prepare("SELECT * FROM enquiries ORDER BY id DESC").all();
if (!rows.length)
  console.log("No inquiries yet. Submit the website inquiry form first.");
else console.table(rows);
database.close();
