import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { Resend } from "resend";

// This would typically be a cron endpoint triggered every 1 hour or so.
// Using GET method to be easily triggered by Vercel Cron.
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();

    // In a real app we'd get the current hour, e.g. "09:00", we just pad it based on current time.
    // For this demonstration, we'll fetch ALL active schedules.
    // To make it precise, you would want `time` logic here:
    // const currentHourStr = new Date().toISOString().split('T')[1].substring(0, 2) + ":00";
    
    // Selecting all active medication schedules
    const { data: schedules, error } = await supabase
      .from("medication_schedules")
      .select("*, profiles!medication_schedules_userId_fkey(name, email)")
      .eq("active", true);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: "No active schedules to remind" });
    }

    // Set up Resend (mock or real)
    // Put your actual key in .env.local like RESEND_API_KEY
    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    let emailsSent = 0;
    let notificationsSent = 0;

    for (const sched of schedules) {
      const userEmail = sched.profiles?.email;
      const userName = sched.profiles?.name || "Student";
      
      const messageBody = `It's time to take your ${sched.dosage || ""} ${sched.medicine_name}. Please make sure you stay hydrated!`;

      // 1. Insert Web App Notification
      await supabase.from("notifications").insert([{
        userId: sched.userId,
        type: "general",
        title: "Medication Reminder 💊",
        message: messageBody,
        read: false
      }]);
      notificationsSent++;

      // 2. Send Email (if real RESEND is configured)
      if (resend) {
        try {
          await resend.emails.send({
            from: "UniWell Health <onboarding@resend.dev>",
            to: userEmail,
            subject: "Time for your Medication 💊",
            text: `Hi ${userName},\n\n${messageBody}\n\nStay healthy,\nUniWell Team`,
            html: `<p>Hi ${userName},</p><p><strong>${messageBody}</strong></p><p>Stay healthy,<br/>UniWell Team</p>`,
          });
          emailsSent++;
        } catch (emailErr) {
          console.error("Failed to send email to", userEmail, emailErr);
        }
      } else {
        // Just mock it in console for hackathon demo
        console.log(`[MOCK EMAIL] To: ${userEmail} | Subject: Medication Reminder | Body: ${messageBody}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron executed. Web notifications sent: ${notificationsSent}. Emails dispatched: ${emailsSent} (check console if 0).`
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
