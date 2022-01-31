import React, { useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import nodeImage from '../assets/yin_yang_bordered.svg'


Cytoscape.use(COSEBilkent);

async function fetchJson() {
    
}

export default function CytoContainer(props) {
    
    const elements = {
        nodes: [
          { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
          { data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 } }
        ],
        edges: [
          {
            data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2' }
          },
          {
            data: { source: 'two', target: 'one', label: 'Edge from Node2 to Node1' }
          }
        ]
      }

    const layout = { name: 'cose-bilkent' };



    return (
    <div style={{
        display:"flex",
        justifyContent: "center",
        alignContent: "center",
        width: "85vw",
        height: "80vh",
        border: "3px solid black"
    }}>
        <CytoscapeComponent
          style={{width: "100vw", height: "100vh"}}
          elements={CytoscapeComponent.normalizeElements(elements)}
          layout={layout}
          stylesheet={[
            {
              selector: 'node',
              style: {
                backgroundImage: {nodeImage},
                width: 20,
                height: 20,
                shape: 'circle'
              }
            },
            {
              selector: 'edge',
              style: {
                width: 3,
                lineColor: "red",
                targetArrowShape: "triangle",
                targetArrowColor: "blue"
              }
            }
          ]}
        />
      </div>
    );
  }