interface OpenWeatherCurrentResponse {
  weather?: Array<{
    main?: string;
    description?: string;
    icon?: string;
  }>;
  main?: {
    temp?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
  name?: string;
  cod?: number | string;
  message?: string;
}

export interface CurrentWeatherData {
  tempC: number;
  condition: string;
  humidity: number | null;
  windKph: number | null;
  iconCode: string | null;
  locationName: string | null;
}

const OPEN_WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const toSentenceCase = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const mapCurrentWeatherPayload = (payload: OpenWeatherCurrentResponse): CurrentWeatherData => {
  const weather = payload.weather?.[0];
  const tempC = typeof payload.main?.temp === 'number' ? payload.main.temp : Number.NaN;

  if (Number.isNaN(tempC)) {
    throw new Error('Weather data is incomplete.');
  }

  return {
    tempC,
    condition: toSentenceCase(weather?.description || weather?.main || 'Unknown'),
    humidity: typeof payload.main?.humidity === 'number' ? payload.main.humidity : null,
    windKph: typeof payload.wind?.speed === 'number' ? payload.wind.speed * 3.6 : null,
    iconCode: weather?.icon || null,
    locationName: payload.name || null,
  };
};

const fetchWeather = async (query: URLSearchParams, signal?: AbortSignal): Promise<CurrentWeatherData> => {
  const response = await fetch(`${OPEN_WEATHER_BASE_URL}?${query.toString()}`, { signal });
  const payload = (await response.json()) as OpenWeatherCurrentResponse;

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to fetch current weather.');
  }

  return mapCurrentWeatherPayload(payload);
};

const getRequiredApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenWeather API key is missing. Set VITE_OPENWEATHER_API_KEY.');
  }

  return apiKey;
};

export const fetchCurrentWeather = async (
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CurrentWeatherData> => {
  const apiKey = getRequiredApiKey();

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: 'metric',
    lang: 'en',
  });

  return fetchWeather(query, signal);
};

export const fetchCurrentWeatherByMunicipality = async (
  municipality: string,
  province = 'Ilocos Sur',
  countryCode = 'PH',
  signal?: AbortSignal,
): Promise<CurrentWeatherData> => {
  const apiKey = getRequiredApiKey();
  const locationQuery = [municipality, province, countryCode].filter(Boolean).join(',');

  const query = new URLSearchParams({
    q: locationQuery,
    appid: apiKey,
    units: 'metric',
    lang: 'en',
  });

  return fetchWeather(query, signal);
};