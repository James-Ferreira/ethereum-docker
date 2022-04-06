const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var cors = require("cors");

const PORT = 8080;
const app = express();
const TTxModel = require("./models/txrecord");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get("/records", async (req, res) => {
  console.log('received get request')
  try {
    const records = await TTxModel.find();
    res.status(200).json({
      records: records.map((record) => ({
        id: record.id,
        name: record.name,
        ttxhash: record.ttxhash,
        time: record.time,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to fetch data." });
  }
});

app.post("/records", async (req, res) => {
  console.log("received post")
  const name = req.body.name;
  const ttxhash = req.body.ttxhash;
  const time = req.body.time;
  console.log(req.body.text);
  const record = new TTxModel({
    _id: new mongoose.Types.ObjectId(),
    name,
    ttxhash,
    time
  });

  try {
    await record.save().catch((e) => console.log(e));
    res.status(201).json({
      message: "Record has been added",
      record: { _id: record._id, name: text, ttxhash: ttxhash, time: time },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to save." });
  }
});

mongoose.connect(
  "mongodb://cont_mongodb:27017/ttx-records",
  {
    auth: {
      username: "admin",
      password: "admin",
    },
    authSource: "admin",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error("failed to connect to mongoDB");
      console.error(err);
    } else {
      console.log("mongodb is running and secured");
      app.listen(PORT);
    }
  }
);
