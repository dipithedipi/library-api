# Book Management System

This project is a simple book management system that allows users to fetch, add, and delete books from a server. It also provides functionality to manage authors and publishers associated with the books.

## Features

- Fetch all books from the server.
- Fetch details about authors and publishers by their IDs.
- Create cards for books, including their authors and publisher.
- Database for savings the books
- Delete books by their ID.
- Add new books to the server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js and npm installed on your machine.
- A running server that supports the API endpoints used by this project.

### Installing

1. Clone the repository to your local machine.
2. Install the project dependencies by running `npm install`
3. Ensure your server is running and accessible at `http://127.0.0.1:3000`

### Edit the graphic
1. Install the project UI dependencies by running `cd ui/; npm install`
2. Run the css builder `npx tailwindcss -i ./input.css -o ./output.css --watch`
3. Change the `index.html` as you want.

### Running the Application

1. Open the page in chrome browser (`http://127.0.0.1:3000/`).
2. Refresh the page if you have edited the graphic.
3. Use the library.

## Usage

- **Fetching Books**: Click on the "Load Books" button to fetch all books from the server and display them as cards.
- **Adding a Book**: Click on the "Add Book" button to open a modal. Fill in the book details and click "Save" to add the book to the server.
- **Deleting a Book**: Click on the "Delete" button on a book card to delete the book from the server.

## Built With

- [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) - For making HTTP requests.
- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) - For handling asynchronous operations.
- [Tailwind](https://tailwindcss.com/) - For the css.
