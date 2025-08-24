import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notes } = req.body; // Vercel automatically parses JSON

    if (!notes) {
      return res.status(400).json({ error: "No notes provided" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates professional client-facing emails based strictly on the given notes.",
        },
        {
          role: "user",
          content: `Here are the notes:\n${notes}\n\nPlease generate a professional email to the client.`,
        },
      ],
    });

    const email = completion.choices[0].message.content;

    res.status(200).json({ email });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "Failed to generate email" });
  }
}
