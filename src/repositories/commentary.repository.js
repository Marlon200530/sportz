import { db } from "../db/index.js";
import { commentary } from "../db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { AppError } from "../utils/errors.js";

export const createCommentary = async (data) => {
  try {
    const [createdCommentary] = await db
      .insert(commentary)
      .values({
        ...data,
        tags: JSON.stringify(data.tags ?? []),
      })
      .returning();

    return createdCommentary;
  } catch (error) {
    if (error.code === "23503") {
      throw new AppError("Match not found", 404, "MATCH_NOT_FOUND");
    }

    throw error;
  }
};

export const listCommentaryByMatchId = async (matchId, limit) => {
  return await db
    .select()
    .from(commentary)
    .where(eq(commentary.matchId, matchId))
    .orderBy(desc(commentary.createdAt))
    .limit(limit);
};

export const getCommentaryById = async (matchId, commentaryId) => {
  const [commentaryItem] = await db
    .select()
    .from(commentary)
    .where(and(eq(commentary.matchId, matchId), eq(commentary.id, commentaryId)))
    .limit(1);

  return commentaryItem;
};
