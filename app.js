import express from "express";
import bodyParser from "body-parser";
import db from "./db/index.js";
import bookRoutes from "./routes/books.js";
import quoteRoutes from "./routes/quotes.js";
import expressLayouts from "express-ejs-layouts";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(expressLayouts);
app.set("layout", "./layout"); // ✅ means all EJS views will be wrapped in layout.ejs


// DB check
db.query("SELECT NOW()", (err, res) => {
  if (err) console.error("❌ DB Failed:", err.stack);
  else console.log("✅ Connected to DB at:", res.rows[0].now);
});

// Routes
app.use("/books", bookRoutes);
app.use("/quotes", quoteRoutes);

app.get("/", async (req, res) => {
  try {
    const booksResult = await db.query("SELECT * FROM books ORDER BY id DESC");
    const quotesResult = await db.query("SELECT * FROM quotes ORDER BY id DESC");

    const books = booksResult.rows;
    const quotes = quotesResult.rows;

    res.render("pages/home", {
      books,
      quotes,
      title: "Home | BookMuse" // 🧠 good that you already had this!
    });
  } catch (err) {
    console.error("Error loading homepage:", err);
    res.status(500).send("Failed to load homepage.");
  }
});



app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
