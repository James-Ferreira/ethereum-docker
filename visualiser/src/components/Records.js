import Record from "./Record";

function Records(records) {
  return (
    <div>
      {records.map((record) => (
        <Record
          key = {record._id}
          ttx_hash = {record.ttx_hash}
          time_sent = {record.time_sent}
          target_addr = {record.target_addr}
          ibis_sender_addr = {record.ibis_sender_addr}
          receipts = {record.receipts}
        />
      ))}
    </div>
  );
}

export default Records;