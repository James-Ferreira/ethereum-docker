const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TTxSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  ttxhash: { type: String, required: true },
  time: { type: String, required: true },
});

const TTxModel = mongoose.model("TTxRecord", TTxSchema);

module.exports = TTxModel;