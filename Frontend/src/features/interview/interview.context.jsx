import { useCallback, useMemo, useState } from "react";
import {
  deleteInterviewReport,
  generateInterviewReport,
  getAllInterviewReports,
  getInterviewReportById,
} from "./api/interview.api";
import { InterviewContext } from "./interview-context";

export function InterviewProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const generateReport = useCallback(async (reportInput) => {
    setLoading(true);
    setError("");

    try {
      const data = await generateInterviewReport(reportInput);
      const generatedReport = data.report || data.interviewReport;

      setReport(generatedReport);
      setReports((currentReports) =>
        generatedReport
          ? [generatedReport, ...currentReports.filter((item) => item._id !== generatedReport._id)]
          : currentReports
      );
      return generatedReport;
    } catch (err) {
      const message = err.message || "Failed to generate interview report";
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async (interviewId) => {
    if (!interviewId || interviewId === "demo") {
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getInterviewReportById(interviewId);
      const fetchedReport = data.interviewReport || data.report;

      setReport(fetchedReport);
      return fetchedReport;
    } catch (err) {
      setError(err.message || "Failed to fetch interview report");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllInterviewReports();
      const fetchedReports = data.interviewReports || data.reports || [];

      setReports(fetchedReports);
      return fetchedReports;
    } catch (err) {
      setError(err.message || "Failed to fetch interview reports");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const removeReport = useCallback(async (interviewId) => {
    setLoading(true);
    setError("");

    try {
      await deleteInterviewReport(interviewId);

      setReports((currentReports) =>
        currentReports.filter((currentReport) => currentReport._id !== interviewId)
      );

      setReport((currentReport) =>
        currentReport?._id === interviewId ? null : currentReport
      );

      return true;
    } catch (err) {
      setError(err.message || "Failed to delete interview report");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      error,
      fetchReport,
      fetchReports,
      generateReport,
      loading,
      removeReport,
      report,
      reports,
      setError,
      setLoading,
      setReport,
      setReports,
    }),
    [
      error,
      fetchReport,
      fetchReports,
      generateReport,
      loading,
      removeReport,
      report,
      reports,
    ]
  );

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}
