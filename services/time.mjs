export function toFormatted(milliseconds) {
  const pad = (n, len = 2) => n.toString().padStart(len, '0');
  
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = milliseconds % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(ms, 3)}`;
}