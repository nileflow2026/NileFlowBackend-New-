const { db } = require("../../src/appwrite");
const { ID } = require('node-appwrite');
const { env } = require('../../src/env');
const { default: OpenAI } = require("openai");


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); 

const storeQuestion = async (req, res) => {
    try {
        const { userId, question,  source = "text" } = req.body;

        if (!userId || !question) {
            return res.status(400).json({ error: "userId and question are required." });
        }

         if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

     // 🔮 Send question to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    });

    const responseText = completion.choices[0].message.content.trim();

    const doc = {
      userId,
      question,
      source,
      responseText: responseText || null,
     timestamp: new Date().toISOString(),
    };

    if (userId) doc.userId = userId;

    const result = await db.createDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_QUESTION_COLLECTION_ID,
            ID.unique(),
            doc
            /* {
                userId, 
                question,
                timestamp: new Date().toISOString(),
            } */
        );    

        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error("Error storing question:", error);
        return res.status(500).json({ error: "Failed to store question." });
    }
};


module.exports ={ storeQuestion}