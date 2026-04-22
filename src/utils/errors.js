export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const errorHandler = (error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Malformed JSON body",
      code: "MALFORMED_JSON",
    });
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational === true;

  if (!isOperational) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: isOperational ? error.message : "Internal server error",
    code: isOperational ? error.code : "INTERNAL_ERROR",
    details: isOperational ? error.details : undefined,
  });
};
