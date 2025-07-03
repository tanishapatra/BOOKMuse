// controllers/bookController.js
import db from "../db/index.js";
import fetch from "node-fetch";

// 📚 GET all books
export async function getAllBooks(req, res) {
  const statusFilter = req.query.status;

  try {
    let query = "";
    let booksResult;

    if (statusFilter) {
      query = `
        SELECT * FROM books 
        WHERE status = $1 
        ORDER BY id DESC
      `;
      booksResult = await db.query(query, [statusFilter]);
    } else {
      query = `
        SELECT * FROM books 
        ORDER BY id DESC
      `;
      booksResult = await db.query(query);
    }

    const books = booksResult.rows;

    res.render("pages/books", {
      books,
      title: "All Books | BookMuse",
      status: statusFilter,
      redirectTo: "/books"
    });

  } catch (err) {
    console.error("Error fetching books without pagination:", err);
    res.status(500).send("Something went wrong 🚨");
  }
}



// ➕ SHOW Add Book Form
export function showAddBookForm(req, res) {
  res.render("pages/addBook", { title: "Add a New Book | BookMuse" });
}

// ➕ POST Add Book
export async function addBook(req, res) {
  try {
    const { title, author, rating, status, read_date, notes, tags } = req.body;
    let cover_url = "";

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
    } else if (req.file) {
      cover_url = "/uploads/" + req.file.filename;
    }

    await db.query(
      `INSERT INTO books (title, author, rating, status, read_date, notes, tags, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        title,
        author,
        rating || null,
        status,
        read_date || null,
        notes,
        tags ? tags.split(",").map(tag => tag.trim()) : [],
        cover_url
      ]
    );

    res.redirect("/books");
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).send("Something went wrong!");
  }
}


// 📝 GET Book by ID for Editing
export async function getBookById(req, res) {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) return res.status(404).send("Book not found");
    res.render("pages/editBook", {
      book,
      title: "Edit Book | BookMuse"
      }); 
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).send("Something went wrong");
  }
}

// 🔁 POST Update Book
export async function updateBook(req, res) {
  const bookId = req.params.id;
  let { title, author, cover_url, rating, status, notes, read_date, tags } = req.body;
  const tagArray = tags ? tags.split(",").map(tag => tag.trim()) : [];

  try {
    // 📸 Fallback logic — use uploaded cover if given
    if (req.file) {
      cover_url = "/uploads/" + req.file.filename;
    }

    await db.query(
      `UPDATE books 
      SET title = $1, author = $2, cover_url = $3, rating = $4, status = $5, notes = $6, read_date = $7, tags = $8
      WHERE id = $9`,
      [title, author, cover_url, rating, status, notes, read_date || null, tagArray, bookId]
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
  const redirectTo = req.body.redirectTo || "/books";
  
  try {
    const result = await db.query("SELECT is_favorite FROM books WHERE id = $1", [bookId]);

    if (result.rowCount === 0) return res.status(404).send("Book not found");

    const currentStatus = result.rows[0].is_favorite;
    const newStatus = !currentStatus;

    await db.query("UPDATE books SET is_favorite = $1 WHERE id = $2", [newStatus, bookId]);
    res.redirect(redirectTo);

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
  redirectTo: "/books/favorites", // 👈 pass this to your bookCard.ejs
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

    res.render("pages/searchResults", {
      books,
      query,
      title: `Search: ${query} | BookMuse`
    });

  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).send("Search failed.");
  }
}


export async function showNotesPage(req, res) {
  const bookId = req.params.id;
  const redirectTo = req.query.redirectTo || `/books/${bookId}/notes`; 
  
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) return res.status(404).send("Book not found");

    res.render("pages/notesPage", {
      book,
      redirectTo,
      title: `${book.title} – Notes | BookMuse`
    });
  } catch (err) {
    console.error("Error loading notes page:", err);
    res.status(500).send("Failed to load notes.");
  }
}


export async function saveNotes(req, res) {
  const bookId = req.params.id;
  const { notes, redirectTo } = req.body;


  try {
    await db.query("UPDATE books SET notes = $1 WHERE id = $2", [notes, bookId]);
    res.redirect(redirectTo || `/books/${bookId}/notes`);

  } catch (err) {
    console.error("Error saving notes:", err);
    res.status(500).send("Failed to save notes.");
  }
}

