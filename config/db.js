const mysql = require("mysql2");

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
  if (err) {
    console.log("❌ Database gagal connect:", err);
  } else {
    console.log("✅ Database Railway terkoneksi");
  }
});

module.exports = db;