// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Illustrative crust and heat fields in geographic sphere coordinates.
export const earlyEarthSurfaceGLSL = `
float fissureCoverage(float contour,float halfWidth) {
  // Filter each signed contour before combining them. A derivative of the
  // absolute distance can cancel when a pixel quad straddles the centerline.
  float pixel=max(fwidth(contour),.0001);
  float distance=abs(contour);
  float coverage=clamp((halfWidth+.5*pixel-distance)/pixel,0.,1.)
    -clamp((.5*pixel-halfWidth-distance)/pixel,0.,1.);
  return coverage*(1.-smoothstep(1.,5.,pixel/halfWidth));
}

vec3 crustFlow(vec3 p) {
  vec3 warp=vec3(tectonicIceNoise(p*5.),tectonicIceNoise((p.yzx+1.7)*5.),
                 tectonicIceNoise((p.zxy-2.1)*5.))-.5;
  return p+.19*warp;
}

float crustPhase(vec3 flow) {
  return dot(flow,vec3(105.,-54.,65.))+9.*tectonicIceNoise(flow*17.);
}

void earlyEarthSurface(vec3 p,float heat,out float basin,out float rock,
                       out vec3 crustNormal,out vec3 emission) {
  vec3 flow=crustFlow(p);
  basin=.76*tectonicIceNoise(flow*5.)+.24*tectonicIceNoise(flow*12.);

  // Two intersecting contours create connected branches and wider junctions.
  float primary=tectonicIceNoise(flow*13.)-.5;
  float secondary=tectonicIceNoise((flow.yzx+3.1)*21.)-.5;
  float resolved=1.-smoothstep(.009,.026,length(fwidth(p)));

  float width=mix(.012,.034,tectonicIceDetail(flow,8.));
  float seam=resolved*max(fissureCoverage(primary,width*.68),
                 fissureCoverage(secondary,width*.45));
  float junction=(1.-smoothstep(.026,.099,length(vec2(primary,secondary))))
    *smoothstep(.46,.62,basin);
  float lake=smoothstep(.63,.75,basin);
  float pools=max(lake,junction);
  float molten=max(max(lake,resolved*junction),seam*smoothstep(.31,.47,basin));

  // Warp aligned folds by the same slow flow that bends the crust rafts.
  float phase=crustPhase(flow);
  float fold=.5+.5*sin(phase);
  float folds=fold*fold;
  float reliefDetail=1.-smoothstep(.45,2.4,fwidth(phase));
  rock=clamp(.13+.30*basin+.57*mix(.375,folds,reliefDetail),0.,1.);
  // Sample the phase gradient in sphere space so neighboring pixels do not
  // share a quantized screen-space normal across each derivative quad.
  vec3 axis=abs(p.z)<.9 ? vec3(0.,0.,1.) : vec3(0.,1.,0.);
  vec3 tangent=normalize(cross(axis,p));
  vec3 bitangent=cross(p,tangent);
  const float stepSize=.0015;
  vec2 phaseGradient=vec2(
    crustPhase(crustFlow(normalize(p+stepSize*tangent)))
      -crustPhase(crustFlow(normalize(p-stepSize*tangent))),
    crustPhase(crustFlow(normalize(p+stepSize*bitangent)))
      -crustPhase(crustFlow(normalize(p-stepSize*bitangent)))
  )/(2.*stepSize);
  float slope=.017*reliefDetail*(1.-.85*pools)*fold*cos(phase);
  crustNormal=normalize(p-slope*(phaseGradient.x*tangent+phaseGradient.y*bitangent));
  float seamCore=resolved*max(fissureCoverage(primary,width*.24),
                     fissureCoverage(secondary,width*.16))
    *smoothstep(.36,.52,basin);
  vec3 margins=mix(vec3(.19,.006,.001),vec3(1.05,.22,.012),molten);
  emission=heat*(molten*margins+seamCore*vec3(6.,3.2,.95));
}
`;
