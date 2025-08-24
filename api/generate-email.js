// api/generate-email.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      const { notes } = JSON.parse(body);

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates professional client-facing emails based strictly on the given notes." },
          { role: "user", content: `Here are the notes:\n${notes}\n\nPlease generate a professional email to the client.` }
        ],
      });

      const email = completion.choices[0].message.content;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ email }));
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to generate email" }));
  }
};
