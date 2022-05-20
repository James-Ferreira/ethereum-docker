import { useRef, useState, useEffect } from "react";
import ChordContainer from "./containers/ChordContainer";

function App() {
  const inputText = useRef("");
  const apiUrl = "http://localhost:8080";
  const [records, setRecords] = useState([]);

  async function fetchRecords() {
    const res = await fetch(`${apiUrl}/records`);
    const data = await res.json();
    console.log("fetched ", data)
    setRecords(data.records);
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    addNewRecord();
  }

  function addNewRecord() {
    const name = "fake ttx"
    const hash = "fake hash"
    const time = Date.now().toString()
    fetch(`${apiUrl}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, hash, time }),
    }).then(async (response) => {
      const data = await response.json();

      const newData = [...records, data.record];
      setRecords(newData);
      inputText.current.value = "";
    });
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
  const matrix = [
    [0, 0, 0, 1], //A black
    [0, 1, 1, 1], //B yellow
    [0, 1, 1, 1], //C brown
    [0, 1, 1, 0], //D orange
  ]; 

  return (
    <div style={{
      height: "100vh",
      width: "100vw"
    }}>
      {/* <CytoContainer /> */}
      <button onClick={onSubmit}> Submit Fake TTX </button>
      <button onClick={fetchRecords}> Fetch </button>

      <h1> TxRecords </h1>
      <ul>
        {records.map((record) => (
          <li style={{ color: "red", fontSize: "18px" }}>{record.name} received {record.hash} at {record.time}</li>
        ))}
      </ul>

      <h1> Tagged Transactions </h1>

      {ChordContainer(matrix)}

    </div>
  );
}

export default App;
