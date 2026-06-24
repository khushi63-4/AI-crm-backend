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
  console.log("Config from DB:", {
    page_id: config.page_id,
    verify_token: config.verify_token,
    public_webhook_url: config.public_webhook_url,
    access_token_preview: config.access_token ? config.access_token.substring(0, 15) + "..." : "null"
  });

  const token = config.access_token;
  if (!token) {
    console.error("Access token is empty!");
    process.exit(1);
  }

  try {
    // 1. Inspect the token by querying /me
    console.log("\n--- Checking Token /me ---");
    const meRes = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
    const meData = await meRes.json();
    console.log("Token owner info:", meData);

    // 1b. Inspect the permissions of the token
    console.log("\n--- Checking Token Permissions (/me/permissions) ---");
    const permRes = await fetch(`https://graph.facebook.com/me/permissions?access_token=${token}`);
    const permData = await permRes.json();
    console.log("Token permissions details:", permData);

    // 2. Query /me/accounts to see page access tokens
    console.log("\n--- Checking User's Pages (/me/accounts) ---");
    const accountsRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`);
    const accountsData = await accountsRes.json();
    
    if (accountsData.error) {
      console.error("Error fetching accounts:", accountsData.error);
    } else if (accountsData.data) {
      console.log(`Found ${accountsData.data.length} pages.`);
      let targetPage = null;
      accountsData.data.forEach(page => {
        console.log(`- Page: ${page.name} (ID: ${page.id})`);
        console.log(`  Category: ${page.category}`);
        console.log(`  Tasks:`, page.tasks);
        if (page.id === config.page_id) {
          targetPage = page;
        }
      });

      if (targetPage) {
        console.log(`\n>>> Target page match found!`);
        console.log(`Page Name: ${targetPage.name}`);
        console.log(`Page Access Token Preview: ${targetPage.access_token.substring(0, 15)}...`);
        console.log(`Use this Page Access Token in your database for automated lead fetching!`);
      } else {
        console.log(`\n>>> Target page with ID ${config.page_id} NOT found in user's managed pages.`);
      }
    } else {
      console.log("No pages data returned. Is this token a Page Access Token already?");
      // Try to fetch page details directly
      const pageRes = await fetch(`https://graph.facebook.com/${config.page_id}?fields=name,category&access_token=${token}`);
      const pageData = await pageRes.json();
      console.log("Page query result with current token:", pageData);
    }

    // 3. Check Subscribed Apps for the Page
    console.log("\n--- Checking Subscribed Apps for Page ---");
    const subRes = await fetch(`https://graph.facebook.com/${config.page_id}/subscribed_apps?access_token=${token}`);
    const subData = await subRes.json();
    console.log("Subscribed apps response:", subData);

    // 4. Check Lead Gen Forms for the Page
    console.log("\n--- Checking Lead Gen Forms for Page ---");
    const formsRes = await fetch(`https://graph.facebook.com/v20.0/${config.page_id}/leadgen_forms?access_token=${token}`);
    const formsData = await formsRes.json();
    console.log("Lead Gen Forms response:", formsData);

    // 5. Try self debug
    console.log("\n--- Checking Debug Token Info ---");
    const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
    const debugData = await debugRes.json();
    console.log("Debug Token response:", debugData);

  } catch (error) {
    console.error("Request failed:", error);
  } finally {
    process.exit(0);
  }
});
