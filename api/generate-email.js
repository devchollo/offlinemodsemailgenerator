import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
const cache = new Map();

export default async function handler(req, res) {
  const closing = `
  As part of our standard process, we typically give you a quick call to confirm the updates. However, due to the high volume of requests and our extended weekend hours, we would like to respect your personal time and avoid disturbing you outside regular business days.
 
\nYou can now review the updates at your convenience. Should you have any additional changes, feedback, or clarifications, please don’t hesitate to reach out to us during our regular working hours, and we’ll be happy to assist you.
 
\nYou can call us at 1-888-642-0197 for any clarifications we'd be glad to assist you with your needs. Thank you for your understanding and continued trust in our services.
  \n`;
  const template = `
  ${req.body}\n\n

  ${closing}
  `;
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
          content: `You are a helpful assistant that generates professional, client-facing emails strictly based on the provided notes. Include a brief introduction but strictly follow the ${template}. Do NOT add a salutation, closing, or signature.`,
        },
        {
          role: "user",
          content: `Here are the notes:\n${notes}\n\nGenerate a professional email to the client. Include a brief introduction but strictly follow the ${template}. Do NOT include Next Steps:. Do NOT include the email salutation, closing, or signature.`,
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
