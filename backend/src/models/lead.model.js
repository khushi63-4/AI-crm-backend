const db = require("../config/db");

// Create Lead
const createLead = (leadData, callback) => {
  const sql = `
    INSERT INTO leads (
      name,
      email,
      phone,
      city,
      occupation,
      investment_amount,
      lead_source
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      leadData.name,
      leadData.email,
      leadData.phone,
      leadData.city,
      leadData.occupation,
      leadData.investment_amount,
      leadData.lead_source,
    ],
    callback
  );
};

// Get All Leads
const getAllLeads = (filters, callback) => {

  let sql = `SELECT * FROM leads WHERE 1=1`;

  let values = [];

  // Search
  if (filters.search) {
    sql += `
      AND (
        name LIKE ?
        OR email LIKE ?
        OR phone LIKE ?
        OR city LIKE ?
        OR occupation LIKE ?
      )
    `;

    const searchValue = `%${filters.search}%`;

    values.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  // Lead Source Filter
  if (filters.lead_source) {
    sql += ` AND lead_source = ?`;
    values.push(filters.lead_source);
  }

  // Call Output Filter
  if (filters.call_output) {
    sql += ` AND call_output = ?`;
    values.push(filters.call_output);
  }
  // Date Range Filter
if (filters.startDate && filters.endDate) {

  sql += `
    AND DATE(created_at)
    BETWEEN ? AND ?
  `;

  values.push(
    filters.startDate,
    filters.endDate
  );

}

  sql += `
    ORDER BY created_at DESC
    LIMIT ?
    OFFSET ?
  `;

  values.push(filters.limit);
  values.push(filters.offset);

  db.query(sql, values, callback);
};


const countLeads = (filters, callback) => {

  let sql = `
    SELECT COUNT(*) AS total
    FROM leads
    WHERE 1=1
  `;

  let values = [];

  if (filters.search) {
    sql += `
      AND (
        name LIKE ?
        OR email LIKE ?
        OR phone LIKE ?
        OR city LIKE ?
        OR occupation LIKE ?
      )
    `;

    const searchValue = `%${filters.search}%`;

    values.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  if (filters.lead_source) {
    sql += ` AND lead_source = ?`;
    values.push(filters.lead_source);
  }

  if (filters.call_output) {
    sql += ` AND call_output = ?`;
    values.push(filters.call_output);
  }
  if (filters.startDate && filters.endDate) {

  sql += `
    AND DATE(created_at)
    BETWEEN ? AND ?
  `;

  values.push(
    filters.startDate,
    filters.endDate
  );

}

  db.query(sql, values, callback);
};


// Get Lead By ID
const getLeadById = (id, callback) => {
  const sql = `
    SELECT *
    FROM leads
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

// Update Lead
const updateLead = (id, leadData, callback) => {
  const sql = `
    UPDATE leads
    SET
      name = ?,
      email = ?,
      phone = ?,
      city = ?,
      occupation = ?,
      investment_amount = ?,
      call_output = ?,
      lead_source = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      leadData.name,
      leadData.email,
      leadData.phone,
      leadData.city,
      leadData.occupation,
      leadData.investment_amount,
      leadData.call_output,
      leadData.lead_source,
      id,
    ],
    callback
  );
};

// Delete Lead
const deleteLead = (id, callback) => {
  const sql = `
    DELETE FROM leads
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};

const bulkCreateLeads = (leads, callback) => {

  const sql = `
    INSERT INTO leads
    (
      name,
      email,
      phone,
      city,
      occupation,
      investment_amount,
      lead_source
    )
    VALUES ?
  `;

  db.query(sql, [leads], callback);
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  bulkCreateLeads,
  countLeads,
};