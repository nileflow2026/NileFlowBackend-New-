
const { Query, ID } = require("node-appwrite");
const { db } = require("../../src/appwrite");
const { env } = require("../../src/env");

const getCareers = async (req, res) => {
  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CAREERS_COLLECTION_ID,
      [Query.limit(100), Query.orderAsc("$createdAt")] // Fetch up to 100 documents, adjust as needed
    );

    res.status(200).json({
      success: true,
      data: response.documents,
      message: "Careers fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching careers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch careers.",
      error: error.message,
    });
  }
};

const addCareer = async (req, res) => {
  const {
    title,
    description,
    location,
    department,
    image,
    responsibilities,
    type,
    requirements,
    growthPath,
  } = req.body;

  // Basic validation (optional for image)
  if (
    !title ||
    !description ||
    !location ||
    !department ||
    !responsibilities ||
    !type ||
    !requirements ||
    !growthPath
  ) {
    return res.status(400).json({
      success: false,
      message:
        "All required fields are needed: title, description, location, and department.",
    });
  }

  try {
    // Convert the responsibilities array to a JSON string
    const responsibilitiesJson = JSON.stringify(responsibilities);
    const requirementsJson = JSON.stringify(responsibilities);
    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CAREERS_COLLECTION_ID,
      ID.unique(),
      {
        title,
        type,
        description,
        location,
        department, 
        responsibilities: responsibilitiesJson, // Save the JSON string
        requirements: requirementsJson,
        growthPath,
        image, // Add the image field here
      }
    );

    res.status(201).json({
      success: true,
      data: response,
      message: "New career listing added successfully.",
    });
  } catch (error) {
    console.error("Error adding career:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add new career listing.",
      error: error.message,
    });
  }
};

module.exports = { getCareers, addCareer };
