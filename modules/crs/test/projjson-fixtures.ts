// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PROJJSONCRS} from '@math.gl/crs';

/**
 * Examples published in the official PROJJSON specification.
 * Source: https://proj.org/en/stable/specifications/projjson.html
 */
export const wgs84GeographicCRS = {
  $schema: 'https://proj.org/schemas/v0.4/projjson.schema.json',
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum_ensemble: {
    name: 'World Geodetic System 1984 ensemble',
    members: [
      {
        name: 'World Geodetic System 1984 (Transit)',
        id: {
          authority: 'EPSG',
          code: 1166
        }
      },
      {
        name: 'World Geodetic System 1984 (G730)',
        id: {
          authority: 'EPSG',
          code: 1152
        }
      },
      {
        name: 'World Geodetic System 1984 (G873)',
        id: {
          authority: 'EPSG',
          code: 1153
        }
      },
      {
        name: 'World Geodetic System 1984 (G1150)',
        id: {
          authority: 'EPSG',
          code: 1154
        }
      },
      {
        name: 'World Geodetic System 1984 (G1674)',
        id: {
          authority: 'EPSG',
          code: 1155
        }
      },
      {
        name: 'World Geodetic System 1984 (G1762)',
        id: {
          authority: 'EPSG',
          code: 1156
        }
      },
      {
        name: 'World Geodetic System 1984 (G2139)',
        id: {
          authority: 'EPSG',
          code: 1309
        }
      }
    ],
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    },
    accuracy: '2.0',
    id: {
      authority: 'EPSG',
      code: 6326
    }
  },
  coordinate_system: {
    subtype: 'ellipsoidal',
    axis: [
      {
        name: 'Geodetic latitude',
        abbreviation: 'Lat',
        direction: 'north',
        unit: 'degree'
      },
      {
        name: 'Geodetic longitude',
        abbreviation: 'Lon',
        direction: 'east',
        unit: 'degree'
      }
    ]
  },
  scope: 'Horizontal component of 3D system.',
  area: 'World.',
  bbox: {
    south_latitude: -90,
    west_longitude: -180,
    north_latitude: 90,
    east_longitude: 180
  },
  id: {
    authority: 'EPSG',
    code: 4326
  }
} satisfies PROJJSONCRS;

export const utm31NProjectedCRS = {
  $schema: 'https://proj.org/schemas/v0.1/projjson.schema.json',
  type: 'ProjectedCRS',
  name: 'WGS 84 / UTM zone 31N',
  base_crs: {
    type: 'GeographicCRS',
    name: 'WGS 84',
    datum: {
      type: 'GeodeticReferenceFrame',
      name: 'World Geodetic System 1984',
      ellipsoid: {
        name: 'WGS 84',
        semi_major_axis: 6378137,
        inverse_flattening: 298.257223563
      }
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        {
          name: 'Geodetic latitude',
          abbreviation: 'Lat',
          direction: 'north',
          unit: 'degree'
        },
        {
          name: 'Geodetic longitude',
          abbreviation: 'Lon',
          direction: 'east',
          unit: 'degree'
        }
      ]
    },
    id: {
      authority: 'EPSG',
      code: 4326
    }
  },
  conversion: {
    name: 'UTM zone 31N',
    method: {
      name: 'Transverse Mercator',
      id: {
        authority: 'EPSG',
        code: 9807
      }
    },
    parameters: [
      {
        name: 'Latitude of natural origin',
        value: 0,
        unit: 'degree',
        id: {
          authority: 'EPSG',
          code: 8801
        }
      },
      {
        name: 'Longitude of natural origin',
        value: 3,
        unit: 'degree',
        id: {
          authority: 'EPSG',
          code: 8802
        }
      },
      {
        name: 'Scale factor at natural origin',
        value: 0.9996,
        unit: 'unity',
        id: {
          authority: 'EPSG',
          code: 8805
        }
      },
      {
        name: 'False easting',
        value: 500000,
        unit: 'metre',
        id: {
          authority: 'EPSG',
          code: 8806
        }
      },
      {
        name: 'False northing',
        value: 0,
        unit: 'metre',
        id: {
          authority: 'EPSG',
          code: 8807
        }
      }
    ]
  },
  coordinate_system: {
    subtype: 'Cartesian',
    axis: [
      {
        name: 'Easting',
        abbreviation: 'E',
        direction: 'east',
        unit: 'metre'
      },
      {
        name: 'Northing',
        abbreviation: 'N',
        direction: 'north',
        unit: 'metre'
      }
    ]
  },
  area: 'World - N hemisphere - 0°E to 6°E - by country',
  bbox: {
    south_latitude: 0,
    west_longitude: 0,
    north_latitude: 84,
    east_longitude: 6
  },
  id: {
    authority: 'EPSG',
    code: 32631
  }
} satisfies PROJJSONCRS;

export const wgs84Egm2008CompoundCRS = {
  $schema: 'https://proj.org/schemas/v0.4/projjson.schema.json',
  type: 'CompoundCRS',
  name: 'WGS 84 + EGM2008 height',
  components: [
    {
      type: 'GeographicCRS',
      name: 'WGS 84',
      datum_ensemble: {
        name: 'World Geodetic System 1984 ensemble',
        members: [
          {
            name: 'World Geodetic System 1984 (Transit)',
            id: {
              authority: 'EPSG',
              code: 1166
            }
          },
          {
            name: 'World Geodetic System 1984 (G730)',
            id: {
              authority: 'EPSG',
              code: 1152
            }
          },
          {
            name: 'World Geodetic System 1984 (G873)',
            id: {
              authority: 'EPSG',
              code: 1153
            }
          },
          {
            name: 'World Geodetic System 1984 (G1150)',
            id: {
              authority: 'EPSG',
              code: 1154
            }
          },
          {
            name: 'World Geodetic System 1984 (G1674)',
            id: {
              authority: 'EPSG',
              code: 1155
            }
          },
          {
            name: 'World Geodetic System 1984 (G1762)',
            id: {
              authority: 'EPSG',
              code: 1156
            }
          },
          {
            name: 'World Geodetic System 1984 (G2139)',
            id: {
              authority: 'EPSG',
              code: 1309
            }
          }
        ],
        ellipsoid: {
          name: 'WGS 84',
          semi_major_axis: 6378137,
          inverse_flattening: 298.257223563
        },
        accuracy: '2.0',
        id: {
          authority: 'EPSG',
          code: 6326
        }
      },
      coordinate_system: {
        subtype: 'ellipsoidal',
        axis: [
          {
            name: 'Geodetic latitude',
            abbreviation: 'Lat',
            direction: 'north',
            unit: 'degree'
          },
          {
            name: 'Geodetic longitude',
            abbreviation: 'Lon',
            direction: 'east',
            unit: 'degree'
          }
        ]
      }
    },
    {
      type: 'VerticalCRS',
      name: 'EGM2008 height',
      datum: {
        type: 'VerticalReferenceFrame',
        name: 'EGM2008 geoid'
      },
      coordinate_system: {
        subtype: 'vertical',
        axis: [
          {
            name: 'Gravity-related height',
            abbreviation: 'H',
            direction: 'up',
            unit: 'metre'
          }
        ]
      }
    }
  ],
  scope: 'Spatial referencing.',
  area: 'World.',
  bbox: {
    south_latitude: -90,
    west_longitude: -180,
    north_latitude: 90,
    east_longitude: 180
  },
  id: {
    authority: 'EPSG',
    code: 9518
  }
} satisfies PROJJSONCRS;

export const etrs89BoundCRS = {
  $schema: 'https://proj.org/schemas/v0.4/projjson.schema.json',
  type: 'BoundCRS',
  source_crs: {
    type: 'GeographicCRS',
    name: 'ETRS89',
    datum_ensemble: {
      name: 'European Terrestrial Reference System 1989 ensemble',
      members: [
        {
          name: 'European Terrestrial Reference Frame 1989'
        },
        {
          name: 'European Terrestrial Reference Frame 1990'
        },
        {
          name: 'European Terrestrial Reference Frame 1991'
        },
        {
          name: 'European Terrestrial Reference Frame 1992'
        },
        {
          name: 'European Terrestrial Reference Frame 1993'
        },
        {
          name: 'European Terrestrial Reference Frame 1994'
        },
        {
          name: 'European Terrestrial Reference Frame 1996'
        },
        {
          name: 'European Terrestrial Reference Frame 1997'
        },
        {
          name: 'European Terrestrial Reference Frame 2000'
        },
        {
          name: 'European Terrestrial Reference Frame 2005'
        },
        {
          name: 'European Terrestrial Reference Frame 2014'
        }
      ],
      ellipsoid: {
        name: 'GRS 1980',
        semi_major_axis: 6378137,
        inverse_flattening: 298.257222101
      },
      accuracy: '0.1'
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        {
          name: 'Geodetic latitude',
          abbreviation: 'Lat',
          direction: 'north',
          unit: 'degree'
        },
        {
          name: 'Geodetic longitude',
          abbreviation: 'Lon',
          direction: 'east',
          unit: 'degree'
        }
      ]
    },
    id: {
      authority: 'EPSG',
      code: 4258
    }
  },
  target_crs: {
    type: 'GeographicCRS',
    name: 'WGS 84',
    datum: {
      type: 'GeodeticReferenceFrame',
      name: 'World Geodetic System 1984',
      ellipsoid: {
        name: 'WGS 84',
        semi_major_axis: 6378137,
        inverse_flattening: 298.257223563
      }
    },
    coordinate_system: {
      subtype: 'ellipsoidal',
      axis: [
        {
          name: 'Geodetic latitude',
          abbreviation: 'Lat',
          direction: 'north',
          unit: 'degree'
        },
        {
          name: 'Geodetic longitude',
          abbreviation: 'Lon',
          direction: 'east',
          unit: 'degree'
        }
      ]
    },
    id: {
      authority: 'EPSG',
      code: 4326
    }
  },
  transformation: {
    name: 'Transformation from unknown to WGS84',
    method: {
      name: 'Position Vector transformation (geog2D domain)',
      id: {
        authority: 'EPSG',
        code: 9606
      }
    },
    parameters: [
      {
        name: 'X-axis translation',
        value: 0,
        unit: 'metre',
        id: {
          authority: 'EPSG',
          code: 8605
        }
      },
      {
        name: 'Y-axis translation',
        value: 0,
        unit: 'metre',
        id: {
          authority: 'EPSG',
          code: 8606
        }
      },
      {
        name: 'Z-axis translation',
        value: 0,
        unit: 'metre',
        id: {
          authority: 'EPSG',
          code: 8607
        }
      },
      {
        name: 'X-axis rotation',
        value: 0,
        unit: {
          type: 'AngularUnit',
          name: 'arc-second',
          conversion_factor: 0.00000484813681109536
        },
        id: {
          authority: 'EPSG',
          code: 8608
        }
      },
      {
        name: 'Y-axis rotation',
        value: 0,
        unit: {
          type: 'AngularUnit',
          name: 'arc-second',
          conversion_factor: 0.00000484813681109536
        },
        id: {
          authority: 'EPSG',
          code: 8609
        }
      },
      {
        name: 'Z-axis rotation',
        value: 0,
        unit: {
          type: 'AngularUnit',
          name: 'arc-second',
          conversion_factor: 0.00000484813681109536
        },
        id: {
          authority: 'EPSG',
          code: 8610
        }
      },
      {
        name: 'Scale difference',
        value: 0,
        unit: {
          type: 'ScaleUnit',
          name: 'parts per million',
          conversion_factor: 0.000001
        },
        id: {
          authority: 'EPSG',
          code: 8611
        }
      }
    ]
  }
} satisfies PROJJSONCRS;

export const egm2008VerticalCRS = {
  type: 'VerticalCRS',
  name: 'EGM2008 height',
  datum: {
    type: 'VerticalReferenceFrame',
    name: 'EGM2008 geoid'
  },
  coordinate_system: {
    subtype: 'vertical',
    axis: [
      {
        name: 'Gravity-related height',
        abbreviation: 'H',
        direction: 'up',
        unit: 'metre'
      }
    ]
  }
} satisfies PROJJSONCRS;

export const officialPROJJSONCRSExamples: PROJJSONCRS[] = [
  wgs84GeographicCRS,
  utm31NProjectedCRS,
  wgs84Egm2008CompoundCRS,
  etrs89BoundCRS
];
