// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import proj4 from 'proj4';
import type {CRSDefinition, PROJJSONCRSByType} from '@math.gl/crs';

/** PROJJSON object variants currently parsed by proj4js 2.20.9. */
export type Proj4PROJJSONCRS = PROJJSONCRSByType<
  'GeographicCRS' | 'GeodeticCRS' | 'ProjectedCRS' | 'BoundCRS'
>;

/** A CRS definition currently accepted by proj4js 2.20.9. */
export type Proj4CRSDefinition = CRSDefinition<Proj4PROJJSONCRS>;

export type Proj4ProjectionOptions = {
  from?: Proj4CRSDefinition;
  to?: Proj4CRSDefinition;
  enforceAxis?: boolean;
};

export type Proj4DatumGridOptions = {
  includeErrorFields?: boolean;
};

type Proj4Converter = {
  forward: (coordinates: number[], enforceAxis?: boolean) => number[];
  inverse: (coordinates: number[], enforceAxis?: boolean) => number[];
};

// proj4js parses this standards-based subset at runtime, but its internal
// PROJJSON declaration is narrower than the official schema in a few nested fields.
const proj4Runtime = proj4 as unknown as {
  (from: Proj4CRSDefinition, to: Proj4CRSDefinition): Proj4Converter;
  defs: (name: string, definition: Proj4CRSDefinition) => void;
  nadgrid: (name: string, grid: ArrayBuffer, options?: Proj4DatumGridOptions) => void;
};

export class Proj4Projection {
  /** Define aliases for one or more projections */
  static defineProjectionAliases(aliases: {[name: string]: Proj4CRSDefinition}): void {
    for (const alias in aliases) {
      proj4Runtime.defs(alias, aliases[alias]);
    }
  }

  /** Register an NTv2 datum grid for use in projection definitions. */
  static registerDatumGrid(name: string, grid: ArrayBuffer, options?: Proj4DatumGridOptions): void {
    proj4Runtime.nadgrid(name, grid, options);
  }

  private _projection: Proj4Converter;
  private _enforceAxis: boolean;

  constructor({from = 'WGS84', to = 'WGS84', enforceAxis = false}: Proj4ProjectionOptions) {
    this._projection = proj4Runtime(from, to);
    this._enforceAxis = enforceAxis;
    if (!this._projection) {
      throw new Error('Invalid projection');
    }
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
  }

  /** Project a coordinate project from first to second coordinate system */
  project(coord: number[]): number[] {
    return this._projection.forward(coord, this._enforceAxis);
  }
  /** Project a coordinate project from second to first coordinate system */
  unproject(coord: number[]): number[] {
    return this._projection.inverse(coord, this._enforceAxis);
  }
}
