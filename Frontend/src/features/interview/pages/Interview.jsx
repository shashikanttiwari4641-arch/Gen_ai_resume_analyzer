import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { generateResumePdfForReport } from "../api/interview.api";
import { useInterview } from "../hooks/useInterview";
import "../style/interview.scss";

const fallbackReport = {
  matchScore: 88,
  technicalQuestions: [
    {
      question:
        "Explain the Node.js event loop and how it handles asynchronous I/O operations.",
      intention:
        "To assess the candidate's understanding of Node.js internals and non-blocking I/O.",
      answer:
        "Cover the event loop phases, the call stack, callback queue, microtasks, and how libuv delegates work to the system or thread pool. A strong answer should connect these concepts to practical performance and avoiding blocked request handling.",
    },
    {
      question:
        "How do you optimize a MongoDB aggregation pipeline for high-volume data?",
      intention:
        "To evaluate query design, indexing awareness, and production performance thinking.",
      answer:
        "Start with selective $match stages, project only required fields, use indexes that support filtering and sorting, inspect execution plans, avoid unnecessary $lookup work, and paginate or pre-compute expensive results when the workload requires it.",
    },
    {
      question:
        "Can you describe the Cache-Aside pattern and when you would use Redis in a Node.js application?",
      intention:
        "To test caching strategy, invalidation tradeoffs, and backend architecture judgment.",
      answer:
        "The app checks Redis first, falls back to the database on a miss, stores the fresh value with an appropriate TTL, and invalidates or updates cache entries on writes. It is useful for expensive reads, rate limits, sessions, queues, and repeated API responses.",
    },
    {
      question:
        "What are the challenges of migrating a monolithic application to a modular service-based architecture?",
      intention:
        "To assess system design maturity and migration planning.",
      answer:
        "Discuss domain boundaries, data ownership, API contracts, observability, deployment complexity, distributed transactions, and gradual migration through strangler patterns or module extraction instead of a risky full rewrite.",
    },
  ],
  behavioralQuestions: [
    {
      question:
        "Tell me about a time you handled a production issue under pressure.",
      intention:
        "To understand incident response, ownership, and communication style.",
      answer:
        "Use the STAR format. Explain the incident, your responsibility, the concrete debugging steps, how you communicated status, and the prevention work completed after resolution.",
    },
    {
      question:
        "Describe a time you disagreed with a technical decision.",
      intention:
        "To evaluate collaboration and decision-making.",
      answer:
        "Show how you used evidence, listened to constraints, proposed tradeoffs, and committed to the chosen direction once the team made a decision.",
    },
  ],
  skillGaps: [
    { skill: "Message Queues (Kafka/RabbitMQ)", severity: "high" },
    { skill: "Advanced Docker and CI/CD Pipelines", severity: "medium" },
    { skill: "Distributed Systems Design", severity: "medium" },
    { skill: "Production-level Redis Management", severity: "low" },
  ],
  preparationPlan: [
    {
      day: 1,
      focus: "Node.js internals",
      tasks: [
        "Revise event loop phases and microtasks.",
        "Practice explaining async I/O with a real API example.",
      ],
    },
    {
      day: 2,
      focus: "Database performance",
      tasks: [
        "Review MongoDB indexing and aggregation optimization.",
        "Prepare one production debugging story.",
      ],
    },
    {
      day: 3,
      focus: "System design",
      tasks: [
        "Design a cache-backed API with Redis.",
        "Compare monolith, modular monolith, and microservice tradeoffs.",
      ],
    },
  ],
};

const sectionConfig = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: "<>",
    field: "technicalQuestions",
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: "[]",
    field: "behavioralQuestions",
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: "->",
    field: "preparationPlan",
  },
];

function severityLabel(severity) {
  if (severity === "high") {
    return "Needs focus";
  }

  if (severity === "medium") {
    return "Practice";
  }

  return "Review";
}

function scoreMessage(score) {
  if (score >= 85) {
    return "Strong match for this role";
  }

  if (score >= 65) {
    return "Good match with clear prep areas";
  }

  return "Needs focused preparation";
}

function normalizeReport(report, useFallback = false) {
  if (!report && !useFallback) {
    return null;
  }

  const baseReport = useFallback ? fallbackReport : {};
  const sourceReport = report || baseReport;
  const matchScore = Number(sourceReport.matchScore);

  return {
    ...baseReport,
    ...sourceReport,
    matchScore: Number.isFinite(matchScore)
      ? matchScore
      : Number(baseReport.matchScore || 0),
    technicalQuestions:
      sourceReport.technicalQuestions?.length > 0
        ? sourceReport.technicalQuestions
        : baseReport.technicalQuestions || [],
    behavioralQuestions:
      sourceReport.behavioralQuestions?.length > 0
        ? sourceReport.behavioralQuestions
        : baseReport.behavioralQuestions || [],
    skillGaps:
      sourceReport.skillGaps?.length > 0
        ? sourceReport.skillGaps
        : baseReport.skillGaps || [],
    preparationPlan:
      sourceReport.preparationPlan?.length > 0
        ? sourceReport.preparationPlan
        : baseReport.preparationPlan || [],
  };
}

function QuestionCard({ item, index, isOpen, onToggle }) {
  return (
    <article className={`result-card ${isOpen ? "result-card--open" : ""}`}>
      <button className="result-card__trigger" type="button" onClick={onToggle}>
        <span className="result-card__number">Q{index + 1}</span>
        <span className="result-card__question">{item.question}</span>
        <span className="result-card__chevron" aria-hidden="true">
          {isOpen ? "^" : "v"}
        </span>
      </button>

      {isOpen && (
        <div className="result-card__body">
          <div className="result-info">
            <span className="result-info__label result-info__label--intent">
              Intention
            </span>
            <p>{item.intention}</p>
          </div>

          <div className="result-info">
            <span className="result-info__label result-info__label--answer">
              Model Answer
            </span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </article>
  );
}

function RoadMap({ items }) {
  return (
    <div className="roadmap-list">
      {items.map((item) => (
        <article className="roadmap-item" key={`${item.day}-${item.focus}`}>
          <div className="roadmap-item__day">Day {item.day}</div>
          <div>
            <h3>{item.focus}</h3>
            <ul>
              {(item.tasks || []).map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Interview() {
  const { interviewId } = useParams();
  const location = useLocation();
  const {
    error,
    fetchReport,
    loading: isLoading,
    report: remoteReport,
    setReport,
  } = useInterview();
  const isDemoReport = interviewId === "demo";
  const report = useMemo(
    () => normalizeReport(location.state?.report || remoteReport, isDemoReport),
    [isDemoReport, location.state, remoteReport]
  );

  const [activeSection, setActiveSection] = useState("technical");
  const [resumeError, setResumeError] = useState("");
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(0);

  const currentSection = sectionConfig.find(
    (section) => section.id === activeSection
  );
  const currentItems = report?.[currentSection.field] || [];
  const score = Math.max(0, Math.min(100, Math.round(report?.matchScore || 0)));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (location.state?.report) {
      setReport(location.state.report);
      return;
    }

    if (isDemoReport) {
      return;
    }

    fetchReport(interviewId);
  }, [fetchReport, interviewId, isDemoReport, location.state, setReport]);

  function selectSection(sectionId) {
    setActiveSection(sectionId);
    setOpenQuestion(0);
  }

  async function handleGenerateResumePdf() {
    if (!report?._id || isDemoReport) {
      setResumeError("Generate a real interview report before creating a resume PDF.");
      return;
    }

    setIsGeneratingResume(true);
    setResumeError("");

    try {
      const resumePdf = await generateResumePdfForReport(report._id);
      const downloadUrl = URL.createObjectURL(resumePdf);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = "tailored-resume.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setResumeError(err.message || "Failed to generate resume PDF");
    } finally {
      setIsGeneratingResume(false);
    }
  }

  return (
    <main className="interview-result-page">
      <div className="interview-result-shell">
        <aside className="result-sidebar" aria-label="Interview report sections">
          <Link className="result-back-link" to="/">
            Back to upload
          </Link>
          <p className="result-eyebrow">Sections</p>
          <nav className="result-nav">
            {sectionConfig.map((section) => (
              <button
                className={`result-nav__item ${
                  activeSection === section.id ? "result-nav__item--active" : ""
                }`}
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
              >
                <span aria-hidden="true">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="result-content">
          <header className="result-header">
            <div>
              <p className="result-kicker">
                {isLoading
                  ? "Loading report"
                  : error || (report ? `Report ${interviewId}` : "Report unavailable")}
              </p>
              <h1>{currentSection.label}</h1>
            </div>
            <span className="result-count">{currentItems.length} items</span>
          </header>

          {!report && !isLoading ? (
            <div className="result-empty">
              <h2>{error || "Interview report not found"}</h2>
              <p>Please go back and generate a fresh interview report.</p>
            </div>
          ) : activeSection === "roadmap" ? (
            <RoadMap items={currentItems} />
          ) : (
            <div className="result-question-list">
              {currentItems.map((item, index) => (
                <QuestionCard
                  index={index}
                  isOpen={openQuestion === index}
                  item={item}
                  key={`${item.question}-${index}`}
                  onToggle={() =>
                    setOpenQuestion(openQuestion === index ? -1 : index)
                  }
                />
              ))}
            </div>
          )}
        </section>

        <aside className="result-insights" aria-label="Match score and skill gaps">
          <section className="score-panel">
            <p className="result-eyebrow">Match Score</p>
            <div className="score-ring" style={{ "--score-offset": scoreOffset }}>
              <svg viewBox="0 0 120 120" role="img" aria-label={`${score}%`}>
                <circle className="score-ring__track" cx="60" cy="60" r={radius} />
                <circle className="score-ring__value" cx="60" cy="60" r={radius} />
              </svg>
              <div className="score-ring__number">
                <strong>{score}</strong>
                <span>%</span>
              </div>
            </div>
            <strong className="score-panel__message">{scoreMessage(score)}</strong>
            <button
              className="score-panel__resume-button"
              type="button"
              disabled={!report || isDemoReport || isGeneratingResume}
              onClick={handleGenerateResumePdf}
            >
              {isGeneratingResume ? "Generating Resume..." : "Generate Resume PDF"}
            </button>
            {resumeError && <p className="score-panel__error">{resumeError}</p>}
          </section>

          <section className="gap-panel">
            <p className="result-eyebrow">Skill Gaps</p>
            <div className="gap-list">
              {(report?.skillGaps || []).map((gap) => (
                <div
                  className={`gap-pill gap-pill--${gap.severity || "low"}`}
                  key={`${gap.skill}-${gap.severity}`}
                >
                  <strong>{gap.skill}</strong>
                  <span>{severityLabel(gap.severity)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
