function Record({ key, ttx_hash, time_sent, target_addr, ibis_sender_addr, receipts}) {
    return <p style={{ color: "#303030", fontSize: "12px" }}>
      {target_addr} received {ttx_hash} at {time_sent} from {ibis_sender_addr} and has {receipts.length} receipts
      </p>;
  }
  
  export default Record;