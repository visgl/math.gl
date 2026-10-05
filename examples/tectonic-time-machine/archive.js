// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original narrow ZIP reader for one scientific GPMLZ entry; no upstream implementation copied.
const MAX_ENTRY = 32 * 1024 * 1024;
export async function decompress(bytes, format) {
  if (typeof DecompressionStream === 'undefined')
    throw new Error('Browser decompression support is required');
  return new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format))
    ).arrayBuffer()
  );
}
export async function readZipEntry(buffer, name) {
  const bytes = new Uint8Array(buffer),
    view = new DataView(buffer);
  const fail = () => {
    throw new Error('Invalid model ZIP archive');
  };
  let footer = bytes.length - 22;
  for (; footer >= Math.max(0, bytes.length - 65557); footer--)
    if (
      view.getUint32(footer, true) === 0x06054b50 &&
      footer + 22 + view.getUint16(footer + 20, true) === bytes.length
    )
      break;
  if (footer < 0 || footer < bytes.length - 65557) return fail();
  if (view.getUint16(footer + 4, true) || view.getUint16(footer + 6, true)) return fail();
  const count = view.getUint16(footer + 10, true),
    centralStart = view.getUint32(footer + 16, true),
    end = centralStart + view.getUint32(footer + 12, true);
  let offset = centralStart;
  if (end > footer) return fail();
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) return fail();
    const size = view.getUint32(offset + 20, true),
      decodedSize = view.getUint32(offset + 24, true);
    const nameSize = view.getUint16(offset + 28, true),
      next =
        offset +
        46 +
        nameSize +
        view.getUint16(offset + 30, true) +
        view.getUint16(offset + 32, true);
    if (next > end) return fail();
    if (decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameSize)) === name) {
      if (view.getUint16(offset + 8, true) & 1 || decodedSize > MAX_ENTRY) return fail();
      const local = view.getUint32(offset + 42, true),
        method = view.getUint16(offset + 10, true);
      if (local + 30 > centralStart || view.getUint32(local, true) !== 0x04034b50) return fail();
      const start =
        local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      if (start + size > centralStart) return fail();
      const data = bytes.subarray(start, start + size);
      const result =
        method === 0 ? data : method === 8 ? await decompress(data, 'deflate-raw') : null;
      if (!result || result.length !== decodedSize) return fail();
      return result;
    }
    offset = next;
  }
  throw new Error(`Missing model geometry entry: ${name}`);
}
export async function modelXML(buffer, source) {
  if (source.sha256) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join(
      ''
    );
    if (actual !== source.sha256)
      throw new Error('Model geometry checksum changed; dataset revision must be verified');
  }
  const gzip = source.archiveEntry
    ? await readZipEntry(buffer, source.archiveEntry)
    : new Uint8Array(buffer);
  const xml = await decompress(gzip, 'gzip');
  if (xml.length > MAX_ENTRY) throw new Error('Model geometry is too large');
  return new TextDecoder().decode(xml);
}
