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
                        <div class="card-actions pr-2">
                            <button class="btn btn-primary onclick="editBook(${book.id})">Edit</button>
                        </div>
                        <div class="card-actions pl-2">
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

function editBook(id) {
    const title = document.getElementById('title-input').value;
    const price = document.getElementById('price-input').value;
    const authors = document.getElementById('authors-input').value;
    const publisher = document.getElementById('publisher-input').value;
}

function addBook() {
    const title = document.getElementById('title-input').value;
    const price = document.getElementById('price-input').value;
    const authors = document.getElementById('authors-input').value;
    const publisher = document.getElementById('publisher-input').value;
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
