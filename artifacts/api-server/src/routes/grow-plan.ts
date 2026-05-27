import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/grow-plan", async (req, res) => {
  try {
    const { cropName, location, season, hemisphere } = req.body as {
      cropName: string;
      location: string;
      season: string;
      hemisphere: string;
    };

    if (!cropName || !season || !hemisphere) {
      res.status(400).json({ error: "cropName, season, and hemisphere are required" });
      return;
    }

    const systemPrompt = `You are Farmguard AI, an expert agronomist and biodynamic farming advisor.
Generate a detailed, practical growing plan for a specific crop considering the season, hemisphere, and moon gardening principles.

ALWAYS respond with a valid JSON object in exactly this format:
{
  "totalDays": <number, total days from soil prep to harvest>,
  "phases": [
    {
      "name": "<phase name, e.g. Soil Preparation, Sowing, Germination, Vegetative Growth, Flowering/Fruiting, Harvest>",
      "startDay": <day number>,
      "endDay": <day number>,
      "activities": ["<specific activity 1>", "<specific activity 2>", ...],
      "moonAdvice": "<specific moon phase advice for this phase>",
      "bestMoonPhases": ["<moon phase name>", ...],
      "tips": ["<practical tip 1>", "<practical tip 2>", ...]
    }
  ],
  "moonGuide": {
    "New Moon": "<what to do with this crop during new moon>",
    "Waxing Crescent": "<what to do>",
    "First Quarter": "<what to do>",
    "Waxing Gibbous": "<what to do>",
    "Full Moon": "<what to do>",
    "Waning Gibbous": "<what to do>",
    "Last Quarter": "<what to do>",
    "Waning Crescent": "<what to do>"
  },
  "generalTips": ["<important tip 1>", "<important tip 2>", "<important tip 3>", "<tip 4>", "<tip 5>"]
}
Do not include any text outside the JSON object. Be specific, practical, and tailored to the location/season.`;

    const userMessage = `Create a detailed growing plan for: ${cropName}
Location: ${location}
Current season: ${season} (${hemisphere} hemisphere)

Include 5-7 phases from soil preparation to harvest, moon phase guidance for each phase, and practical tips specific to this crop and season.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if Claude wraps the JSON
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let plan;
    try {
      plan = JSON.parse(stripped);
    } catch {
      req.log.error({ text: stripped.slice(0, 500) }, "Grow plan JSON parse failed");
      res.status(500).json({ error: "Failed to generate plan. Please try again." });
      return;
    }

    res.json(plan);
  } catch (err) {
    req.log.error({ err }, "Grow plan error");
    res.status(500).json({ error: "Failed to generate grow plan. Please try again." });
  }
});

export default router;
