require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const db = require("../src/config/db");

db.query("SELECT * FROM facebook_configs LIMIT 1", async (err, results) => {
  if (err) {
    console.error("Database error:", err);
    process.exit(1);
  }

  if (results.length === 0) {
    console.error("No Facebook configuration found in database!");
    process.exit(1);
  }

  const config = results[0];
  const token = config.access_token;
  const pageId = config.page_id;

  if (!token || !pageId) {
    console.error("Access token or Page ID is missing in configuration!");
    process.exit(1);
  }

  try {
    console.log(`Subscribing Page (ID: ${pageId}) to the App programmatically...`);
    const subscribeUrl = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`;
    const res = await fetch(subscribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subscribed_fields: "leadgen",
        access_token: token
      })
    });

    const data = await res.json();
    if (data.error) {
      console.error("❌ Subscription failed:", data.error);
    } else {
      console.log("✅ Success! Page is now subscribed to the App. Response:", data);
      
      // Let's verify the active subscription list
      console.log("\nVerifying active subscriptions on the Page...");
      const verifyRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?access_token=${token}`);
      const verifyData = await verifyRes.json();
      console.log("Subscribed Apps:", JSON.stringify(verifyData, null, 2));
    }

  } catch (error) {
    console.error("Request failed:", error);
  } finally {
    process.exit(0);
  }
});
