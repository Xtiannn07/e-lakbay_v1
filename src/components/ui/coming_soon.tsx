import { useState, useEffect } from "react";
import {
  HardHat,
  X,
  Construction,
  Mail,
} from "lucide-react";
import constructionAnimation from '../../assets/Construction_Animation.webm';

export default function ComingSoonModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative z-50 w-full max-w-lg bg-zinc-900 border-2 border-yellow-400 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(250,204,21,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hazard stripe header */}
        <div
          className="h-4 w-full"
          style={{
            background:
              "repeating-linear-gradient(45deg, #facc15 0px, #facc15 16px, #1c1917 16px, #1c1917 32px)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-4 text-zinc-400 hover:text-yellow-400 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="px-6 pt-4 pb-6 sm:px-10 sm:pt-6 sm:pb-8">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-yellow-400 transition-all duration-100" />
            <span className="text-yellow-400 text-xs tracking-[0.3em] uppercase">
              Site Under Construction
            </span>
          </div>

          {/* Construction Animation Video */}
          <div className="relative w-full h-44 sm:h-52 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden mb-6 flex items-center justify-center">
            <video
              src={constructionAnimation}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Construction size={18} className="text-yellow-400" />
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                COMING SOON
              </h2>
              <Construction size={18} className="text-yellow-400" />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
              We're building something epic. Our crew is working around the
              clock. Leave your email and be first to know when we open.
            </p>
          </div>

          {/* Email form */}
          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubmitted(true);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-900 text-sm font-black rounded-lg transition-colors whitespace-nowrap tracking-wide"
              >
                NOTIFY ME
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
              <HardHat size={16} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold">
                You're on the list — we'll holler!
              </span>
            </div>
          )}
        </div>

        {/* Hazard stripe footer */}
        <div
          className="h-3 w-full"
          style={{
            background:
              "repeating-linear-gradient(45deg, #facc15 0px, #facc15 12px, #1c1917 12px, #1c1917 24px)",
          }}
        />
      </div>
    </div>
  );
}