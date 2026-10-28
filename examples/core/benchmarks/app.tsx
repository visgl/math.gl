// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: React is required by this example's classic JSX runtime.
import React, {createRef, PureComponent} from 'react';
import {render} from 'react-dom'; // eslint-disable-line

import {BenchResultsWidget} from 'probe.gl/bench-widget';
import type {LogEntry} from 'probe.gl/bench';
import {Bench} from 'probe.gl/bench';

import addBenchmarks from '../../../test/bench/modules.bench';

const addReferenceBenchmarks = false;

export default class App extends PureComponent {
  container = createRef<HTMLDivElement>();
  records: LogEntry[] = [];
  widget: BenchResultsWidget | null = null;
  suite: Bench;

  constructor(props) {
    super(props);

    this.suite = new Bench({
      log: (record) => {
        this.records.push(record);
        this.widget?.setProps({records: this.records});
      }
    });
    addBenchmarks(this.suite, addReferenceBenchmarks);
  }

  componentDidMount() {
    this.widget = new BenchResultsWidget({
      container: this.container.current!,
      records: this.records
    });
    void this.suite.calibrate().run();
  }

  componentWillUnmount() {
    this.widget?.destroy();
    this.widget = null;
  }

  render() {
    return <div ref={this.container} />;
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
