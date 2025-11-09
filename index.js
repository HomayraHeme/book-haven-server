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
