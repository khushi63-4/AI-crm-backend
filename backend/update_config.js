require("dotenv").config();
const db = require("./src/config/db");

const configData = {
  public_webhook_url: "https://radiated-denial-unlaced.ngrok-free.dev/api/leads/facebook/webhook",
  verify_token: "my_special_token"
};

// Connect db connection manually if not connected
db.query("SELECT id FROM facebook_configs LIMIT 1", (err, results) => {
  if (err) {
    console.error("Error checking config:", err);
    process.exit(1);
  }

  if (results.length > 0) {
    db.query(
      "UPDATE facebook_configs SET verify_token = ?, public_webhook_url = ? WHERE id = ?",
      [configData.verify_token, configData.public_webhook_url, results[0].id],
      (updateErr) => {
        if (updateErr) {
          console.error("Error updating config:", updateErr);
          process.exit(1);
        }
        console.log("Config updated successfully!");
        process.exit(0);
      }
    );
  } else {
    db.query(
      "INSERT INTO facebook_configs (verify_token, public_webhook_url) VALUES (?, ?)",
      [configData.verify_token, configData.public_webhook_url],
      (insertErr) => {
        if (insertErr) {
          console.error("Error inserting config:", insertErr);
          process.exit(1);
        }
        console.log("Config inserted successfully!");
        process.exit(0);
      }
    );
  }
});
