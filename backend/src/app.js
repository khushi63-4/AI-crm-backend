const express = require("express");
const cors = require("cors");

const leadRoutes = require("./routes/lead.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Simple privacy policy page for Facebook app verification
app.get("/privacy", (req, res) => {
  res.send("Privacy Policy for CRM. We do not sell or share your data.");
});

module.exports = app;