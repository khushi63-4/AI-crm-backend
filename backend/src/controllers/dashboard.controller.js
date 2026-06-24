const Dashboard = require("../models/dashboard.model");

const getDashboardStats = (req, res) => {

  Dashboard.getDashboardStats((err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Database Error",
      });
    }

    res.status(200).json(result[0]);

  });

};

module.exports = {
  getDashboardStats,
};