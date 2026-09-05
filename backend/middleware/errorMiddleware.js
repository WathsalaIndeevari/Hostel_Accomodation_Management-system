export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);

  res.status(404);

  next(error);
};

export const errorHandler = (error, req, res, next) => {
  let statusCode = res.statusCode;

  if (statusCode === 200) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    stack:
      process.env.NODE_ENV === "production"
        ? null
        : error.stack
  });
};