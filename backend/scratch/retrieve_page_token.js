require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const db = require("../src/config/db");

const userToken = "EAIEpLudBz50BR8Y5cVl2KSI7ezG0NtkPHARevLd6EYIbK3HN6jvS46DWRncxZCbFySqmT3qvi5XCKt7ENIkAH8NcdZBXxFJeVB56ZCOdiZAEGe6wfRWW5MEmhXjz4Ms91ZAmMVz9bRZAn3NgFVp9bmiT5GQYH4YVcIc0gOaR9Uq3CLVPZCsmjXAkcwyUDtSaBZB5XpQXGQit6kdSQ6WGubqYKHoY3glq6FuZCNSnpxGTZAlmljLokZAWVzc2z9WGP3ZAiCT1wmxgp7e2yhltg1wjAb28";
const targetPageId = "1098376730014578";

async function run() {
  try {
    console.log("Querying /me/accounts to fetch your Page Access Tokens...");
    const res = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}`);
    const data = await res.json();

    if (data.error) {
      console.error("❌ Error fetching accounts:", data.error);
      process.exit(1);
    }

    const pages = data.data || [];
    console.log(`Found ${pages.length} pages:`);
    let pageToken = null;

    pages.forEach(page => {
      console.log(`- Page: ${page.name} (ID: ${page.id})`);
      if (page.id === targetPageId) {
        pageToken = page.access_token;
      }
    });

    if (!pageToken) {
      console.error(`\n❌ Could not find SeekhoBecho.in (ID: ${targetPageId}) in your authorized pages list!`);
      console.log("Please double check if the user token has permissions to access this page.");
      process.exit(1);
    }

    console.log(`\n✅ Found Page Access Token for SeekhoBecho.in!`);
    console.log(`Token preview: ${pageToken.substring(0, 20)}...`);

    // Update database
    console.log("Updating database...");
    db.query("UPDATE facebook_configs SET access_token = ? LIMIT 1", [pageToken], (dbErr, dbRes) => {
      if (dbErr) {
        console.error("❌ Database update failed:", dbErr);
        process.exit(1);
      }
      console.log("✅ Database updated successfully with Page Access Token!");
      process.exit(0);
    });

  } catch (err) {
    console.error("Request failed:", err);
    process.exit(1);
  }
}

run();
