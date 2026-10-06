import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const interviewReportPath = "/api/ai/interview-report";

function getErrorPayload(err, fallbackMessage) {
  const payload = err.response?.data;

  if (payload) {
    return {
      ...payload,
      message: payload.error || payload.message || fallbackMessage,
    };
  }

  return { message: err.message || fallbackMessage };
}

function buildInterviewFormData({
  jobDescription,
  selfDescription = "",
  resumeFile,
  resume,
}) {
  const formData = new FormData();

  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);

  const selectedResume = resumeFile || resume;

  if (selectedResume) {
    formData.append("resume", selectedResume);
  }

  return formData;
}

export async function createInterviewReport(formData) {
  try {
    const response = await api.post(interviewReportPath, formData);
    return response.data;
  } catch (err) {
    throw getErrorPayload(err, "Failed to generate interview report");
  }
}

export async function generateInterviewReport(reportInput) {
  const formData = buildInterviewFormData(reportInput);
  return createInterviewReport(formData);
}

export async function generateResumePdfForReport(interviewId) {
  try {
    const response = await api.post(`${interviewReportPath}/${interviewId}/resume-pdf`, null, {
      responseType: "blob",
    });
    return response.data;
  } catch (err) {
    throw getErrorPayload(err, "Failed to generate resume PDF");
  }
}

export async function getAllInterviewReports() {
  try {
    const response = await api.get(interviewReportPath);
    return response.data;
  } catch (err) {
    throw getErrorPayload(err, "Failed to fetch interview reports");
  }
}

export async function getInterviewReportById(interviewId) {
  try {
    const response = await api.get(`${interviewReportPath}/${interviewId}`);
    return response.data;
  } catch (err) {
    throw getErrorPayload(err, "Failed to fetch interview report");
  }
}

export async function deleteInterviewReport(interviewId) {
  try {
    const response = await api.delete(`${interviewReportPath}/${interviewId}`);
    return response.data;
  } catch (err) {
    throw getErrorPayload(err, "Failed to delete interview report");
  }
}

export default api;
