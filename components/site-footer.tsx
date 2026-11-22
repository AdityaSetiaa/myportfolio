"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { portfolio } from "../data/portfolio";
export function SiteFooter() {const year=useSyncExternalStore(()=>()=>{},()=>new Date().getFullYear(),()=>2026);return <footer className="footer"><div className="wrap footer-main"><div><Link className="brand" href="/">AS<span>.</span></Link><p>Aditya Setia · Software Developer</p></div><div className="footer-links">{portfolio.social.github && <a href={portfolio.social.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14}/></a>}{portfolio.social.linkedin && <a href={portfolio.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14}/></a>}<a href="#top">Back to top ↑</a></div></div><div className="wrap footer-bottom"><span>© {year} Aditya Setia</span><span>Designed with intention. Built with code.</span></div></footer>}