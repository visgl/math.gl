declare module 'open-location-code' {
  export type OpenLocationCodeArea = {
    latitudeLo: number;
    longitudeLo: number;
    latitudeHi: number;
    longitudeHi: number;
    latitudeCenter: number;
    longitudeCenter: number;
    codeLength: number;
  };

  export class OpenLocationCode {
    isFull(code: string): boolean;
    decode(code: string): OpenLocationCodeArea;
  }

  const openLocationCodePackage: {OpenLocationCode: typeof OpenLocationCode};
  export default openLocationCodePackage;
}
