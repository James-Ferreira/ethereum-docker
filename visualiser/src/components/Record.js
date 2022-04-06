function Record({ name, hash, time }) {
    return <p style={{ color: "red", fontSize: "25px" }}>{name} received {hash} at {time}</p>;
  }
  
  export default Record;