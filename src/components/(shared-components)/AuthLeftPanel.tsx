"use client"

import { Wallet } from "lucide-react";

interface AuthLeftPanelProps {
  title: React.ReactNode;
  description: string;
  narrow?: boolean;
}

export default function AuthLeftPanel({ title, description, narrow }: AuthLeftPanelProps) {
  const width = narrow
    ? "lg:w-[500px] xl:w-[560px]"
    : "lg:w-[580px] xl:w-[640px]";

  return (
    <div className={`hidden lg:flex ${width} flex-shrink-0 h-full relative overflow-hidden text-white select-none`}
      style={{ background: "linear-gradient(90deg, #a47451 0.000%, #9c9881 16.667%, #73a09d 33.333%, #3b899a 50.000%, #095b79 66.667%, #002847 83.333%, #000116 100.000%)" }}>

      <style>{`
        @keyframes pn-af { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pn-bf { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)}  }
        @keyframes pn-cf { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-13px)} }
        .pn-card-a { animation: pn-af 5s ease-in-out infinite; }
        .pn-card-b { animation: pn-bf 6.5s ease-in-out infinite; animation-delay: 1s; }
        .pn-card-c { animation: pn-cf 4.5s ease-in-out infinite; animation-delay: 2s; }
      `}</style>

      {/* Ambient glow orbs */}
      <div className="absolute pointer-events-none" style={{ top: "-10%", right: "-5%", width: 440, height: 440, background: "radial-gradient(circle, oklch(0.9685 0.2061 109.7 / 0.16) 0%, transparent 65%)", filter: "blur(48px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-5%", left: "-8%", width: 380, height: 380, background: "radial-gradient(circle, oklch(0.75 0 0 / 0.18) 0%, transparent 65%)", filter: "blur(48px)" }} />

      {/* Dot grid — bottom left */}
      <div className="absolute bottom-10 left-10 grid gap-[7px]"
        style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full bg-white/20" />
        ))}
      </div>

      {/* Scatter marks */}
      <span className="absolute top-[19%] left-[17%] text-[22px] text-white/[0.18] font-extralight leading-none">+</span>
      <span className="absolute top-[27%] right-[18%] text-[16px] text-white/[0.13] font-extralight leading-none">×</span>
      <span className="absolute top-[51%] right-[7%]  text-[22px] text-white/[0.16] font-extralight leading-none">+</span>
      <span className="absolute bottom-[31%] left-[8%] text-[16px] text-white/[0.13] font-extralight leading-none">×</span>
      <span className="absolute top-[42%] left-[4%]  text-[11px] text-white/[0.09] font-extralight leading-none">+</span>

      {/* Outline square decorations */}
      <div className="absolute top-[22%] left-[10%] w-14 h-14 rounded-xl border border-white/[0.10] rotate-[14deg]" />
      <div className="absolute top-[31%] right-[7%] w-8  h-8  rounded-lg border border-white/[0.08] -rotate-[7deg]" />
      <div className="absolute bottom-[26%] right-[4%] w-10 h-10 rounded-lg border border-white/[0.07] rotate-[5deg]" />

      {/* Inner layout */}
      <div className="relative flex flex-col h-full w-full p-10 xl:p-12">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex w-9 h-9 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <Wallet className="w-[17px] h-[17px]" />
          </div>
          <span className="text-[20px] font-bold tracking-tight">Paynest</span>
        </div>

        {/* Cards area */}
        <div className="flex-1 relative min-h-0 mt-2">

          {/* Revenue card */}
          <div className="pn-card-a absolute rounded-2xl bg-white ring-1 ring-black/[0.06] p-5 text-gray-900"
            style={{ width: 272, top: "11%", left: "5%", boxShadow: "0 12px 56px rgba(0,0,0,0.45)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Today&apos;s Revenue
            </p>
            <p className="text-[24px] font-bold tracking-tight leading-none text-gray-900">
              GHS 24,850
              <span className="text-[15px] font-normal text-gray-400">.00</span>
            </p>

            {/* Sparkline */}
            <svg className="w-full mt-3 mb-3" height="40" viewBox="0 0 240 40" fill="none">
              <path
                d="M0 34 Q25 34 42 26 Q62 17 82 22 Q108 29 128 15 Q148 5 172 11 Q196 17 212 7 Q226 2 240 5"
                stroke="oklch(0.2 0 0)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.7"
              />
              <circle cx="212" cy="7" r="4" fill="oklch(0.2 0 0)" opacity="0.85" />
              <circle cx="212" cy="7" r="9" fill="oklch(0.2 0 0)" opacity="0.10" />
            </svg>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ↑ 18.4%
              </span>
              <span className="text-[11px] text-gray-400">vs yesterday</span>
            </div>
          </div>

          {/* Payment received notification */}
          <div className="pn-card-b absolute rounded-2xl bg-white ring-1 ring-black/[0.06] px-4 py-3.5 flex items-center gap-3"
            style={{ width: 196, top: "4%", right: "4%", boxShadow: "0 10px 48px rgba(0,0,0,0.40)" }}>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 16 16" className="w-[15px] h-[15px]"
                fill="none" stroke="#059669" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,8 6,12 14,4" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-gray-800 leading-tight">Payment Received</p>
              <p className="text-[12px] font-bold text-emerald-600 mt-0.5">+GHS 3,200.00</p>
            </div>
          </div>

          {/* Recent sales list */}
          <div className="pn-card-c absolute rounded-2xl bg-white ring-1 ring-black/[0.06] p-4"
            style={{ width: 212, bottom: "11%", right: "2%", boxShadow: "0 10px 48px rgba(0,0,0,0.40)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5">
              Recent Sales
            </p>
            {[
              { name: "Laptop Stand", amt: "120.00" },
              { name: "USB-C Hub", amt: "45.00" },
              { name: "Wireless Mouse", amt: "85.00" },
            ].map((row, i) => (
              <div key={i}
                className={`flex items-center justify-between py-[7px] ${i < 2 ? "border-b border-gray-100" : ""}`}>
                <span className="text-[12px] text-gray-600">{row.name}</span>
                <span className="text-[12px] font-semibold text-gray-900">GHS {row.amt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="pb-1">
          <h1 className="text-[32px] xl:text-[38px] font-black leading-[1.07] tracking-tight mb-2.5 text-white">
            {title}
          </h1>
          <p className="text-white/50 text-[13.5px] leading-relaxed max-w-[290px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
