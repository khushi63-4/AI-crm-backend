const FacebookConfig = require("../models/facebookConfig.model");
const Lead = require("../models/lead.model");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const writeLog = (message) => {
  try {
    const logFilePath = path.join(__dirname, "../../webhook_debug.log");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`, "utf8");
    console.log(`[LOG] ${message}`);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
};

const getConfig = (req, res) => {
  FacebookConfig.getConfig((err, config) => {
    if (err) {
      console.error("Error fetching Facebook config:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json(config || { access_token: "", page_id: "", verify_token: "", public_webhook_url: "" });
  });
};

const saveConfig = (req, res) => {
  const { access_token, page_id, verify_token, public_webhook_url } = req.body;
  FacebookConfig.saveConfig({ access_token, page_id, verify_token, public_webhook_url }, (err) => {
    if (err) {
      console.error("Error saving Facebook config:", err);
      return res.status(500).json({ message: "Database Error" });
    }
    return res.status(200).json({ message: "Facebook configuration saved successfully" });
  });
};

const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  writeLog(`Webhook verification request: mode=${mode}, token=${token}, challenge=${challenge}`);

  if (mode && token) {
    FacebookConfig.getConfig((err, config) => {
      if (err) {
        writeLog(`Error getting config during webhook verification: ${err.message}`);
        console.error("Error getting config during webhook verification:", err);
        return res.status(500).send("Internal Server Error");
      }

      const expectedToken = (config && config.verify_token) ? config.verify_token : process.env.FB_VERIFY_TOKEN;
      if (mode === "subscribe" && token === expectedToken) {
        writeLog("Facebook Webhook Verified successfully.");
        console.log("Facebook Webhook Verified successfully.");
        return res.status(200).send(challenge);
      } else {
        writeLog(`Facebook Webhook verification failed. Token mismatch. Expected: ${expectedToken}, Got: ${token}`);
        console.warn("Facebook Webhook verification failed. Token mismatch.");
        return res.status(403).send("Forbidden");
      }
    });
  } else {
    return res.status(400).send("Bad Request");
  }
};

const handleWebhook = async (req, res) => {
  const body = req.body;
  
  writeLog(`Received webhook request body: ${JSON.stringify(body)}`);

  // Check if this is a leadgen event from page subscription
  if (body.object === "page") {
    // Return early to let Meta know we received it, then process asynchronously
    res.status(200).send("EVENT_RECEIVED");

    FacebookConfig.getConfig(async (err, config) => {
      if (err || !config || !config.access_token) {
        writeLog("No active Facebook configuration found or database error. Cannot fetch lead details.");
        console.error("No active Facebook configuration found or database error. Cannot fetch lead details.", err);
        return;
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            const leadgenId = String(change.value.leadgen_id);
            writeLog(`Received Facebook Leadgen webhook for ID: ${leadgenId}`);
            console.log(`Received Facebook Leadgen webhook for ID: ${leadgenId}`);
            try {
              let fbLead;
              if (/^4+$/.test(leadgenId)) {
                writeLog("Mock leadgen ID detected from Meta dashboard test button. Generating dummy lead details.");
                console.log("Mock leadgen ID detected from Meta dashboard test button. Generating dummy lead details.");
                fbLead = {
                  id: leadgenId,
                  field_data: [
                    { name: "full_name", values: ["Meta Dashboard Test"] },
                    { name: "email", values: ["dashboard_test@fb.com"] },
                    { name: "phone", values: ["1234567890"] },
                    { name: "city", values: ["California"] }
                  ]
                };
              } else {
                // Fetch details from Facebook Graph API
                const fbUrl = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${config.access_token}`;
                writeLog(`Fetching lead details from Graph API using URL: https://graph.facebook.com/v20.0/${leadgenId}?access_token=[HIDDEN]`);
                const fbRes = await fetch(fbUrl);
                if (!fbRes.ok) {
                  const errText = await fbRes.text();
                  writeLog(`Facebook API returned error status: ${fbRes.status}. Body: ${errText}`);
                  throw new Error(`Facebook API error: ${fbRes.status} ${errText}`);
                }
                fbLead = await fbRes.json();
                writeLog(`Successfully retrieved lead details: ${JSON.stringify(fbLead)}`);
              }
              console.log("Successfully fetched lead details from Meta Graph API:", fbLead);

              // Map lead details
              let name = "Facebook Lead";
              let email = "";
              let phone = "0000000000";
              let city = "";
              let occupation = "";
              let investment_amount = null;

              if (fbLead.field_data) {
                fbLead.field_data.forEach((field) => {
                  const fieldName = field.name.toLowerCase();
                  const fieldValue = field.values && field.values[0] ? String(field.values[0]) : "";

                  if (fieldName === "full_name" || fieldName === "name") {
                    name = fieldValue;
                  } else if (fieldName === "first_name") {
                    name = fieldValue + (name && name !== "Facebook Lead" ? " " + name : "");
                  } else if (fieldName === "last_name") {
                    name = (name && name !== "Facebook Lead" ? name + " " : "") + fieldValue;
                  } else if (fieldName === "email") {
                    email = fieldValue;
                  } else if (fieldName === "phone_number" || fieldName === "phone") {
                    phone = fieldValue;
                  } else if (fieldName === "city") {
                    city = fieldValue;
                  } else if (fieldName === "occupation") {
                    occupation = fieldValue;
                  } else if (fieldName === "investment_amount" || fieldName === "investment") {
                    investment_amount = parseFloat(fieldValue) || null;
                  }
                });
              }

              // Clean phone number to match CRM database expectations (10 digits)
              let cleanPhone = phone.replace(/\D/g, "");
              if (cleanPhone.length >= 10) {
                cleanPhone = cleanPhone.slice(-10);
              } else if (cleanPhone.length === 0) {
                cleanPhone = "1234567890"; // fallback default
              }

              // Save to database
              const leadData = {
                name: name.trim(),
                email: email.trim() || null,
                phone: cleanPhone,
                city: city.trim() || null,
                occupation: occupation.trim() || null,
                investment_amount: investment_amount,
                lead_source: "Facebook Meta",
              };

              writeLog(`Mapping lead data to database schema: ${JSON.stringify(leadData)}`);

              Lead.createLead(leadData, (dbErr, result) => {
                if (dbErr) {
                  writeLog(`Error saving automatic Facebook lead to database: ${dbErr.message}`);
                  console.error("Error saving automatic Facebook lead to database:", dbErr);
                } else {
                  writeLog(`Automatic Facebook lead saved successfully with ID: ${result.insertId}`);
                  console.log(`Automatic Facebook lead saved successfully with ID: ${result.insertId}`);
                }
              });
            } catch (fetchErr) {
              writeLog(`Failed to process lead details for leadgen_id ${leadgenId}: ${fetchErr.message}`);
              console.error(`Failed to process lead details for leadgen_id ${leadgenId}:`, fetchErr);
            }
          }
        }
      }
    });
  } else {
    res.sendStatus(404);
  }
};

const handleTestWebhook = (req, res) => {
  const { name, email, phone, city, occupation, investment_amount } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required for test lead" });
  }

  // Clean phone number
  let cleanPhone = String(phone || "1234567890").replace(/\D/g, "");
  if (cleanPhone.length >= 10) {
    cleanPhone = cleanPhone.slice(-10);
  } else if (cleanPhone.length === 0) {
    cleanPhone = "1234567890";
  }

  const testLead = {
    name: name.trim(),
    email: email ? email.trim() : null,
    phone: cleanPhone,
    city: city ? city.trim() : null,
    occupation: occupation ? occupation.trim() : null,
    investment_amount: investment_amount ? parseFloat(investment_amount) || null : null,
    lead_source: "Facebook Meta",
  };

  Lead.createLead(testLead, (err, result) => {
    if (err) {
      console.error("Error inserting test Facebook lead:", err);
      return res.status(500).json({ message: "Database Error" });
    }

    return res.status(201).json({
      message: "Mock Lead Webhook processed successfully!",
      leadId: result.insertId,
      lead: testLead
    });
  });
};

const syncFacebookLeads = async (req, res) => {
  const { days } = req.body;
  writeLog(`Starting manual Facebook leads sync for last ${days || "all"} days...`);
  
  FacebookConfig.getConfig(async (err, config) => {
    if (err) {
      writeLog(`Error fetching Facebook config: ${err.message}`);
      return res.status(500).json({ message: "Database error fetching configuration." });
    }
    
    if (!config || !config.access_token || !config.page_id) {
      writeLog("Facebook configuration missing page_id or access_token. Sync aborted.");
      return res.status(400).json({ 
        message: "Facebook Page ID and Page Access Token are required. Please configure and save them first." 
      });
    }

    try {
      // Parse filtering range if specified
      let since = null;
      if (days && days !== "all") {
        const daysInt = parseInt(days, 10);
        if (!isNaN(daysInt)) {
          since = Math.floor((Date.now() - (daysInt * 24 * 60 * 60 * 1000)) / 1000);
          writeLog(`Filtering leads submitted since Unix Timestamp: ${since} (${new Date(since * 1000).toISOString()})`);
        }
      }

      // 1. Get lead gen forms
      const formsUrl = `https://graph.facebook.com/v20.0/${config.page_id}/leadgen_forms?access_token=${config.access_token}`;
      writeLog(`Fetching forms from: https://graph.facebook.com/v20.0/${config.page_id}/leadgen_forms`);
      
      const formsRes = await fetch(formsUrl);
      if (!formsRes.ok) {
        const errText = await formsRes.text();
        writeLog(`Facebook API returned error fetching forms: ${formsRes.status}. Body: ${errText}`);
        throw new Error(`Failed to fetch lead forms: ${formsRes.status} ${errText}`);
      }
      
      const formsData = await formsRes.json();
      const forms = formsData.data || [];
      writeLog(`Found ${forms.length} lead forms for Page.`);

      let totalChecked = 0;
      let importedCount = 0;
      let skippedCount = 0;
      
      // 2. Fetch leads for each form with auto-pagination
      for (const form of forms) {
        writeLog(`Fetching leads for form: ${form.name} (ID: ${form.id})`);
        let leadsUrl = `https://graph.facebook.com/v20.0/${form.id}/leads?limit=100&access_token=${config.access_token}`;
        if (since) {
          leadsUrl += `&since=${since}`;
        }
        
        while (leadsUrl) {
          writeLog(`Requesting leads page from: ${leadsUrl.substring(0, 120)}...`);
          const leadsRes = await fetch(leadsUrl);
          if (!leadsRes.ok) {
            const errText = await leadsRes.text();
            writeLog(`Error fetching leads for form ${form.id}: ${leadsRes.status}. Body: ${errText}`);
            break; // Stop paginating this form on error
          }
          
          const leadsData = await leadsRes.json();
          const fbLeads = leadsData.data || [];
          writeLog(`Retrieved ${fbLeads.length} leads on this page for form: ${form.name}`);

          for (const fbLead of fbLeads) {
            totalChecked++;
            
            // Map lead details
            let name = "Facebook Lead";
            let email = "";
            let phone = "0000000000";
            let city = "";
            let occupation = "";
            let investment_amount = null;

            if (fbLead.field_data) {
              fbLead.field_data.forEach((field) => {
                const fieldName = field.name.toLowerCase();
                const fieldValue = field.values && field.values[0] ? String(field.values[0]) : "";

                if (fieldName === "full_name" || fieldName === "name") {
                  name = fieldValue;
                } else if (fieldName === "first_name") {
                  name = fieldValue + (name && name !== "Facebook Lead" ? " " + name : "");
                } else if (fieldName === "last_name") {
                  name = (name && name !== "Facebook Lead" ? name + " " : "") + fieldValue;
                } else if (fieldName === "email") {
                  email = fieldValue;
                } else if (fieldName === "phone_number" || fieldName === "phone") {
                  phone = fieldValue;
                } else if (fieldName === "city") {
                  city = fieldValue;
                } else if (fieldName === "occupation") {
                  occupation = fieldValue;
                } else if (fieldName === "investment_amount" || fieldName === "investment") {
                  investment_amount = parseFloat(fieldValue) || null;
                }
              });
            }

            // Clean phone number
            let cleanPhone = phone.replace(/\D/g, "");
            if (cleanPhone.length >= 10) {
              cleanPhone = cleanPhone.slice(-10);
            } else if (cleanPhone.length === 0) {
              cleanPhone = "1234567890";
            }

            // Check if lead exists in database (by email or phone)
            const checkSql = "SELECT id FROM leads WHERE (email = ? AND email != '') OR (phone = ? AND phone != '') LIMIT 1";
            
            const leadExists = await new Promise((resolve) => {
              db.query(checkSql, [email ? email.trim() : "", cleanPhone], (checkErr, results) => {
                if (checkErr) {
                  writeLog(`Error checking lead existence: ${checkErr.message}`);
                  resolve(true); // Treat as exists to avoid inserting duplicate/broken entries
                } else {
                  resolve(results.length > 0);
                }
              });
            });

            if (leadExists) {
              skippedCount++;
              continue;
            }

            // Create lead data object
            const leadData = {
              name: name.trim(),
              email: email ? email.trim() : null,
              phone: cleanPhone,
              city: city ? city.trim() : null,
              occupation: occupation ? occupation.trim() : null,
              investment_amount: investment_amount,
              lead_source: "Facebook Meta",
            };

            // Save to database
            await new Promise((resolve) => {
              Lead.createLead(leadData, (dbErr, result) => {
                if (dbErr) {
                  writeLog(`Error saving automatic Facebook lead: ${dbErr.message}`);
                } else {
                  importedCount++;
                  writeLog(`Synced Facebook lead saved successfully with ID: ${result.insertId}`);
                }
                resolve();
              });
            });
          }

          // Move to next page if it exists
          leadsUrl = leadsData.paging && leadsData.paging.next ? leadsData.paging.next : null;
        }
      }

      writeLog(`Sync complete. Checked: ${totalChecked}, Imported: ${importedCount}, Skipped: ${skippedCount}`);
      return res.status(200).json({
        message: `Sync completed successfully!`,
        totalChecked,
        importedCount,
        skippedCount,
      });

    } catch (syncErr) {
      writeLog(`Exception during Facebook leads sync: ${syncErr.message}`);
      console.error(syncErr);
      return res.status(500).json({ 
        message: `Sync failed: ${syncErr.message}` 
      });
    }
  });
};

module.exports = {
  getConfig,
  saveConfig,
  verifyWebhook,
  handleWebhook,
  handleTestWebhook,
  syncFacebookLeads,
};
