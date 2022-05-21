import React from 'react';
import ChordDiagram from 'react-chord-diagram'
import Gradient from "javascript-color-gradient";

export default function ChordContainer(matrix, nodeMap) {
  //const gradientArray = ["green"]
  const gradientArray = new Gradient()
  .setColorGradient(
    "#eb1418",
    "#db3e00",
    "#fccb00",
    "#00d084",
    "#0693e3",
    "#9900ef",
    "#f78da7"
    )
  .setMidpoint(nodeMap.size)
  .getColors();

  return (
    <div
    style={{
      display: "flex",
      width: 800,
      height: 800,
      alignItems: "center",
      justifyContent: "center"
      }}>
    {nodeMap.size > 0 ?
      <ChordDiagram
      matrix={matrix}
      componentId={1}
      groupLabels={[...nodeMap.keys()]}
      groupColors={gradientArray}
      groupOnClick={(idx) => alert('Clicked group: ' + nodeMap.getKey(idx))}
      ribbonOnClick={(idx) => alert('Clicked ribbon: ' + idx)}
      width={800}
      height={800}
      style={{ font: "10px sans-serif", padding: "15px" }}
    />
    :
      <span> There is nothing to display (yet)</span>
    }

    </div>
  )
  }