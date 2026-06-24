const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("Database Error:", err);
    return;
  }

  console.log("MySQL Connected");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS facebook_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      access_token TEXT NULL,
      page_id VARCHAR(100) NULL,
      verify_token VARCHAR(255) NULL,
      public_webhook_url VARCHAR(255) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  db.query(createTableQuery, (createErr) => {
    if (createErr) {
      console.error("Error creating facebook_configs table:", createErr);
    } else {
      console.log("facebook_configs table is ready");
      // Add public_webhook_url column if it doesn't exist
      const alterTableQuery = `
        ALTER TABLE facebook_configs 
        ADD COLUMN public_webhook_url VARCHAR(255) NULL
      `;
      db.query(alterTableQuery, (alterErr) => {
        if (alterErr) {
          if (alterErr.code === 'ER_DUP_FIELDNAME' || alterErr.errno === 1060) {
            console.log("public_webhook_url column already exists");
          } else {
            console.error("Error altering facebook_configs table:", alterErr);
          }
        } else {
          console.log("public_webhook_url column successfully added");
        }
      });
    }
  });
});

module.exports = db;