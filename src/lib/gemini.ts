import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features may not work.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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

export async function scanProvision(docContent: string) {
  const prompt = `
    Focus ONLY on Section F (Provision) of this EHCP draft.
    Identify all instances of non-statutory "vague wording".
    
    Vague wording includes phrases like:
    - "would benefit from"
    - "opportunities for"
    - "as appropriate"
    - "regular"
    - "as required"
    - "access to"
    - "where possible"
    
    For each instance found:
    1. QUOTE the vague phrase.
    2. EXPLAIN why it is legally weak (non-quantified/non-specified).
    3. SUGGEST a statutory replacement that is specific and quantified.
    
    Document Text:
    ${docContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });
    return response.text ?? "No vague wording identified in this section.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error scanning provision.";
  }
}

export async function getNextSteps(appCase: any) {
  const prompt = `
    Based on the following case data, suggest the top 3 high-priority "Next Steps" for the parent.
    
    Child: ${appCase.childName} (${appCase.age} years old)
    LA: ${appCase.laName}
    Current Stage: ${appCase.currentStage}
    Next Deadline: ${appCase.nextDeadline} (${appCase.deadlineLabel})
    Documents: ${appCase.docs.length} uploaded
    Communications: ${appCase.comms.length} records
    
    Consider the statutory timelines in the SEND Code of Practice.
    If they are near a deadline, flag it.
    If they just received a draft, suggest reviewing Section F.
    If they are at "Pre-request", suggest gathering EP evidence.
    
    Format the response as 3 clear, actionable bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });
    return response.text ?? "Continue monitoring timelines and gathering evidence.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Review your case dashboard for current deadlines.";
  }
}
