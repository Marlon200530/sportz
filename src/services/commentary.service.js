import {
  createCommentary,
  getCommentaryById,
  listCommentaryByMatchId,
} from "../repositories/commentary.repository.js";
import { getMatchById } from "../repositories/match.repository.js";
import { AppError } from "../utils/errors.js";

const MAX_LIMIT = 100;

const parseTags = (tags) => {
  if (!tags) return [];

  try {
    const parsedTags = JSON.parse(tags);
    return Array.isArray(parsedTags) ? parsedTags : [];
  } catch {
    return tags.split(",").filter(Boolean);
  }
};

const formatCommentary = (commentary) => {
  if (!commentary) return commentary;

  return {
    ...commentary,
    tags: parseTags(commentary.tags),
  };
};

const assertMatchExists = async (matchId) => {
  const match = await getMatchById(matchId);

  if (!match) {
    throw new AppError("Match not found", 404, "MATCH_NOT_FOUND");
  }
};

export const createCommentaryService = async (matchId, data) => {
  await assertMatchExists(matchId);

  const createdCommentary = await createCommentary({
    ...data,
    matchId,
  });

  return formatCommentary(createdCommentary);
};

export const getCommentaryByMatchIdService = async (matchId, limit) => {
  await assertMatchExists(matchId);

  const commentaryList = await listCommentaryByMatchId(matchId, Math.min(limit ?? MAX_LIMIT, MAX_LIMIT));

  return commentaryList.map(formatCommentary);
};

export const getCommentaryByIdService = async (matchId, commentaryId) => {
  await assertMatchExists(matchId);

  const commentary = await getCommentaryById(matchId, commentaryId);

  if (!commentary) {
    throw new AppError("Commentary not found", 404, "COMMENTARY_NOT_FOUND");
  }

  return formatCommentary(commentary);
};
