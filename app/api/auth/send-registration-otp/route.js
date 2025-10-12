import { clientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { sendOTPToMultipleEmails } from "@/lib/email";
import { generateOTP, storeOTP } from "@/lib/otpStore";

export async function POST(req) {
  try {
    const { email, name, role, employeeId } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Email domain validation
    const allowedDomains = ['@cutm.ac.in', '@centurionuniv.edu.in'];
    const emailDomain = email.substring(email.lastIndexOf('@'));
    
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { success: false, error: "Only @cutm.ac.in or @centurionuniv.edu.in email addresses are allowed." },
        { status: 400 }
      );
    }

    // Additional validation for teachers: must use name-based email, not number-based
    if (role === 'teacher') {
      const emailPrefix = email.split('@')[0];
      if (/^\d+$/.test(emailPrefix)) {
        return NextResponse.json(
          { success: false, error: "Teachers must use name-based email addresses (e.g., johnsmith@cutm.ac.in), not number-based emails." },
          { status: 400 }
        );
      }
    }

    const client = await clientPromise;
    const db = client.db("cutm1");
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Store registration data and OTP
    storeOTP(email, otp, {
      name,
      email,
      role,
      employeeId,
      type: 'registration'
    });

    // Generate institutional email based on role
    let institutionalEmail;
    if (role === 'teacher') {
      // For teachers: use name (e.g., "John Smith" -> "johnsmith@cutm.ac.in")
      institutionalEmail = `${name.replace(/\s+/g, '').toLowerCase()}@cutm.ac.in`;
    } else {
      // For students: use registration number format (e.g., "220101130056@cutm.ac.in")
      // Extract registration number from email if it's in the format number@cutm.ac.in
      const emailPrefix = email.split('@')[0];
      if (/^\d+$/.test(emailPrefix)) {
        institutionalEmail = `${emailPrefix}@cutm.ac.in`;
      } else {
        // Fallback to name-based email for students
        institutionalEmail = `${name.replace(/\s+/g, '').toLowerCase()}@cutm.ac.in`;
      }
    }

    // Send OTP only to institutional email
    const emailsToSend = [institutionalEmail].filter(Boolean);
    const emailResults = await sendOTPToMultipleEmails(emailsToSend, otp, 'registration');

    // Check if any emails were sent successfully
    const successfulEmails = emailResults.filter(result => result.success);
    
    if (successfulEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to send OTP emails. Please try again." },
        { status: 500 }
      );
    }

    console.log(`OTP sent to ${successfulEmails.length} email(s):`, successfulEmails.map(r => r.email));

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${successfulEmails.length} email address(es)`,
      institutionalEmail,
      emailsSent: successfulEmails.length
    });

  } catch (error) {
    console.error("Send registration OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
