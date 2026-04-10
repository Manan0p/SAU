import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert Blob to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;

    const base64Data = buffer.toString("base64");

    const prompt = `Look at this medical prescription or pill schedule. 
Extract the medications and return them STRICTLY as a JSON array where each object has these exact keys:
"medicine_name": the name of the medicine
"dosage": the dosage (e.g. 500mg, 1 tablet, etc.)
"times_of_day": an array of strings in HH:MM format indicating when it should be taken (e.g. ["09:00", "21:00"]). If it says morning, use 09:00. If afternoon, use 14:00. If night, use 21:00.
Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON array.`;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText.replace(/^```json|```$/gm, '').trim());
    } catch(e) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      return NextResponse.json({ error: "Could not parse prescription clearly." }, { status: 422 });
    }

    return NextResponse.json({ medications: jsonResult });

  } catch (error: any) {
    console.error("Prescription Extractor Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract data" }, { status: 500 });
  }
}
