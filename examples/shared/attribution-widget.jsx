// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from "react";
import "./attribution-widget.css";

/** Compact source credits shared by standalone examples and website embeds. */
export default function AttributionWidget({ sources }) {
  return (
    <details className="attribution-widget">
      <summary>
        <span>Data attribution</span>
        <small>{sources.map((source) => source.credit).join(" · ")}</small>
      </summary>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>
            <strong>{source.title}</strong>
            <p>{source.creators || source.credit}</p>
            <div className="attribution-widget-links">
              <a href={source.dataset} target="_blank" rel="noreferrer">
                Original data ↗
              </a>
              {source.paper && (
                <a href={source.paper} target="_blank" rel="noreferrer">
                  Study ↗
                </a>
              )}
              <a href={source.licenseUrl} target="_blank" rel="noreferrer">
                {source.license} ↗
              </a>
              {source.hosted && (
                <a href={source.hosted} target="_blank" rel="noreferrer">
                  Hosted copy ↗
                </a>
              )}
            </div>
            {source.changes && (
              <p>
                <b>Display changes:</b> {source.changes}
              </p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
