// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React from 'react';

/** Read slopes from the same displayed tiles and native stencils as the surface arrows. */
export default function SeamExplorer({scene}) {
  const format = value => (value ? `${value.x.toFixed(3)}, ${value.y.toFixed(3)}` : 'Unavailable');
  return (
    <div className="terrain-seam-readings">
      <table aria-label="Shared boundary gradients">
        <thead>
          <tr>
            <th>Seam Y</th>
            <th>Fine gradient (X, Y)</th>
            <th>Coarse gradient (X, Y)</th>
          </tr>
        </thead>
        <tbody>
          {scene.seam.map(row => (
            <tr key={row.y}>
              <td>{row.y}</td>
              <td>{format(row.fine)}</td>
              <td>{row.coarseNode ? format(row.coarse) : 'No coarse node'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
