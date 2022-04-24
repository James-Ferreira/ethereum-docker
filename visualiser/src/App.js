import { useRef, useState, useEffect } from "react";
import Records from "./components/Records";
import CytoContainer from './containers/CytoContainer';

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

      
    </div>
  );
}

export default App;
