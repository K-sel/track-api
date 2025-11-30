import { WGStoLV95 } from "swiss-projection";

export const altitudeService = {
  getAltitude: async (wgsCoordinates) => {
    const lv95Coordinates = WGStoLV95(wgsCoordinates);
    const response = await fetch(
      `https://api3.geo.admin.ch/rest/services/height?easting=${lv95Coordinates[0]}&northing=${lv95Coordinates[1]}`
    );
    return await response.json();
  },
};
