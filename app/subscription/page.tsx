import Link from "next/link";
import { ArrowRight, Building2, Brain, Bell, ShieldCheck, Ambulance, BarChart3, FileCheck2, MapPinned } from "lucide-react";

const plans = [
  {
    name: "Campus Essential",
    price: "Rs 50",
    subtitle: "per student / month",
    description: "Core digital health workflow for schools and colleges beginning their transformation.",
  },
  {
    name: "Campus Plus",
    price: "Rs 75",
    subtitle: "per student / month",
    description: "Balanced package for institutions that need analytics, reminders, and insurer coordination.",
  },
  {
    name: "Campus Enterprise",
    price: "Rs 100",
    subtitle: "per student / month",
    description: "Advanced hospital integrations, claim automation, and high-scale emergency readiness.",
  },
];

const premiumFeatures = [
  {
    title: "AI Symptom Triage",
    detail: "Students input symptoms and AI suggests potential diagnosis pathways for faster action.",
    icon: Brain,
  },
  {
    title: "Advanced Analytics Dashboard",
    detail: "Operational insights for administrators, medical teams, and policy decisions.",
    icon: BarChart3,
  },
  {
    title: "Medicine Reminders",
    detail: "Scheduled medication nudges improve adherence and reduce missed doses.",
    icon: Bell,
  },
  {
    title: "Hospital Integration",
    detail: "Paid integration pathway with partner hospitals for escalation and continuity of care.",
    icon: Building2,
  },
  {
    title: "Insurance + Compensation Flow",
    detail: "Integrated insurers with compensation handling and per-claim process visibility.",
    icon: ShieldCheck,
  },
];

const metrics = [
  { label: "Target claim turnaround", value: "< 24h" },
  { label: "Emergency dispatch trigger", value: "< 30s" },
  { label: "Medication adherence lift", value: "+35%" },
  { label: "Manual admin effort reduction", value: "-40%" },
];

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#eceef0]">
        <div className="max-w-7xl mx-auto h-18 px-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
            UniWell
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
          >
            Enter Portals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-14 space-y-14">
        <section className="rounded-4xl border border-[#eceef0] bg-white p-10 shadow-[0_8px_30px_rgba(25,28,30,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#005eb8]">Institutional Pricing</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight" style={{ fontFamily: "var(--font-manrope)" }}>
            Subscription model for schools and colleges
          </h1>
          <p className="mt-5 max-w-3xl text-[#4a6078] text-lg leading-relaxed">
            UniWell is sold as a campus subscription with premium costing from Rs 50 to Rs 100 per student per month,
            depending on the model selected.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-white border border-[#eceef0] rounded-3xl p-7 shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
              <h2 className="text-xl font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
                {plan.name}
              </h2>
              <p className="mt-4 text-3xl font-black text-[#005eb8]">{plan.price}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#727783]">{plan.subtitle}</p>
              <p className="mt-4 text-sm text-[#727783] leading-relaxed">{plan.description}</p>
            </div>
          ))}
        </section>

        <section className="bg-white border border-[#eceef0] rounded-4xl p-8">
          <h3 className="text-2xl font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
            What premium includes
          </h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumFeatures.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-[#eceef0] bg-[#fcfdfe] p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d6e3ff] flex items-center justify-center text-[#00478d]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-[#191c1e]">{title}</h4>
                </div>
                <p className="mt-3 text-sm text-[#727783] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#eceef0] rounded-3xl p-7">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-6 h-6 text-[#16a34a]" />
              <h3 className="text-xl font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
                Smart Claim Approval
              </h3>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-[#727783]">Auto-checks</p>
            <ul className="mt-3 space-y-2 text-sm text-[#4a6078]">
              <li>- Documents</li>
              <li>- Eligibility</li>
            </ul>
          </div>

          <div className="bg-white border border-[#eceef0] rounded-3xl p-7">
            <div className="flex items-center gap-3">
              <Ambulance className="w-6 h-6 text-[#ba1a1a]" />
              <h3 className="text-xl font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
                Emergency Auto-Dispatch
              </h3>
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-[#727783]">Sends</p>
            <ul className="mt-3 space-y-2 text-sm text-[#4a6078]">
              <li>- Location</li>
              <li>- Blood group</li>
              <li>- Medical history</li>
            </ul>
          </div>
        </section>

        <section className="bg-white border border-[#eceef0] rounded-4xl p-8">
          <h3 className="text-2xl font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
            Metrics
          </h3>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-[#eceef0] p-5 bg-[#f7f9fb]">
                <p className="text-2xl font-black text-[#00478d]">{m.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#727783]">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
