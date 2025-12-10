/**
 * Formate un nombre de secondes en chaîne de temps lisible (HH:MM:SS ou MM:SS)
 * @param {number} seconds - Le nombre de secondes à formater
 * @returns {string} Le temps formaté au format "H:MM:SS" si >= 1h, sinon "M:SS"
 * @example
 * formatTime(3665) // "1:01:05"
 * formatTime(125)  // "2:05"
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};
