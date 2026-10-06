import "../style/home.scss";
import { useInterviewForm } from "../hooks/useInterviewForm";
import { useEffect } from "react";
import { useInterview } from "../hooks/useInterview";
import InterviewHomeView from "../ui/InterviewHomeView";

export default function Home() {
  const interviewForm = useInterviewForm();
  const { error, fetchReports, loading, removeReport, reports } = useInterview();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <InterviewHomeView
      {...interviewForm}
      reportError={error}
      reports={reports}
      reportsLoading={loading}
      onDeleteReport={removeReport}
    />
  );
}
