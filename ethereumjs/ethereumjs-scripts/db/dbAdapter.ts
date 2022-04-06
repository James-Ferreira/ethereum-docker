import { connect } from "mongoose";
import { TTxModel, TTxRecord, TTxSchema } from "./taggedtransaction";

export default class DatabaseAdapter {
    _client: any;
    DB_CONN_STRING = 'mongodb://cont_mongodb:27017/ttx-records'
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
  
    async connectToDb() {
        try {
            console.log("connecting to db...")

            let client = await connect(this.DB_CONN_STRING, this.CONN_OPTS);
            console.log("connected")
            return client;
        } catch(e) {
            console.log(e);
        }
    }
  

    async addRecord(record: TTxRecord) {
        let doc = new TTxModel(record)
        // doc.createdAt;
        // doc.updatedAt;
        await doc.save();
        console.log("wrote: " + doc)
    }

    async findRecord() {
        const records = await TTxModel.find();
        console.log(records);
        return records;
    }

    // // using api
    // async fetchRecords() {
    //     const apiUrl = "http://localhost:8080";
    //     const res = await fetch(`${apiUrl}/records`);
    //     const data = await res.json();
    //     console.log(data);
    // }

    // // using api
    // async addNewRecord(record: TTxRecord) {
    //     const apiUrl = "http://localhost:8080";
    //     const text = record.name;
    //     fetch(`${apiUrl}/records`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({ text }),
    //     }).then(async (response: any) => {
    //       const data = await response.json();
    //         console.log(data)
    //     });
    // }
  }
  