import OpenAI from "openai";

// OpenAI client
const openai = new OpenAI({
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
            "Strictly follow this structure when generating the email:\n\n" +
            "[insert a bit of intro here and summary of what changed]\n\n" +
            "Page/URL: [Page title / URL here]\n\n" +
            "[changes here]\n\n\n" +
            "[Advise the client to submit additional changes through site changes form or call in for further support.]\n" +
            "Request closed and being reviewed by quality control.\n\n" +
            "Rules:\n" +
            "- Replace the square brackets with real content.\n" +
            "- Do NOT include greetings, closings, signatures, internal notes, or NEXT STEPS/QC notes.\n" +
            "- Always include the URL if it’s given.\n" +
            "- Keep the email concise and professional.",
        },
        {
          role: "user",
          content: `Internal notes:\n${notes}\n\nWrite the client-facing email now.`,
        },
      ],
    });

    let email = response.choices[0]?.message?.content?.trim() || "No email generated.";

    // 🔧 Cleanup: normalize line breaks & enforce template consistency
    email = email
      .replace(/\r\n/g, "\n")
      .replace(/^\s*Page\/URL:?/gm, "Page/URL:") // enforce correct header
      .replace(/^\s*[-•]\s*/gm, " - "); // normalize bullet style

    // Save to cache
    cache.set(notes, email);

    return res.status(200).json({ email, cached: false });
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.stack || err);
    return res.status(500).json({ error: "Failed to generate email" });
  }
}
