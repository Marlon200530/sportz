import { Router } from "express";
import { createMatchCommentary, getMatchCommentary, getMatchCommentaryById } from "../controllers/commentary.controller.js";

const router = Router({ mergeParams: true });

router.route("/").get(getMatchCommentary).post(createMatchCommentary);
router.get("/:commentaryId", getMatchCommentaryById);

export default router;
