import React from 'react';
import ChordDiagram from 'react-chord-diagram'
import Gradient from "javascript-color-gradient";

export default function ChordContainer(matrix, nodeMap) {
  //const gradientArray = ["green"]
  const gradientArray = new Gradient()
  .setColorGradient("#3F2CAF", "#e9446a", "#edc988", "#607D8B")
  .setMidpoint(20)
  .getColors();

  return (
    <>
      <ChordDiagram
        matrix={matrix}
        componentId={1}
        groupLabels={[...nodeMap.keys()]}
        groupColors={gradientArray}
        groupOnClick={(idx) => alert('Clicked group: ' + idx)}
        ribbonOnClick={(idx) => alert('Clicked ribbon: ' + idx)}
        width={800}
        height={800}
        style={{ font: "10px sans-serif", padding: "15px" }}
      />
    </>
  )
  }