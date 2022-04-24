import * as Mongoose from "mongoose";

// Represents a result from a Delve
export interface DelveEntry {
    node_id: string,
    timestamp: string,
}

// Represents pre-computed delve_ids
export interface DelveIds {
    node_id: string,
    computed_ids: [string],
}

export interface DelveResults {
    node_id: string,
    delved_peers: [DelveIds]
}

export const DelveIdsSchema = new Mongoose.Schema<DelveIds>({
    node_id: {type: String, required: true},
    computed_ids: {type: [String], required: true},
})
    
// Create a Schema corresponding to the document interface.
export const DelveResultsSchema = new Mongoose.Schema<DelveResults>({
    node_id: {type: String, required: true},
    delved_peers: {type: [DelveIdsSchema], required: true},
});
    
// Create a Model.
export const DelveResultsModel = Mongoose.model<DelveResults>('DelveResults', DelveResultsSchema);