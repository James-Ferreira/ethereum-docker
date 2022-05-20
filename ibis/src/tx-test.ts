import DatabaseAdapter from "./db/dbAdapter"
import { TTxRecord } from './db/ttx-models'

const db = new DatabaseAdapter();
const hash = "ibis_hash_test"

let ttx_record: TTxRecord = {
    ttx_hash: hash,
    time_sent: Date.now().toString(),
    target_addr: `target_addr`,
    ibis_sender_addr: "ibis_addr",
    receipts: [],
  }

db.addTTxRecord(ttx_record)

let receipt = {
    returner_addr: "returner_addr",
    ibis_receiver_addr: "ibis_addr",
    time_returned:  Date.now().toString(),
  }
  
 db.addTTxReceipt(hash, receipt);

 //cd /usr/ibis/ethereumjs-monorepo/packages/devp2p; node -r ts-node/register ./ibis-client/tx-test.ts