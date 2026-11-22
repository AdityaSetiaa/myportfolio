"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export function CopyEmail({email}:{email:string}) {const [copied,setCopied]=useState(false); return <button className="button ghost" onClick={async()=>{await navigator.clipboard.writeText(email);setCopied(true);window.setTimeout(()=>setCopied(false),2000)}}>{copied?"Copied email":"Copy email"} {copied?<Check size={17}/>:<Copy size={17}/>}</button>}