// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original domain enforcement, numerical differentiation and cartographic factors.
import type {
  ProjectionContext,
  ProjectionImplementation,
  ProjectionPlugin,
  ProjectionPoint
} from './experimental/types';

/** Closed geographic rectangle in radians, without antimeridian wrapping. */
export type ProjectionDomain = {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
};
/** Physical projected-axis units per input radian. No datum or CRS axis/unit stages. */
export type ProjectionJacobian = {
  dxDLongitude: number;
  dxDLatitude: number;
  dyDLongitude: number;
  dyDLatitude: number;
};
/** Physical projected-axis units per input radian squared. The mixed term is symmetric. */
export type ProjectionHessian = {
  d2xDLongitude2: number;
  d2xDLongitudeDLatitude: number;
  d2xDLatitude2: number;
  d2yDLongitude2: number;
  d2yDLongitudeDLatitude: number;
  d2yDLatitude2: number;
};
export type ProjectionFactors = ProjectionJacobian & {
  meridionalScale: number;
  parallelScale: number;
  arealScale: number;
  meridianConvergence: number;
  meridianParallelAngle: number;
  angularDistortion: number;
  maximumScale: number;
  minimumScale: number;
};
export type ProjectionAnalysisOptions = {
  projection: ProjectionPlugin;
  context: ProjectionContext;
  /** Application-qualified region, not a promise of a globally valid algorithm. */
  domain: ProjectionDomain;
  /** Central difference step in radians. Default 1e-4; stencil uses +/-2 steps. */
  step?: number;
  /** Second-derivative central difference step in radians. Default 1e-3; stencil uses +/-2 steps. */
  hessianStep?: number;
  /** Agreement required between fourth-order stencils at step and half-step. */
  derivativeTolerance?: number;
};
export function createProjectionJacobian(): ProjectionJacobian {
  return {dxDLongitude: 0, dxDLatitude: 0, dyDLongitude: 0, dyDLatitude: 0};
}
export function createProjectionHessian(): ProjectionHessian {
  return {
    d2xDLongitude2: 0,
    d2xDLongitudeDLatitude: 0,
    d2xDLatitude2: 0,
    d2yDLongitude2: 0,
    d2yDLongitudeDLatitude: 0,
    d2yDLatitude2: 0
  };
}
export function createProjectionFactors(): ProjectionFactors {
  return {
    ...createProjectionJacobian(),
    meridionalScale: 0,
    parallelScale: 0,
    arealScale: 0,
    meridianConvergence: 0,
    meridianParallelAngle: 0,
    angularDistortion: 0,
    maximumScale: 0,
    minimumScale: 0
  };
}

/** Fourth-order central stencil weights at offsets -2..2 steps: f' * 12 step, f'' * 12 step^2. */
const FIRST_DIFFERENCE = [1, -8, 0, 8, -1] as const;
const SECOND_DIFFERENCE = [-1, 16, -30, 16, -1] as const;

/** Optional single-projection analysis. Allocate scratch once; reuse all method outputs.
 * false leaves outputs untouched. Plugin errors, nonfinite values, domain edges,
 * singularities and unresolved derivatives are observable failures. Recursive plugin
 * calls fail while scratch is in use; output setters can safely reenter afterwards.
 */
export class ProjectionAnalysis {
  readonly domain: ProjectionDomain;
  private readonly implementation: ProjectionImplementation;
  private readonly a: number;
  private readonly es: number;
  private readonly step: number;
  private readonly hessianStep: number;
  private readonly tolerance: number;
  private readonly point: ProjectionPoint = {x: 0, y: 0, z: 0};
  private readonly derivative: ProjectionJacobian = createProjectionJacobian();
  private readonly curvature: ProjectionHessian = createProjectionHessian();
  private busy = false;
  private dx = 0;
  private dy = 0;
  constructor(options: ProjectionAnalysisOptions) {
    const {semiMajorAxis: a, eccentricitySquared: es} = options.context;
    const {west, east, south, north} = options.domain;
    const step = options.step ?? 1e-4,
      hessianStep = options.hessianStep ?? 1e-3,
      tolerance = options.derivativeTolerance ?? 1e-6;
    if (
      !(
        Number.isFinite(a) &&
        a > 0 &&
        Number.isFinite(es) &&
        es >= 0 &&
        es < 1 &&
        Number.isFinite(west) &&
        Number.isFinite(east) &&
        west < east &&
        west >= -Math.PI &&
        east <= Math.PI &&
        Number.isFinite(south) &&
        Number.isFinite(north) &&
        south < north &&
        south >= -Math.PI / 2 &&
        north <= Math.PI / 2 &&
        Number.isFinite(step) &&
        step > 0 &&
        step < 0.1 &&
        Number.isFinite(hessianStep) &&
        hessianStep > 0 &&
        hessianStep < 0.1 &&
        Number.isFinite(tolerance) &&
        tolerance > 0 &&
        tolerance < 1
      )
    ) {
      throw new Error('Invalid projection analysis geometry, domain or derivative options');
    }
    this.domain = Object.freeze({west, east, south, north});
    this.implementation = options.projection.create(options.context);
    if (!this.implementation.forwardInPlace || !this.implementation.inverseInPlace) {
      throw new Error('Projection analysis requires mutable horizontal projection hooks');
    }
    this.a = a;
    this.es = es;
    this.step = step;
    this.hessianStep = hessianStep;
    this.tolerance = tolerance;
  }
  contains(longitude: number, latitude: number): boolean {
    const {west, east, south, north} = this.domain;
    return (
      Number.isFinite(longitude) &&
      Number.isFinite(latitude) &&
      longitude >= west &&
      longitude <= east &&
      latitude >= south &&
      latitude <= north
    );
  }
  projectTo(longitude: number, latitude: number, result: ProjectionPoint): boolean {
    if (this.busy || !this.contains(longitude, latitude)) return false;
    this.busy = true;
    let x: number, y: number;
    try {
      if (!this.sample(longitude, latitude)) return false;
      x = this.point.x;
      y = this.point.y;
    } finally {
      this.busy = false;
    }
    result.x = x;
    result.y = y;
    return true;
  }
  unprojectTo(x: number, y: number, result: ProjectionPoint): boolean {
    if (this.busy || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    this.busy = true;
    let longitude: number, latitude: number;
    try {
      this.point.x = x;
      this.point.y = y;
      this.point.z = 0;
      try {
        this.implementation.inverseInPlace!(this.point);
      } catch {
        return false;
      }
      longitude = this.point.x;
      latitude = this.point.y;
      if (!this.contains(longitude, latitude)) return false;
    } finally {
      this.busy = false;
    }
    result.x = longitude;
    result.y = latitude;
    return true;
  }
  jacobian(longitude: number, latitude: number, result: ProjectionJacobian): boolean {
    if (this.busy) return false;
    this.busy = true;
    let xx: number, xy: number, yx: number, yy: number;
    try {
      if (!this.calculate(longitude, latitude)) return false;
      xx = this.derivative.dxDLongitude;
      xy = this.derivative.dxDLatitude;
      yx = this.derivative.dyDLongitude;
      yy = this.derivative.dyDLatitude;
    } finally {
      this.busy = false;
    }
    result.dxDLongitude = xx;
    result.dxDLatitude = xy;
    result.dyDLongitude = yx;
    result.dyDLatitude = yy;
    return true;
  }
  hessian(longitude: number, latitude: number, result: ProjectionHessian): boolean {
    if (this.busy) return false;
    this.busy = true;
    let xll: number, xlp: number, xpp: number, yll: number, ylp: number, ypp: number;
    try {
      if (!this.calculateHessian(longitude, latitude)) return false;
      xll = this.curvature.d2xDLongitude2;
      xlp = this.curvature.d2xDLongitudeDLatitude;
      xpp = this.curvature.d2xDLatitude2;
      yll = this.curvature.d2yDLongitude2;
      ylp = this.curvature.d2yDLongitudeDLatitude;
      ypp = this.curvature.d2yDLatitude2;
    } finally {
      this.busy = false;
    }
    result.d2xDLongitude2 = xll;
    result.d2xDLongitudeDLatitude = xlp;
    result.d2xDLatitude2 = xpp;
    result.d2yDLongitude2 = yll;
    result.d2yDLongitudeDLatitude = ylp;
    result.d2yDLatitude2 = ypp;
    return true;
  }
  factors(longitude: number, latitude: number, result: ProjectionFactors): boolean {
    if (this.busy) return false;
    this.busy = true;
    let xx: number, xy: number, yx: number, yy: number;
    try {
      if (!this.calculate(longitude, latitude)) return false;
      xx = this.derivative.dxDLongitude;
      xy = this.derivative.dxDLatitude;
      yx = this.derivative.dyDLongitude;
      yy = this.derivative.dyDLatitude;
    } finally {
      this.busy = false;
    }
    const d = 1 - this.es * Math.sin(latitude) ** 2;
    const parallelRadius = (this.a * Math.cos(latitude)) / Math.sqrt(d);
    const meridionalRadius = (this.a * (1 - this.es)) / (d * Math.sqrt(d));
    const ex = xx / parallelRadius,
      ey = yx / parallelRadius;
    const nx = xy / meridionalRadius,
      ny = yy / meridionalRadius;
    const k = Math.hypot(ex, ey),
      h = Math.hypot(nx, ny),
      area = ex * ny - ey * nx;
    // Singular values of the local east/north map; retain a signed area determinant.
    const sum = Math.hypot(ex + ny, ey - nx),
      difference = Math.hypot(ex - ny, ey + nx);
    const maximum = (sum + difference) / 2;
    const minimum = maximum > 0 ? Math.min(maximum, Math.abs(area) / maximum) : 0;
    if (
      !(
        Number.isFinite(maximum) &&
        minimum > maximum * 1e-12 &&
        Number.isFinite(h) &&
        Number.isFinite(k)
      )
    )
      return false;
    const angle = Math.atan2(Math.abs(area), Math.abs(ex * nx + ey * ny));
    const convergence = -Math.atan2(xy, yy);
    const distortion = 2 * Math.asin(Math.min(1, (maximum - minimum) / (maximum + minimum)));
    result.dxDLongitude = xx;
    result.dxDLatitude = xy;
    result.dyDLongitude = yx;
    result.dyDLatitude = yy;
    result.meridionalScale = h;
    result.parallelScale = k;
    result.arealScale = area;
    result.meridianConvergence = convergence;
    result.meridianParallelAngle = angle;
    result.angularDistortion = distortion;
    result.maximumScale = maximum;
    result.minimumScale = minimum;
    return true;
  }
  private sample(longitude: number, latitude: number): boolean {
    if (!this.contains(longitude, latitude)) return false;
    this.point.x = longitude;
    this.point.y = latitude;
    this.point.z = 0;
    try {
      this.implementation.forwardInPlace!(this.point);
    } catch {
      return false;
    }
    return Number.isFinite(this.point.x) && Number.isFinite(this.point.y);
  }
  private difference(longitude: number, latitude: number, step: number, axis: number): boolean {
    const lx = axis === 0 ? step : 0,
      ly = axis === 1 ? step : 0;
    if (!this.sample(longitude - 2 * lx, latitude - 2 * ly)) return false;
    const x1 = this.point.x,
      y1 = this.point.y;
    if (!this.sample(longitude - lx, latitude - ly)) return false;
    const x2 = this.point.x,
      y2 = this.point.y;
    if (!this.sample(longitude + lx, latitude + ly)) return false;
    const x3 = this.point.x,
      y3 = this.point.y;
    if (!this.sample(longitude + 2 * lx, latitude + 2 * ly)) return false;
    this.dx = (x1 - this.point.x + 8 * (x3 - x2)) / (12 * step);
    this.dy = (y1 - this.point.y + 8 * (y3 - y2)) / (12 * step);
    return Number.isFinite(this.dx) && Number.isFinite(this.dy);
  }
  /** Fourth-order estimate of one Hessian term (0 longitude^2, 1 mixed, 2 latitude^2). */
  private hessianDifference(longitude: number, latitude: number, step: number, term: number) {
    let x = 0,
      y = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        // Pure terms apply the second-difference stencil along one axis; the mixed term applies
        // the first-difference stencil along both. Weights share the 144 * step^2 divisor.
        const weight =
          term === 1
            ? FIRST_DIFFERENCE[i] * FIRST_DIFFERENCE[j]
            : (term === 0 ? j : i) === 2
              ? 12 * SECOND_DIFFERENCE[term === 0 ? i : j]
              : 0;
        if (weight === 0) continue;
        if (!this.sample(longitude + (i - 2) * step, latitude + (j - 2) * step)) return false;
        x += weight * this.point.x;
        y += weight * this.point.y;
      }
    }
    this.dx = x / (144 * step * step);
    this.dy = y / (144 * step * step);
    return Number.isFinite(this.dx) && Number.isFinite(this.dy);
  }
  private calculateHessian(longitude: number, latitude: number): boolean {
    for (let term = 0; term < 3; term++) {
      if (!this.hessianDifference(longitude, latitude, this.hessianStep, term)) return false;
      const x = this.dx,
        y = this.dy;
      if (!this.hessianDifference(longitude, latitude, this.hessianStep / 2, term)) return false;
      const bound = this.tolerance * Math.max(this.a, Math.abs(this.dx), Math.abs(this.dy));
      if (Math.abs(x - this.dx) > bound || Math.abs(y - this.dy) > bound) return false;
      const dx = this.dx + (this.dx - x) / 15,
        dy = this.dy + (this.dy - y) / 15;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
      if (term === 0) {
        this.curvature.d2xDLongitude2 = dx;
        this.curvature.d2yDLongitude2 = dy;
      } else if (term === 1) {
        this.curvature.d2xDLongitudeDLatitude = dx;
        this.curvature.d2yDLongitudeDLatitude = dy;
      } else {
        this.curvature.d2xDLatitude2 = dx;
        this.curvature.d2yDLatitude2 = dy;
      }
    }
    return true;
  }
  private calculate(longitude: number, latitude: number): boolean {
    for (let axis = 0; axis < 2; axis++) {
      if (!this.difference(longitude, latitude, this.step, axis)) return false;
      const x = this.dx,
        y = this.dy;
      if (!this.difference(longitude, latitude, this.step / 2, axis)) return false;
      const bound = this.tolerance * Math.max(this.a, Math.abs(this.dx), Math.abs(this.dy));
      if (Math.abs(x - this.dx) > bound || Math.abs(y - this.dy) > bound) return false;
      const dx = this.dx + (this.dx - x) / 15,
        dy = this.dy + (this.dy - y) / 15;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
      if (axis === 0) {
        this.derivative.dxDLongitude = dx;
        this.derivative.dyDLongitude = dy;
      } else {
        this.derivative.dxDLatitude = dx;
        this.derivative.dyDLatitude = dy;
      }
    }
    return true;
  }
}
