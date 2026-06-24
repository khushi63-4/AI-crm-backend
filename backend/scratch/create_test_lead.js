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
    // 1. Fetch the lead forms for the page
    console.log(`\nFetching lead gen forms for Page ID: ${pageId}...`);
    const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${token}`);
    const formsData = await formsRes.json();

    if (formsData.error) {
      console.error("\n❌ Error fetching lead forms:", formsData.error);
      console.log("\n💡 Suggestions:");
      if (formsData.error.message.includes("pages_manage_ads")) {
        console.log("-> Your Page Access Token is missing the 'pages_manage_ads' permission.");
        console.log("-> Please regenerate the Page Access Token in the Graph API Explorer and add the 'pages_manage_ads' permission.");
      }
      process.exit(1);
    }

    const forms = formsData.data || [];
    if (forms.length === 0) {
      console.log("\n⚠️ No lead forms found on this Facebook Page. Please create a Lead Form first in Meta Business Suite.");
      process.exit(0);
    }

    let success = false;
    for (const targetForm of forms) {
      console.log(`\n--------------------------------------------`);
      console.log(`Trying Form: "${targetForm.name}" (ID: ${targetForm.id})`);

      // 2. Delete any existing test lead for this form
      console.log(`Deleting any existing test leads for form ${targetForm.id}...`);
      const deleteRes = await fetch(`https://graph.facebook.com/v20.0/${targetForm.id}/test_leads?access_token=${token}`, {
        method: "DELETE"
      });
      const deleteData = await deleteRes.json();
      console.log("Delete response:", deleteData);

      // 3. Create a new test lead
      console.log(`Creating a new test lead on Meta servers for form ${targetForm.id}...`);
      const payload = {
        field_data: JSON.stringify([
          { name: "full_name", values: ["Programmatic Test Lead"] },
          { name: "email", values: ["prog_test@facebook.com"] },
          { name: "phone", values: ["+15555555555"] },
          { name: "city", values: ["New York"] }
        ])
      };

      const createRes = await fetch(`https://graph.facebook.com/v20.0/${targetForm.id}/test_leads?access_token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const createData = await createRes.json();
      
      if (createData.error) {
        console.error(`❌ Error creating test lead for form ${targetForm.id}:`, createData.error);
      } else {
        console.log(`\n✅ Success! Test Lead created on Meta servers for form ${targetForm.id}. Response:`, createData);
        console.log("\nCheck your server terminal or 'webhook_debug.log' to verify if the webhook was received and processed!");
        success = true;
        break; // Stop trying other forms
      }
    }

    if (!success) {
      console.log("\n❌ All forms failed to create a test lead. This can happen if the forms require custom field data that wasn't provided, or if the Page configuration is locked down.");
    }

  } catch (error) {
    console.error("Request failed:", error);
  } finally {
    process.exit(0);
  }
});
