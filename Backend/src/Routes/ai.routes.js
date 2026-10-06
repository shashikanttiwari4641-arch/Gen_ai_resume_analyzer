const express = require("express");
const aiController = require("../Controllers/ai.controllers");
const authMiddlewares = require("../Middlewares/auth.middlewares");
const uploadMiddlewares = require("../Middlewares/upload.middlewares");

const aiRouter = express.Router();

aiRouter.post(
  "/interview-report",
  authMiddlewares.authUser,
  uploadMiddlewares.uploadResume,
  aiController.generateInterviewReport
);

aiRouter.post(
  "/interview-report/:id/resume-pdf",
  authMiddlewares.authUser,
  aiController.generateResumePdfFromReportController
);

aiRouter.get(
  "/interview-report",
  authMiddlewares.authUser,
  aiController.getAllInterviewReportsController
);

aiRouter.get(
  "/interview-report/:id",
  authMiddlewares.authUser,
  aiController.getInterviewReportByIdController
);

aiRouter.delete(
  "/interview-report/:id",
  authMiddlewares.authUser,
  aiController.deleteInterviewReportController
);

module.exports = aiRouter;
