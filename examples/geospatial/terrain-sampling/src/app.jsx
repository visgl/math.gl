// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useState} from 'react';
import ExamplePanel from '../../../common/example-panel';
import Sampling from './sampling';
import MeshLab from './mesh-lab';
import BandsUpdates from './bands-updates';
import {TerrainStreaming} from './lod-streaming';
import TileTransitions from './coordinated-transitions';
import GeographicLod from './geographic-lod';
import BreaklineAuthoring from './breakline-authoring';
import './styles.css';

const groups = [
  {id: 'sampling', title: 'Sampling & analysis', Component: Sampling},
  {id: 'mesh', title: 'Mesh generation', Component: MeshLab},
  {id: 'contours', title: 'Contour tolerance', Component: BandsUpdates},
  {id: 'tiles', title: 'Tiles & LOD', Component: TileTransitions},
  {id: 'geographic', title: 'Geographic seams & LOD', Component: GeographicLod},
  {id: 'breaklines', title: 'Breakline authoring', Component: BreaklineAuthoring},
  {id: 'streaming', title: 'Streaming replay', Component: TerrainStreaming}
];

export default function TerrainSampling({style}) {
  const [active, setActive] = useState(() =>
    new URLSearchParams(window.location.search).get('terrain') === 'pacific'
      ? 'streaming'
      : 'sampling'
  );
  const [controlsRoot, setControlsRoot] = useState(null);
  const group = groups.find(item => item.id === active);
  const ActiveView = group.Component;
  return (
    <div className="terrain-sampling" style={style}>
      <section className="terrain-groups" aria-label="Terrain groups">
        {groups.map(item => (
          <ExamplePanel
            key={item.id}
            title={item.title}
            className={active === item.id ? 'terrain-group-expanded' : ''}
            open={active === item.id}
            onOpenChange={open => {
              if (open) setActive(item.id);
            }}
          >
            {active === item.id && <div ref={setControlsRoot} />}
          </ExamplePanel>
        ))}
      </section>
      <main className="terrain-stage" aria-label={group?.title || 'Terrain visualizations'}>
        {/* Unmount inactive demos so their terrain builds and update caches do no work. */}
        {ActiveView && <ActiveView key={active} controlsRoot={controlsRoot} />}
      </main>
    </div>
  );
}
