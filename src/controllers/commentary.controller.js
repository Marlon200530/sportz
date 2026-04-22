import { commentaryIdParamSchema, createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { AppError } from "../utils/errors.js";
import {
  createCommentaryService,
  getCommentaryByIdService,
  getCommentaryByMatchIdService,
} from "../services/commentary.service.js";

export const createMatchCommentary = async (req, res, next) => {
  try {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError("Invalid match id", 400, "VALIDATION_ERROR", parsedParams.error.flatten());
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError("Invalid payload", 400, "VALIDATION_ERROR", parsedBody.error.flatten());
    }

    const createdCommentary = await createCommentaryService(parsedParams.data.id, parsedBody.data);

    res.status(201).json({
      success: true,
      message: "Commentary created successfully",
      data: createdCommentary,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatchCommentary = async (req, res, next) => {
  try {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError("Invalid match id", 400, "VALIDATION_ERROR", parsedParams.error.flatten());
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError("Invalid query parameters", 400, "VALIDATION_ERROR", parsedQuery.error.flatten());
    }

    const commentaryList = await getCommentaryByMatchIdService(parsedParams.data.id, parsedQuery.data.limit);

    res.status(200).json({
      success: true,
      data: commentaryList,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatchCommentaryById = async (req, res, next) => {
  try {
    const parsedMatchParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedMatchParams.success) {
      throw new AppError("Invalid match id", 400, "VALIDATION_ERROR", parsedMatchParams.error.flatten());
    }

    const parsedCommentaryParams = commentaryIdParamSchema.safeParse(req.params);

    if (!parsedCommentaryParams.success) {
      throw new AppError("Invalid commentary id", 400, "VALIDATION_ERROR", parsedCommentaryParams.error.flatten());
    }

    const commentaryItem = await getCommentaryByIdService(
      parsedMatchParams.data.id,
      parsedCommentaryParams.data.commentaryId
    );

    res.status(200).json({
      success: true,
      data: commentaryItem,
    });
  } catch (error) {
    next(error);
  }
};
