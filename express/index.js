import {TTxRecordModel, TTxReceiptModel} from './models/txrecord.js'
import express from "express"
import mongoose from "mongoose"
import bodyParser from 'body-parser';
import cors from "cors"
const PORT = 8080;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get("/records", async (req, res) => {
  console.log('received get request')
  try {
    const records = await TTxRecordModel.find();
    res.status(200).json({
      records: records.map((record) => ({
        ttx_hash: record.ttx_hash,
        time_sent: record.time_sent,
        target_addr: record.target_addr,
        ibis_sender_addr: record.ibis_sender_addr,
        receipts: record.receipts
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to fetch data." });
  }
});

app.post("/records", async (req, res) => {
  console.log("received post: ", req.body)
  const ttx_hash = req.body.ttx_hash
  const time_sent = req.body.time_sent
  const target_addr = req.body.target_addr
  const ibis_sender_addr = req.body.ibis_sender_addr
  const receipts = req.body.receipts

  const record = new TTxRecordModel({
    _id: new mongoose.Types.ObjectId(),
    ttx_hash,
    time_sent,
    target_addr,
    ibis_sender_addr,
    receipts
  });

  try {
    await record.save().catch((e) => console.log(e));
    console.log(res.status)
    res.status(200).json({
      message: "Record has been added",
      record: {
        _id: record._id,
        ttx_hash: ttx_hash,
        time_sent: time_sent,
        target_addr: target_addr,
        ibis_sender_addr: ibis_sender_addr,
        receipts: receipts
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to save." });
  }
});

mongoose.connect(
  "mongodb://mongodb:27017/ibis_db",
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
