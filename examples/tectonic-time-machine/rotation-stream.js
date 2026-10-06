// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original adapter for the GPlates keyed JSON response; parsers are imported from loaders.gl.
import {ClarinetParser, JSONTableLoaderWithParser} from 'math.gl-json-table-loader';

// Supplying a schema selects columns before Arrow conversion. Unselected fields
// are dropped; required fields and incompatible values still produce errors.
export const ROTATION_SCHEMA = {
  fields: ['age', 'plateId', 'w', 'x', 'y', 'z'].map(name => ({
    name, type: name === 'age' || name === 'plateId' ? 'int32' : 'float64', nullable: false
  })),
  metadata: {}
};
export function parseRotationRows(chunks, batchSize = 4096) {
  return JSONTableLoaderWithParser.parseInBatches(chunks, {
    core: {batchSize},
    json: {
      shape: 'arrow-table', schema: ROTATION_SCHEMA,
      arrowConversion: {onExtraField: 'drop', integerConversion: 'error', logRecoveries: false}
    }
  });
}

/** Convert {age: {plateId: [w,x,y,z]}} to a JSON row stream without retaining the document. */
export async function* rotationRows(chunks) {
  const decoder = new TextDecoder('utf-8', {fatal: true}), encoder = new TextEncoder();
  const q = new Float64Array(4);
  let depth = 0, age = NaN, plateId = NaN, components = 0, active = false;
  let output = '[', separator = '', sawRoot = false;
  function key(value) {
    const number = typeof value === 'string' && /^\d+(?:\.0)?$/.test(value) ? Number(value) : NaN;
    if (depth === 1) age = number;
    if (depth === 2) plateId = number;
  }
  const parser = new ClarinetParser({
    onopenobject(value) {
      depth++;
      if (depth === 1) sawRoot = true;
      if (depth === 3 && Number.isFinite(age) && Number.isFinite(plateId))
        throw new Error('Expected a quaternion array');
      key(value);
    },
    onkey(value) {key(value);},
    oncloseobject() {depth--;},
    onopenarray() {
      if (active) throw new Error('Invalid quaternion');
      active = depth === 2 && Number.isFinite(age) && Number.isFinite(plateId);
      if (depth === 0 || (depth === 1 && Number.isFinite(age)) || (depth === 3 && active))
        throw new Error('Invalid rotation response shape');
      depth++;
      if (active) components = 0;
    },
    onvalue(value) {
      if (active && depth === 3) {
        if (!Number.isFinite(value) || components >= 4) throw new Error('Invalid quaternion');
        q[components++] = value;
      } else if ((depth === 1 && Number.isFinite(age)) || (depth === 2 && Number.isFinite(age) && Number.isFinite(plateId))) {
        throw new Error('Expected a quaternion array');
      }
    },
    onclosearray() {
      if (active && depth === 3) {
        if (components !== 4) throw new Error('Invalid quaternion');
        output += `${separator}{"age":${age},"plateId":${plateId},"w":${q[0]},"x":${q[1]},"y":${q[2]},"z":${q[3]}}`;
        separator = ',';
        active = false;
      }
      depth--;
    },
    onerror(error) {throw error;}
  });
  for await (const chunk of chunks) {
    parser.write(decoder.decode(chunk, {stream: true}));
    if (output) {yield encoder.encode(output); output = '';}
  }
  parser.write(decoder.decode());
  parser.end();
  if (!sawRoot || depth !== 0) throw new Error('Incomplete rotation response');
  yield encoder.encode(`${output}]`);
}
export function parseRotationBatches(chunks, batchSize = 4096) {
  return parseRotationRows(rotationRows(chunks), batchSize);
}

/** Release the response reader on completion, failure, source change, or unmount. */
export async function* responseChunks(body, signal) {
  const reader = body.getReader();
  const cancel = () => {reader.cancel(signal.reason).catch(() => {});};
  signal.addEventListener('abort', cancel, {once: true});
  try {
    while (true) {
      signal.throwIfAborted();
      const {done, value} = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      yield value;
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
