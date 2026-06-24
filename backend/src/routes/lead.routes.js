const express = require("express");

const router = express.Router();

const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  uploadCSV,
} = require("../controllers/lead.controller");

const {
  getConfig,
  saveConfig,
  verifyWebhook,
  handleWebhook,
  handleTestWebhook,
  syncFacebookLeads,
} = require("../controllers/facebook.controller");

const upload = require("../middlewares/upload.middleware");

// Facebook config and webhook routes
router.get("/facebook/config", getConfig);
router.post("/facebook/config", saveConfig);
router.get("/facebook/webhook", verifyWebhook);
router.post("/facebook/webhook", handleWebhook);
router.post("/facebook/test-webhook", handleTestWebhook);
router.post("/facebook/sync", syncFacebookLeads);

router.post("/", createLead);

router.get("/", getAllLeads);

router.get("/:id", getLeadById);

router.put("/:id", updateLead);

router.delete("/:id", deleteLead);
router.post(
  "/upload-csv",
  upload.single("file"),
  uploadCSV
);
module.exports = router;
