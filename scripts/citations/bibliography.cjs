// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {Cite} = require('@citation-js/core');
require('@citation-js/plugin-bibtex');
const fs = require('node:fs');
const path = require('node:path');
const bibliographyPath = path.resolve(__dirname, '../../docs/references.bib');

function parseBibliography(source) {
  const entries = new Cite(source).data;
  if (!entries.length) throw new Error('Bibliography is empty');
  const result = new Map();
  for (const entry of entries) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) throw new Error(`Invalid citation key: ${entry.id}`);
    if (result.has(entry.id)) throw new Error(`Duplicate citation key: ${entry.id}`);
    for (const field of ['title', 'author', 'issued']) {
      if (!entry[field] || (Array.isArray(entry[field]) && !entry[field].length)) {
        throw new Error(`${entry.id}: missing ${field}`);
      }
    }
    if (!entry.issued['date-parts']?.[0]?.[0]) throw new Error(`${entry.id}: missing year`);
    if (!entry.DOI && !entry.URL) throw new Error(`${entry.id}: DOI or URL required`);
    if (entry.URL && !/^https?:\/\//.test(entry.URL)) throw new Error(`${entry.id}: invalid URL`);
    if (entry.DOI && !/^10\.\d{4,9}\/\S+$/.test(entry.DOI))
      throw new Error(`${entry.id}: invalid DOI`);
    result.set(entry.id, entry);
  }
  return result;
}
function readBibliography() {
  return parseBibliography(fs.readFileSync(bibliographyPath, 'utf8'));
}
function year(entry) {
  return entry.issued['date-parts'][0][0];
}
function label(entry) {
  const names = entry.author.map(a => a.family || a.literal);
  return `${names.length > 2 ? names[0] + ' et al.' : names.join(' & ')} (${year(entry)})`;
}
function plain(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\r\n]+/g, ' ');
}
function escape(value) {
  return plain(value).replace(/([\\`*_[\]<>{}])/g, '\\$1');
}
function reference(entry) {
  const authors = entry.author
    .map(a => a.literal || [a.given, a.family].filter(Boolean).join(' '))
    .join(', ');
  const venue = entry['container-title'] || entry.publisher || '';
  const detail = [venue, entry.volume, entry.issue ? `(${entry.issue})` : '', entry.page]
    .filter(Boolean)
    .join(', ');
  const links = [];
  if (entry.DOI) links.push(`[DOI](https://doi.org/${entry.DOI})`);
  if (entry.URL && entry.URL !== `https://doi.org/${entry.DOI}`)
    links.push(`[Source](${entry.URL})`);
  return `${escape(authors)} (${year(entry)}). **${escape(entry.title)}**. ${detail ? escape(detail) + '. ' : ''}${links.join(' · ')}${entry.note ? '\n\n' + escape(entry.note) : ''}`;
}
function renderBibliography(entries) {
  return (
    '# Bibliography\n\n{/* Generated from references.bib by yarn citations:generate. Do not edit. */}\n\nDownload the shared [BibTeX bibliography](/references.bib) or [CSL-JSON metadata](/references.json).\n\nAcademic sources cited throughout the documentation. Software and dataset attribution remains in [References and credits](./references-and-credits.md).\n\n' +
    [...entries.values()]
      .sort((a, b) => a.id.localeCompare(b.id, 'en'))
      .map(entry => `## ${escape(label(entry))} {/* #${entry.id} */}\n\n${reference(entry)}\n`)
      .join('\n')
  );
}
module.exports = {
  bibliographyPath,
  parseBibliography,
  readBibliography,
  label,
  reference,
  renderBibliography
};
