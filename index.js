const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Running Lumina Library Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
