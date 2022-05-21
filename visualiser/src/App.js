import { useState, useEffect } from "react";
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


  async function refreshRecords() {
    let newRecords = await fetchRecords();
    setRecords(newRecords)
  }


  async function refreshDiagram() {
    // create a bidirectional map of the records->index
    let map = createNodeMap(records)
    setNodeMap(map);

    //process the matrix to have node edges
    console.log("processing matrix with records:" + records)
    let mat = processTTxMatrix(map, records)
    setMatrix(mat)
  }

  function onSubmit(e) {
    console.log("submitting test TTx")
    addNewRecord()
    refreshDiagram()
  }

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Automatically refreshing MongoDB Records...');
      const updateAll = async () => {
        let newRecords = await fetchRecords();
          // create a bidirectional map of the records->index
        let map = createNodeMap(newRecords)

        //process the matrix to have node edges
        let mat = processTTxMatrix(map, newRecords)
        setRecords(newRecords)
        setNodeMap(map);
        setMatrix(mat)
      }

      updateAll();

    }, 2000);
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginLeft: "1em",
      height: "100vh"
    }}>
      <div style={{
        display: "flex",
        flex: "1",
        height: 800,
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
        onClick={refreshDiagram}
        >
          Update
        </Button>

        <div style={{display: "flex", flexDirection: "column", textAlign: "left"}}>
          <span style={{color: "white"}}># TTxRecords: {records.length} </span>
          <span style={{color: "white"}}># Distinct Nodes: {nodeMap.size} </span>
          <span style={{color: "white"}}># Matrix Size: {matrix.length} </span>
          {/* {Records(records)} */}
        </div>


      </div>

      <div style={{
      display:"flex",
      flex: "3",
      padding: "1em",
      alignItems: "center",
      justifyContent: "center",
      background: "#30303030",
      borderRadius: "16px",
      marginLeft: "1em"
      }}>
        {ChordContainer(matrix, nodeMap)}
      </div>
    </div>
  );
}

export default App;
