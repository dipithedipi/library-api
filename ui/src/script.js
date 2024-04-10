"use strict";

// Fetches all books from the server.
function fetchBooks() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://127.0.0.1:3000/books', true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(xhr.responseText);
            } else {
                reject('Error during the request: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Network Error');
        };
        xhr.send();
    });
}

// Fetches the name of an author by their ID.
function fetchAuthor(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `http://127.0.0.1:3000/author/id/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText).name);
            } else {
                reject('Error during the request: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Network Error');
        };
        xhr.send();
    });
}

// Fetches the name of a publisher by their ID.
function fetchPublisher(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `http://127.0.0.1:3000/publisher/id/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText).name);
            } else {
                reject('Error during the request: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Network Error');
        };
        xhr.send();
    });
}

// Creates a card for a book, including its authors and publisher.
function createCard(book) {
    return Promise.all([
        Promise.all(book.authors.map(author => fetchAuthor(author))),
        fetchPublisher(book.publisher_id)
    ]).then(([authors, publisher]) => {
        return `
            <div class="card w-80 bg-base-100 shadow-xl">
                <div class="card-body items-center text-center">
                    <h2 class="card-title">${book.title}</h2>
                    <p>Authors: ${authors.join(', ')}</p>
                    <p>Publisher: ${publisher}</p>
                    <p>Price: ${book.price} $</p>
                    <div class="flex">
                        <div class="card-actions">
                            <button class="btn btn-primary" onclick="deleteBook(${book.id})">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Deletes a book by its ID.
function deleteBook(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', `http://127.0.0.1:3000/book/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve();
                loadBooksCard();
            } else {
                reject('Error during the request: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Network Error');
        };
        xhr.send();
    });
}

// Handles the addition of a new book.
function addBookHandle() {
    const my_modal_1 = document.getElementById('my_modal_1')
    my_modal_1.showModal()
    document.getElementById('btn-save').addEventListener('click', addBook);
}

// Adds a new book to the server.
function addBook() {
    console.log('addBook');
    const title = document.getElementById('title-input').value;
    const price = document.getElementById('price-input').value;
    const authors = document.getElementById('authors-input').value;
    const publisher = document.getElementById('publisher-input').value;

    // Check if all fields are filled
    if (!title || !price || !authors || !publisher) {
        alert("Please enter all field")
        return
    }

    // Fields must be a string not only space
    if (title.trim() == '' || authors.trim() == '' || publisher.trim() == '') {
        alert("Please enter all field, only white space not allowed")
        return
    }

    // Price must be a positive number
    if (isNaN(price) || parseFloat(price) < 0) {
        alert("Price must be a positive number")
        return
    }

    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', `http://127.0.0.1:3000/book`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve();
                loadBooksCard();
                alert('Book added');

                // Clear input fields
                document.getElementById('title-input').value = '';
                document.getElementById('price-input').value = '';
                document.getElementById('authors-input').value = '';
                document.getElementById('publisher-input').value = '';
            } else {
                reject('Error during the request: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Network Error');
        };
        xhr.send(JSON.stringify({
            title: title,
            price: price,
            authors: authors.split(',') || [],
            publisher: publisher
        }));
    });
}

// Adds cards for all books to the collector.
function addCardsToCollector(books) {
    const cardCollector = document.getElementById('cards-collector');
    cardCollector.innerHTML = '';
    Promise.all(books.map(book => createCard(book))).then(cards => {
        cards.forEach(card => {
            cardCollector.innerHTML += card;
        });
    }).catch(error => {
        console.error(error);
    });
}

// Loads all book cards.
function loadBooksCard() {
    document.getElementById("cards-container").hidden = false;
    document.getElementById("get-started-btn").hidden = true;
    fetchBooks().then(response => {
        let books = JSON.parse(response);
        addCardsToCollector(books);
    }).catch(error => {
        console.log(error);
    });
}
