import { Router } from "express";
import {getMatches, createMatch, getMatchById} from "../controllers/match.controller.js";

const router = Router();


router.route("/").get(getMatches).post(createMatch);
router.get("/:id", getMatchById);

export default router;
