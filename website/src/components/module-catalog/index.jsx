// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

const modules = [
  ['Core', 'core', 'Vectors, matrices, quaternions, and the foundations of 3D math.', [
    ['Transforms', 'core/developer-guide/transformations'], ['Types', 'core/types'], ['Expressions', 'core/expressions']
  ]],
  ['Geometry', 'geometry', 'Build, query, and process shapes from curves and polygons to 3D meshes.', [
    ['Curves', 'geometry/curves'], ['Polygons', 'geometry/polygon'], ['Culling', 'geometry/culling'], ['Spatial indexes', 'geometry/spatial-index']
  ]],
  ['Geospatial', 'geospatial', 'Work with geographic coordinates, reference systems, and map projections.', [
    ['CRS', 'geospatial/crs'], ['Projections', 'geospatial/projection'], ['Terrain', 'geospatial/terrain']
  ]],
  ['Earth', 'earth', 'Connect locations with Earth models, daylight, and local time.', [
    ['Geoid', 'earth/geoid'], ['Sun', 'earth/sun'], ['Timezones', 'earth/timezone']
  ]],
  ['DGGS 🧪', 'dggs', 'Explore discrete global grids and decode geographic cell boundaries.', [
    ['H3', 'dggs/api-reference/h3-decoder'], ['A5', 'dggs/api-reference/a5-decoder'], ['S2', 'dggs/api-reference/s2-decoder'], ['GeoHash', 'dggs/api-reference/geohash-decoder'], ['Quadkey', 'dggs/api-reference/quadkey-decoder'], ['Plus Code', 'dggs/api-reference/plus-code-decoder']
  ]],
  ['Web Mercator', 'web-mercator', 'Project geographic coordinates and control cameras for interactive web maps.', [
    ['Projection', 'web-mercator/api-reference/web-mercator-utils'], ['Viewports', 'web-mercator/api-reference/web-mercator-viewport'], ['Camera fitting', 'web-mercator/api-reference/web-mercator-viewport#fitboundsbounds-options-object']
  ]],
  ['Arrow', 'arrow', 'Process binary data and exchange Arrow and GeoArrow representations.', [
    ['UTF-8', 'arrow/utf8'], ['GeoArrow', 'arrow/geoarrow'], ['GeoArrow utilities', 'arrow/geoarrow-utils'], ['WKB/WKT', 'arrow/wkb']
  ]],
  ['Tasks', 'tasks', 'Schedule typed work locally and in browser or Node workers.', [
    ['Scheduling', 'tasks/developer-guide/execution'], ['Workers', 'tasks/developer-guide/custom-workers'], ['Streams', 'tasks/developer-guide/task-runner'], ['State', 'tasks/developer-guide/persistent-resources']
  ]]
];

export default function ModuleCatalog() {
  return (
    <>
      <p>
        Choose a module for your application. Each overview introduces its
        capabilities, guides, and API.
      </p>
      <ul className={styles.grid}>
        {modules.map(([name, id, description, capabilities]) => (
          <li key={id} className={styles.card}>
            <Link className={styles.primaryLink} to={`/docs/modules/${id}`}>
              <h2>{name}</h2>
              <code>@math.gl/{id}</code>
              <p>{description}</p>
            </Link>
            <div className={styles.capabilities}>
              {capabilities.map(([label, path], index) => (
                <React.Fragment key={label}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <Link to={`/docs/modules/${path}`}>{label}</Link>
                </React.Fragment>
              ))}
            </div>
            <Link className={styles.action} to={`/docs/modules/${id}`}>
              Explore module <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
