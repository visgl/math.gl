// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, { Suspense, useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

/** Browser-only lazy demo with loaders.gl's styled fullscreen frame. */
export default function LiveGlobe({
  Globe,
  label,
  height,
  inline = false,
  interactive = false,
  exampleProps
}) {
  const frameHeight =
    height ?? (inline ? 520 : 'max(240px, calc(100dvh - var(--ifm-navbar-height) - 4rem))');
  const frame = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const opener = useRef(null);
  const scrollPosition = useRef({ x: 0, y: 0 });
  const active = fullscreen || expanded;
  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  useEffect(() => {
    if (!expanded) return undefined;
    const previousExpanded = document.documentElement.getAttribute('data-example-expanded');
    document.documentElement.setAttribute('data-example-expanded', 'true');
    const close = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
      }
      if (event.key === 'Tab') {
        const controls = [
          ...frame.current.querySelectorAll(
            'button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
          )
        ].filter(
          (element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first || !frame.current.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || !frame.current.contains(document.activeElement))
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', close);
    frame.current.querySelector('[data-example-close]')?.focus({ preventScroll: true });
    return () => {
      if (previousExpanded === null)
        document.documentElement.removeAttribute('data-example-expanded');
      else document.documentElement.setAttribute('data-example-expanded', previousExpanded);
      document.removeEventListener('keydown', close);
      if (frame.current?.isConnected) {
        window.scrollTo(scrollPosition.current.x, scrollPosition.current.y);
        opener.current?.focus({ preventScroll: true });
      }
    };
  }, [expanded]);
  const fallback = <p role="status">Loading {label}…</p>;
  const toggleFullscreen = async (event) => {
    if (expanded) {
      setExpanded(false);
    } else if (fullscreen) {
      await document.exitFullscreen();
    } else {
      scrollPosition.current = { x: window.scrollX, y: window.scrollY };
      opener.current = frame.current.querySelector('[data-example-close]') || event.currentTarget;
      if (typeof frame.current.requestFullscreen === 'function') {
        try {
          await frame.current.requestFullscreen();
          return;
        } catch {
          // Some browsers expose the API but reject requests for this element.
        }
      }
      setExpanded(true);
    }
  };
  return (
    <div
      ref={frame}
      aria-label={label}
      className={styles.frame}
      data-fullscreen={active || undefined}
      data-expanded={expanded || undefined}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded || undefined}
      data-inline={inline || undefined}
      style={{
        '--doc-live-example-height':
          typeof frameHeight === 'number' ? `${frameHeight}px` : frameHeight
      }}
    >
      <div
        className={styles.content}
        style={{ pointerEvents: inline && !active && !interactive ? 'none' : 'auto' }}
        inert={inline && !active && !interactive ? true : undefined}
      >
        <BrowserOnly fallback={fallback}>
          {() => (
            <Suspense fallback={fallback}>
              <Globe {...exampleProps} />
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
            data-example-close
            aria-label={active ? `Exit fullscreen ${label}` : `Open ${label} fullscreen`}
            title={active ? 'Exit fullscreen' : 'Open fullscreen'}
          >
            <span aria-hidden="true">{active ? '×' : '⛶'}</span>
          </button>
          {!active && !interactive && (
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
