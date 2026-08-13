"use client";
import { useState } from "react";
export function JsonExportActions({reportId,displayName,data}:{reportId:string;displayName:string;data:unknown}) {
  const [copied,setCopied]=useState(false); const json=JSON.stringify(data,null,2);
  async function copy(){await navigator.clipboard.writeText(json);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}
  function download(){const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`副業適性完整資料-${displayName}-${reportId}.json`;link.click();URL.revokeObjectURL(url);}
  async function downloadPng(){const {toPng}=await import("html-to-image");const target=document.getElementById("client-report-export");if(!target)return;const dataUrl=await toPng(target,{backgroundColor:"#f7f4ed",pixelRatio:2,cacheBust:true});const link=document.createElement("a");link.href=dataUrl;link.download=`副業適性行動報告-${displayName}-${reportId}.png`;link.click();}
  return <div className="coach-export-actions"><button className="button primary" type="button" onClick={copy}>{copied?"已複製完整 JSON":"複製完整 JSON"}</button><button className="button secondary" type="button" onClick={download}>下載 JSON</button><button className="button secondary" type="button" onClick={downloadPng}>下載客戶版 PNG</button></div>;
}
