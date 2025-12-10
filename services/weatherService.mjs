export const weatherEnrichementService = {
  agregate: async (activity) => {
    const [long, lat] = activity.startPosition.geometry.coordinates;
    const timestamp = new Date(activity.startPosition.timestamp);
    const date = timestamp.toISOString().split("T")[0];
    const hour = timestamp.getHours();

    const daysDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const baseUrl =
      daysDiff > 7
        ? "https://archive-api.open-meteo.com/v1/archive"
        : "https://api.open-meteo.com/v1/forecast";

    const res = await fetch(
      `${baseUrl}?latitude=${lat}&longitude=${long}&hourly=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&start_date=${date}&end_date=${date}`
    );
    const { hourly } = await res.json();

    const weather = {
      temperature: hourly.temperature_2m[hour],
      humidity: hourly.relative_humidity_2m[hour],
      windSpeed: hourly.wind_speed_10m[hour],
      conditions: getConditions(hourly.weather_code[hour]),
      fetched_at: new Date(),
    };

    const elevationGain = activity.elevationGain
    const { difficultyScore, difficultyFactors } = calcDifficulty(
      hourly.weather_code[hour],
      hourly.wind_speed_10m[hour],
      hourly.temperature_2m[hour],
      elevationGain
    );

    return { weather, difficultyScore, difficultyFactors };
  },
};

const calcDifficulty = (weatherCode, windSpeed, temperature, elevationGain) => {
  const baseScore = 1.0;

  const elevationBonus = Math.min(elevationGain / 500, 0.4);

  const windBonus = windSpeed > 40 ? 0.2 : windSpeed > 20 ? 0.1 : 0;

  const temperatureBonus =
    temperature < 0 || temperature > 32
      ? 0.15
      : temperature < 5 || temperature > 28
      ? 0.08
      : 0;

  const weatherBonus =
    weatherCode >= 80
      ? 0.1 // orage/grêle
      : weatherCode >= 70
      ? 0.08 // neige
      : weatherCode >= 50
      ? 0.05 // pluie/bruine
      : 0;

  const total = Math.min(
    baseScore + elevationBonus + windBonus + temperatureBonus + weatherBonus,
    2.0
  );

  return {
    difficultyScore: Math.round(total * 100) / 100,
    difficultyFactors: {
      baseScore,
      elevationBonus,
      weatherBonus,
      windBonus,
      temperatureBonus,
    },
  };
};

const getConditions = (code) => {
  if (code <= 3) return "clear";
  if (code <= 49) return "foggy";
  if (code <= 69) return "rainy";
  if (code <= 79) return "snowy";
  return "stormy";
};
