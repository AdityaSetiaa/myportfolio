import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound(){return <div className="wrap not-found"><p className="eyebrow">404 / PAGE NOT FOUND</p><h1>Nothing at <em>this address.</em></h1><p>The page you’re looking for could not be found.</p><Link className="button primary" href="/"><ArrowLeft size={17}/> Back to home</Link></div>}