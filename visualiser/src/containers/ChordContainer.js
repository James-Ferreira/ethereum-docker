import React from 'react';
import ChordDiagram from 'react-chord-diagram'

export default function ChordContainer(matrix) {

  return (
    <div style={{
      display: 'flex',
      marginLeft: '10em',
      border: '1px solid red',
      height: "600px",
      width: "800px",
      justifyContent: "center",
      alignContent: "center"
      }}>
      <ChordDiagram
        matrix={matrix}
        componentId={1}
        style={{fontFamily: 'sans-serif'}}
        groupLabels={['A', 'B', 'C', 'D']}
        groupColors={['black', 'yellow', 'brown', 'orange']}
        groupOnClick={(idx) => alert('Clicked group: ' + idx)}
        ribbonOnClick={(idx) => alert('Clicked ribbon: ' + idx)}
        height={500}
        width={650}
      />
    </div>
  )
  }