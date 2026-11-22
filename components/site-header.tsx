"use client";
import "./section-selector.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, House, UserRound, BriefcaseBusiness, Folder, Code2, GraduationCap, Mail, Download } from "lucide-react";
import { portfolio } from "../data/portfolio";

const links = [
  { label: "Home", href: "/#home", id: "home", Icon: House },
  { label: "About", href: "/#about", id: "about", Icon: UserRound },
  { label: "Experience", href: "/#experience", id: "experience", Icon: BriefcaseBusiness },
  { label: "Work", href: "/#projects", id: "projects", Icon: Folder },
  { label: "Skills", href: "/#skills", id: "skills", Icon: Code2 },
  { label: "Education", href: "/#education", id: "education", Icon: GraduationCap },
  { label: "Contact", href: "/#contact", id: "contact", Icon: Mail },
];

export function SiteHeader() {
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const pathname = usePathname();

  useEffect(() => {
    const panels = document.querySelector<HTMLElement>(".portfolio-sections");
    const update = () => {
      setScrolled(window.scrollY > 24);
      if (pathname !== "/") return;
      if (panels && window.matchMedia("(max-width: 700px)").matches) {
        const index = Math.round(panels.scrollLeft / panels.clientWidth);
        setActive(links[index]?.id ?? "home");
        return;
      }
      const sections = ["home", "about", "experience", "projects", "skills", "education", "contact"]
        .map((id) => document.getElementById(id))
        .filter((section) => section !== null);
      const selectionLine = window.matchMedia("(min-width: 701px)").matches
        ? window.innerHeight * 0.65
        : 180;
      const current = [...sections].reverse().find(
        (section) => section.getBoundingClientRect().top <= selectionLine
      );
      setActive(current?.id ?? "home");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    panels?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      panels?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const current = pathname.startsWith("/projects") ? "projects" : active;
  const activeIndex = links.findIndex(({ id }) => id === current);
  const iconTrack = useRef<HTMLDivElement>(null);
  const previousIndex = useRef(activeIndex);
  useLayoutEffect(() => {
    const count = links.length;
    let steps = activeIndex - previousIndex.current;
    previousIndex.current = activeIndex;
    if (Math.abs(steps) > count / 2) steps -= Math.sign(steps) * count;
    if (!steps || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = iconTrack.current?.animate(
      [{ translate: `${steps * 48}px 0` }, { translate: "0 0" }],
      { duration: 340, easing: "cubic-bezier(.22,1,.36,1)" }
    );
    return () => animation?.cancel();
  }, [activeIndex]);

  return <><header className={`site-header section-selector ${scrolled ? "scrolled" : ""}`}>
    <div className="wrap nav-inner">
      <Link className="brand" href="/" aria-label="Aditya Setia home">AS<span>.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <div className="selector-track" style={{ transform: `translateY(calc(-0.5 * var(--tab-height) - ${activeIndex} * var(--tab-height)))` }}>
        {links.map(({ label, href, id }, index) => <Link key={id} href={href} className={`nav-depth-${Math.min(Math.abs(index - activeIndex), 2)} ${current === id ? "active" : ""}`} aria-current={current === id ? "location" : undefined}><span>{label}</span></Link>)}
        </div>
        {portfolio.resumePath && <a className="resume-link" href={portfolio.resumePath} download>Resume <ArrowUpRight size={15}/></a>}
      </nav>
    </div>
  </header>
    <nav className="mobile-selector" aria-label="Section navigation"
      onTouchStart={({ touches }) => {
        swipeStart.current = touches.length === 1 ? { x: touches[0].clientX, y: touches[0].clientY } : null;
      }}
      onTouchCancel={() => { swipeStart.current = null; }}
      onTouchEnd={({ changedTouches, currentTarget }) => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (!start) return;
        const dx = changedTouches[0].clientX - start.x;
        const dy = changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const next = links[(activeIndex + (dx < 0 ? 1 : -1) + links.length) % links.length];
        if (next) currentTarget.querySelector<HTMLAnchorElement>(`a[href="${next.href}"]`)?.click();
      }}>
        <div ref={iconTrack} className="mobile-icon-track" style={{ transform: `translateX(calc(-22px - ${(links.length + activeIndex) * 48}px))` }}>
        {[-1, 0, 1].flatMap(copy => links.map(({ label, href, id, Icon }) => (
                    <Link key={copy + id} href={href} aria-label={label} title={label}
            tabIndex={copy === 0 ? undefined : -1} aria-hidden={copy === 0 ? undefined : true}
            onClick={event => {
              const section = document.getElementById(id);
              const panels = section?.parentElement;
              if (pathname !== "/" || !panels?.classList.contains("portfolio-sections")) return;
              event.preventDefault();
              panels.scrollTo({ left: links.findIndex(link => link.id === id) * panels.clientWidth, behavior: "instant" });
              setActive(id);
              if (location.hash !== "#" + id) history.pushState(null, "", href);
            }}
            aria-current={current === id ? "location" : undefined}>
            <Icon size={20} aria-hidden="true" />
          </Link>
        )))}
        {portfolio.resumePath && <a href={portfolio.resumePath} download aria-label="Download resume"><Download size={20}/></a>}
        </div>
      </nav></>;
}