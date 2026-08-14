export const TAIWAN_LOCATION_REFERENCE_VERSION = "taiwan-county-city-reference-1.0.0";

export interface ResolvedBirthPlace {
  input: string;
  canonical_name: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  resolution_status: "RESOLVED" | "UNRESOLVED";
  reference_version: string;
}

export const TAIWAN_LOCATIONS = [
  { canonical_name: "台北市", latitude: 25.033, longitude: 121.5654 },
  { canonical_name: "新北市", latitude: 25.012, longitude: 121.4657 },
  { canonical_name: "桃園市", latitude: 24.9937, longitude: 121.301 },
  { canonical_name: "台中市", latitude: 24.1477, longitude: 120.6736 },
  { canonical_name: "台南市", latitude: 22.9999, longitude: 120.2269 },
  { canonical_name: "高雄市", latitude: 22.6273, longitude: 120.3014 },
  { canonical_name: "基隆市", latitude: 25.1276, longitude: 121.7392 },
  { canonical_name: "新竹市", latitude: 24.8138, longitude: 120.9675 },
  { canonical_name: "嘉義市", latitude: 23.4801, longitude: 120.4491 },
  { canonical_name: "新竹縣", latitude: 24.839, longitude: 121.002 },
  { canonical_name: "苗栗縣", latitude: 24.5602, longitude: 120.8214 },
  { canonical_name: "彰化縣", latitude: 24.0756, longitude: 120.544 },
  { canonical_name: "南投縣", latitude: 23.9609, longitude: 120.9719 },
  { canonical_name: "雲林縣", latitude: 23.7092, longitude: 120.4313 },
  { canonical_name: "嘉義縣", latitude: 23.4518, longitude: 120.2555 },
  { canonical_name: "屏東縣", latitude: 22.5519, longitude: 120.5488 },
  { canonical_name: "宜蘭縣", latitude: 24.7021, longitude: 121.7378 },
  { canonical_name: "花蓮縣", latitude: 23.9911, longitude: 121.6112 },
  { canonical_name: "台東縣", latitude: 22.7554, longitude: 121.15 },
  { canonical_name: "澎湖縣", latitude: 23.5712, longitude: 119.5793 },
  { canonical_name: "金門縣", latitude: 24.4494, longitude: 118.3767 },
  { canonical_name: "連江縣", latitude: 26.1605, longitude: 119.9517 },
] as const;

const ALIASES: Record<string, string> = { 臺北市: "台北市", 臺中市: "台中市", 臺南市: "台南市", 臺東縣: "台東縣" };

export function resolveBirthPlace(input = ""): ResolvedBirthPlace {
  const normalized = (ALIASES[input.trim()] ?? input.trim());
  const match = TAIWAN_LOCATIONS.find((location) => location.canonical_name === normalized);
  if (!match) return { input: input.trim(), canonical_name: null, latitude: null, longitude: null, timezone: null, resolution_status: "UNRESOLVED", reference_version: TAIWAN_LOCATION_REFERENCE_VERSION };
  return { input: input.trim(), canonical_name: match.canonical_name, latitude: match.latitude, longitude: match.longitude, timezone: "Asia/Taipei", resolution_status: "RESOLVED", reference_version: TAIWAN_LOCATION_REFERENCE_VERSION };
}
