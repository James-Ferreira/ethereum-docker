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
    const text = "fake ttx"
    fetch(`${apiUrl}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
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
        <Records records={records} />
    </div>
  );
}

export default App;
