import * as Mongoose from "mongoose";

// Create an interface representing a document in MongoDB.
export interface TTxRecord {
name: string;
ttxhash: string;
time: string;
}

// Create a Schema corresponding to the document interface.
export const TTxSchema = new Mongoose.Schema<TTxRecord>({
name: { type: String, required: true },
ttxhash: { type: String, required: true },
time: { type: String, required: true },
});
  
// Create a Model.
export const TTxModel = Mongoose.model<TTxRecord>('TTxRecord', TTxSchema);