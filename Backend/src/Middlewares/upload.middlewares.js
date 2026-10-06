const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

function uploadResume(req, res, next) {
  upload.single("resume")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "Resume upload failed",
        error:
          err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Use resume as the PDF file field name"
            : err.message,
      });
    }

    return res.status(400).json({
      message: "Resume upload failed",
      error: err.message,
    });
  });
}

module.exports = { uploadResume };
