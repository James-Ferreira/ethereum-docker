import mongoose from "mongoose"
const Schema = mongoose.Schema;


/* TTxReceipt */
const TTxReceiptSchema = new Schema({
  returner_addr: {type: String, required: true},
  ibis_receiver_addr: {type: String, required: true},
  time_returned: {type: String, required: true},
})
export const TTxReceiptModel = mongoose.model("TTxReceipt", TTxReceiptSchema)

/* TTxRecord */
const TTxRecordSchema = new Schema({
  ttx_hash: {type: String, required: true},
  time_sent: String,
  target_addr: String,
  ibis_sender_addr: String,
  receipts: [TTxReceiptSchema],
})
export const TTxRecordModel = mongoose.model("TTxRecord", TTxRecordSchema)

// const TTxSchema = new Schema({
//   _id: mongoose.Schema.Types.ObjectId,
//   name: { type: String, required: true },
//   ttxhash: { type: String, required: true },
//   time: { type: String, required: true },
// });

// const TTxModel = mongoose.model("TTxRecord", TTxSchema);

// module.exports = TTxModel;


/*
For every TTxRecord
  let targt_addr = t
  for every receipt
    let returner_addr = r
    createLink(t, r)
*/