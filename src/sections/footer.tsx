import { Facebook, Instagram, X, Github, Youtube } from "lucide-react";
import { useState } from 'react';
import logo from '../assets/e-lakbay_logo(black).svg';
import ComingSoonModal from '../components/ui/coming_soon';

const navLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Partners", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "License", href: "#" },
];

const socials = [
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: X, label: "X / Twitter", href: "https://x.com" },
  { icon: Github, label: "GitHub", href: "https://github.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
];

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border p-4 md:px-8">

      {/* ── Upper Row: brand left, nav centered ──
          Stays as a row on tablet (md). Stacks to column only on mobile (sm and below). */}
    <div className="flex flex-row items-start md:items-center  gap-6 md:gap-12 lg:gap-16">

    {/* Brand */}
    <div className="flex flex-col items-center gap-1 shrink-0">
        <img src={logo} alt="E-Lakbay" className="w-auto h-16" />
        <span className="font-semibold text-sm tracking-wide">E-Lakbay</span>
    </div>

    {/* Nav Links */}
    <nav
        aria-label="Footer navigation"
        className="flex flex-wrap gap-x-8 gap-y-3 flex-1 items-center justify-center"
    >
        {navLinks.map((link) => (
        <button
            key={link.label}
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 whitespace-nowrap text-underline-offset-5 hover:underline"
        >
            {link.label}
        </button>
        ))}
    </nav>
    </div>

      {/* ── Divider ── */}
      <div className="w-full h-px bg-border my-2" />

      {/* ── Lower Row: copyright left, socials right ──
          Stays as a row on tablet. Stacks to 1 col only on mobile. */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <p className="text-xs text-muted-foreground">
          © 2026 E-Lakbay. All rights reserved.
        </p>

        <div className="flex items-center gap-5" aria-label="Social media links">
          {socials.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              <Icon size={18} strokeWidth={1.75} />
            </a>
          ))}
        </div>

      </div>

      {isModalOpen && (
        <ComingSoonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </footer>
  );
}