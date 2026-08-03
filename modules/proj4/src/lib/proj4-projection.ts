// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import proj4 from 'proj4';

/** A PROJ string, WKT definition, named coordinate system, or PROJJSON definition. */
export type Proj4ProjectionDefinition = Extract<
  Parameters<typeof proj4>[0],
  string | {type: string}
>;

export type Proj4ProjectionOptions = {
  from?: Proj4ProjectionDefinition;
  to?: Proj4ProjectionDefinition;
  enforceAxis?: boolean;
};

export type Proj4DatumGridOptions = {
  includeErrorFields?: boolean;
};

export class Proj4Projection {
  /** Define aliases for one or more projections */
  static defineProjectionAliases(aliases: {[name: string]: Proj4ProjectionDefinition}): void {
    for (const alias in aliases) {
      proj4.defs(alias, aliases[alias]);
    }
  }

  /** Register an NTv2 datum grid for use in projection definitions. */
  static registerDatumGrid(name: string, grid: ArrayBuffer, options?: Proj4DatumGridOptions): void {
    proj4.nadgrid(name, grid, options);
  }

  private _projection: proj4.Converter;
  private _enforceAxis: boolean;

  constructor({from = 'WGS84', to = 'WGS84', enforceAxis = false}: Proj4ProjectionOptions) {
    this._projection = proj4(from, to);
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
