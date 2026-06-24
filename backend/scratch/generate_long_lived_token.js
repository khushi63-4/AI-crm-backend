const readline = require("readline");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const db = require("../src/config/db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log("\n=======================================================");
  console.log("   META PERMANENT PAGE ACCESS TOKEN GENERATOR   ");
  console.log("=======================================================\n");

  try {
    // 1. Get credentials
    const appId = await askQuestion("1. Enter your Meta App ID: ");
    if (!appId.trim()) {
      console.error("App ID cannot be empty!");
      process.exit(1);
    }

    const appSecret = await askQuestion("2. Enter your Meta App Secret (find in App Settings > Basic): ");
    if (!appSecret.trim()) {
      console.error("App Secret cannot be empty!");
      process.exit(1);
    }

    const shortToken = await askQuestion("3. Enter your current User Access Token (from Graph API Explorer): ");
    if (!shortToken.trim()) {
      console.error("Token cannot be empty!");
      process.exit(1);
    }

    const targetPageId = "1098376730014578";

    // 2. Exchange short-lived User Access Token for long-lived User Access Token (lasts 60 days)
    console.log("\nExchanging short-lived User Token for a long-lived User Token (60 days)...");
    const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId.trim()}&client_secret=${appSecret.trim()}&fb_exchange_token=${shortToken.trim()}`;
    const exchangeRes = await fetch(exchangeUrl);
    const exchangeData = await exchangeRes.json();

    if (exchangeData.error) {
      throw new Error(`Exchange failed: ${JSON.stringify(exchangeData.error)}`);
    }

    const longLivedUserToken = exchangeData.access_token;
    console.log("✅ Successfully generated Long-lived User Access Token.");

    // 3. Fetch Page Access Token using the long-lived User Token
    // Page Access Tokens generated from a long-lived User Token NEVER expire!
    console.log(`\nFetching never-expiring Page Access Token for Page ID ${targetPageId}...`);
    const pageUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedUserToken}`;
    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    if (pageData.error) {
      throw new Error(`Fetching page token failed: ${JSON.stringify(pageData.error)}`);
    }

    const pages = pageData.data || [];
    const targetPage = pages.find(p => p.id === targetPageId);

    if (!targetPage) {
      throw new Error(`SeekhoBecho.in (ID: ${targetPageId}) not found in authorized pages! Check page selections in login popup.`);
    }

    const permanentPageToken = targetPage.access_token;
    console.log(`\n✅ Successfully generated PERMANENT Page Access Token for: ${targetPage.name}`);
    console.log(`Token preview: ${permanentPageToken.substring(0, 20)}...`);

    // 4. Update Database
    console.log("\nUpdating CRM database with the permanent Page Access Token...");
    db.query("UPDATE facebook_configs SET access_token = ? LIMIT 1", [permanentPageToken], async (dbErr) => {
      if (dbErr) {
        console.error("❌ Database update failed:", dbErr);
        process.exit(1);
      }
      console.log("✅ Database updated successfully! This Page Token will NEVER expire.");
      
      // Try to check debug info of the new token to confirm it is permanent
      console.log("\nVerifying token status on Meta servers...");
      const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${permanentPageToken}&access_token=${permanentPageToken}`);
      const debugData = await debugRes.json();
      
      if (debugData.data) {
        console.log(`- Token Type: ${debugData.data.type}`);
        console.log(`- Expires At: ${debugData.data.expires_at === 0 || !debugData.data.expires_at ? "Never (Permanent)" : new Date(debugData.data.expires_at * 1000).toLocaleString()}`);
      }
      
      process.exit(0);
    });

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
