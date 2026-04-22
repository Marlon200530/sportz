import * as dotenv from "dotenv";
import arcjet, { shield, tokenBucket } from "@arcjet/node";

dotenv.config();

const ARCJET_MODE = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";
const ARCJET_REQUESTED_TOKENS = 1;
const ARCJET_FAIL_OPEN = process.env.ARCJET_FAIL_OPEN === "true" || process.env.ARCJET_ENV === "development";

const arcjetKey = process.env.ARCJET_KEY;
let missingKeyWarningLogged = false;

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({ mode: ARCJET_MODE }),
        tokenBucket({
          mode: ARCJET_MODE,
          refillRate: 20,
          interval: "1m",
          capacity: 40,
        }),
      ],
    })
  : null;

const getDeniedResponse = (decision) => {
  if (decision.reason.isRateLimit()) {
    return {
      statusCode: 429,
      code: "RATE_LIMITED",
      error: "Too many requests",
    };
  }

  return {
    statusCode: 403,
    code: "FORBIDDEN",
    error: "Forbidden",
  };
};

export const protectWithArcjet = async (request, requested = ARCJET_REQUESTED_TOKENS) => {
  if (!aj) {
    if (!missingKeyWarningLogged) {
      console.error("ARCJET_KEY is not configured. Arcjet protection is disabled.");
      missingKeyWarningLogged = true;
    }

    // Fail closed in production when Arcjet key is missing
    if (process.env.NODE_ENV === "production" || ARCJET_MODE === "LIVE") {
      return {
        allowed: false,
        statusCode: 503,
        code: "SECURITY_UNAVAILABLE",
        error: "Security protection unavailable",
      };
    }

    return { allowed: true };
  }

  const decision = await aj.protect(request, { requested });

  if (!decision.isDenied()) {
    return { allowed: true, decision };
  }

  return {
    allowed: false,
    decision,
    ...getDeniedResponse(decision),
  };
};

export const arcjetHttpMiddleware = async (req, res, next) => {
  try {
    const result = await protectWithArcjet(req);

    if (result.allowed) {
      return next();
    }

    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      code: result.code,
    });
  } catch (error) {
    console.error("Arcjet HTTP protection failed:", error);

    if (ARCJET_FAIL_OPEN) {
      return next();
    }

    return res.status(503).json({
      success: false,
      error: "Security protection unavailable",
      code: "SECURITY_UNAVAILABLE",
    });
  }
};

export const shouldFailOpenArcjet = () => ARCJET_FAIL_OPEN;