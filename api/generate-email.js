import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
const cache = new Map();

export default async function handler(req, res) {
  const template = `
  # {Page/URL}
  > [Changes made here]
  `;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notes } = req.body; // Vercel automatically parses JSON

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
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates professional client-facing emails based strictly on the given notes. You are to strictly follow the ${template}`,
        },
        {
          role: "user",
          content: `Here are the notes:\n${notes}\n\nPlease generate a professional email to the client. Do not include Client's Name nor "Dear Client" and don't add a subject. Do not include Next Steps on the email. Also the Position will always be Modification Specialist \n Pro Modifications Team`,
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
