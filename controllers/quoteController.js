// controllers/quoteController.js
import db from "../db/index.js";

export async function getQuote(req, res) {
  try {
    const result = await db.query("SELECT * FROM quotes LIMIT 1");
    const quote = result.rows[0] || { content: "Add your first quote..." };
    res.render("pages/quotePage", {
  quote,
  title: "Quotes | BookMuse"
});


  } catch (err) {
    console.error("Error loading quote:", err);
    res.status(500).send("Failed to load quote.");
  }
}

export async function updateQuote(req, res) {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    console.log("Quote is empty! Not updating.");
    return res.status(400).send("Quote cannot be empty!");
  }

  try {
    const result = await db.query("SELECT * FROM quotes");
    if (result.rowCount === 0) {
      await db.query("INSERT INTO quotes (content) VALUES ($1)", [content]);
    } else {
      await db.query("UPDATE quotes SET content = $1", [content]);
    }

    res.redirect("/#quotes");
  } catch (err) {
    console.error("Error updating quote:", err);
    res.status(500).send("Failed to update quote.");
  }
}
