import { NextResponse } from "next/server";
import { sendEmail, generateEmailTemplate } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload format." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, email, userType = "CANDIDATE", subject, category = "GENERAL", message } = body || {};

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (at least 2 characters)." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please enter a subject (at least 3 characters)." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a detailed explanation (at least 10 characters)." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Generate unique ticket reference
    const ticketId = `TICK-${Date.now().toString().slice(-6)}`;

    // 3. Dispatch confirmation email (non-blocking)
    try {
      const emailHtml = generateEmailTemplate(
        `Support Request Received: ${subject.trim()}`,
        `Hello ${name.trim()},<br/><br/>
        We have received your support inquiry (Ticket ID: <strong>${ticketId}</strong>).<br/><br/>
        <strong>Category:</strong> ${category}<br/>
        <strong>User Type:</strong> ${userType}<br/>
        <strong>Message:</strong><br/>${message.trim()}<br/><br/>
        Our support operations team will review your inquiry and follow up at ${email.trim()} within our standard response window.`,
        "View Help Centre",
        "https://www.nexthire.cloud/help"
      );

      sendEmail({
        to: email.trim(),
        subject: `[NextHire Support #${ticketId}] Request Received: ${subject.trim()}`,
        html: emailHtml,
      }).catch((err) => console.warn("[Support Contact] Email dispatch note:", err));
    } catch (emailErr) {
      console.warn("[Support Contact] Email notification note:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        ticketId,
        message: `Support ticket ${ticketId} created successfully! Our team will respond shortly.`,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Support Contact Error]:", err);
    return NextResponse.json(
      { success: false, error: "Unable to process support request. Please try again." },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
