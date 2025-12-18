
const { db } = require('./appwriteService');



const getSettingsDoc = async  (req, res) => {
  try {
    const document = await db.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SETTINGS_COLLECTION_ID,
      process.env.APPWRITE_SETTINGS_DOCUMENT_ID
      
    );
    res.json(document);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

const updateSettingDoc = async (req, res) => {
    try {
        const {
            appName,
            currency,
            currencySymbol,
            taxRate,
            businessHours,
            language,
            timezone
          } = req.body;
      const updated = await db.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SETTINGS_COLLECTION_ID,
        process.env.APPWRITE_SETTINGS_DOCUMENT_ID,
        {
            appName,
            currency,
            currencySymbol,
            taxRate,
            businessHours,
            language,
            timezone
          }
        
      );
  
      res.json(updated);
    } catch (error) {
      console.error('Error updating settings:', error.message);
      res.status(500).json({ error: 'Failed to update settings' });
    }
} 

module.exports = { getSettingsDoc, updateSettingDoc}
