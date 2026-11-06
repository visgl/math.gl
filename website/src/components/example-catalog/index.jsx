// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import groups from "../../examples/table-of-contents.json";
import styles from "./styles.module.css";
const descriptions = {
  core: "Explore transforms and expression evaluation.",
  geometry: "Build shapes, manipulate polygons, and test visibility.",
  geospatial:
    "Explore projections, coordinate systems, terrain, and geographic data.",
  earth: "Explore daylight, timezones, and Earth gravity models.",
  dggs: "Inspect cells and boundaries across global grids.",
};
export default function ExampleCatalog() {
  const images = useBaseUrl("/images/examples/");
  return (
    <>
      <p>
        Interactive examples of math.gl in action. Open a card to explore the
        controls and source code.
      </p>
      <nav className={styles.navigation} aria-label="Example modules">
        {groups
          .filter((g) => g.type === "category")
          .map((g) => (
            <a key={g.label} href={`#${g.label.split("/")[1]}`}>
              {g.label.split("/")[1]}
            </a>
          ))}
      </nav>
      {groups
        .filter((g) => g.type === "category")
        .map((group) => {
          const id = group.label.split("/")[1];
          return (
            <section key={id} className={styles.section}>
              <h2 id={id}>{group.label}</h2>
              <p>{descriptions[id]}</p>
              <div className={styles.grid}>
                {group.items.map((item) => (
                  <Link
                    className={styles.card}
                    key={item.id}
                    to={`/examples/${item.id}`}
                  >
                    <img
                      src={`${images}${item.id}.jpg`}
                      alt=""
                      loading="lazy"
                      width="480"
                      height="270"
                    />
                    <span>
                      {item.label || "Benchmarks"}{" "}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
    </>
  );
}
