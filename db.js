// Requires the sqlite3 module and sets it to verbose mode for more detailed error messages.
const sqlite3 = require("sqlite3").verbose();

// Specifies the path to the SQLite database file.
const filepath = "./books.db";

// Requires the fs module for file system operations.
const fs = require("fs");

/**
 * Creates a connection to the SQLite database.
 * If the database file does not exist, it creates a new one and initializes it with tables and default data.
 * @returns {sqlite3.Database} The database connection object.
 */
function createDbConnection() {
    // Checks if the database file exists.
    if (fs.existsSync(filepath)) {
        // Returns a connection to the existing database.
        return new sqlite3.Database(filepath);
    } else {
        // Creates a new database file and initializes it.
        const db = new sqlite3.Database(filepath, (error) => {
            if (error) {
                // Logs any error that occurs during database creation.
                return console.error(error.message);
            }
            // Initializes the database with tables.
            createTables(db);
            // Inserts default data into the database.
            defaultData(db)
        });
        // Logs that a new database connection has been established.
        console.log("Connection with new SQLite has been established");
        return db;
    }
}

/**
 * Creates the necessary tables in the SQLite database.
 * @param {sqlite3.Database} db The database connection object.
 */
function createTables(db) {
    // Creates the 'books' table.
    db.exec(`
        CREATE TABLE books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(128) NOT NULL,
            price INT NOT NULL,
            publisher_id INTEGER NOT NULL,
            FOREIGN KEY (publisher_id) REFERENCES publisher(id)
        );
    `);

    // Creates the 'authors' table.
    db.exec(`
        CREATE TABLE authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL
        );
    `);

    // Creates the 'publishers' table.
    db.exec(`
        CREATE TABLE publishers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL
        );
    `);

    // Creates the 'book_authors' table to manage the many-to-many relationship between books and authors.
    db.exec(`
        CREATE TABLE book_authors (
            book_id INTEGER NOT NULL,
            author_id INTEGER NOT NULL,
            PRIMARY KEY (book_id, author_id),
            FOREIGN KEY (book_id) REFERENCES books(id),
            FOREIGN KEY (author_id) REFERENCES authors(id)
        );
    `);
}

/**
 * Inserts default data into the SQLite database.
 * Reads book data from a JSON file and inserts it into the database.
 * @param {sqlite3.Database} db The database connection object.
 */
function defaultData(db) {
    // Reads the JSON data from a file.
    fs.readFile("./books.json", "utf8", async (err, data) => {
        if (err) {
            // Logs any error that occurs during file reading.
            console.error("Error reading JSON file:", err);
            return;
        }

        try {
            // Parses the JSON data into a JavaScript object.
            const booksData = JSON.parse(data);

            // Iterates over each book in the data.
            for (const book of booksData) {
                // Inserts or retrieves the publisher ID.
                let publisher_id = await getOrInsertPublisher(db, book.publisher);
                // Inserts or retrieves the author IDs.
                let author_ids = await getOrInsertAuthors(db, book.authors);
                // Inserts the book into the database.
                let book_id = await insertBook(db, book.title, book.price, publisher_id);

                // Associates the book with its authors.
                await insertBookAuthors(db, book_id, author_ids);
            }

        } catch (error) {
            // Logs any error that occurs during data parsing or insertion.
            console.error("Error parsing JSON data:", error);
        }
    });
}

/**
 * Inserts a publisher into the database if it does not already exist.
 * @param {sqlite3.Database} db The database connection object.
 * @param {string} publisher The name of the publisher.
 * @returns {Promise<number>} The ID of the publisher.
 */
async function getOrInsertPublisher(db, publisher) {
    // Checks if the publisher already exists in the database.
    const publisherRow = await execQueryPromise(db, `SELECT * FROM publishers WHERE name = ?`, [publisher]);
    if (publisherRow.length === 0) {
        // Inserts the new publisher into the database.
        await execQueryPromise(db, `INSERT INTO publishers (name) VALUES (?)`, [publisher]);
        // Retrieves the ID of the newly inserted publisher.
        const lastId = await execQueryPromise(db, `SELECT * FROM publishers WHERE name = ?`, [publisher])
        return lastId[0].id;
    }
    // Returns the ID of the existing publisher.
    return publisherRow[0].id;
}

/**
 * Inserts authors into the database if they do not already exist.
 * @param {sqlite3.Database} db The database connection object.
 * @param {Array<string>} authors An array of author names.
 * @returns {Promise<Array<number>>} An array of author IDs.
 */
async function getOrInsertAuthors(db, authors) {
    const authorIds = [];
    // Iterates over each author.
    for (const author of authors) {
        // Checks if the author already exists in the database.
        const authorRow = await execQueryPromise(db, `SELECT * FROM authors WHERE name = ?`, [author]);
        if (authorRow.length === 0) {
            // Inserts the new author into the database.
            await execQueryPromise(db, `INSERT INTO authors (name) VALUES (?)`, [author]);
            // Retrieves the ID of the newly inserted author.
            const lastId = await execQueryPromise(db, `SELECT * FROM authors WHERE name = ?`, [author])
            authorIds.push(lastId[0].id);
        } else {
            // Adds the ID of the existing author to the array.
            authorIds.push(authorRow[0].id);
        }
    }
    // Returns the array of author IDs.
    return authorIds;
}

/**
 * Inserts a book into the database.
 * @param {sqlite3.Database} db The database connection object.
 * @param {string} title The title of the book.
 * @param {number} price The price of the book.
 * @param {number} publisher_id The ID of the publisher.
 * @returns {Promise<number>} The ID of the inserted book.
 */
async function insertBook(db, title, price, publisher_id) {
    // Inserts the book into the database.
    await execQueryPromise(db, `INSERT INTO books (title, price, publisher_id) VALUES (?, ?, ?)`, [title, price, publisher_id]);
    // Retrieves the ID of the newly inserted book.
    const lastId = await execQueryPromise(db, "SELECT * FROM books WHERE title = ? AND price = ? AND publisher_id = ?", [title, price, publisher_id])
    return lastId[0].id;
}

/**
 * Associates a book with its authors in the database.
 * @param {sqlite3.Database} db The database connection object.
 * @param {number} bookId The ID of the book.
 * @param {Array<number>} authorIds An array of author IDs.
 */
async function insertBookAuthors(db, bookId, authorIds) {
    const promises = []
    // Iterates over each author ID.
    authorIds.forEach(author_id => {
        // Inserts the association between the book and the author into the database.
        promises.push(execQueryPromise(db, `INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)`, [bookId, author_id]))
    });
    // Waits for all insertions to complete.
    await Promise.all(promises);
}

/**
 * Executes a SQL query and returns the result as a promise.
 * @param {sqlite3.Database} db The database connection object.
 * @param {string} query The SQL query to execute.
 * @param {Array} params An array of parameters to bind to the query.
 * @returns {Promise<Array>} The result of the query.
 */
function execQueryPromise(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, rows) => {
            if (error) {
                // Rejects the promise if an error occurs.
                reject(error);
            } else {
                // Resolves the promise with the query result.
                resolve(rows);
            }
        });
    });
}

// Exports the functions for use in other modules.
module.exports = {
    createDbConnection,
    execQueryPromise,
    getOrInsertPublisher,
    getOrInsertAuthors,
    insertBook,
    insertBookAuthors
};
