// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original UI following the inline documentation benchmark pattern in loaders.gl.
import React, {useEffect, useRef, useState} from 'react';
import {
  IMPLEMENTATIONS,
  SAMPLE_COUNT,
  SCENARIOS
} from '../../../../modules/proj4/test/live-bench-types';
import type {BenchmarkOptions, BenchmarkRow} from '../../../../modules/proj4/test/live-bench-types';
import styles from './styles.module.css';

type Status = 'idle' | 'running' | 'complete' | 'stopped' | 'error';

/** Inline, user-started comparison. Algorithm code runs only in the worker. */
export default function Proj4Benchmarks() {
  const [options, setOptions] = useState<BenchmarkOptions>({
    points: 10000,
    precision: 'Float64',
    dimension: 2,
    direction: 'project'
  });
  const [status, setStatus] = useState<Status>('idle');
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState('');
  const workerRef = useRef<Worker | null>(null);
  const running = status === 'running';
  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  function change(next: Partial<BenchmarkOptions>) {
    setOptions(previous => ({...previous, ...next}));
    setRows([]);
    setStatus('idle');
    setError('');
  }
  function stop() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus('stopped');
  }
  function run() {
    if (workerRef.current) return;
    setRows([]);
    setError('');
    setStatus('running');
    try {
      const worker = new Worker(new URL('./benchmark.worker.ts', import.meta.url), {
        type: 'module'
      });
      workerRef.current = worker;
      const finish = () => {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      };
      worker.onmessage = ({data}) => {
        if (workerRef.current !== worker) return;
        if (data.type === 'row') setRows(previous => [...previous, data.row]);
        if (data.type === 'complete') {
          setVersion(data.summary.proj4Version);
          setStatus('complete');
          finish();
        }
        if (data.type === 'error') {
          setError(data.message);
          setStatus('error');
          finish();
        }
      };
      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        setError(
          'The benchmark worker could not run. Check your connection or browser settings and try again.'
        );
        setStatus('error');
        finish();
      };
      worker.postMessage(options);
    } catch (failure) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setError(failure instanceof Error ? failure.message : String(failure));
      setStatus('error');
    }
  }

  const statusText = {
    idle: 'Ready to run in your browser.',
    running: `Running… ${rows.length} of ${SCENARIOS.length} projections complete.`,
    complete: 'Complete. All coordinates checked against proj4js before timing.',
    stopped: 'Stopped. Completed rows are shown below.',
    error: 'Benchmark failed. Results are incomplete.'
  }[status];

  return (
    <section className={styles.panel} aria-label="Live projection benchmarks">
      <fieldset className={styles.controls} disabled={running}>
        <legend>Benchmark settings</legend>
        <label>
          Coordinates
          <select
            aria-label="Coordinates"
            value={options.points}
            onChange={event => change({points: Number(event.target.value)})}
          >
            <option value={2000}>2,000</option>
            <option value={10000}>10,000</option>
            <option value={50000}>50,000</option>
          </select>
        </label>
        <label>
          Precision
          <select
            aria-label="Precision"
            value={options.precision}
            onChange={event =>
              change({precision: event.target.value as BenchmarkOptions['precision']})
            }
          >
            <option>Float64</option>
            <option>Float32</option>
          </select>
        </label>
        <label>
          Layout
          <select
            aria-label="Layout"
            value={options.dimension}
            onChange={event =>
              change({dimension: Number(event.target.value) as BenchmarkOptions['dimension']})
            }
          >
            <option value={2}>XY</option>
            <option value={3}>XYZ</option>
            <option value={4}>XYZM</option>
          </select>
        </label>
        <label>
          Direction
          <select
            aria-label="Direction"
            value={options.direction}
            onChange={event =>
              change({direction: event.target.value as BenchmarkOptions['direction']})
            }
          >
            <option value="project">Forward</option>
            <option value="unproject">Inverse</option>
          </select>
        </label>
      </fieldset>
      <div className={styles.actions}>
        <button type="button" className="button button--primary" onClick={run} disabled={running}>
          {rows.length ? 'Run again' : 'Run benchmarks'}
        </button>
        {running && (
          <button type="button" className="button button--secondary" onClick={stop}>
            Stop
          </button>
        )}
        <span role="status">{statusText}</span>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <div
          className={styles.tableScroll}
          tabIndex={0}
          role="region"
          aria-label="Benchmark results"
        >
          <table className={styles.results}>
            <caption>
              Million coordinates per second · higher is faster · {options.precision},{' '}
              {options.dimension} ordinates,{' '}
              {options.direction === 'project' ? 'forward' : 'inverse'}
            </caption>
            <thead>
              <tr>
                <th scope="col">Projection</th>
                {IMPLEMENTATIONS.map(name => (
                  <th key={name} scope="col">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const fastest = Math.min(...row.measurements.map(result => result.milliseconds));
                return (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    {row.measurements.map((result, index) => (
                      <td
                        key={IMPLEMENTATIONS[index]}
                        className={result.milliseconds === fastest ? styles.fastest : undefined}
                      >
                        {result.milliseconds > 0
                          ? (options.points / result.milliseconds / 1000).toFixed(2)
                          : 'Below timer resolution'}
                        <small>
                          {result.milliseconds.toFixed(2)} ms
                          {result.milliseconds === fastest && result.milliseconds > 0
                            ? ' · Fastest'
                            : ''}
                        </small>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>
        {SAMPLE_COUNT} warmed samples per implementation; median shown. Imports, construction and
        buffer resets are excluded. Keep this tab visible while running. Results depend on your
        browser and hardware.
      </p>
      {version && (
        <p className={styles.note}>
          math.gl website build compared with proj4js {version}. All implementations run in the same
          worker.
        </p>
      )}
    </section>
  );
}
