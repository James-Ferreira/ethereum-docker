import {Schema, model, connect} from "mongoose";
import { TTxModel } from "./taggedtransaction";
import { DatabaseAdapter } from "./dbAdapter";

let dbAdapter = new DatabaseAdapter();

dbAdapter.addRecord({
  name: '172.0.0.0',
  ttxhash: '0fx233asdnasdjn23ajsnd',
  time: Date.now().toString(),
})

dbAdapter.findRecord();