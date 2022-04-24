import * as Mongoose from "mongoose";

// Represents a returned TTx
export interface TTxReceipt {
    returner_addr: string,
    ibis_receiver_addr: string,
    time_returned: string,
}

// Represents all details relating to a Tagged Transaction
export interface TTxRecord {
    ttx_hash: string;
    time_sent: string;
    target_addr: string,
    ibis_sender_addr: string,
    receipts: Array<TTxReceipt>,
    }

export const TTxReceiptSchema = new Mongoose.Schema<TTxReceipt>({
    returner_addr: String,
    ibis_receiver_addr: String,
    time_returned: String,
})
    
// Create a Schema corresponding to the document interface.
export const TTxRecordSchema = new Mongoose.Schema<TTxRecord>({
    ttx_hash: {type: String, required: true},
    time_sent: String,
    target_addr: String,
    ibis_sender_addr: String,
    receipts: [TTxReceiptSchema],
});
    
// Create a Model.
export const TTxRecordModel = Mongoose.model<TTxRecord>('TTxRecord', TTxRecordSchema);