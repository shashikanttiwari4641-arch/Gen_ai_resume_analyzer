import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initialInterviewForm } from "../state/interviewForm.state";
import { useInterview } from "./useInterview";

export function useInterviewForm() {
  const navigate = useNavigate();
  const { generateReport } = useInterview();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialInterviewForm);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const jobCharCount = form.jobDescription.length;
  const hasProfile = Boolean(form.resume || form.selfDescription.trim());
  const canSubmit = Boolean(form.jobDescription.trim() && hasProfile && !isSubmitting);

  const selectedFileLabel = useMemo(() => {
    if (!form.resume) {
      return "No file selected";
    }

    return form.resume.name;
  }, [form.resume]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function selectFile(file) {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF resume.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be 5MB or smaller.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError("");
    setForm((currentForm) => ({
      ...currentForm,
      resume: file,
    }));
  }

  function handleFileInput(event) {
    selectFile(event.target.files?.[0]);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const report = await generateReport({
        jobDescription: form.jobDescription,
        selfDescription: form.selfDescription,
        resumeFile: form.resume,
      });

      if (!report) {
        setError("Failed to generate interview report");
        return;
      }

      navigate(`/interview/${report._id}`, {
        state: { report },
      });
    } catch (err) {
      setError(err.message || "Failed to generate interview report");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
    selectedFileLabel,
    updateField,
  };
}
