// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PROJJSONCRS} from './projjson-types';

/** A registered or named CRS identifier, such as `EPSG:4326` or `WGS84`. */
export type CRSIdentifier = string;

/** A coordinate reference system serialized using WKT1 or WKT2. */
export type WKTCRSDefinition = string;

/** A coordinate reference system serialized using PROJ string syntax. */
export type PROJStringDefinition = string;

/** A serialized or named coordinate reference system definition. */
export type CRSStringDefinition = CRSIdentifier | WKTCRSDefinition | PROJStringDefinition;

/** Top-level coordinate reference system object types defined by PROJJSON v0.7. */
export type PROJJSONCRSType = NonNullable<PROJJSONCRS['type']>;

type PROJJSONCRSBranchByType<CRS, T> = CRS extends {type?: infer Type}
  ? T extends Type
    ? CRS & {type: T}
    : never
  : never;

/** Selects PROJJSON CRS objects with a specific required top-level `type`. */
export type PROJJSONCRSByType<T extends PROJJSONCRSType> = T extends unknown
  ? PROJJSONCRSBranchByType<PROJJSONCRS, T>
  : never;

/** A serialized CRS definition or a standards-based PROJJSON CRS object. */
export type CRSDefinition<T extends PROJJSONCRS = PROJJSONCRS> = CRSStringDefinition | T;

export type {PROJJSONCRS};
