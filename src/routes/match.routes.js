import { Router } from "express";
import {getMatches, createMatch} from "../controllers/match.controller.js";

const router = Router();


router.route("/").get(getMatches).post(createMatch);

export default router;
