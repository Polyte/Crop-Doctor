import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/grow-plan", async (req, res) => {
  try {
    const { cropName, location, season, hemisphere, lang = "en" } = req.body as {
      cropName: string;
      location: string;
      season: string;
      hemisphere: string;
      lang?: string;
    };

    if (!cropName || !season || !hemisphere) {
      res.status(400).json({ error: "cropName, season, and hemisphere are required" });
      return;
    }

    const isSwahili = lang === "sw";

    const systemPrompt = `You are Farmguard AI, an expert agronomist and biodynamic farming advisor.

${isSwahili ? "IMPORTANT: Respond ENTIRELY in Swahili (Kiswahili). All JSON fields must be in Swahili." : "Generate a detailed, practical growing plan for a specific crop considering the season, hemisphere, and moon gardening principles."}

ALWAYS respond with a valid JSON object in exactly this format:
{
  "totalDays": <number, total days from soil prep to harvest>,
  "phases": [
    {
      "name": "<phase name>",
      "startDay": <day number>,
      "endDay": <day number>,
      "activities": ["<specific activity 1>", ...],
      "moonAdvice": "<specific moon phase advice>",
      "bestMoonPhases": ["<moon phase name>", ...],
      "tips": ["<practical tip 1>", ...]
    }
  ],
  "moonGuide": {
    "New Moon": "<what to do>",
    "Waxing Crescent": "<what to do>",
    "First Quarter": "<what to do>",
    "Waxing Gibbous": "<what to do>",
    "Full Moon": "<what to do>",
    "Waning Gibbous": "<what to do>",
    "Last Quarter": "<what to do>",
    "Waning Crescent": "<what to do>"
  },
  "generalTips": ["<tip 1>", ...]
}
Do not include any text outside the JSON object. ${isSwahili ? "ALL values must be in Swahili." : "Be specific, practical, and tailored to the location/season."}`;

    const userMessage = isSwahili
      ? `Tengeneza mpango wa ukuaji kwa: ${cropName}\nEneo: ${location}\nMajira ya sasa: ${season} (${hemisphere} hemisphere)\n\nJumuisha awamu 5-7 kutoka kuandaa udongo hadi kuvuna, ushauri wa mwezi kwa kila awamu, na vidokezo vya vitendo.`
      : `Create a detailed growing plan for: ${cropName}\nLocation: ${location}\nCurrent season: ${season} (${hemisphere} hemisphere)\n\nInclude 5-7 phases from soil preparation to harvest, moon phase guidance for each phase, and practical tips specific to this crop and season.`;

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
