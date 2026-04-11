# UniWell: Campus Health Sanctuary

UniWell is a comprehensive, modern campus healthcare platform engineered for educational institutions. It connects students and medical staff seamlessly to minimize administration overhead and maximize care, featuring secure role-based portals, emergency SOS broadcasting, medical records management, and AI-assisted health inquiries.

🌐 **Live Demo:** [https://sau-tau.vercel.app/](https://sau-tau.vercel.app/)

---

## 🖼️ Product Tour

Here’s a quick look at the app experience — from the central landing page to role-specific medical portals.

**Landing & unified Entry**
A clean, accessible landing page welcoming users and routing them securely to their respective portals based on role (Admin, Student, Staff).

**Patient Dashboards & Clinical Sanctuary**
Unified views holding historical diagnoses, allergies, pharmacy tracking, and real-time appointment bookings.

## 🎯 What This Project Does

UniWell is built around unifying complex campus health infrastructure into one continuous flow: identity resolution → role routing → secure health data handling.

It helps universities and colleges to:
- **Centralize Medical Records:** A single source of truth for student health data.
- **Handle Emergencies Fast:** Live GPS SOS alerts routed directly to campus first responders.
- **Automate Bureaucracy:** Digital verification for insurance claims.
- **Streamline Scheduling:** Let students book clinic appointments seamlessly.

---

## ✨ Core Features

- 🔐 **Multi-Role Authentication** - Supabase-powered OAuth and credential sign-in tailored for Students, Admins, and Medical Staff.
- 🚨 **Emergency SOS** - Live GPS broadcasting and immediate alert routing to the campus medical response team.
- 🤖 **AI Healthcare Chatbot** - Integrated Google Generative AI assistant providing immediate triage guidance and platform navigation.
- 📆 **Instant Booking** - Queue-less appointment scheduling linked directly with campus physicians.
- 🏥 **Digital Personal Records** - Comprehensive patient dashboard holding historical diagnoses, allergy tracking, and unified health metrics.
- 💊 **Medication Details** - Pharmacy tracking, digital prescriptions, and medication regimens.
- 🛡️ **Insurance Claims** - Digital verification and automated routing for instant student health insurance claim approvals.

---

## 👥 Who Is This For?

Perfect for learning and building:
- **Full-stack Next.js:** App Router, robust server actions, complex route groups.
- **Auth & Authorization:** Supabase SSR with strict Role-Based Access Control (RBAC) separating admins, doctors, and students.
- **AI Integration:** Implementing conversational interfaces using the Google Generative AI SDK within a React application.
- **Email Automation:** Transactional communications via Resend and Nodemailer.
- **Premium UI/UX:** Leveraging Radix UI components, Framer Motion animations, and custom Tailwind styling for a premium aesthetic.

---

## 🛠 Tech Stack

**Frontend**
- **Next.js 16.2** - App Router (Server Components & Actions)
- **React 19** - UI library
- **Tailwind CSS v4** - Styling framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Fluid micro-animations
- **Lucide React** - Iconography

**Backend & Services**
- **Supabase** - PostgreSQL Database + SSR Authentication
- **Google Generative AI** - Smart healthcare chatbot and contextual queries
- **Resend & Nodemailer** - Transactional email dispatch
- **Google Maps API** - Emergency SOS location mapping

**Deployment**
- **Vercel** - Hosting, edge networks, and CI/CD

---

## 📁 Project Structure

```text
uniwell/
├── app/
│   ├── api/                  # API endpoints and chatbot processing
│   ├── (auth)/               # Login, registering, and session handling
│   ├── admin/                # Administrator dashboard routes
│   ├── staff/                # Clinical sanctuary (doctors/pharmacists)
│   ├── student/              # Student health views
│   ├── page.tsx              # Main Landing page
│   └── layout.tsx            # Global layout wrapper
├── components/               # Shareable, reusable UI pieces (modals, forms, nav)
├── lib/                      # Core utility functions and system definitions
├── utils/
│   └── supabase/             # Supabase client helpers (client, server, middleware)
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript interfaces
├── public/                   # Static assets
└── package.json              # App dependencies
```

---

## 🚀 Quick Start

### 1) Prerequisites
- Node.js 20+
- npm (or yarn/pnpm)
- A Supabase project
- Google Gemini API Key
- Resend API key (optional for emails)

### 2) Install dependencies
```bash
npm install
```

### 3) Environment variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Email Configuration
RESEND_API_KEY=your_resend_api_key

# Optional application URL configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4) Database Seeding
Open your Supabase SQL Editor and execute the contents of the `supabase_schema.sql` file located in the project root to provision the necessary tables for profiles, records, appointments, and roles.

### 5) Start the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💾 Database Schema Overview (Supabase)

UniWell utilizes a rich relational schema extending Supabase Auth. Key tables include:
- `user_profiles` - Extended identity storing role (`student`, `doctor`, `admin`), demographics, and active statuses.
- `appointments` - Tracking scheduling between students and clinical staff.
- `medical_records` - Immutable clinical history linking diagnoses, prescriptions, and physician notes.
- `insurance_claims` - Managing state and verification for university health coverages.

---

## 📊 How It Works (End-to-End)

1. User authenticates via Supabase Auth.
2. The custom Supabase Middleware determines the user's explicit role (Extracted from the `user_profiles` table logic).
3. React Server Components dynamically render the appropriate portal (`/student`, `/staff`, or `/admin`).
4. Clinical updates (e.g. creating an appointment) trigger Next.js Server Actions, safely mutating the Supabase Postgres instance securely directly from the backend.
5. In an SOS event, the browser's Geolocation API captures coordinates, pushes an alert row via the Supabase client, and dispatches a realtime notification to the `/staff` emergency queue.

---

## 🐛 Troubleshooting

| Issue | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Auth loops or blank pages** | Missing Supabase Env Variables | Double check `.env.local` bindings for URL and Anon Key. |
| **AI Chatbot fails to reply** | Invalid Gemini API Key or Quota Hit | Verify `GOOGLE_GENERATIVE_AI_API_KEY` is present. |
| **SOS Location fails** | Browser denied location permission | Have user manually grant location permissions on their device. |
| **Database operations failing** | RLS Policies preventing read/write | Ensure the `supabase_schema.sql` was completely executed and roles are correctly mapped. |

---

## 🚢 Building for Production

```bash
npm run build
npm run start
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 🔐 Security Notes

⚠️ **For production:**
- **Never expose powerful keys:** Ensure service keys or API secret keys remain strictly server-side.
- **Row Level Security (RLS):** Rely heavily on Supabase RLS to prevent students from querying random medical records. RLS definitions are critical.
- Ensure the production URL in the Vercel dashboard properly points to `https://sau-tau.vercel.app/`.

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a Pull Request.

## 📝 License
This project is licensed under the MIT License - see the `LICENSE` file for details.

Copyright © 2026 team gooble

## 👨‍💻 Authors
Built by **team gooble**:
- Manan
- Nikunj
- Vibhuti
- Minit
- Bhumika

## 🙏 Acknowledgments
- **Supabase** for robust auth and PostgreSQL infrastructure.
- **Google Generative AI** for powering intelligent medical assistance.
- **Vercel** for hosting.
- **Radix UI** & **Tailwind** for beautiful utility-driven styling.

Ready to explore your complete campus health sanctuary? Visit [https://sau-tau.vercel.app/](https://sau-tau.vercel.app/) and log in.
