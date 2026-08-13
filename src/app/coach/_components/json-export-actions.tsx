"use client";
import { useState } from "react";
export function JsonExportActions({reportId,data}:{reportId:string;data:unknown}) {
  const [copied,setCopied]=useState(false); const json=JSON.stringify(data,null,2);
  async function copy(){await navigator.clipboard.writeText(json);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}
  function download(){const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`${reportId}-full.json`;link.click();URL.revokeObjectURL(url);}
  return <div className="coach-export-actions"><button className="button primary" type="button" onClick={copy}>{copied?"已複製完整 JSON":"一鍵複製完整 JSON"}</button><button className="button secondary" type="button" onClick={download}>下載 JSON</button></div>;
}
