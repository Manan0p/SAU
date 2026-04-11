import Link from "next/link";
import { ArrowRight, Shield, Heart, Activity, Stethoscope, Clock, MapPin, CalendarDays } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#cae2fe] selection:text-[#00478d]">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#eceef0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#d6e3ff] text-[#00478d] shadow-sm" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>UniWell</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4a6078]">
            <a href="#features" className="hover:text-[#00478d] transition-colors">Features</a>
            <Link href="/subscription" className="hover:text-[#00478d] transition-colors">Subscription Model</Link>
          </div>
          <Link href="/login">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] hover:scale-105" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
              Enter Portals
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Ambient Blobs */}
        <div className="absolute top-10 left-[-100px] w-96 h-96 rounded-full bg-[#cae2fe] opacity-40 mix-blend-multiply blur-3xl" />
        <div className="absolute top-40 right-10 w-80 h-80 rounded-full bg-[#d6e3ff] opacity-40 mix-blend-multiply blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] rounded-full bg-[#e3eafd] opacity-40 mix-blend-multiply blur-3xl" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#eceef0] shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-[#005eb8] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#4a6078]">Campus Healthcare Layer</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#191c1e] mb-6 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
            Your Unified Campus <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00478d, #005eb8)" }}>
              Health Sanctuary
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#4a6078] mb-10 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "var(--font-public-sans)" }}>
            A single, comprehensive platform managing emergency SOS, medical records, digital prescriptions, and insurance claims for the entire student body and clinical staff.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <button className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 rounded-[1rem] text-base font-bold text-white transition-all shadow-[0_4px_24px_rgba(0,94,184,0.25)] hover:scale-105 hover:shadow-[0_8px_32px_rgba(0,94,184,0.3)]" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
                Sign In to Portals
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/subscription">
              <button className="w-full sm:w-auto px-8 py-4 rounded-[1rem] text-base font-bold text-[#00478d] bg-[#d6e3ff] border border-[#cae2fe] shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:bg-[#cae2fe] transition-all">
                View Subscription Model
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section id="features" className="py-24 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#191c1e] mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Everything you need for campus wellbeing</h2>
            <p className="text-[#727783] text-base">UniWell connects students and medical staff seamlessly, minimizing administration overhead and maximizing care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Activity, title: "Emergency SOS", desc: "Live GPS broadcast and immediate alert routing to the campus medical response team.", color: "#ba1a1a", bg: "#ffdad6" },
              { icon: Shield, title: "Insurance Claims", desc: "Digital verification and automated routing for instant student health insurance claim approvals.", color: "#00478d", bg: "#d6e3ff" },
              { icon: CalendarDays, title: "Instant Booking", desc: "Book appointments with campus physicians right from your device, skip the waiting queue.", color: "#4a6078", bg: "#eceef0" },
              { icon: Stethoscope, title: "Digital Records", desc: "A unified patient dashboard holding historical diagnoses, allergies, and blood types securely.", color: "#005eb8", bg: "#cae2fe" },
              { icon: Clock, title: "Medication Details", desc: "Pharmacy tracking and medication reminders linked directly to prescriptions.", color: "#424752", bg: "#f2f4f6" },
              { icon: MapPin, title: "Facility Mapping", desc: "Immediate routing to nearby automated external defibrillators (AEDs) and first aid kits.", color: "#00478d", bg: "#d6e3ff" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#f7f9fb] rounded-3xl p-8 border border-[#eceef0] transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(25,28,30,0.06)] group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: feature.bg }}>
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-[#191c1e] mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>{feature.title}</h3>
                <p className="text-sm text-[#727783] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / CTA ── */}
      <footer className="py-20 bg-white border-t border-[#eceef0]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#191c1e] mb-6" style={{ fontFamily: 'var(--font-manrope)' }}>Ready to access your portal?</h2>
          <p className="text-[#727783] mb-8">Securely log in to manage your appointments, health records, or staff duties.</p>
          <Link href="/login">
            <button className="px-8 py-4 rounded-[1rem] text-base font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.2)] hover:scale-105" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
              Access UniWell
            </button>
          </Link>
          <p className="text-xs text-[#a8adb8] mt-12 uppercase tracking-widest font-bold">© 2026 South Asian University · Health Tech Layer</p>
        </div>
      </footer>
    </div>
  );
}
