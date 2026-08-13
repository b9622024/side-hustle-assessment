import { EclipticGeoMoon, SiderealTime, SunPosition } from "astronomy-engine";
import type { AstrologyElement, AstrologyModality } from "../scoring/types";
import type { AstrologyPlacement, AstrologyProfile } from "../report/types";

const SIGNS = [
  ["牡羊座","FIRE","CARDINAL"],["金牛座","EARTH","FIXED"],["雙子座","AIR","MUTABLE"],
  ["巨蟹座","WATER","CARDINAL"],["獅子座","FIRE","FIXED"],["處女座","EARTH","MUTABLE"],
  ["天秤座","AIR","CARDINAL"],["天蠍座","WATER","FIXED"],["射手座","FIRE","MUTABLE"],
  ["摩羯座","EARTH","CARDINAL"],["水瓶座","AIR","FIXED"],["雙魚座","WATER","MUTABLE"],
] as const satisfies ReadonlyArray<readonly [string,AstrologyElement,AstrologyModality]>;

const LOCATIONS: Array<{matches:string[];latitude:number;longitude:number}> = [
  {matches:["台北","臺北","新北","基隆"],latitude:25.033,longitude:121.5654},{matches:["桃園"],latitude:24.9937,longitude:121.301},
  {matches:["新竹"],latitude:24.8138,longitude:120.9675},{matches:["苗栗"],latitude:24.5602,longitude:120.8214},
  {matches:["台中","臺中"],latitude:24.1477,longitude:120.6736},{matches:["彰化"],latitude:24.0756,longitude:120.544},
  {matches:["南投"],latitude:23.9609,longitude:120.9719},{matches:["雲林"],latitude:23.7092,longitude:120.4313},
  {matches:["嘉義"],latitude:23.4801,longitude:120.4491},{matches:["台南","臺南"],latitude:22.9999,longitude:120.2269},
  {matches:["高雄"],latitude:22.6273,longitude:120.3014},{matches:["屏東"],latitude:22.5519,longitude:120.5488},
  {matches:["宜蘭"],latitude:24.7021,longitude:121.7378},{matches:["花蓮"],latitude:23.9911,longitude:121.6112},
  {matches:["台東","臺東"],latitude:22.7554,longitude:121.15},{matches:["澎湖"],latitude:23.5712,longitude:119.5793},
  {matches:["金門"],latitude:24.4494,longitude:118.3767},{matches:["馬祖","連江"],latitude:26.1605,longitude:119.9517},
];

function placement(longitude:number):AstrologyPlacement {
  const normalized=((longitude%360)+360)%360;
  const [sign,element,modality]=SIGNS[Math.floor(normalized/30)]!;
  return {sign,element,modality,longitude:Number(normalized.toFixed(6))};
}

function taiwanLocalDate(birthDate:string,birthTime:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) throw new Error("INVALID_BIRTH_DATETIME");
  return new Date(`${birthDate}T${birthTime}:00+08:00`);
}

function ascendantLongitude(date:Date,latitude:number,longitude:number) {
  const radians=Math.PI/180;
  const theta=(SiderealTime(date)*15+longitude)*radians;
  const phi=latitude*radians;
  const obliquity=23.4392911*radians;
  const raw=Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(obliquity)+Math.tan(phi)*Math.sin(obliquity))/radians+180;
  return (raw+360)%360;
}

export function calculateBasicAstrologyProfile(birthDate:string,birthTime?:string,birthPlace?:string):AstrologyProfile {
  const date=taiwanLocalDate(birthDate,birthTime??"12:00");
  const sun=placement(SunPosition(date).elon);
  if(!birthTime) return {sun,calculation:{engine:"astronomy-engine-2.1.19",timezone:"Asia/Taipei",precision:"SUN_ONLY",location_resolved:false}};
  const moon=placement(EclipticGeoMoon(date).lon);
  const location=LOCATIONS.find(item=>item.matches.some(name=>birthPlace?.includes(name)));
  if(!location) return {sun,moon,calculation:{engine:"astronomy-engine-2.1.19",timezone:"Asia/Taipei",precision:"SUN_MOON",location_resolved:false}};
  return {sun,moon,ascendant:placement(ascendantLongitude(date,location.latitude,location.longitude)),calculation:{engine:"astronomy-engine-2.1.19",timezone:"Asia/Taipei",precision:"SUN_MOON_ASCENDANT",location_resolved:true,latitude:location.latitude,longitude:location.longitude}};
}
