import { redirect } from "next/navigation";

export default function PharmacyPage() {
  redirect("/staff/pharmacy/prescriptions");
}
