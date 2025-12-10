/**
 * Calcule l'allure (pace) en min/km
 * @param {Number} distanceMeters - Distance en mètres
 * @param {Number} timeSeconds - Temps en secondes
 * @returns {String} Allure formatée (ex: "5:30/km")
 */
export const calculatePace = (distanceMeters, timeSeconds) => {
  const distanceKm = distanceMeters / 1000;
  const paceSecondsPerKm = timeSeconds / distanceKm;

  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
};
