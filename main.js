// Imports necessary modules and functions from the 'db.js' file.
const { 
    createDbConnection, 
    execQueryPromise, 
    getOrInsertAuthors, 
    getOrInsertPublisher, 
    insertBook, 
    insertBookAuthors 
} = require('./db.js');

// Imports the express module for creating a web server.
const express = require('express')
// Imports the http module for creating an HTTP server.
const http = require('http');
// Imports the body-parser module for parsing incoming request bodies.
const bodyParser = require('body-parser');
// Imports the path module for handling file and directory paths.
const path = require('path');
// Import the cors module for enabling CORS in requests.
var cors = require('cors')

// Creates an express application.
const app = express()
// Enable CORS for all requests.
app.use(cors())
// Middleware to parse JSON bodies.
app.use(express.json());
// Middleware to serve static files from the "./ui/src/" directory.
app.use(express.static("./ui/src/"));

// Creates a connection to the database.
const db = createDbConnection()
// Checks if the database connection was successful.
if (db) {
    console.log('[+] Database opened')
} else {
    console.log('[!] Error opening database')
    process.exit(1)
}

// Endpoint to get an author by ID.
app.get("/author/id/:id", async (req, res) => {
    // Extracts the author ID from the request parameters.
    const author_id = req.params.id;

    // Validates the author ID.
    if (!author_id) {
        res.status(400).send("Author id not valid")
    }

    try {
        // Queries the database for the author.
        const author_row = await execQueryPromise(db, 'SELECT name FROM authors WHERE id = ?', [author_id]);
        // Checks if the author was found.
        if (author_row.length == 0) { res.status(404).send("Author not found"); return; }
        // Sends the author's name as the response.
        res.status(200).send(author_row[0]);
    } catch (error) {
        // Logs any error that occurs during the query.
        console.error("Error selecting author:", error);
        // Sends an error response.
        res.status(500).send("Error selecting author");
    }
})

// Endpoint to get all books by a specific author.
app.get("/author/books/:id", async (req, res) => {
    // Extracts the author ID from the request parameters.
    const author_id = req.params.id;

    // Validates the author ID.
    if (!author_id) {
        res.status(400).send("Author id not valid")
    }

    try {
        // Queries the database for all books by the author.
        const author_row = await execQueryPromise(db, "SELECT id, title, price, publisher_id FROM book_authors INNER JOIN books ON books.id = book_authors.book_id WHERE author_id = ?", [author_id])
        // Checks if any books were found.
        if (author_row.length == 0) { res.status(404).send("No books found"); return; }
        
        // Adds the authors of each book to the response.
        for(let book of author_row) {
            let authors = await execQueryPromise(db, 'SELECT authors.id FROM authors INNER JOIN book_authors ON authors.id = book_authors.author_id WHERE book_authors.book_id = ?', [book.id]);
            book.authors = authors.map(a => a.id);
        }
        
        // Sends the books as the response.
        res.status(200).send(author_row);
    } catch (error) {
        // Logs any error that occurs during the query.
        console.error("Error selecting author books:", error);
        // Sends an error response.
        res.status(500).send("Error selecting author books");
    }
})

// Endpoint to get a publisher by ID.
app.get("/publisher/id/:id", async (req, res) => {
    // Extracts the publisher ID from the request parameters.
    const publisher_id = req.params.id;

    // Validates the publisher ID.
    if (!publisher_id) {
        res.status(400).send("Publisher id not valid")
    }

    try {
        // Queries the database for the publisher.
        const publisher_row = await execQueryPromise(db, 'SELECT name FROM publishers WHERE id = ?', [publisher_id]);
        // Checks if the publisher was found.
        if (publisher_row.length == 0) { res.status(404).send("Publisher not found"); return; }
        // Sends the publisher's name as the response.
        res.status(200).send(publisher_row[0]);
    } catch (error) {
        // Logs any error that occurs during the query.
        console.error("Error selecting publisher:", error);
        // Sends an error response.
        res.status(500).send("Error selecting publisher");
    }
})

// Endpoint to get all books by a specific publisher.
app.get("/publisher/books/:id", async (req, res) => {
    // Extracts the publisher ID from the request parameters.
    const publisher_id = req.params.id;

    // Validates the publisher ID.
    if (!publisher_id) {
        res.status(400).send("Publisher id not valid")
    }

    try {
        // Queries the database for all books by the publisher.
        const publisher_row = await execQueryPromise(db, "SELECT * FROM books WHERE publisher_id = ?", [publisher_id])
        // Checks if any books were found.
        if (publisher_row.length == 0) { res.status(404).send("No books found"); return; }
        // Sends the books as the response.
        res.status(200).send(publisher_row);
    } catch (error) {
        // Logs any error that occurs during the query.
        console.error("Error selecting publisher books:", error);
        // Sends an error response.
        res.status(500).send("Error selecting publisher books");
    }
})

// Endpoint to get all books.
app.get('/books', async (req, res) => {
    try {
        // Queries the database for all books.
        const books = await execQueryPromise(db, 'SELECT * FROM books');
        // Adds the authors of each book to the response.
        for (let book of books) {
            const authors = await execQueryPromise(db, 'SELECT authors.id FROM authors INNER JOIN book_authors ON authors.id = book_authors.author_id WHERE book_authors.book_id = ?', [book.id]);
            book.authors = authors.map(a => a.id);
        }

        // Sends the books as the response.
        res.status(200).send(books);
    } catch (error) {
        // Logs any error that occurs during the query.
        console.error("Error selecting books:", error);
        // Sends an error response.
        res.status(500).send("Error selecting books");
    }
});

// Endpoint to add a new book.
app.post('/book', async (req, res) => {
    // Extracts the book details from the request body.
    const { title, price, publisher, authors } = req.body;

    // Validates the request body.
    if (!title || !price || !publisher || !authors) {
        return res.status(400).send("All fields must be filled");
    }

    if (!Array.isArray(authors)) {
        return res.status(400).send("Authors must be an array");
    }

    // Fields must be a string not only space
    if (title.trim() == '' || authors.trim() == '' || publisher.trim() == '') {
        return res.status(400).send("Please enter all field, white space not allowed");
    }

    if (isNaN(price)|| price < 0) {
        return res.status(400).send("Price must be a postive number");
    }

    try {
        // Checks if the book is already present in the database.
        const publisher_row = await execQueryPromise(db, "SELECT * FROM publishers WHERE name = ?", [publisher])
        if (publisher_row.length != 0) {
            const book_row = await execQueryPromise(db, "SELECT * from books WHERE title = ? AND publisher_id = ?", [title, publisher_row[0].id])
            if(book_row.length != 0) {
                res.status(409).send("Book already present")
                return
            }
        }

        // Inserts the new book into the database.
        const publisher_id = await getOrInsertPublisher(db, publisher);
        const author_ids = await getOrInsertAuthors(db, authors);

        const bookId = await insertBook(db, title, price, publisher_id);
        await insertBookAuthors(db, bookId, author_ids);

        // Sends a success response.
        res.status(200).send("Book inserted");
    } catch (error) {
        // Logs any error that occurs during the insertion.
        console.error(error);
        // Sends an error response.
        res.status(500).send("Error inserting book");
    }
});

// Endpoint to delete a book by ID.
app.delete('/book/:id', async (req, res) => {
    // Extracts the book ID from the request parameters.
    const book_id = req.params.id;

    // Validates the book ID.
    if (!book_id) {
        return res.status(400).send("Book id not valid");
    }

    try {
        // Queries the database for the book.
        const book_row = await execQueryPromise(db, "SELECT * FROM books WHERE id = ?", [book_id])
        // Checks if the book was found.
        if (book_row.length == 0) {
            res.status(404).send("Book not found");
            return;
        }

        // Deletes the book from the database.
        await execQueryPromise(db, "DELETE FROM books WHERE id = ?", [book_id]);
        // Deletes the author associations for the book.
        await execQueryPromise(db, "DELETE FROM book_authors WHERE book_id = ?", [book_id]);
        // Sends a success response.
        res.status(200).send("Book deleted");
    } catch (error) {
        // Logs any error that occurs during the deletion.
        console.error("Error deleting book:", error);
        // Sends an error response.
        res.status(500).send("Error deleting book");
    }
});

// Default route for serving the website's index.html file.
app.use('/', function(req,res){
    if (req.url === '/') {
        res.sendFile(path.join(__dirname+'/ui/src/index.html'));
    }
});

// Creates an HTTP server with the express application.
const server = http.createServer(app);
// Starts the server on port 3000.
server.listen(3000, () => {
    console.log(`[+] Server listening on port 3000`)
})
