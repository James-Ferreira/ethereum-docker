import Mongoose from "mongoose";
import { TTxReceipt, TTxRecord, TTxReceiptSchema, TTxRecordSchema, TTxRecordModel } from "./ttx-models";
import { DelveEntry, DelveIds, DelveResults, DelveIdsSchema, DelveResultsSchema, DelveResultsModel } from "./delve-models";


export default class DatabaseAdapter {
    _client: any;
    DB_CONN_STRING = 'mongodb://mongodb:27017/ibis_db'
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
    async addTTxReceipt(ttx_hash: string, receipt: TTxReceipt) {
        //retrieve the ttx record
        //let record: TTxRecordInterface = await TTxRecordModel.find({ttx_hash: tx_hash})
        //push the new TTxReceipt into the ttx record
        //record.save()
        console.log(`adding a TTx receipt to  ${TTxRecordModel.find({ttx_hash: ttx_hash})}`)
        let doc = await TTxRecordModel.findOneAndUpdate(
            {ttx_hash: ttx_hash},
            {$addToSet: {receipts: receipt}}
        )
        if(doc) console.log(`updated receipts  ${doc.receipts}`)

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


    // addNewTTxRecord(record: TTxRecord) {
    //     const apiUrl = "http://localhost:8080";
    //     fetch(`${apiUrl}/records`, {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //         },
      
    //         body: JSON.stringify({record}),
      
    //       }).then(async (response) => {
    //         const data = await response.json();
    //         return data.record
    //       });
    // }
  }
  