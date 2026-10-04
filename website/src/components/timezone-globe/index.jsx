// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy, Suspense, useEffect, useRef, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

const Globe = lazy(() => import('./globe'));

/** Browser-only lazy demo with loaders.gl's styled fullscreen frame. */
export default function TimezoneGlobe({height = 520, inline = false}) {
  const frame = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const fallback = <p role="status">Loading timezone globe…</p>;
  const toggleFullscreen = () =>
    fullscreen ? document.exitFullscreen() : frame.current.requestFullscreen();
  return (
    <div
      ref={frame}
      aria-label="Timezone globe"
      className={styles.frame}
      data-fullscreen={fullscreen || undefined}
      style={{'--doc-live-example-height': typeof height === 'number' ? `${height}px` : height}}
    >
      <div
        className={styles.content}
        style={{pointerEvents: inline && !fullscreen ? 'none' : 'auto'}}
        inert={inline && !fullscreen ? true : undefined}
      >
        <BrowserOnly fallback={fallback}>
          {() => (
            <Suspense fallback={fallback}>
              <Globe />
            </Suspense>
          )}
        </BrowserOnly>
      </div>
      {inline && (
        <>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={styles.fullscreenButton}
            aria-label={
              fullscreen ? 'Exit fullscreen timezone globe' : 'Open timezone globe fullscreen'
            }
            title={fullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
          >
            <span aria-hidden="true">{fullscreen ? '×' : '⛶'}</span>
          </button>
          {!fullscreen && (
            <button type="button" onClick={toggleFullscreen} className={styles.interactionGate}>
              <span>
                <span aria-hidden="true">⛶</span> Explore fullscreen
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
