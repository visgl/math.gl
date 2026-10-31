// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getTransferList} from '@math.gl/core/tasks';

test('discovers channel ports while respecting nonrecursive discovery', () => {
  const channel = new MessageChannel();
  try {
    expect(getTransferList(channel)).toEqual([channel.port1, channel.port2]);
    expect(getTransferList(channel, false)).toEqual([]);
    expect(getTransferList(channel.port1, false)).toEqual([channel.port1]);
  } finally {
    channel.port1.close();
    channel.port2.close();
  }
});

test('deduplicates channel ports in cyclic maps and sets without visiting inherited properties', () => {
  const channel = new MessageChannel();
  try {
    const payload = {channel, port: channel.port1, map: new Map(), set: new Set()};
    payload.map.set(payload, channel);
    payload.set.add(channel.port2);
    expect(getTransferList(payload)).toEqual([channel.port1, channel.port2]);
    expect(getTransferList(Object.create({channel}))).toEqual([]);
  } finally {
    channel.port1.close();
    channel.port2.close();
  }
});

test('discovered ports can be transferred and still exchange messages', async () => {
  const channel = new MessageChannel();
  let ports: MessagePort[] = [];
  try {
    ports = structuredClone([channel.port1, channel.port2], {transfer: getTransferList(channel)});
    const message = new Promise(resolve => {
      ports[1].onmessage = event => resolve(event.data);
    });
    ports[0].postMessage('transferred');
    await expect(message).resolves.toBe('transferred');
  } finally {
    ports.forEach(port => port.close());
    channel.port1.close();
    channel.port2.close();
  }
});
