import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: "No notes provided" });
    }

    // Check cache first
    if (cache.has(notes)) {
      return res.status(200).json({ email: cache.get(notes), cached: true });
    }

    // Call OpenAI if not cached
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6, 
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates professional, client-facing emails strictly based on the provided notes. Include a brief introduction. Do NOT add a salutation, closing, or signature.`,
        },
        {
          role: "user",
          content: `Here are the notes:\n${notes}\n\nGenerate a professional email to the client. Include a brief introduction. Do NOT include Next Steps:. Do NOT include the email salutation, closing, or signature.`,
        },
      ],
    });

    const email = completion.choices[0].message.content;

    // Save to cache
    cache.set(notes, email);

    res.status(200).json({ email, cached: false });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "Failed to generate email" });
  }
}
