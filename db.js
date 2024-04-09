const sqlite3 = require("sqlite3").verbose();
const filepath = "./books.db";
const fs = require("fs");

function createDbConnection() {
    if (fs.existsSync(filepath)) {
        return new sqlite3.Database(filepath);
    } else {
        const db = new sqlite3.Database(filepath, (error) => {
            if (error) {
                return console.error(error.message);
            }
            createTables(db);
            defaultData(db)
        });
        console.log("Connection with new SQLite has been established");
        return db;
    }
}

function createTables(db) {
    db.exec(`
        CREATE TABLE books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(128) NOT NULL,
            price INT NOT NULL,
            publisher_id INTEGER NOT NULL,
            FOREIGN KEY (publisher_id) REFERENCES publisher(id)
        );
    `);
    
    db.exec(`
        CREATE TABLE authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL
        );
    `);

    db.exec(`
        CREATE TABLE publishers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL
        );
    `);
    
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

function defaultData(db) {
    // Read the JSON data from a file
    fs.readFile("./books.json", "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading JSON file:", err);
            return;
        }

        try {
            const booksData = JSON.parse(data);
            //console.log("Books data:", booksData);

            for (const book of booksData) {
                let publisher_id = await getOrInsertPublisher(db, book.publisher);
                let author_ids = await getOrInsertAuthors(db, book.authors);
                let book_id = await insertBook(db, book.title, book.price, publisher_id);

                await insertBookAuthors(db, book_id, author_ids);
            }

        } catch (error) {
            console.error("Error parsing JSON data:", error);
        }
    });
}


async function getOrInsertPublisher(db, publisher) {
    const publisherRow = await execQueryPromise(db, `SELECT * FROM publishers WHERE name = ?`, [publisher]);
    if (publisherRow.length === 0) {
        //console.log("Inserting new publisher:", publisher); // Debugging line
        await execQueryPromise(db, `INSERT INTO publishers (name) VALUES (?)`, [publisher]);
        const lastId = await execQueryPromise(db, `SELECT * FROM publishers WHERE name = ?`, [publisher])
        return lastId[0].id;
    }
    return publisherRow[0].id;
}

async function getOrInsertAuthors(db, authors) {
    const authorIds = [];
    for (const author of authors) {
        const authorRow = await execQueryPromise(db, `SELECT * FROM authors WHERE name = ?`, [author]);
        if (authorRow.length === 0) {
            await execQueryPromise(db, `INSERT INTO authors (name) VALUES (?)`, [author]);
            const lastId = await execQueryPromise(db, `SELECT * FROM authors WHERE name = ?`, [author])
            authorIds.push(lastId[0].id);
        } else {
            authorIds.push(authorRow[0].id);
        }
    }
    return authorIds;
}

async function insertBook(db, title, price, publisher_id) {
    await execQueryPromise(db, `INSERT INTO books (title, price, publisher_id) VALUES (?, ?, ?)`, [title, price, publisher_id]);
    const lastId = await execQueryPromise(db, "SELECT * FROM books WHERE title = ? AND price = ? AND publisher_id = ?", [title, price, publisher_id])
    return lastId[0].id;
}

async function insertBookAuthors(db, bookId, authorIds) {
    const promises = []
    authorIds.forEach(author_id => {
        promises.push(execQueryPromise(db, `INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)`, [bookId, author_id]))
    });
    await Promise.all(promises);
}

function execQueryPromise(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
}


module.exports = {
    createDbConnection,
    execQueryPromise,
    getOrInsertPublisher,
    getOrInsertAuthors,
    insertBook,
    insertBookAuthors
};
