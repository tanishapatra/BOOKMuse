import express from "express";
import { getAllBooks, showAddBookForm, addBook, getBookById,
  updateBook, deleteBook, toggleFavorite, getFavoriteBooks,searchBooks, showNotesPage, saveNotes} from "../controllers/bookController.js"; 
import upload from "../middleware/upload.js";

const router = express.Router();

// Route to get all books
router.get("/", getAllBooks);
router.get("/add", showAddBookForm);
router.post("/add", upload.single("cover"), addBook);

router.get("/edit/:id", getBookById);
router.post("/edit/:id", upload.single("cover"), updateBook);

router.post("/delete/:id", deleteBook);

router.post("/:id/favorite", toggleFavorite);
router.get("/favorites", getFavoriteBooks);

router.get("/search", searchBooks);

router.get("/:id/notes", showNotesPage);
router.post("/:id/notes", saveNotes);

// Export the router
export default router;