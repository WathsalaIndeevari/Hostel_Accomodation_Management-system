import multer from "multer";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);

  res.status(404);

  next(error);
};

export const errorHandler = (error, req, res, next) => {
  let statusCode =
    res.statusCode === 200 ? 500 : res.statusCode;

  let message = error.message;

  if (error instanceof multer.MulterError) {
    statusCode = 400;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Receipt file cannot exceed 5 MB";
    } else {
      message = error.message;
    }
  }

  if (
    message ===
    "Only JPG, JPEG, PNG, WEBP and PDF receipts are allowed"
  ) {
    statusCode = 400;
  }

  if (error.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack:
      process.env.NODE_ENV === "production"
        ? null
        : error.stack
  });
};