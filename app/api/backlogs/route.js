import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

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

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("cutm1");
    const cutm = db.collection("CUTM1");

    // Get user role for access control
    const userRole = payload.role?.toLowerCase();

    // Security check: Role-based access control
    if (userRole === 'user' || userRole === 'student') {
      // Students can only view their own backlog data
      const userEmail = payload.email;
      if (userEmail && userEmail.includes('@cutm.ac.in')) {
        const userRegNumber = userEmail.split('@')[0];
        if (body.registration && body.registration !== userRegNumber) {
          return NextResponse.json({ 
            error: "Access denied - Students can only view their own backlog data" 
          }, { status: 403 });
        }
        // Auto-fill registration for students
        if (!body.registration) {
          body.registration = userRegNumber;
        }
      }
    } else if (userRole === 'teacher' || userRole === 'admin') {
      // Teachers and admins can view any student's backlog data
      console.log(`Access granted to ${userRole}: ${payload.email} accessing backlog data`);
    } else {
      return NextResponse.json({ 
        error: "Access denied - Invalid user role" 
      }, { status: 403 });
    }

    // Clear action (only for admins)
    if (body.action === "clear") {
      if (userRole !== 'admin') {
        return NextResponse.json({ 
          error: "Access denied - Only administrators can clear backlogs" 
        }, { status: 403 });
      }
      
      const { registration, subject_code } = body;
      if (!registration || !subject_code) return NextResponse.json({ error: "registration and subject_code required" }, { status: 400 });
      const res = await cutm.updateOne(
        { Reg_No: registration.toUpperCase(), Subject_Code: subject_code.toUpperCase() },
        { $set: { Grade: "P" } }
      );
      if (res.matchedCount === 0) return NextResponse.json({ error: "Record not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    // Search for backlogs
    const { registration, subject_code, branch, year, semesters = [] } = body;
    const query = { Grade: { $in: ["F","M","S","I","R","AB"] } };
    
    if (registration) {
      query.Reg_No = registration.toUpperCase();
    }
    
    if (subject_code) {
      query.Subject_Code = subject_code.toUpperCase();
    }
    
    // Apply semester filter if provided
    if (semesters.length > 0 && !semesters.includes("All")) {
      query.Sem = { $in: semesters };
    }
    
    // Optional branch/year filters by Reg_No patterns
    const and = [];
    if (branch) {
      const code = branchCode(branch);
      if (code) and.push({ Reg_No: { $regex: `^.{7}${code}` } });
    }
    if (year) {
      const yy = year.length === 4 ? year.slice(-2) : year;
      and.push({ Reg_No: { $regex: `^${yy}` } });
    }
    if (and.length) query.$and = and;

    console.log("Backlog search query:", JSON.stringify(query));

    const backlogs = await cutm.find(query).project({ _id: 0 }).sort({ Sem: 1, Subject_Code: 1 }).toArray();
    
    console.log(`Found ${backlogs.length} backlog records`);
    
    return NextResponse.json({ 
      backlogs,
      total: backlogs.length,
      registration: registration || "auto-filled"
    });
  } catch (err) {
    console.error("/api/backlogs error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function branchCode(name) {
  const map = { Civil: '1', CSE: '2', ECE: '3', EEE: '5', Mechanical: '6' };
  return map[name] || null;
}


