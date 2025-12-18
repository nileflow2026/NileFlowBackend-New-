const { ID } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { logAuditFromRequest } = require('../../utils/auditLogger');

const getStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user information found.' });
    }
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_STAFF_COLLECTION
    );

    return res.status(200).json(response.documents);
  } catch (error) {
    console.error('[Appwrite] getStaff error:', error);
    return res.status(500).json({ error: 'Failed to fetch staff data' });
  }
};

  
   const deleteStaff = async (id, req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user information found.' });
      }
  
      if (!userId) {
        return res.status(400).json({ error: 'Invalid token: Missing user ID.' });
      }
  
      const userId = req.user.userId; // Now safely extract
      console.log('userId:', userId)
  
      if (!userId) {
        return res.status(400).json({ error: 'Invalid token: Missing user ID.' });
      }
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID, 
        env.APPWRITE_STAFF_COLLECTION,  
        id);
        res.status(200).json({ notifications: response.documents });
      return getStaff(); // refresh the list
      
    } catch (error) {
      console.error('[Appwrite] deleteStaff error:', error);
      res.status(500).json({ error: 'Failed to delete staff.' });
    }
  };
  
   const updateStaff = async (id, updatedData, req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user information found.' });
      }

       const userId = req.user.userId; // Now safely extract
      console.log('userId:', userId)

      if (!userId) {
        return res.status(400).json({ error: 'Invalid token: Missing user ID.' });
      }
  
      await db.updateDocument(
        process.env.APPWRITE_DATABASE_ID, 
        process.env.APPWRITE_STAFF_COLLECTION, 
        id, 
        updatedData
    );
    res.status(201).json({ message: 'Staff updated successfully.' });
      return getStaff(); // refresh the list
    } catch (error) {
      console.error('[Appwrite] updateStaff error:', error);
      res.status(500).json({ error: e.message });
    }
  };
  const createStaff = async (req, res) => {
    console.log('[createStaff] req.body:', req.body);

    try {
      const { name, role, address, email, phonenumber } = req.body;
  
      const staffData = {
        name,
        role,
        address,
        email,
        phonenumber,
      };
  
      const doc = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_STAFF_COLLECTION,
        ID.unique(),
        staffData
      );

      await logAuditFromRequest(
        req,
        "Staff added",
        "Staff Management",
        doc.$id,
        { name, role }
      );
  
      res.status(201).json({ message: 'Staff created successfully.' });
    } catch (error) {
      console.error('[Appwrite] createStaff error:', error);
      res.status(500).json({ error: 'Failed to create staff' });
    }
  };
  


  module.exports = { createStaff, deleteStaff, updateStaff, getStaff}