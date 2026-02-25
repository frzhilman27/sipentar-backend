const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sipentar",
});

db.connect((err) => {
  if (err) {
    console.log("Database gagal connect:", err);
  } else {
    console.log("Database terkoneksi ✅");
  }
});

module.exports = db;