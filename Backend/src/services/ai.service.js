const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

require("dotenv").config();

const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

let ai;

function getAIClient() {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("GOOGLE_GENAI_API_KEY is missing in environment variables");
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });
  }

  return ai;
}

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall resume match score out of 100."),

  technicalQuestions: z.array(
    z.object({
      question: z
        .string()
        .describe("The technical question can be asked in the interview"),

      intention: z
        .string()
        .describe("The intention of interviewer behind asking this question"),

      answer: z
        .string()
        .describe(
          "How to answer this question, what points to cover, what approach to follow and what mistakes to avoid"
        ),
    })
  ).describe(
    "Technical interview questions that can be asked along with their intention and ideal answers."
  ),

  behavioralQuestions: z.array(
    z.object({
      question: z
        .string()
        .describe("The behavioral question that can be asked in the interview"),

      intention: z
        .string()
        .describe("The intention of interviewer behind asking this question"),

      answer: z
        .string()
        .describe(
          "How to answer this behavioral question using STAR or a similar structured approach"
        ),
    })
  ).describe(
    "Behavioral interview questions along with their intention and ideal answers."
  ),

  skillGaps: z.array(
    z.object({
      skill: z
        .string()
        .describe("The skill which the candidate is lacking"),

      severity: z
        .enum(["low", "medium", "high"])
        .describe("Severity of the missing skill"),
    })
  ).describe(
    "List of skill gaps in the candidate's profile along with their severity."
  ),

  preparationPlan: z.array(
    z.object({
      day: z
        .number()
        .describe("The day number in the preparation plan"),

      focus: z
        .string()
        .describe("The main focus of this day's preparation"),

      tasks: z
        .array(z.string())
        .describe("List of tasks to complete on this day"),
    })
  ).describe(
    "A day-wise preparation plan for the candidate to prepare for the interview."
  ),
  title: z.string().describe("The title of the job for which the interview report is generated"),
});

const interviewReportJsonSchema = z.toJSONSchema(interviewReportSchema);

function parseProviderError(err) {
  if (!err?.message) {
    return null;
  }

  try {
    return JSON.parse(err.message);
  } catch {
    return null;
  }
}

function getAIErrorMessage(err) {
  const providerError = parseProviderError(err);
  const status = providerError?.error?.status;
  const code = providerError?.error?.code;

  if (status === "RESOURCE_EXHAUSTED" || code === 429) {
    return "Gemini API quota exceeded for this project. Please wait for quota reset, switch GEMINI_MODEL, or enable billing/add quota in Google AI Studio.";
  }

  if (providerError?.error?.message) {
    return providerError.error.message;
  }

  return err.message || "Gemini failed to generate the interview report";
}

async function generateInterviewReport(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("generateInterviewReport requires a non-empty prompt string");
  }

  let response;

  try {
    response = await getAIClient().models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      contents: prompt,

      config: {
        responseMimeType: "application/json",
        responseJsonSchema: interviewReportJsonSchema,
      },
    });
  } catch (err) {
    throw new Error(getAIErrorMessage(err), { cause: err });
  }

  if (!response.text) {
    throw new Error("Gemini returned an empty response");
  }

  const report = JSON.parse(response.text);
  return interviewReportSchema.parse(report);
}

async function generateTailoredResume(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("generateTailoredResume requires a non-empty prompt string");
  }

  let response;

  try {
    response = await getAIClient().models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      contents: prompt,
    });
  } catch (err) {
    throw new Error(getAIErrorMessage(err), { cause: err });
  }

  if (!response.text) {
    throw new Error("Gemini returned an empty resume response");
  }

  return response.text;
}

module.exports = generateInterviewReport;
module.exports.generateTailoredResume = generateTailoredResume;
