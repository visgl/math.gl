// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {BenchResultsWidget} from 'probe.gl/bench-widget';
import type {LogEntry} from 'probe.gl/bench';
import styles from './styles.module.css';

/** Run the general benchmark suite only on request, away from the documentation UI. */
export default function CoreBenchmarks() {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<BenchResultsWidget | null>(null);
  const worker = useRef<Worker | null>(null);
  const records = useRef<LogEntry[]>([]);
  const [suite, setSuite] = useState<'core' | 'all'>('core');
  const [status, setStatus] = useState('Ready');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    widget.current = new BenchResultsWidget({container: container.current!});
    return () => {
      worker.current?.terminate();
      worker.current = null;
      widget.current?.destroy();
      widget.current = null;
    };
  }, []);

  function stop() {
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
    setStatus('Stopped');
  }

  function run() {
    if (worker.current) return;
    records.current = [];
    widget.current?.setProps({records: []});
    setRunning(true);
    setStatus('Running');
    try {
      const active = new Worker(new URL('./benchmark.worker.ts', import.meta.url), {type: 'module'});
      worker.current = active;
      const finish = (message: string) => {
        if (worker.current !== active) return;
        active.terminate();
        worker.current = null;
        setRunning(false);
        setStatus(message);
      };
      active.onmessage = ({data}) => {
        if (worker.current !== active) return;
        if (data.type === 'entry') {
          records.current.push(data.entry);
          widget.current?.setProps({records: records.current});
        } else finish(data.type === 'complete' ? 'Complete' : `Error: ${data.message}`);
      };
      active.onerror = event => finish(`Error: ${event.message}`);
      active.postMessage({suite});
    } catch (error) {
      worker.current?.terminate();
      worker.current = null;
      setRunning(false);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return <section className={styles.panel} aria-label="General math benchmarks">
    <div className={styles.controls}>
      <label>Suite <select value={suite} disabled={running} onChange={event => setSuite(event.target.value as 'core' | 'all')}>
        <option value="core">Core math</option><option value="all">All math.gl modules</option>
      </select></label>
      <button type="button" disabled={running} onClick={run}>Run benchmarks</button>
      <button type="button" disabled={!running} onClick={stop}>Stop</button>
      <span role="status">{status}</span>
    </div>
    <div ref={container} />
  </section>;
}
