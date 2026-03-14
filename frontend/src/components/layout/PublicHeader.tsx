import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Use Cases", to: "/#use-cases" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Security", to: "/security" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Header slides in from top on mount */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled || open
            ? "bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.07)]"
            : "bg-white/85 backdrop-blur-md border-b border-border/40"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 z-10">
            <img src="/logo-icon.svg" alt="LegacyAI" className="h-7 w-7 dark:invert" />
            <span className="text-sm font-semibold text-foreground tracking-tight">Legacy AI</span>
          </Link>

          {/* Right side: CTA + hamburger */}
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 transition-opacity duration-200 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" variant="dark" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>

            {/* Hamburger — visible on all sizes */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 flex flex-col justify-center items-center gap-[5px] rounded-md hover:bg-muted/60 transition-colors"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="block w-[18px] h-px bg-foreground rounded-full origin-center"
              />
              <motion.span
                animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="block w-[18px] h-px bg-foreground rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="block w-[18px] h-px bg-foreground rounded-full origin-center"
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Full slide-down menu panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-14 left-0 right-0 z-40 bg-white overflow-hidden shadow-lg border-b border-border"
            >
              <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
                <div className="grid grid-cols-4 gap-x-8 min-h-[220px]">
                  {/* Left col — brand blurb */}
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Legacy AI</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Voice-first knowledge capture for enterprise teams.</p>
                  </div>

                  {/* Second col — all 6 nav links stacked */}
                  <div className="flex flex-col gap-0.5">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.to}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + i * 0.05, duration: 0.25 }}
                      >
                        <Link
                          to={link.to}
                          onClick={() => setOpen(false)}
                          className={`inline-block py-2 text-sm transition-all duration-150 ${
                            location.pathname === link.to
                              ? "font-semibold text-foreground underline underline-offset-4 decoration-foreground/40"
                              : "text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-foreground/30"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cols 3 & 4 — empty whitespace */}
                </div>

                {/* Bottom row — CTA buttons full-width right-aligned */}
                <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/85 transition-colors whitespace-nowrap"
                  >
                    Get Started Free →
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 top-14 z-30 bg-black/25 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
