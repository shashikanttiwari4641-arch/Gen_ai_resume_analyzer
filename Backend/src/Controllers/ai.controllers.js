const { PDFParse } = require("pdf-parse");
const mongoose = require("mongoose");
const generateAIReport = require("../services/ai.service");
const { generateTailoredResume } = require("../services/ai.service");
const InterviewReport = require("../models/interviewReport.model");

function buildInterviewReportPrompt({
  jobDescription,
  resumeText,
  selfDescription,
}) {
  return `
Generate an interview preparation report for the candidate.

Return only valid JSON that matches the required response schema.
Do not use a default match score. Calculate matchScore from the overlap between the job requirements and the candidate profile only.
Give a lower score when important required skills, tools, experience, or responsibilities from the job description are missing from the resume or self description.
Use the full 0-100 range: 85+ means very strong evidence, 65-84 means partial fit, below 65 means meaningful gaps.

Job Description:
${jobDescription}

Resume:
${resumeText || "No resume provided"}

Candidate Self Description:
${selfDescription || "No self description provided"}
`;
}

function buildTailoredResumePrompt({
  jobDescription,
  resumeText,
  selfDescription,
  matchScore,
  skillGaps,
}) {
  const gaps = Array.isArray(skillGaps)
    ? skillGaps.map((gap) => `${gap.skill} (${gap.severity})`).join(", ")
    : "";

  return `
Create a polished, ATS-friendly resume tailored to the job description.

Use only information present in the candidate resume or self description. Do not invent employers, degrees, dates, certifications, or metrics.
Emphasize matching skills and responsibilities from the job description.
Use the match score and skill gaps as guidance for what to emphasize or de-emphasize.
Return plain text only, no markdown.
Use these sections when possible:
Name
Professional Summary
Core Skills
Experience
Projects
Education

Job Description:
${jobDescription}

Candidate Resume:
${resumeText || "No resume provided"}

Candidate Self Description:
${selfDescription || "No self description provided"}

Match Score:
${Number.isFinite(Number(matchScore)) ? `${Math.round(matchScore)} out of 100` : "Not available"}

Skill Gaps:
${gaps || "No skill gaps provided"}
`;
}

const scoreStopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "this",
  "to",
  "with",
  "you",
  "your",
  "will",
  "we",
  "work",
  "role",
  "team",
  "job",
  "description",
  "candidate",
  "experience",
  "skills",
]);

function tokenizeForScore(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((token) =>
      token
        .trim()
        .replace(/\.js$/, "")
        .replace(/[-.]+/g, "")
    )
    .filter((token) => token.length > 2 && !scoreStopWords.has(token));
}

function calculateProfileMatchScore({ jobDescription, resumeText, selfDescription }) {
  const requirementTokens = tokenizeForScore(jobDescription);
  const profileTokens = new Set(tokenizeForScore(`${resumeText || ""} ${selfDescription || ""}`));

  if (requirementTokens.length === 0 || profileTokens.size === 0) {
    return 0;
  }

  const uniqueRequirements = [...new Set(requirementTokens)];
  const matches = uniqueRequirements.filter((token) => profileTokens.has(token)).length;
  const coverage = matches / uniqueRequirements.length;

  const profileDepth = Math.min(profileTokens.size / Math.max(uniqueRequirements.length, 1), 1);
  const score = Math.round(coverage * (82 + profileDepth * 18));

  return Math.max(0, Math.min(100, score));
}

function sanitizePdfText(value = "") {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function escapePdfString(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfLine(line, maxLength = 92) {
  const words = line.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [""];
  }

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function createResumePdfBuffer(resumeText) {
  const normalizedText = sanitizePdfText(resumeText);
  const lines = normalizedText
    .split("\n")
    .flatMap((line) => wrapPdfLine(line.trim()))
    .slice(0, 240);
  const linesPerPage = 48;
  const pages = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(["Tailored Resume"]);
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  ];

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const textLines = pageLines
      .map((line) => `(${escapePdfString(line)}) Tj T*`)
      .join("\n");
    const stream = `BT\n/F1 11 Tf\n14 TL\n54 760 Td\n${textLines}\nET`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

async function generateInterviewReport(req, res) {
  try {
    const { jobDescription, selfDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required",
      });
    }

    const resumeText = await parseResumeFile(req.file);

    const prompt = buildInterviewReportPrompt({
      jobDescription,
      resumeText,
      selfDescription,
    });

    const aiReport = await generateAIReport(prompt);
    const matchScore = calculateProfileMatchScore({
      jobDescription,
      resumeText,
      selfDescription,
    });

    const savedReport = await InterviewReport.create({
      user: req.user.id,
      jobDescription,
      resume: resumeText,
      selfDescription,
      ...aiReport,
      matchScore,
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      report: savedReport,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to generate interview report",
      error: err.message,
    });
  }
}

async function parseResumeFile(file) {
  if (!file) {
    return "";
  }

  const parser = new PDFParse({ data: file.buffer });

  try {
    const parsedPdf = await parser.getText();
    return parsedPdf.text;
  } finally {
    await parser.destroy();
  }
}

async function generateResumePdfFromReportController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid interview report id",
      });
    }

    const interviewReport = await InterviewReport.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      });
    }

    if (!interviewReport.resume && !interviewReport.selfDescription) {
      return res.status(400).json({
        message: "This report does not have resume or profile details",
      });
    }

    const resumePrompt = buildTailoredResumePrompt({
      jobDescription: interviewReport.jobDescription,
      resumeText: interviewReport.resume,
      selfDescription: interviewReport.selfDescription,
      matchScore: interviewReport.matchScore,
      skillGaps: interviewReport.skillGaps,
    });
    const tailoredResume = await generateTailoredResume(resumePrompt);
    const pdfBuffer = createResumePdfBuffer(tailoredResume);
    const filename = `${String(interviewReport.title || "tailored-resume")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tailored-resume"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to generate resume PDF",
      error: err.message,
    });
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid interview report id",
      });
    }

    const interviewReport = await InterviewReport.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      interviewReport,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to fetch interview report",
      error: err.message,
    });
  }
}

async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await InterviewReport.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -__v"
      );

    return res.status(200).json({
      message: "Interview reports fetched successfully",
      interviewReports,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to fetch interview reports",
      error: err.message,
    });
  }
}

async function deleteInterviewReportController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid interview report id",
      });
    }

    const deletedReport = await InterviewReport.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!deletedReport) {
      return res.status(404).json({
        message: "Interview report not found",
      });
    }

    return res.status(200).json({
      message: "Interview report deleted successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Failed to delete interview report",
      error: err.message,
    });
  }
}

module.exports = {
  generateResumePdfFromReportController,
  generateInterviewReport,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  deleteInterviewReportController,
};
