const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// logger middleware
const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

// verify token

//token verify middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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

// auth related api
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    expiresIn: "1h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

//logout

app.post("/logout", async (req, res) => {
  const user = req.user;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    expiresIn: "1h",
  });
  res
    .clearCookie("token", token, {
      maxAge: 0,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

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
  console.log(req.body);
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

  const result = await booksCollection.updateOne(filter, BookDoc, options);
  res.send(result);
});

// update a small part

app.patch("/books/:id", async (req, res) => {
  const id = req.params.id;
  const updatedBook = req.body;
  const filter = { _id: new ObjectId(id) };

  const BookDoc = {
    $set: {
      quantity: updatedBook.quantity,
    },
  };

  const result = await booksCollection.updateOne(filter, BookDoc);
  res.send(result);
});

// add new book to data base
app.post("/books", logger, verifyToken, async (req, res) => {
  console.log(req);
  console.log("owner", req.user);
  //verify
  const newBook = req.body;
  const result = await booksCollection.insertOne(newBook);
  res.send(result);
});

// borrow collection

app.get("/borrowed_books", logger, verifyToken, async (req, res) => {
  console.log(req.query.email);
  console.log("owner", req.user);
  //verify
  if (req.query.email !== req.user.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  //
  let query = {};
  if (req.query?.email) {
    query = { email: req.query.email };
  }
  const cursor = borrowCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

app.post("/borrowed_books", async (req, res) => {
  const newEntry = req.body;
  const result = await borrowCollection.insertOne(newEntry);
  res.send(result);
});

app.delete("/borrowed_books/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await borrowCollection.deleteOne(query);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Running Lumina Library Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
