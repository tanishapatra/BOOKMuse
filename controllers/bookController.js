// controllers/bookController.js
import db from "../db/index.js";
import fetch from "node-fetch";

// 📚 GET all books
// export async function getAllBooks(req, res) {
//   try {
//     const result = await db.query("SELECT * FROM books ORDER BY id ASC");
//     const books = result.rows;

//     res.render("pages/books", { books });
//   } catch (err) {
//     console.error("Error fetching books:", err);
//     res.status(500).send("Internal Server Error");
//   }
// }

export async function getAllBooks(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status;

  try {
    let query = "";
    let countQuery = "";
    let booksResult, countResult;

    if (statusFilter) {
      query = `
        SELECT * FROM books 
        WHERE status = $1 
        ORDER BY id DESC 
        LIMIT $2 OFFSET $3
      `;
      countQuery = `SELECT COUNT(*) FROM books WHERE status = $1`;

      booksResult = await db.query(query, [statusFilter, limit, offset]);
      countResult = await db.query(countQuery, [statusFilter]);
    } else {
      query = `
        SELECT * FROM books 
        ORDER BY id DESC 
        LIMIT $1 OFFSET $2
      `;
      countQuery = `SELECT COUNT(*) FROM books`;

      booksResult = await db.query(query, [limit, offset]);
      countResult = await db.query(countQuery);
    }

    const books = booksResult.rows;
    const totalBooks = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);

    res.render("pages/books", {
  books,
  currentPage: page,
  totalPages,
  title: "All Books | BookMuse" // ← THIS FIXES IT
});

  } catch (err) {
    console.error("Pagination broke:", err);
    res.status(500).send("Something broke 💔");
  }
}



// ➕ SHOW Add Book Form
export function showAddBookForm(req, res) {
  res.render("pages/addBook", { title: "Add a New Book | BookMuse" });
}

// ➕ POST Add Book
export async function addBook(req, res) {
  const { title, author, rating, status, notes, read_date } = req.body;

  let cover_url = "";

  try {
    const queryTitle = encodeURIComponent(title);
    const queryAuthor = encodeURIComponent(author);
    const response = await fetch(`https://openlibrary.org/search.json?title=${queryTitle}&author=${queryAuthor}`);
    const data = await response.json();

    let match = data.docs.find(
      b => b.cover_i && b.title.toLowerCase().includes(title.toLowerCase())
    );

    if (!match) {
      match = data.docs.find(b => b.cover_i);
    }

    if (match && match.cover_i) {
      cover_url = `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
    }

    await db.query(
      `INSERT INTO books 
      (title, author, cover_url, rating, status, notes, read_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [title, author, cover_url, rating, status, notes, read_date]
    );

    res.redirect("/books");
  } catch (err) {
    console.error("🔥 Error adding book:", err);
    res.status(500).send("Something went wrong while adding the book");
  }
}


// 📝 GET Book by ID for Editing
export async function getBookById(req, res) {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) return res.status(404).send("Book not found");
    res.render("pages/editBook", { book }); // ✅ updated view path
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).send("Something went wrong");
  }
}

// 🔁 POST Update Book
export async function updateBook(req, res) {
  const bookId = req.params.id;
  const { title, author, cover_url, rating, status, notes, read_date } = req.body;

  try {
    await db.query(
      `UPDATE books 
      SET title = $1, author = $2, cover_url = $3, rating = $4, status = $5, notes = $6, read_date = $7 
      WHERE id = $8`,
      [title, author, cover_url, rating, status, notes, read_date, bookId]
    );
    res.redirect("/books");
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).send("Update failed");
  }
}

// ❌ DELETE Book
export async function deleteBook(req, res) {
  const bookId = req.params.id;

  try {
    await db.query("DELETE FROM books WHERE id = $1", [bookId]);
    res.redirect("/books");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).send("Delete failed");
  }
}

// ❤️ Toggle Favorite Status
export async function toggleFavorite(req, res) {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT is_favorite FROM books WHERE id = $1", [bookId]);

    if (result.rowCount === 0) return res.status(404).send("Book not found");

    const currentStatus = result.rows[0].is_favorite;
    const newStatus = !currentStatus;

    await db.query("UPDATE books SET is_favorite = $1 WHERE id = $2", [newStatus, bookId]);

    res.redirect("/books");
  } catch (err) {
    console.error("Favorite toggle failed:", err);
    res.status(500).send("Something went wrong.");
  }
}

export async function getFavoriteBooks(req, res) {
  try {
    const bookResult = await db.query("SELECT * FROM books WHERE is_favorite = true ORDER BY id DESC");
    const quoteResult = await db.query("SELECT * FROM quotes ORDER BY id DESC");

    const books = bookResult.rows;
    const quotes = quoteResult.rows;

    res.render("pages/favoriteBooks", {
      books,
      quotes,
      title: "Favorites | BookMuse"
    });
  } catch (err) {
    console.error("Error loading favorites:", err);
    res.status(500).send("Failed to load favorites.");
  }
}

// 🔍 Search Books
export async function searchBooks(req, res) {
  const query = req.query.q;

  try {
    const result = await db.query(
      "SELECT * FROM books WHERE LOWER(title) LIKE LOWER($1)",
      [`%${query}%`]
    );
    const books = result.rows;
    res.render("pages/home", { books }); // reuse home.ejs with filtered books
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).send("Search failed.");
  }
}

