import Mongoose from "mongoose";
import { TTxReceipt, TTxRecord, TTxReceiptSchema, TTxRecordSchema, TTxRecordModel } from "./ttx-models";
import { DelveEntry, DelveIds, DelveResults, DelveIdsSchema, DelveResultsSchema, DelveResultsModel } from "./delve-models";


export default class DatabaseAdapter {
    _client: any;
    DB_CONN_STRING = 'mongodb://cont_mongodb:27017/ibis_db'
    CONN_OPTS = {
        auth: {
          username: "admin",
          password: "admin",
        },
        authSource: "admin",
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }

    constructor() {
        this._client = this.connectToDb()
    }
  
    /**
     * Connect to the MongoDB Client
     * @returns
     */
    async connectToDb() {
        try {
            console.log("connecting to db...")

            let client = await Mongoose.connect(this.DB_CONN_STRING, this.CONN_OPTS);
            console.log("connected")
            return client;
        } catch(e) {
            console.log(e);
        }
    }
  

    /* === TAGGED TRANSACTION === */

    /**
     * Adds a Transaction Receipt to an existing TxRecord
     * @param hash 
     * @param receipt 
     */
    async addTTxReceipt(tx_hash: string, receipt: TTxReceipt) {
        //retrieve the ttx record
        //let record = await this.findTxRecord(tx_hash);
        //push the new TTxReceipt into the ttx record
        //record.receipts.push(receipt);
        TTxRecordModel.update(
            {ttx_hash: tx_hash},
            {$addToSet: {receipts: receipt}}
        )
    }

    /**
     * Adds a Transaction Record to the database
     * @param record 
     */
    async addTTxRecord(record: TTxRecord) {
        let doc = new TTxRecordModel(record)
        await doc.save()
    }

    /**
     * Locates and returns a Tagged Transaction Record
     * @param tx_hash transaction hash to find
     * @returns 
     */
    async findTxRecord(tx_hash: string) {
        const record = await TTxRecordModel.find({ttx_hash: tx_hash});
        return record;
    }

    /**
     * Counts the number of TxRecords currently in the database
     */
    async countTxRecord() {
        let res = await TTxRecordModel.find()
        return res.length
    }

    /* === DELVE === */

    // async addDelveEntry(target: string, entry: DelveEntry) {
    //     let record = await DelveResultsModel.find(target);
    //     console.log("returned: ", record);
        
    // }



  }
  