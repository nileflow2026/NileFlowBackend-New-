const { fetchAuditLogs } = require("../../utils/auditLogger");


const getAuditLogs = async (req, res) => {
  try {
    const logs = await fetchAuditLogs(100); // fetch up to 100 logs
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAuditLogs };
