const db = require("../config/db");

const getConfig = (callback) => {
  const sql = `SELECT * FROM facebook_configs LIMIT 1`;
  db.query(sql, (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) {
      return callback(null, null);
    }
    return callback(null, results[0]);
  });
};

const saveConfig = (configData, callback) => {
  const checkSql = `SELECT id FROM facebook_configs LIMIT 1`;
  db.query(checkSql, (err, results) => {
    if (err) return callback(err);

    if (results.length > 0) {
      const updateSql = `
        UPDATE facebook_configs
        SET access_token = ?, page_id = ?, verify_token = ?, public_webhook_url = ?
        WHERE id = ?
      `;
      db.query(
        updateSql,
        [
          configData.access_token || null,
          configData.page_id || null,
          configData.verify_token || null,
          configData.public_webhook_url || null,
          results[0].id,
        ],
        callback
      );
    } else {
      const insertSql = `
        INSERT INTO facebook_configs (access_token, page_id, verify_token, public_webhook_url)
        VALUES (?, ?, ?, ?)
      `;
      db.query(
        insertSql,
        [
          configData.access_token || null,
          configData.page_id || null,
          configData.verify_token || null,
          configData.public_webhook_url || null,
        ],
        callback
      );
    }
  });
};

module.exports = {
  getConfig,
  saveConfig,
};
