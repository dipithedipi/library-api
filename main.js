const { 
    createDbConnection, 
    execQueryPromise, 
    getOrInsertAuthors, 
    getOrInsertPublisher, 
    insertBook, 
    insertBookAuthors 
} = require('./db.js');
const express =  require('express')
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');

const app = express()
app.use(express.json());
app.use(express.static("ui"));

const db = createDbConnection()
if (db) {
    console.log('[+] Database opened')
} else {
    console.log('[!] Error opening database')
    process.exit(1)
}

app.get("/author/id/:id", async (req, res) => {
    const author_id = req.params.id;

    // checks
    if (!author_id) {
        res.status(400).send("Author id not valid")
    }

    try {
        const author_row = await execQueryPromise(db, 'SELECT name FROM authors WHERE id = ?', [author_id]);
        if (author_row.length == 0) { res.status(404).send("Author not found"); return; }
        res.status(200).send(author_row[0]);
    } catch (error) {
        console.error("Error selecting author:", error);
        res.status(500).send("Error selecting author");
    }
})

app.get("/author/books/:id", async (req, res) => {
    const author_id = req.params.id;

    // checks
    if (!author_id) {
        res.status(400).send("Author id not valid")
    }

    try {
        const author_row = await execQueryPromise(db, "SELECT id, title, price, publisher_id FROM book_authors INNER JOIN books ON books.id = book_authors.book_id WHERE author_id = ?", [author_id])
        if (author_row.length == 0) { res.status(404).send("No books found"); return; }
        
        for(let book of author_row) {
            let authors = await execQueryPromise(db, 'SELECT authors.id FROM authors INNER JOIN book_authors ON authors.id = book_authors.author_id WHERE book_authors.book_id = ?', [book.id]);
            book.authors = authors.map(a => a.id);
        }
        
        res.status(200).send(author_row);
    } catch (error) {
        console.error("Error selecting author books:", error);
        res.status(500).send("Error selecting author books");
    }
})

app.get("/publisher/id/:id", async (req, res) => {
    const publisher_id = req.params.id;

    // checks
    if (!publisher_id) {
        res.status(400).send("Publisher id not valid")
    }

    try {
        const publisher_row = await execQueryPromise(db, 'SELECT name FROM publishers WHERE id = ?', [publisher_id]);
        if (publisher_row.length == 0) { res.status(404).send("Publisher not found"); return; }
        res.status(200).send(publisher_row[0]);
    } catch (error) {
        console.error("Error selecting publisher:", error);
        res.status(500).send("Error selecting publisher");
    }
})

app.get("/publisher/books/:id", async (req, res) => {
    const publisher_id = req.params.id;

    // checks
    if (!publisher_id) {
        res.status(400).send("Publisher id not valid")
    }

    try {
        const publisher_row = await execQueryPromise(db, "SELECT * FROM books WHERE publisher_id = ?", [publisher_id])
        if (publisher_row.length == 0) { res.status(404).send("No books found"); return; }
        res.status(200).send(publisher_row);
    } catch (error) {
        console.error("Error selecting publisher books:", error);
        res.status(500).send("Error selecting publisher books");
    }
})

app.get('/books', async (req, res) => {
    try {
        const books = await execQueryPromise(db, 'SELECT * FROM books');
        // add authors
        for (let book of books) {
            const authors = await execQueryPromise(db, 'SELECT authors.id FROM authors INNER JOIN book_authors ON authors.id = book_authors.author_id WHERE book_authors.book_id = ?', [book.id]);
            book.authors = authors.map(a => a.id);
        }

        res.status(200).send(books);
    } catch (error) {
        console.error("Error selecting books:", error);
        res.status(500).send("Error selecting books");
    }
});

app.post('/book', async (req, res) => {
    const { title, price, publisher, authors } = req.body;

    if (!title || !price || !publisher || !authors) {
        return res.status(400).send("All fields must be filled");
    }

    if (!Array.isArray(authors)) {
        return res.status(400).send("Authors must be an array");
    }

    if (isNaN(price)) {
        return res.status(400).send("Price must be a number");
    }

    try {
        // check if the book alredy present
        const publisher_row = await execQueryPromise(db, "SELECT * FROM publishers WHERE name = ?", [publisher])
        if (publisher_row.length != 0) {
            const book_row = await execQueryPromise(db, "SELECT * from books WHERE title = ? AND publisher_id = ?", [title, publisher_row[0].id])
            if(book_row.length != 0) {
                res.status(409).send("Book already present")
                return
            }
        }

        // if not, add the book
        const publisher_id = await getOrInsertPublisher(db, publisher);
        const author_ids = await getOrInsertAuthors(db, authors);

        const bookId = await insertBook(db, title, price, publisher_id);
        await insertBookAuthors(db, bookId, author_ids);

        res.status(200).send("Book inserted");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error inserting book");
    }
});

app.delete('/book/:id', async (req, res) => {
    const book_id = req.params.id;

    if (!book_id) {
        return res.status(400).send("Book id not valid");
    }

    try {
        const book_row = await execQueryPromise(db, "SELECT * FROM books WHERE id = ?", [book_id])
        if (book_row.length == 0) {
            res.status(404).send("Book not found");
            return;
        }

        // delete book
        await execQueryPromise(db, "DELETE FROM books WHERE id = ?", [book_id]);
        // delete author association
        await execQueryPromise(db, "DELETE FROM book_authors WHERE book_id = ?", [book_id]);
        res.status(200).send("Book deleted");
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send("Error deleting book");
    }
});


// default URL for website
app.use('/', function(req,res){
    if (req.url === '/') {
        res.sendFile(path.join(__dirname+'/ui/index.html'));
    }
});

const server = http.createServer(app);
server.listen(3000, () => {
    console.log(`[+] Server listening on port 3000`)
})
