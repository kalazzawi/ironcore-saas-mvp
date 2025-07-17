'use client';  // Enables client-side React features like useState

import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

export default function IPAMDashboard() {
  const [prefixes, setPrefixes] = useState([]);

  useEffect(() => {
    // Fetch prefixes from backend API
    fetch('http://localhost:8080/ipam/prefixes')
      .then(res => res.json())
      .then(data => setPrefixes(data))
      .catch(err => console.error("Error fetching prefixes:", err));
  }, []);

  // Diagram elements: Nodes for each prefix
  const elements = prefixes.map(p => ({
    data: { id: p.id, label: `${p.cidr} - Tags: ${JSON.stringify(p.tags)}` }
  }));

  return (
    <div>
      <h1>IPAM Dashboard</h1>
      <ul>
        {prefixes.map(p => (
          <li key={p.id}>
            {p.cidr} - Tags: {JSON.stringify(p.tags)}
          </li>
        ))}
      </ul>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '600px', height: '400px' }}
        layout={{ name: 'circle' }}
      />
    </div>
  );
}