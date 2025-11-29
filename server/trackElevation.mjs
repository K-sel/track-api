let previousElevation = null;
let totalElevationGain = 0;
let totalElevationLoss = 0;
let maxAltitude = 0;
let minAltitude = 0;

const ELEVATION_THRESHOLD = 3;

export const trackElevation = (data, elevationData) => {
  const currentElevation = parseFloat(elevationData?.height);

  if (!currentElevation || isNaN(currentElevation)) return;

  if (data.start) {
    previousElevation = currentElevation;
    totalElevationGain = 0;
    totalElevationLoss = 0;
    maxAltitude = currentElevation;
    minAltitude = currentElevation;
    console.log(`Tracking started at altitude: ${currentElevation}m`);
    return;
  }

  if (data.stop) {
    console.log(
      `Tracking stopped. Total gain: ${totalElevationGain.toFixed(
        2
      )}m, Total loss: ${totalElevationLoss.toFixed(2)}m`
    );
    previousElevation = null;
    return;
  }

  if (previousElevation !== null) {
    const elevationChange = currentElevation - previousElevation;

    if (currentElevation > maxAltitude + ELEVATION_THRESHOLD) {
      maxAltitude = currentElevation;
      console.log(`New maximum altitude: ${maxAltitude.toFixed(2)}m`);
    }
    if (currentElevation < minAltitude - ELEVATION_THRESHOLD) {
      minAltitude = currentElevation;
      console.log(`New minimum altitude: ${minAltitude.toFixed(2)}m`);
    }

    if (elevationChange > ELEVATION_THRESHOLD) {
      totalElevationGain += elevationChange;
      console.log(
        `Elevation gain: +${elevationChange.toFixed(
          2
        )}m (Total: ${totalElevationGain.toFixed(2)}m)`
      );
    } else if (elevationChange < -ELEVATION_THRESHOLD) {
      totalElevationLoss += Math.abs(elevationChange);
      console.log(
        `Elevation loss: ${elevationChange.toFixed(
          2
        )}m (Total: ${totalElevationLoss.toFixed(2)}m)`
      );
    }
  }

  previousElevation = currentElevation;
};