"use strict";

function fetchBooks() {
    return new Promise((resolve, reject) => {
        // Creazione di un nuovo oggetto XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // Configurazione della richiesta
        xhr.open('GET', 'http://127.0.0.1:3000/books', true);

        // Gestione della risposta
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                // La richiesta è andata a buon fine, la risposta è disponibile
                resolve(xhr.responseText);
            } else {
                // Si è verificato un errore durante la richiesta
                reject('Errore durante la richiesta: ' + xhr.status);
            }
        };

        // Gestione degli errori di rete
        xhr.onerror = function() {
            reject('Si è verificato un errore di rete');
        };

        // Invio della richiesta
        xhr.send();
    });
}

function fetchAuthor(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `http://127.0.0.1:3000/author/id/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText).name);
            } else {
                reject('Errore durante la richiesta: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Si è verificato un errore di rete');
        };
        xhr.send();
    });
}

function fetchPublisher(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `http://127.0.0.1:3000/publisher/id/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText).name);
            } else {
                reject('Errore durante la richiesta: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Si è verificato un errore di rete');
        };
        xhr.send();
    });
}

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

// TODO
function deleteBook(id) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', `http://127.0.0.1:3000/book/${id}`, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve();
                loadBooksCard();
            } else {
                reject('Errore durante la richiesta: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Si è verificato un errore di rete');
        };
        xhr.send();
    });
}

function addBookHandle() {
    const my_modal_1 = document.getElementById('my_modal_1')
    my_modal_1.showModal()
    document.getElementById('btn-save').addEventListener('click', addBook);
}

function addBook() {
    console.log('addBook');
    // get input values
    const title = document.getElementById('title-input').value;
    const price = document.getElementById('price-input').value;
    const authors = document.getElementById('authors-input').value;
    const publisher = document.getElementById('publisher-input').value;

    // check if they are empty
    if (!title || !price || !authors || !publisher) {
        alert("Please enter all field")
        return
    }

    // send request 
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', `http://127.0.0.1:3000/book`, true);
        xhr.setRequestHeader('Content-Type', 'application/json'); // Set the content type header
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 400) {
                resolve();

                //reload cards
                loadBooksCard();
                alert('Book added');
                
                // clear input fields
                document.getElementById('title-input').value = '';
                document.getElementById('price-input').value = '';
                document.getElementById('authors-input').value = '';
                document.getElementById('publisher-input').value = '';
            } else {
                reject('Errore durante la richiesta: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            reject('Si è verificato un errore di rete');
        };
        // body parameters
        xhr.send(JSON.stringify({
            title: title,
            price: price,
            authors: authors.split(',') || [],
            publisher: publisher
        }));
    });
}

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
