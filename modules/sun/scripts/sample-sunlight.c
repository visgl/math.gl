// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original integration code using the BSD-3-Clause Hošek-Wilkie 1.4a reference API.
// Reference: https://cgg.mff.cuni.cz/projects/SkylightModelling/
// Color matching: Wyman, Sloan & Shirley (2013), Equation 4 / Table 1 (not copied code).
// https://jcgt.org/published/0002/02/01/
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "ArHosekSkyModel.h"

#define PI 3.14159265358979323846

// Independently implemented evaluation of the published piecewise Gaussian equations.
static double gaussian(double wavelength, double amplitude, double center, double left, double right) {
  double offset = (wavelength - center) * (wavelength < center ? left : right);
  return amplitude * exp(-offset * offset / 2);
}
static void matching(double wavelength, double xyz[3]) {
  xyz[0] = gaussian(wavelength, 0.362, 442, 0.0624, 0.0374)
         + gaussian(wavelength, 1.056, 599.8, 0.0264, 0.0323)
         - gaussian(wavelength, 0.065, 501.1, 0.0490, 0.0382);
  xyz[1] = gaussian(wavelength, 0.821, 568.8, 0.0213, 0.0247)
         + gaussian(wavelength, 0.286, 530.9, 0.0613, 0.0322);
  xyz[2] = gaussian(wavelength, 1.217, 437, 0.0845, 0.0278)
         + gaussian(wavelength, 0.681, 459, 0.0385, 0.0725);
}
static void rgb(const double xyz[3], double result[3]) {
  result[0] = fmax(0, 3.2406 * xyz[0] - 1.5372 * xyz[1] - 0.4986 * xyz[2]);
  result[1] = fmax(0, -0.9689 * xyz[0] + 1.8758 * xyz[1] + 0.0415 * xyz[2]);
  result[2] = fmax(0, 0.0557 * xyz[0] - 0.2040 * xyz[1] + 1.0570 * xyz[2]);
}
static void sample(double degrees, double turbidity, int resolution) {
  double elevation = degrees * PI / 180;
  ArHosekSkyModelState *state = arhosekskymodelstate_alloc_init(elevation, turbidity, 0);
  double directXYZ[3] = {0}, diffuseXYZ[3] = {0};
  // The reference spectrum is piecewise linear at 40 nm knots. Integrate each
  // knot over the hemisphere once, then interpolate before the 5 nm XYZ quadrature.
  double skySpectrum[10] = {0};
  for (int row = 0; row < resolution; row++) {
    double mu = (row + 0.5) / resolution;
    double theta = acos(mu);
    for (int column = 0; column < resolution * 2; column++) {
      double phi = 2 * PI * (column + 0.5) / (resolution * 2);
      double cosGamma = mu * sin(elevation) + sqrt(1 - mu * mu) * cos(elevation) * cos(phi);
      double gamma = acos(fmax(-1, fmin(1, cosGamma)));
      for (int knot = 0; knot < 10; knot++) {
        skySpectrum[knot] += arhosekskymodel_radiance(state, theta, gamma, 360 + knot * 40) * mu;
      }
    }
  }
  for (int knot = 0; knot < 10; knot++) skySpectrum[knot] *= 2 * PI / (resolution * resolution * 2);
  // Integrate 380–720 nm (the reference's visible range), trapezoidal rule at 5 nm.
  for (int wavelength = 380; wavelength <= 720; wavelength += 5) {
    double xyz[3];
    matching(wavelength, xyz);
    double spectralWeight = (wavelength == 380 || wavelength == 720) ? 2.5 : 5;
    double direct = 0;
    // Equal-area annuli across the solar disk account for spectral limb darkening.
    for (int radius = 0; radius < resolution * 2; radius++) {
      double gamma = state->solar_radius * sqrt((radius + 0.5) / (resolution * 2));
      double theta = PI / 2 - elevation;
      direct += arhosekskymodel_solar_radiance(state, theta, gamma, wavelength)
              - arhosekskymodel_radiance(state, theta, gamma, wavelength);
    }
    direct *= PI * pow(sin(state->solar_radius), 2) / (resolution * 2);
    int knot = (wavelength - 360) / 40;
    double fraction = (wavelength - 360) / 40.0 - knot;
    double diffuse = skySpectrum[knot];
    if (fraction > 0) diffuse += fraction * (skySpectrum[knot + 1] - skySpectrum[knot]);
    for (int channel = 0; channel < 3; channel++) {
      directXYZ[channel] += fmax(0, direct) * xyz[channel] * spectralWeight;
      diffuseXYZ[channel] += diffuse * xyz[channel] * spectralWeight;
    }
  }
  double direct[3], diffuse[3];
  rgb(directXYZ, direct);
  rgb(diffuseXYZ, diffuse);
  printf("[%.9g,%.9g,%.9g,%.9g,%.9g,%.9g]", direct[0], direct[1], direct[2], diffuse[0], diffuse[1], diffuse[2]);
  arhosekskymodelstate_free(state);
}
int main(int argc, char **argv) {
  if (argc == 3) {
    sample(atof(argv[1]), atof(argv[2]), 64);
    return 0;
  }
  printf("[");
  for (int turbidity = 1; turbidity <= 10; turbidity++) {
    if (turbidity > 1) printf(",");
    printf("[");
    for (int degrees = 0; degrees <= 90; degrees++) {
      if (degrees > 0) printf(",");
      sample(degrees, turbidity, 32);
    }
    printf("]");
  }
  printf("]\n");
  return 0;
}
