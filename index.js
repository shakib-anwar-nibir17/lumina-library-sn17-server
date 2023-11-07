const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json());

// ------------MONGO DB --------------\\
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctziwlh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//collection name

const categoryCollection = client.db("luminaLibrary").collection("category");
const booksCollection = client.db("luminaLibrary").collection("books");
const borrowCollection = client.db("luminaLibrary").collection("borrow");

app.get("/category", async (req, res) => {
  const cursor = categoryCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});
app.get("/category/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await categoryCollection.findOne(query);
  res.send(result);
});

app.get("/books", async (req, res) => {
  const cursor = booksCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// bookCollection

// all books list
app.get("/books/category/:category", async (req, res) => {
  const category = req.params.category;
  const query = { category: category };
  const cursor = booksCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// api for finding single book
app.get("/books/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await booksCollection.findOne(query);
  res.send(result);
});

// update book information

app.put("/books/:id", async (req, res) => {
  const id = req.params.id;
  const updatedBook = req.body;
  console.log(id, updatedBook);
  const filter = { _id: new ObjectId(id) };

  const options = { upsert: true };

  const BookDoc = {
    $set: {
      name: updatedBook.name,
      author: updatedBook.author,
      quantity: updatedBook.quantity,
      rating: updatedBook.rating,
      category: updatedBook.category,
      image: updatedBook.image,
    },
  };
  console.log(BookDoc);
  const result = await booksCollection.updateOne(filter, BookDoc, options);
  res.send(result);
});

// add new book to data base
app.post("/books", async (req, res) => {
  const newBook = req.body;
  console.log(newBook);
  const result = await booksCollection.insertOne(newBook);
  res.send(result);
});

// borrow collection
app.post("/borrowed_books", async (req, res) => {
  const newEntry = req.body;
  console.log(newEntry);
  const result = await borrowCollection.insertOne(newEntry);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Running Lumina Library Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
