import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    const body = await req.json();
    const { message, previousMessages = [] } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch available doctors
    const { data: profiles, error: doctorError } = await supabase
      .from("profiles")
      .select("id, name");
      // Note: We don't have a direct 'where roles contains doctor' in public schema cleanly without 
      // specific querying, but we can fetch them or we can just fetch all users and filter via JS.
      // Wait, let's use the contains operator.
      
    const { data: doctors } = await supabase
      .from("profiles")
      .select("name, phone, email")
      .contains("roles", ["doctor"]);

    // 2. Fetch available inventory
    const { data: inventory } = await supabase
      .from("pharmacy_inventory")
      .select("name, category, quantity")
      .gt("quantity", 0);

    const doctorsList = doctors?.map(d => `- ${d.name}`).join("\\n") || "No doctors available.";
    const medsList = inventory?.map(i => `- ${i.name} (${i.category}, Qty: ${i.quantity})`).join("\\n") || "No medicines in stock.";

    const systemPrompt = `You are UniWell AI, the campus healthcare assistant for SAU (South Asian University).
Your job is to kindly assist students with their healthcare queries, mental health support, and direct them to campus resources.

Available Campus Doctors:
${doctorsList}

Available Pharmacy Stock (Over-the-counter / Generic):
${medsList}

Instructions:
1. If a student mentions physical symptoms, suggest they see one of the available doctors and mention if any over-the-counter medicine from stock might help alleviate symptoms (with a disclaimer to consult the doctor).
2. If they ask about stock, only list items that are currently in stock.
3. If they need mental health support, provide encouraging, empathetic, and calming advice.
4. Do NOT make definitive medical diagnoses. Always include a disclaimer to visit the medical center.
5. Keep your responses concise, professional, and friendly. Do NOT use markdown asterisks (* or **) for bolding or lists under any circumstances. Use plain text like dashes (-) for lists instead.`;

    // Reconstruct history for Gemini
    const history = previousMessages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Start a chat session
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    // We pass system instructions using systemInstruction parameter (supported in newer SDKs, or we can just prepend it to history)
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! I am UniWell AI. I will base my answers on this context." }] },
        ...history
      ]
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
