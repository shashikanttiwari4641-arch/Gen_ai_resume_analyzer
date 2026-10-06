import { uploadRules } from "../state/interviewForm.state";
import { Link } from "react-router-dom";

function SectionTitle({ icon, label, badge }) {
  return (
    <div className="interview-section-title">
      <span className="interview-section-title__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      {badge && <span className="interview-section-title__badge">{badge}</span>}
    </div>
  );
}

function JobDescriptionPanel({ value, charCount, onChange }) {
  return (
    <section className="interview-panel interview-panel--job">
      <SectionTitle icon="■" label="Target Job Description" badge="Required" />

      <label className="interview-field">
        <span className="interview-field__label">Job details</span>
        <textarea
          name="jobDescription"
          value={value}
          onChange={onChange}
          maxLength={5000}
          placeholder="Paste the full job description here... e.g. Senior Frontend Engineer requires proficiency in React, TypeScript, and large-scale system design..."
        />
        <span className="interview-field__counter">{charCount}/5000 chars</span>
      </label>
    </section>
  );
}

function ResumeDropzone({
  fileInputRef,
  isDragging,
  onClick,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  selectedFileLabel,
}) {
  return (
    <div className="interview-upload">
      <div className="interview-upload__label">
        Upload Resume <span>(Best Results)</span>
      </div>

      <button
        type="button"
        className={`interview-dropzone ${
          isDragging ? "interview-dropzone--active" : ""
        }`}
        onClick={onClick}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <span className="interview-dropzone__icon" aria-hidden="true">
          ↑
        </span>
        <strong>Click to upload or drag & drop</strong>
        <small>
          {uploadRules.acceptedTypes.join(", ").toUpperCase()} ({uploadRules.maxSizeLabel})
        </small>
        <em>{selectedFileLabel}</em>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        name="resume"
        accept={uploadRules.acceptedTypes.join(",")}
        onChange={onFileChange}
        hidden
      />
    </div>
  );
}

function ProfilePanel({
  fileInputRef,
  form,
  isDragging,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  onOpenFilePicker,
  onUpdateField,
  selectedFileLabel,
}) {
  return (
    <section className="interview-panel interview-panel--profile">
      <SectionTitle icon="●" label="Your Profile" />

      <ResumeDropzone
        fileInputRef={fileInputRef}
        isDragging={isDragging}
        onClick={onOpenFilePicker}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onFileChange={onFileChange}
        selectedFileLabel={selectedFileLabel}
      />

      <div className="interview-divider">
        <span />
        <strong>OR</strong>
        <span />
      </div>

      <label className="interview-field interview-field--compact">
        <span className="interview-field__label">Quick Self-Description</span>
        <textarea
          name="selfDescription"
          value={form.selfDescription}
          onChange={onUpdateField}
          placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
        />
      </label>

      <div className="interview-note">
        <span aria-hidden="true">i</span>
        Either a Resume or a Self Description is required to generate a
        personalized plan.
      </div>
    </section>
  );
}

function formatReportDate(value) {
  if (!value) {
    return "Recently generated";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ReportHistory({ error, loading, onDeleteReport, reports }) {
  return (
    <section className="report-history" aria-label="Generated interview reports">
      <header className="report-history__header">
        <div>
          <h2>My Recent Interview Plans</h2>
          <p>{loading ? "Loading saved plans..." : `${reports.length} saved plans`}</p>
        </div>
      </header>

      {error && <p className="report-history__error">{error}</p>}

      {!loading && reports.length === 0 ? (
        <div className="report-history__empty">
          <strong>No reports yet</strong>
          <span>Your generated interview reports will appear here.</span>
        </div>
      ) : (
        <div className="report-history__list">
          {reports.map((report) => (
            <article className="report-history-card" key={report._id}>
              <Link to={`/interview/${report._id}`}>
                <span className="report-history-card__score">
                  {Math.round(report.matchScore || 0)}%
                </span>
                <span className="report-history-card__meta">
                  {formatReportDate(report.createdAt)}
                </span>
                <strong>{report.title || "Untitled interview report"}</strong>
                <small>Interview plan</small>
              </Link>

              <button
                type="button"
                onClick={() => onDeleteReport(report._id)}
                aria-label={`Delete ${report.title || "report"}`}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function InterviewHomeView({
  canSubmit,
  error,
  fileInputRef,
  form,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleFileInput,
  handleSubmit,
  isDragging,
  isSubmitting,
  jobCharCount,
  openFilePicker,
  onDeleteReport,
  reportError,
  reports,
  reportsLoading,
  selectedFileLabel,
  updateField,
}) {
  return (
    <main className="interview-page">
      <section className="interview-hero">
        <h1>
          Create Your Custom <span>Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </section>

      <form
        className={`interview-shell ${isSubmitting ? "interview-shell--loading" : ""}`}
        onSubmit={handleSubmit}
      >
        {isSubmitting && (
          <div className="interview-loading" role="status" aria-live="polite">
            <span className="interview-loading__spinner" aria-hidden="true" />
            <strong>Loading your interview plan</strong>
            <small>AI is reading the job description and your resume.</small>
          </div>
        )}

        <div className="interview-grid">
          <JobDescriptionPanel
            value={form.jobDescription}
            charCount={jobCharCount}
            onChange={updateField}
          />

          <ProfilePanel
            fileInputRef={fileInputRef}
            form={form}
            isDragging={isDragging}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFileChange={handleFileInput}
            onOpenFilePicker={openFilePicker}
            onUpdateField={updateField}
            selectedFileLabel={selectedFileLabel}
          />
        </div>

        <footer className="interview-actions">
          <p>
            {isSubmitting
              ? "Loading your interview plan"
              : error || "AI-Powered Strategy Generation • Approx 30s"}
          </p>
          <div className="interview-actions__buttons">
            <button
              className="interview-actions__button interview-actions__button--primary"
              type="submit"
              disabled={!canSubmit}
            >
              <span aria-hidden="true">✦</span>
              {isSubmitting ? "Loading your interview plan" : "Generate My Interview Strategy"}
            </button>
          </div>
        </footer>
      </form>

      <ReportHistory
        error={reportError}
        loading={reportsLoading}
        onDeleteReport={onDeleteReport}
        reports={reports}
      />
    </main>
  );
}
