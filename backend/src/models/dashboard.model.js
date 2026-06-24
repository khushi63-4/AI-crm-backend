const db = require("../config/db");

const getDashboardStats = (callback) => {

  const sql = `
    SELECT

      COUNT(*) AS totalLeads,

      SUM(CASE
        WHEN lead_source = 'Manual'
        THEN 1 ELSE 0 END
      ) AS manualLeads,

      SUM(CASE
        WHEN lead_source = 'CSV Upload'
        THEN 1 ELSE 0 END
      ) AS csvLeads,

      SUM(CASE
        WHEN lead_source = 'Facebook Meta'
        THEN 1 ELSE 0 END
      ) AS facebookLeads,

      SUM(CASE
        WHEN call_output = 'Converted'
        THEN 1 ELSE 0 END
      ) AS convertedLeads,

      SUM(CASE
        WHEN call_output = 'Follow Up'
        THEN 1 ELSE 0 END
      ) AS followUpLeads,

      SUM(CASE
        WHEN call_output = 'Not Interested'
        THEN 1 ELSE 0 END
      ) AS notInterestedLeads

    FROM leads
  `;

  db.query(sql, callback);
};

module.exports = {
  getDashboardStats,
};