import type { Doctor, User } from "@/types";

/** Mock user accounts — password is always "password123" for demo */
export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "usr_001",
    name: "Arjun Sharma",
    email: "arjun@sau.edu.in",
    password: "password123",
    role: "student",
    studentId: "SAU2024001",
    avatar: "",
  },
  {
    id: "usr_002",
    name: "Priya Mehta",
    email: "priya@sau.edu.in",
    password: "password123",
    role: "student",
    studentId: "SAU2024002",
    avatar: "",
  },
  {
    id: "usr_003",
    name: "Dr. Admin",
    email: "admin@sau.edu.in",
    password: "admin123",
    role: "admin",
    studentId: "ADM001",
    avatar: "",
  },
];

/** Mock doctors with available time slots */
export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc_001",
    name: "Dr. Kavita Rao",
    specialty: "General Physician",
    available: [
      "2026-04-10T09:00:00",
      "2026-04-10T10:00:00",
      "2026-04-11T11:00:00",
      "2026-04-12T14:00:00",
    ],
  },
  {
    id: "doc_002",
    name: "Dr. Rajesh Kumar",
    specialty: "Orthopedics",
    available: [
      "2026-04-10T11:00:00",
      "2026-04-11T09:00:00",
      "2026-04-13T15:00:00",
    ],
  },
  {
    id: "doc_003",
    name: "Dr. Sneha Patel",
    specialty: "Dermatology",
    available: [
      "2026-04-10T13:00:00",
      "2026-04-11T14:00:00",
      "2026-04-14T10:00:00",
    ],
  },
  {
    id: "doc_004",
    name: "Dr. Anil Bose",
    specialty: "Psychiatry & Counseling",
    available: [
      "2026-04-10T15:00:00",
      "2026-04-12T09:00:00",
      "2026-04-15T11:00:00",
    ],
  },
  {
    id: "doc_005",
    name: "Dr. Meena Iyer",
    specialty: "Gynecology",
    available: [
      "2026-04-11T10:00:00",
      "2026-04-13T13:00:00",
      "2026-04-16T09:00:00",
    ],
  },
];
