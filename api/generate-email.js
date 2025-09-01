import OpenAI from "openai";

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory cache
const cache = new Map();

export default async function handler(req, res) {
  const intro = `Happy Labor Day! 🎉 We hope you’re enjoying a relaxing holiday.\n
Here are the updates we’ve completed for your website:`;
  const closure = `Normally, we would reach out by phone to confirm these updates with you. However, since it’s Labor Day, we didn’t want to disturb your holiday. Please feel free to review the changes at your convenience, and we’ll be glad to confirm everything with you after the holiday.
\nThank you for your continued trust, and wishing you a safe and enjoyable Labor Day!`;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "No notes provided" });
    }

    // ✅ Cache check
    if (cache.has(notes)) {
      return res.status(200).json({ email: cache.get(notes), cached: true });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant writing professional client-facing emails. " +
            "Generate a short introductory sentence or two that summarizes the changes in the internal notes. " +
            "Then list the updates strictly in this format:\n\n" +
            `${intro}\n` +
            "# Page Name/URL\n - What was changed\n\n" +
            `${closure}` +
            "Do NOT include greetings, closings, signatures, internal notes, or NEXT STEPS/QC notes. " +
            "Keep the email concise and professional.",
        },
        {
          role: "user",
          content: `Internal notes:\n${notes}\n\nWrite the client-facing email now.`,
        },
      ],
    });

    let email = response.choices[0]?.message?.content?.trim() || "No email generated.";

    // 🔧 Optional cleanup: normalize line breaks & enforce # / - prefixes
    email = email
      .replace(/\r\n/g, "\n")
      .replace(/^\s*Page\/URL:/gm, "# ") // ensure headers
      .replace(/^\s*[-•]\s*/gm, " - "); // normalize dash lists

    // Save to cache
    cache.set(notes, email);

    return res.status(200).json({ email, cached: false });
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.stack || err);
    return res.status(500).json({ error: "Failed to generate email" });
  }
}
