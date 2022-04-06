import Record from "./Record";
function Records({ records }) {
  return (
    <div>
      {records.map((record) => (
        <Record key={record.id} name={record.name} hash={record.ttxhash} time={record.time} />
      ))}
    </div>
  );
}

export default Records;