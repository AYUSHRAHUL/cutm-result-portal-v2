import { clientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// 🧮 Map CUTM grades to numeric values
const GRADE_MAP = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0,
  S: 0, // Supplementary
  M: 0, // Malpractice
  I: 0, // Incomplete
  R: 0, // Reappear
};

// Helper to safely parse credits like "3+1" or "3"
function parseCredits(creditStr) {
  if (!creditStr) return 0;
  const parts = creditStr
    .toString()
    .split("+")
    .map((p) => parseFloat(p.trim()) || 0);
  return parts.reduce((a, b) => a + b, 0);
}

// SGPA calculation
function calculateSGPA(subjects) {
  let totalCredits = 0;
  let weightedSum = 0;

  subjects.forEach((sub) => {
    const credits = parseCredits(sub.Credits);
    const grade = (sub.Grade || "").toUpperCase().trim();
    const gradePoint = GRADE_MAP[grade] ?? 0;

    // Only count subject credits if grade exists (even 0)
    if (!isNaN(credits)) {
      totalCredits += credits;
      weightedSum += credits * gradePoint;
    }
  });

  const sgpa = totalCredits ? weightedSum / totalCredits : 0;
  return { sgpa: sgpa.toFixed(2), totalCredits };
}

// JWT verification helper
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// CGPA calculation across all semesters
async function calculateCGPA(db, registration) {
  const cutm = db.collection("CUTM1");
  const cursor = await cutm.find({ Reg_No: registration.toUpperCase() }).toArray();

  let totalCredits = 0;
  let weightedSum = 0;

  cursor.forEach((row) => {
    const credits = parseCredits(row.Credits);
    const grade = (row.Grade || "").toUpperCase().trim();
    const gradePoint = GRADE_MAP[grade] ?? 0;

    if (!isNaN(credits)) {
      totalCredits += credits;
      weightedSum += credits * gradePoint;
    }
  });

  const cgpa = totalCredits ? weightedSum / totalCredits : 0;
  return cgpa.toFixed(2);
}

export async function POST(req) {
  try {
    // Check authentication
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const { registration, semester } = await req.json();
    
    // Get user role for access control
    const userRole = payload.role?.toLowerCase();
    
    // Security check: Role-based access control
    if (userRole === 'user' || userRole === 'student') {
      // Students can only view their own results
      const userEmail = payload.email;
      if (userEmail && userEmail.includes('@cutm.ac.in')) {
        const userRegNumber = userEmail.split('@')[0];
        if (registration !== userRegNumber) {
          return NextResponse.json({ 
            error: "Access denied - Students can only view their own results" 
          }, { status: 403 });
        }
      }
    } else if (userRole === 'teacher' || userRole === 'admin') {
      // Teachers and admins can view any student's results
      console.log(`Access granted to ${userRole}: ${payload.email} viewing results for ${registration}`);
    } else {
      return NextResponse.json({ 
        error: "Access denied - Invalid user role" 
      }, { status: 403 });
    }
    
    const client = await clientPromise;
    const db = client.db("cutm1");
    const cutm = db.collection("CUTM1");

    // Convert "Semester 2" to "Sem 2" format to match database
    const dbSemester = semester.replace('Semester ', 'Sem ');

    const subjects = await cutm
      .find({ Reg_No: registration.toUpperCase(), Sem: dbSemester })
      .project({
        _id: 0,
        Reg_No: 1,
        Name: 1,
        Subject_Code: 1,
        Subject_Name: 1,
        Credits: 1,
        Grade: 1,
      })
      .toArray();

    if (!subjects.length) {
      return NextResponse.json({ error: "No result found" }, { status: 404 });
    }

    const { sgpa } = calculateSGPA(subjects);
    const cgpa = await calculateCGPA(db, registration);

    return NextResponse.json({
      registration,
      semester: dbSemester, // Return the database format
      subjects,
      sgpa,
      cgpa,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
