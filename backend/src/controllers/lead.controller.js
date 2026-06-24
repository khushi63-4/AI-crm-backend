const Lead = require("../models/lead.model");

// Create Lead
const createLead = (req, res) => {
  const {
    name,
    email,
    phone,
    city,
    occupation,
    investment_amount,
    lead_source,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  if (!phone) {
    return res.status(400).json({
      message: "Phone number is required",
    });
  }

  const phoneStr = String(phone).trim();
  if (!/^\d{10}$/.test(phoneStr)) {
    return res.status(400).json({
      message: "Phone number must be exactly 10 digits",
    });
  }

  Lead.createLead(
    {
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phoneStr, 
      city: city ? city.trim() : null,
      occupation: occupation ? occupation.trim() : null,
      investment_amount: investment_amount ? parseFloat(investment_amount) || null : null,
      lead_source: lead_source || "Manual",
    },
    (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Database Error",
        });
      }

      res.status(201).json({
        message: "Lead Created Successfully",
        leadId: result.insertId,
      });
    }
  );
};

// Get All Leads
const getAllLeads = (req, res) => {

  const page = parseInt(req.query.page) || 1;

  const limit = parseInt(req.query.limit) || 10;

  const offset = (page - 1) * limit;

const filters = {
  search: req.query.search || "",
  lead_source: req.query.lead_source || "",
  call_output: req.query.call_output || "",
  startDate: req.query.startDate || "",
  endDate: req.query.endDate || "",
  limit,
  offset,
};

  Lead.countLeads(filters, (err, countResult) => {

    if (err) {
      return res.status(500).json(err);
    }

    Lead.getAllLeads(filters, (err, leads) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.status(200).json({
        total: countResult[0].total,
        page,
        limit,
        data: leads,
      });

    });

  });

};


// Get Lead By ID
const getLeadById = (req, res) => {
  const { id } = req.params;

  Lead.getLeadById(id, (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Lead Not Found",
      });
    }

    res.status(200).json(result[0]);
  });
};

// Update Lead
const updateLead = (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  if (name !== undefined && (!name || !name.trim())) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  if (phone !== undefined) {
    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }
    const phoneStr = String(phone).trim();
    if (!/^\d{10}$/.test(phoneStr)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits",
      });
    }
    req.body.phone = phoneStr;
  }

  if (name !== undefined) {
    req.body.name = name.trim();
  }

  Lead.updateLead(id, req.body, (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Lead Not Found",
      });
    }

    res.status(200).json({
      message: "Lead Updated Successfully",
    });
  });
};

// Delete Lead
const deleteLead = (req, res) => {
  const { id } = req.params;

  Lead.deleteLead(id, (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Lead Not Found",
      });
    }

    res.status(200).json({
      message: "Lead Deleted Successfully",
    });
  });
};
const fs = require("fs");
const csv = require("csv-parser");
const uploadCSV = (req, res) => {

  const leads = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {

      leads.push([
        row.name,
        row.email,
        row.phone,
        row.city,
        row.occupation,
        row.investment_amount,
        "CSV Upload",
      ]);

    })

    .on("end", () => {

      Lead.bulkCreateLeads(
        leads,
        (err, result) => {

          if (err) {
            return res.status(500).json(err);
          }

          res.status(200).json({
            message: "CSV Uploaded Successfully",
            totalLeads: leads.length,
          });

        }
      );

    });

};
module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  uploadCSV,
};