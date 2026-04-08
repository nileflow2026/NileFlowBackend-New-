const { db } = require("../services/appwriteService");
const { env } = require("../src/env");
const { ID, Query } = require("node-appwrite");

const logAudit = async ({
  action,
  performedBy,
  entityType,
  entityId,
  details = {},
}) => {
  try {
    const payload = {
      action: action || "UNKNOWN_ACTION",
      performedBy: performedBy || "UNKNOWN_USER",
      entityType: entityType || "UNKNOWN_ENTITY",
      entityId: entityId || "UNKNOWN_ID",
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
    };

    console.log("Audit log payload:", payload);

    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_AUDIT_LOGS_COLLECTION_ID,
      ID.unique(),
      payload,
    );
  } catch (err) {
    console.error("Failed to log audit:", err.message);
  }
};

const logAuditFromRequest = async (
  req,
  action,
  entityType,
  entityId,
  details = {},
) => {
  const performedBy = req?.user?.email || req?.user?.userId || "Unknown user";
  return logAudit({
    action,
    performedBy,
    entityType,
    entityId,
    details,
  });
};
const fetchAuditLogs = async (limit = 50) => {
  try {
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_AUDIT_LOGS_COLLECTION_ID,
      [Query.orderDesc("timestamp"), Query.limit(limit)],
    );

    return result.documents;
  } catch (err) {
    console.error("Error fetching audit logs:", err.message);
    throw new Error("Failed to fetch audit logs");
  }
};

module.exports = { logAudit, fetchAuditLogs, logAuditFromRequest };
