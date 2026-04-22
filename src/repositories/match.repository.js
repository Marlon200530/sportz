import {db} from "../db/index.js";
import {matches} from "../db/schema.js";
import {desc} from "drizzle-orm";


export const createMatch = async (data) => {
    const [event] =  await db.insert(matches).values({
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        homeScore: data.homeScore ?? 0,
        awayScore: data.awayScore ?? 0,
        status: data.status
    }).returning();

    return event;
};

export const getMatches = async (limit) => {
    const data = await db
        .select()
        .from(matches)
        .orderBy(desc(matches.createdAt))
        .limit(limit);
    return data;
};
