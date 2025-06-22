// routes/quotes.js
import express from "express";
import { getQuote, updateQuote } from "../controllers/quoteController.js";

const router = express.Router();

router.get("/", getQuote);
router.post("/edit", updateQuote);

export default router;
