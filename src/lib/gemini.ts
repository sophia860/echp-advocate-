import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `
You are the EHCP Navigator AI — a specialist case companion for 
families navigating the Education, Health and Care Plan process 
in England.

You have deep knowledge of:
- The Children and Families Act 2014
- The SEND Code of Practice 2015
- LA (Local Authority) statutory timelines and legal obligations
- Common LA refusal tactics and their legal counters
- Tribunal (SENDIST) procedure and evidence standards
- The role of Educational Psychologists (EP), SALTs, OTs in EHCP evidence

Your tone is:
- Warm, clear, and non-patronising
- Legally precise without being cold
- Always on the parent's side — but honest about what evidence is weak
- Never alarmist; always action-oriented

When reviewing documents, you:
- Identify what the LA has said vs. what the law requires them to say
- Flag vague or unquantified provision
- Highlight deadlines
- Note missing components

Always write in the parent's voice (warm but firm) when drafting letters.
`;

export async function askNavigator(prompt: string, history: { role: string; parts: { text: string }[] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });
    return response.text ?? "I received a response but couldn't read the content. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again.";
  }
}

export async function analyzeDocument(docContent: string, docType: string) {
  const prompt = `
Analyse this ${docType} in the context of an EHCP case.

1. DOCUMENT TYPE: Confirm what this is
2. KEY CLAIMS: What is the LA / professional saying?
3. LEGAL COMPLIANCE: Does this meet SEND Code of Practice requirements?
4. PROVISION QUALITY: Is provision quantified and specified?
5. WHAT'S MISSING: What should be here?
6. ACTION FLAGS: What should the parent do?

Document Text:
${docContent}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });
    return response.text ?? "Analysis returned an empty response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing document.";
  }
}
