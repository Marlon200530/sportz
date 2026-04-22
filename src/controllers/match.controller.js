import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {createMatchService, getMatchesService }from "../services/match.service.js";
import { AppError } from "../utils/errors.js";


export const createMatch = async (req, res, next) => {
    try {
        const parsed = createMatchSchema.safeParse(req.body);

        if (!parsed.success) {
            throw new AppError("Invalid payload", 400, "VALIDATION_ERROR", parsed.error.flatten());
        }

        const match = await createMatchService(parsed.data);

        req.app.locals.broadcastMatchCreated?.(match);

        res.status(201).json({
            success: true,
            message: "Match created successfully",
            data: match
        });
    } catch (error) {
        next(error);
    }
};


export const getMatches = async (req, res, next) => {
    try {
        const parsed = listMatchesQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            throw new AppError("Invalid query parameters", 400, "VALIDATION_ERROR", parsed.error.flatten());
        }

        const matchList = await getMatchesService(parsed.data.limit);

        res.status(200).json({
            success: true,
            data: matchList
        });
    } catch (error) {
        next(error);
    }
};
