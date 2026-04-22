import {createMatch, getMatches } from "../repositories/match.repository.js";
import { getMatchStatus } from "../utils/match-status.js";
import { AppError } from "../utils/errors.js";


export const createMatchService = async (data) => {
    const homeTeam = data.homeTeam.trim();
    const awayTeam = data.awayTeam.trim();

    if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
        throw new AppError(
            "homeTeam and awayTeam must be different",
            422,
            "INVALID_MATCH_TEAMS"
        );
    }

    const status = getMatchStatus(data.startTime, data.endTime);

    if (!status) {
        throw new AppError("Invalid match dates", 400, "INVALID_MATCH_DATES");
    }

    const match = await createMatch({
        ...data,
        sport: data.sport.trim(),
        homeTeam,
        awayTeam,
        status,
    });

    return match;
}

export const getMatchesService = async (limit) => {
    return await getMatches(limit ?? 20);
}
