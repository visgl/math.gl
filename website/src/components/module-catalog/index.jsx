// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

const modules = [
  [
    "Core",
    "core",
    "Vectors, matrices, quaternions, and the foundations of 3D math.",
    "Transforms · Types · Expressions",
  ],
  [
    "Geometry",
    "geometry",
    "Build, query, and process shapes from curves and polygons to 3D meshes.",
    "Curves · Polygons · Culling · Spatial indexes",
  ],
  [
    "Geospatial",
    "geospatial",
    "Work with geographic coordinates, reference systems, and map projections.",
    "CRS · Projections · Terrain",
  ],
  [
    "Earth",
    "earth",
    "Connect locations with Earth models, daylight, and local time.",
    "Geoid · Sun · Timezones",
  ],
  [
    "DGGS 🧪",
    "dggs",
    "Explore discrete global grids and decode geographic cell boundaries.",
    "H3 · S2 · GeoHash · A5",
  ],
  [
    "Web Mercator",
    "web-mercator",
    "Project geographic coordinates and control cameras for interactive web maps.",
    "Projection · Viewports · Camera fitting",
  ],
  ["Arrow", "arrow", "Process binary data and exchange Arrow and GeoArrow representations.", "UTF-8 · Arrow · GeoArrow · WKB/WKT"],
  ["Tasks", "tasks", "Schedule typed work locally and in browser or Node workers.", "Scheduling · Workers · Streams · State"],
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
          <li key={id}>
            <Link className={styles.card} to={`/docs/modules/${id}`}>
              <h2>{name}</h2>
              <code>@math.gl/{id}</code>
              <p>{description}</p>
              <span className={styles.capabilities}>{capabilities}</span>
              <span className={styles.action}>
                Explore module <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
