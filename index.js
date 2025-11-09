const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.port || 3000



// middleware
app.use(cors());
app.use(express.json())

// zk62ZiUhySe2tdIh
// bookHavenUser

const uri = "mongodb+srv://bookHavenUser:zk62ZiUhySe2tdIh @cluster0.qswuexk.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await client.connect();
        const db = client.db('book_db');
        const booksCollection = db.collection('books');
        const usersCollection = db.collection('users');

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send('user already exist.do not need to insert again')
            }
            else {
                const result = await usersCollection.insertOne(newUser)
                res.send(result);
            }

        })

        app.get('/books', async (req, res) => {

            console.log(req.query)
            const email = req.query.email;
            const query = {}
            if (email) {
                query.email = email;
            }

            const cursor = booksCollection.find(query);

            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/latest-books', async (req, res) => {
            const cursor = booksCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await booksCollection.findOne(query)
            res.send(result);
        })

        app.post('/books', verifyFirebaseToken, async (req, res) => {
            console.log('headers in the post', req.headers);
            const newProduct = req.body;
            const result = await booksCollection.insertOne(newProduct)
            res.send(result);

        })



    } finally {
    }


}
run().catch(console.dir)

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('book haven is running')
})

app.listen(port, () => {
    console.log(`book server app listening on port ${port}`)
})
