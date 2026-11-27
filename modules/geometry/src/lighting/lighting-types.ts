// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Explicit azimuth extension rule; never inferred from a file or its metadata. */
export type PhotometricSymmetry = 'rotational' | 'quadrant' | 'bilateral' | 'none';

/** Format-independent polar/azimuth intensity measurements in degrees and candela. */
export type PhotometricProfile = {
  /** Ordered polar angles in [0, 180], measured from an application-chosen pole. */
  verticalAngles: ArrayLike<number>;
  /** Ordered azimuth angles in [0, 360], relative to an application-chosen origin. */
  horizontalAngles: ArrayLike<number>;
  /** Candela samples, vertical angle varying fastest. */
  intensities: ArrayLike<number>;
  /** Uniform intensity multiplier; default 1. No lamp, ballast or file metadata is read. */
  intensityScale?: number;
  /** Explicit rotational, quadrant, bilateral or full-circle interpretation. */
  symmetry: PhotometricSymmetry;
};
