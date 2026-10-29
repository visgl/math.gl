// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSIdentifier} from './crs';

/** WMS 1.3 `CRS:` codes and the OGC register entries they abbreviate. */
const WMS_CRS_CODES: Readonly<Record<string, string>> = {
  '84': 'CRS84',
  '83': 'CRS83',
  '27': 'CRS27'
};

const AUTHORITY_CODE = /^([A-Z][A-Z0-9_-]*):([A-Z0-9_.-]+)$/i;
const OGC_URN = /^urn:ogc:def:crs:([A-Z][A-Z0-9_-]*):([^:]*):([A-Z0-9_.-]+)$/i;
const OGC_URI =
  /^https?:\/\/www\.opengis\.net\/def\/crs\/([A-Z][A-Z0-9_-]*)\/([^/]+)\/([A-Z0-9_.-]+)\/?$/i;

/**
 * Normalizes recognized spellings of an authority CRS identifier to `AUTHORITY:CODE`.
 *
 * Recognized forms are `AUTHORITY:CODE`, the WMS 1.3 codes `CRS:84`, `CRS:83` and `CRS:27`,
 * OGC URNs (`urn:ogc:def:crs:EPSG::32619`) and OGC URIs
 * (`http://www.opengis.net/def/crs/EPSG/0/32619`). Authorities are upper-cased. OGC codes are
 * upper-cased; other codes keep their spelling.
 *
 * A version is removed only when it is empty or `0`, or when it is `1.3` on an OGC `CRS84`,
 * `CRS83` or `CRS27` code, which the OGC register publishes only at that version. Any other
 * versioned identifier is returned unchanged, so it does not compare equal to an unversioned one.
 * Unrecognized strings are also returned unchanged.
 *
 * The result identifies a registry entry only. Different codes are never equated: `EPSG:4326` and
 * `OGC:CRS84` stay distinct, as do Web Mercator aliases. No datum equivalence, axis-order
 * convention or registry lookup is applied.
 *
 * @param identifier - CRS identifier as written by a source or service.
 * @returns The canonical `AUTHORITY:CODE` identifier, or `identifier` unchanged.
 */
export function normalizeCRSIdentifier(identifier: CRSIdentifier): CRSIdentifier {
  const text = identifier.trim();

  const authorityCode = AUTHORITY_CODE.exec(text);
  if (authorityCode) {
    const [, authority, code] = authorityCode;
    if (authority.toUpperCase() === 'CRS') {
      const ogcCode = WMS_CRS_CODES[code];
      return ogcCode ? `OGC:${ogcCode}` : identifier;
    }
    return formatIdentifier(authority, code);
  }

  const versioned = OGC_URN.exec(text) || OGC_URI.exec(text);
  if (versioned) {
    const [, authority, version, code] = versioned;
    return isUnversioned(authority, version, code) ? formatIdentifier(authority, code) : identifier;
  }

  return identifier;
}

/** Whether a URN or URI version names no particular revision of the registry entry. */
function isUnversioned(authority: string, version: string, code: string): boolean {
  if (version === '' || version === '0') return true;
  const ogcCode = code.toUpperCase();
  return (
    authority.toUpperCase() === 'OGC' &&
    version === '1.3' &&
    Object.values(WMS_CRS_CODES).includes(ogcCode)
  );
}

function formatIdentifier(authority: string, code: string): CRSIdentifier {
  const upperAuthority = authority.toUpperCase();
  return `${upperAuthority}:${upperAuthority === 'OGC' ? code.toUpperCase() : code}`;
}
