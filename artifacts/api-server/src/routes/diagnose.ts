import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.post("/diagnose", async (req, res) => {
  try {
    const { imageBase64, description, subjectType, cropType, livestockType } = req.body as {
      imageBase64?: string;
      description: string;
      subjectType: "crop" | "livestock";
      cropType?: string;
      livestockType?: string;
    };

    if (!subjectType) {
      res.status(400).json({ error: "subjectType is required" });
      return;
    }

    const subjectLabel = subjectType === "crop"
      ? `crop${cropType ? ` (${cropType})` : ""}`
      : `livestock${livestockType ? ` (${livestockType})` : ""}`;

    const { lang = "en" } = req.body as { lang?: string };
    const isSwahili = lang === "sw";
    const isFrench = lang === "fr";
    const isAmharic = lang === "am";

    const langInstruction = isSwahili
      ? "IMPORTANT: Respond ENTIRELY in Swahili (Kiswahili). All fields in the JSON must be in Swahili."
      : isFrench
      ? "IMPORTANT: Respond ENTIRELY in French. All fields in the JSON must be in French."
      : isAmharic
      ? "IMPORTANT: Respond ENTIRELY in Amharic (አማርኛ). All fields in the JSON must be in Amharic."
      : "You analyze descriptions and images to identify diseases, pests, nutritional deficiencies, or health conditions.";

    const systemPrompt = `You are Farmguard AI, an expert agricultural diagnostician helping farmers identify issues with their ${subjectType === "crop" ? "crops" : "livestock"}.

${langInstruction}

Always respond with a valid JSON object in exactly this format:
{
  "condition": "Name of the condition or disease",
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": "low" | "medium" | "high",
  "summary": "Brief 1-2 sentence explanation of the diagnosis",
  "symptoms": ["symptom 1", "symptom 2", ...],
  "causes": ["cause 1", "cause 2", ...],
  "treatments": ["treatment step 1", "treatment step 2", ...],
  "prevention": ["prevention tip 1", "prevention tip 2", ...],
  "urgency": "Brief urgency statement for the farmer"
}
Do not include any text outside the JSON object.`;

    const userContent: Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"] = [];

    if (imageBase64) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: imageBase64,
        },
      });
    }

    const userMessage = isSwahili
      ? `Tafadhali chunguza shida hii ya ${subjectLabel}.\n\nMaelezo ya mkulima: ${description}`
      : isFrench
      ? `Veuillez diagnostiquer ce problème de ${subjectLabel}.\n\nDescription de l'agriculteur: ${description}`
      : `Please diagnose this ${subjectLabel} issue.\n\nFarmer's description: ${description}`;

    userContent.push({ type: "text", text: userMessage });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanText = responseText
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let diagnosisResult;
    try {
      diagnosisResult = JSON.parse(cleanText);
    } catch {
      diagnosisResult = {
        condition: "Unable to diagnose",
        severity: "medium" as const,
        confidence: "low" as const,
        summary: responseText || "Could not parse diagnosis. Please try again with a clearer description or image.",
        symptoms: [],
        causes: ["Insufficient information provided"],
        treatments: ["Consult a local agricultural extension officer"],
        prevention: ["Monitor your crops/livestock regularly"],
        urgency: "Please provide more details for an accurate diagnosis.",
      };
    }

    res.json(diagnosisResult);
  } catch (err) {
    req.log.error({ err }, "Diagnose error");
    res.status(500).json({ error: "Failed to diagnose. Please try again." });
  }
});

router.post("/diagnose/followup", async (req, res) => {
  try {
    const { message, diagnosisContext, lang = "en" } = req.body as {
      message: string;
      diagnosisContext: {
        condition: string;
        summary: string;
        subjectType: string;
        treatments: string[];
        causes: string[];
        severity: string;
      };
      lang?: string;
    };

    if (!message || !diagnosisContext) {
      res.status(400).json({ error: "message and diagnosisContext required" });
      return;
    }

    const isFrench = lang === "fr";
    const isSwahili = lang === "sw";
    const isAmharic = lang === "am";

    const langInstruction = isSwahili
      ? "IMPORTANT: Respond entirely in Swahili."
      : isFrench
      ? "IMPORTANT: Respond entirely in French."
      : isAmharic
      ? "IMPORTANT: Respond entirely in Amharic (አማርኛ)."
      : "";

    const systemPrompt = `You are Farmguard AI, an expert agricultural advisor. A farmer has received a diagnosis and has a follow-up question. Answer helpfully, practically, and concisely.

Context of their diagnosis:
- Condition: ${diagnosisContext.condition}
- Summary: ${diagnosisContext.summary}
- Subject: ${diagnosisContext.subjectType}
- Severity: ${diagnosisContext.severity}
- Recommended treatments: ${diagnosisContext.treatments.join("; ")}
- Causes: ${diagnosisContext.causes.join("; ")}

${langInstruction}

Keep your answer practical and actionable. Use plain language a farmer can understand. 2-4 sentences max unless a detailed explanation is needed.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Followup error");
    res.status(500).json({ error: "Failed to get answer. Please try again." });
  }
});

export default router;
