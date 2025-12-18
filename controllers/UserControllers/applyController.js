// controllers/applyController.js

const formidable = require("formidable"); // Formidable can also be used if not using Multer
const fs = require("fs");
const { db, storage } = require("../../src/appwrite");
const { ID, Query } = require("node-appwrite");
const { env } = require("../../src/env");



const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, role, motivation } = req.body;
    const cvFile = req.file; // The file is available on `req.file` because of Multer

    console.log("Received file:", cvFile);

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and role are required.",
      });
    }

    let cvFileId = null;

    if (cvFile) {
      // Upload the file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        env.APPLICANT_CVS_BUCKET_ID,
        ID.unique(),
        // Multer's memory storage provides a buffer
        cvFile.buffer
      );
      cvFileId = uploadedFile.$id;
    }

    // Save applicant data to Appwrite DB
    const newApplication = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_APPLICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        email,
        phone,
        role,
        motivation,
        cvId: cvFileId,
      }
    );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: newApplication,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application.",
      error: error.message,
    });
  }
};

const getApplications = async (req, res) => {
  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_APPLICATIONS_COLLECTION_ID,
      [Query.orderDesc("$createdAt")] // Order by creation date, descending
    );

    res.status(200).json({
      success: true,
      data: response.documents,
      message: "Applications fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications.",
      error: error.message,
    });
  }
};

module.exports = { submitApplication, getApplications };
