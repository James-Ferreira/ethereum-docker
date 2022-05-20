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
    <div style={{
      display: 'flex',
      marginLeft: '10em',
      border: '1px solid red',
      height: "600px",
      width: "800px",
      justifyContent: "center",
      alignContent: "center",
      padding: "2em"
      }}>
      <ChordDiagram
        matrix={matrix}
        componentId={1}
        style={{fontFamily: 'sans-serif'}}
        groupLabels={[...nodeMap.keys()]}
        groupColors={gradientArray}
        groupOnClick={(idx) => alert('Clicked group: ' + idx)}
        ribbonOnClick={(idx) => alert('Clicked ribbon: ' + idx)}
        height={600}
        width={800}
      />
    </div>
  )
  }