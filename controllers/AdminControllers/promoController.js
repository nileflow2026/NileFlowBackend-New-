const { Query } = require("node-appwrite");
const { users, db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const dayjs = require("dayjs");

const southSudanHolidays = [
  {
    name: "Independence Day",
    date: "07-09",
    message: "Honoring Freedom and Sovereignty",
    cta: "Enjoy 10% off to celebrate freedom!",
  },
  {
    name: "Martyrs' Day",
    date: "07-30",
    message: "Remembering the Heroes of Liberation",
    cta: "Special collection dropping today",
  },
  {
    name: "Peace Agreement Day",
    date: "08-27",
    message: "Commemorating the Path to Peace",
    cta: "Support local peace initiatives",
  },
  {
    name: "Maisha Day",
    date: "10-10",
    message: "Celebrate Local Heritage",
    cta: "Buy 1, Gift 1 — today only!",
  },
];

const getTodayPromo = async (req, res) => {
  const today = dayjs();
  const todayStr = today.format("MM-DD");
  const todayDate = today.format("YYYY-MM-DD");

  try {
    // 1. Check Holiday
    const holiday = southSudanHolidays.find((h) => h.date === todayStr);
    if (holiday) {
      return res.json({
        type: "holiday",
        title: holiday.name,
        message: holiday.message,
        cta: holiday.cta,
        image: holiday.image,
      });
    }

    // 2. Check Appwrite promotions
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PROMOTIONS_COLLECTION_ID
    );

    if (result.documents.length > 0) {
      const promo = result.documents[0];
      return res.json({
        type: "promotion",
        title: promo.title,
        message: promo.message,
        cta: promo.cta || null,
        image: promo.image,
      });
    }

    // 3. Fallback
    return res.json({
      type: "default",
      title: "Welcome to Nile Mart",
      message: "Shop local, celebrate culture",
      image: null,
      cta: null,
    });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return res.status(500).json({ error: "Failed to fetch promotion" });
  }
};

module.exports = { getTodayPromo };
