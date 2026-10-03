// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {PROJJSONCRSByType} from '@math.gl/crs';

export const geographicJSON: PROJJSONCRSByType<'GeographicCRS'> = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    type: 'GeodeticReferenceFrame',
    name: 'World Geodetic System 1984',
    ellipsoid: {name: 'WGS 84', semi_major_axis: 6378137, inverse_flattening: 298.257223563}
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {name: 'Longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree'},
      {name: 'Latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree'}
    ]
  }
};
export const projectedJSON: PROJJSONCRSByType<'ProjectedCRS'> = {
  type: 'ProjectedCRS',
  name: 'WGS 84 / UTM zone 31N',
  base_crs: geographicJSON,
  conversion: {
    name: 'UTM zone 31N',
    method: {name: 'Transverse Mercator'},
    parameters: [
      {name: 'Latitude of natural origin', value: 0, unit: 'degree'},
      {name: 'Longitude of natural origin', value: 3, unit: 'degree'},
      {name: 'Scale factor at natural origin', value: 0.9996, unit: 'unity'},
      {name: 'False easting', value: 500000, unit: 'metre'},
      {name: 'False northing', value: 0, unit: 'metre'}
    ]
  },
  coordinate_system: {
    subtype: 'Cartesian',
    axis: [
      {name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre'},
      {name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre'}
    ]
  }
};
export const geographicWKT =
  'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]]';
export const projectedWKT =
  'PROJCS["UTM 31",' +
  geographicWKT +
  ',PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1]]';
export const projectedWKT2 =
  'PROJCRS["UTM 31",BASEGEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0]],CONVERSION["UTM zone 31N",METHOD["Transverse Mercator"],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.017453292519943295]],PARAMETER["Longitude of natural origin",3,ANGLEUNIT["degree",0.017453292519943295]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1]],PARAMETER["False northing",0,LENGTHUNIT["metre",1]]],CS[Cartesian,2],AXIS["easting",east,ORDER[1]],AXIS["northing",north,ORDER[2]],LENGTHUNIT["metre",1]]';
export const esriWKT =
  'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",' +
  geographicWKT.replace('WGS_1984', 'D_WGS_1984') +
  ',PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Standard_Parallel_1",0],PARAMETER["Auxiliary_Sphere_Type",0],UNIT["Meter",1]]';
export const datumDefinitions = [
  '+proj=longlat +datum=OSGB36',
  '+proj=longlat +datum=ch1903',
  '+proj=longlat +datum=potsdam',
  '+proj=longlat +ellps=GRS80 +towgs84=0,0,0',
  '+proj=longlat +ellps=intl +towgs84=12,-23,34',
  '+proj=longlat +ellps=airy +towgs84=1,2,3,0.1,-0.2,0.3,2',
  '+proj=longlat +a=6370000 +b=6350000 +towgs84=0,0,0'
];
