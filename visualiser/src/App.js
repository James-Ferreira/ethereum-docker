import { useState } from "react";
import ChordContainer from "./containers/ChordContainer";
import { addNewRecord, fetchRecords, printBiMap, createNodeMap, createMatrix, processTTxMatrix } from "./util/helperFunctions";
import Records from "./components/Records";
import BiMap from 'bidirectional-map'
// MUI
import Button from '@mui/material/Button';
import ibis from './assets/ibis-logo.png'

function App() {
  const [records, setRecords] = useState([]);
  const [matrix, setMatrix] = useState([])
  const [nodeMap, setNodeMap] = useState(new BiMap())

  async function onRefresh() {
    let fetchedRecords = await fetchRecords();
    setRecords(fetchedRecords);
    console.log("refreshed " + fetchedRecords.length + " records...")
    //nodeIndexMap = updateNodeMap(nodeIndexMap, fetchedRecords);
    let bi_map = createNodeMap(records)

    let node_matrix = createMatrix(bi_map.size);
    node_matrix = processTTxMatrix(node_matrix, bi_map, records)
    console.log(node_matrix)
    setNodeMap(bi_map)
    setMatrix(node_matrix)
  }

  function onSubmit(e) {
    console.log("submitting test TTx")
    addNewRecord()
    onRefresh()
  }

  /*
    Computes the chord layout for the specified square matrix of size n×n, 
    where the matrix represents the directed flow amongst a network (a complete digraph)
    of n nodes.
    
    The given matrix must be an array of length n, where each element matrix[i] is an
    array of n numbers, where each matrix[i][j] represents the flow from the ith node
    in the network to the jth node. 
    
    Each number matrix[i][j] must be nonnegative, though it can be zero if there is no
    flow from node i to node j. 
  */
  // const matrix = [
  //   [0, 1, 1, 0], //A black
  //   [1, 0, 1, 1], //B yellow
  //   [1, 1, 0, 0], //C brown
  //   [1, 0, 0, 0], //D orange
  // ]; 



  return (
    <div style={{
      display: "flex",
      alignItems: "center"
    }}>
      <div style={{
        display: "flex",
        flex: "1",
        borderRadius: "24px",
        flexDirection: "column",
        padding: "1em",
        background: "linear-gradient(90deg, rgba(112,217,99,1) 0%, rgba(127,190,236,1) 37%, rgba(185,243,255,1) 100%)",
        textAlign: "center", 
        alignItems: "center"
      }}>
        <img style={{width: "10em"}}src ={ibis} />
        <h1> IBIS VISUALISER</h1>
        <div></div>
        <Button
        sx={{marginBottom: "2em", width: "85%"}}
        variant="contained"
        onClick={onSubmit}
        >
            Submit Fake TTX
        </Button>

        <Button
        sx={{marginBottom: "2em", width: "85%"}}
        variant="contained"
        onClick={onRefresh}
        >
          Fetch
        </Button>

        <div>
          <span style={{color: "white"}}>There are ({records.length}) TTxRecords</span>
          {Records(records)}
        </div>


      </div>

      <div style={{
      display:"flex",
      flex: "3",
      padding: "1em",
      alignItems: "center",
      justifyContent: "center"
      }}>
        {ChordContainer(matrix, nodeMap)}
      </div>
    </div>
  );
}

export default App;
