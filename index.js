const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 3000;

// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());


const verifyFirebaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).send({ message: 'Unauthorized access' });

    const token = authorization.split(' ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.token_email = decoded.email;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qswuexk.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
    try {
        await client.connect();
        const db = client.db('bookHavenUser');
        const booksCollection = db.collection('books');
        const usersCollection = db.collection('users');
        const commentCollection = db.collection('comments');

        app.get('/', (req, res) => res.send("Book server is running perfectly"));

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const existingUser = await usersCollection.findOne({ email: newUser.email });
            if (existingUser) return res.send('User already exists');
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        });


        app.get('/books', async (req, res) => {
            try {
                const sortOrder = req.query.sort === 'asc' ? 1 : -1;
                const books = await booksCollection.find().sort({ rating: sortOrder }).toArray();
                res.send(books);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Failed to fetch books' });
            }
        });


        app.get('/latest-books', async (req, res) => {
            const latestBooks = await booksCollection.find().sort({ created_at: -1 }).limit(6).toArray();
            res.send(latestBooks);
        });


        app.get('/myBooks', verifyFirebaseToken, async (req, res) => {
            const userEmail = req.token_email;
            const books = await booksCollection.find({ userEmail }).toArray();
            res.send(books);
        });


        app.get('/book-details/:id', verifyFirebaseToken, async (req, res) => {
            const id = req.params.id;
            const book = await booksCollection.findOne({ _id: new ObjectId(id) });
            if (!book) return res.status(404).send({ message: 'Book not found' });
            res.send(book);
        });

        app.post('/books', verifyFirebaseToken, async (req, res) => {
            const ratingValue = parseFloat(req.body.rating);
            const newBook = {
                ...req.body,
                rating: isNaN(ratingValue) ? 0 : ratingValue,
                userEmail: req.token_email,
                created_at: new Date(),
            };

            try {
                const result = await booksCollection.insertOne(newBook);
                if (result.acknowledged) {
                    res.send({ insertedId: result.insertedId, message: "Book added successfully!" });
                } else {
                    res.status(400).send({ message: "Failed to insert book" });
                }
            } catch (error) {
                console.error("Error adding book:", error);
                res.status(500).send({ message: 'Failed to add book' });
            }
        });

        app.patch('/books/:id', verifyFirebaseToken, async (req, res) => {
            const id = req.params.id;
            const updatedBook = req.body;
            const userEmail = req.token_email;

            const ratingValue = parseFloat(updatedBook.rating);
            const newRating = isNaN(ratingValue) ? 0 : ratingValue;

            try {
                const book = await booksCollection.findOne({ _id: new ObjectId(id) });
                if (!book) return res.status(404).send({ message: 'Book not found' });
                if (book.userEmail !== userEmail) return res.status(403).send({ message: 'Not allowed to update this book' });

                const updateDoc = {
                    $set: {
                        title: updatedBook.title,
                        author: updatedBook.author,
                        genre: updatedBook.genre,
                        rating: newRating,
                        summary: updatedBook.summary,
                        coverImage: updatedBook.image || updatedBook.coverImage,
                        lastUpdated: new Date(),
                    },
                };

                const result = await booksCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
                res.send(result);
            } catch (error) {
                console.error("Error updating book:", error);
                res.status(500).send({ message: 'Failed to update book' });
            }
        });

        app.delete('/books/:id', verifyFirebaseToken, async (req, res) => {
            const id = req.params.id;
            const userEmail = req.token_email;

            const book = await booksCollection.findOne({ _id: new ObjectId(id) });
            if (!book) return res.status(404).send({ message: 'Book not found' });
            if (book.userEmail !== userEmail) return res.status(403).send({ message: 'Not allowed to delete this book' });

            const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get("/book-comments/:bookId", async (req, res) => {
            try {
                const comments = await commentCollection
                    .find({ bookId: req.params.bookId })
                    .sort({ created_at: -1 })
                    .toArray();
                res.send(comments);
            } catch (error) {
                res.status(500).send({ message: "Failed to load comments" });
            }
        });

        app.post("/book-comments/:bookId", verifyFirebaseToken, async (req, res) => {
            try {
                const newComment = {
                    bookId: req.params.bookId,
                    userName: req.body.userName,
                    userPhoto: req.body.userPhoto,
                    comment: req.body.comment,
                    created_at: new Date(),
                };
                const result = await commentCollection.insertOne(newComment);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to add comment" });
            }
        });

    } finally { }
}

run().catch(console.dir);

app.listen(port, () => console.log(`Book server is running on port ${port}`));
