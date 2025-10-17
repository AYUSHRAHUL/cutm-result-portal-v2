import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { jwtVerify } from "jose";

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

const FAIL_OR_INCOMPLETE_GRADES = new Set(["F", "S", "M", "I", "R"]);

const REQUIRED_CREDITS = {
  "Basket I": 17,
  "Basket II": 12,
  "Basket III": 25,
  "Basket IV": 58,
  "Basket V": 48,
};

// Lateral entry students have different credit requirements
const LATERAL_ENTRY_CREDITS = {
  "Basket I": 6,
  "Basket II": 9,
  "Basket III": 25,
  "Basket IV": 48,
  "Basket V": 32,
};

function parseCredits(creditStr) {
  if (!creditStr) return 0;
  const parts = creditStr
    .toString()
    .split(/[+\-]/) // handle "2+0+1" or possible "2--2--2" formats
    .map((p) => parseFloat(p.trim()) || 0);
  return parts.reduce((a, b) => a + b, 0);
}

function buildBasketState(required) {
  return {
    status: "Not Started",
    is_completed: false,
    earned_credits: 0,
    failed_credits: 0,
    attempted_credits: 0,
    required_credits: required,
    pending_credits: required,
    percentage: 0,
    has_default_subjects: false,
    default_assigned_count: 0,
    subjects: [],
  };
}

// Function to check if a student is lateral entry
function isLateralEntryStudent(registration) {
  // Lateral entry students have "1" as the 9th character (0-indexed position 8)
  // Example: 220101131056 (lateral) vs 220101130056 (normal)
  return registration && registration.length >= 9 && registration.charAt(8) === '1';
}

// Function to get required credits based on student type
function getRequiredCreditsForStudent(registration) {
  return isLateralEntryStudent(registration) ? LATERAL_ENTRY_CREDITS : REQUIRED_CREDITS;
}

function recalcBasket(b) {
  b.attempted_credits = (Number(b.earned_credits) || 0) + (Number(b.failed_credits) || 0);
  b.pending_credits = Math.max(0, (Number(b.required_credits) || 0) - (Number(b.earned_credits) || 0));
  const pct = b.required_credits > 0 ? Math.min(100, Math.round((b.earned_credits / b.required_credits) * 100)) : 0;
  b.percentage = pct;
  b.is_completed = pct >= 100;
  b.status = b.is_completed ? "Completed" : pct === 0 ? "Not Started" : "Pending";
  return b;
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

    // FIXED: Extract request data first
    const { department, batch, registration, semesters = [], basket } = await req.json();
    
    // Get user role for access control
    const userRole = payload.role?.toLowerCase();
    
    // Security check: Role-based access control
    if (userRole === 'user' || userRole === 'student') {
      // Students can only view their own progress
      const userEmail = payload.email;
      if (userEmail && userEmail.includes('@cutm.ac.in')) {
        const userRegNumber = userEmail.split('@')[0];
        if (registration && registration !== userRegNumber) {
          return NextResponse.json({ 
            error: "Access denied - Students can only view their own progress" 
          }, { status: 403 });
        }
      }
    } else if (userRole === 'teacher' || userRole === 'admin') {
      // Teachers and admins can view any student's progress
      console.log(`Access granted to ${userRole}: ${payload.email} accessing progress for ${registration}`);
    } else {
      return NextResponse.json({ 
        error: "Access denied - Invalid user role" 
      }, { status: 403 });
    }
    const reg = String(registration || "").toUpperCase().trim();
    if (!reg) return NextResponse.json({ error: "Registration is required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("cutm1");

    // First, get student info to validate department and batch
    const studentInfo = await db
      .collection("CUTM1")
      .findOne({ Reg_No: reg }, { projection: { _id: 0, Name: 1, Reg_No: 1, Branch: 1 } });
    
    if (!studentInfo) {
      // FIXED: Enhanced error message with debugging info
      console.log(`Student not found: ${reg}`);
      
      // Check if there are similar registration numbers
      const similarRegs = await db
        .collection("CUTM1")
        .find({ Reg_No: { $regex: `^${reg.slice(0, 6)}` } })
        .project({ _id: 0, Reg_No: 1, Name: 1 })
        .limit(5)
        .toArray();
      
      const suggestions = similarRegs.length > 0 
        ? ` Similar registrations found: ${similarRegs.map(r => r.Reg_No).join(', ')}`
        : '';
      
      return NextResponse.json({ 
        error: `Student not found with registration number: ${reg}.${suggestions} Please verify the registration number.` 
      }, { status: 404 });
    }

    // Extract batch from registration (first 2 digits)
    const regBatch = reg.slice(0, 2);
    const actualBatch = `20${regBatch}`;
    
    // Extract department from registration number (8th character is department code)
    const deptCode = reg.charAt(7); // 8th character (0-indexed)
    const deptMap = {
      '1': 'Civil Engineering',
      '2': 'Computer Science Engineering', 
      '3': 'Electronics & Communication Engineering',
      '5': 'Electrical & Electronics Engineering',
      '6': 'Mechanical Engineering'
    };
    const actualDepartment = deptMap[deptCode] || "Unknown";

    // Validate department if provided
    if (department && department !== "All" && department !== actualDepartment) {
      return NextResponse.json({ 
        error: `Registration ${reg} belongs to department "${actualDepartment}", but you selected department "${department}". Please select the correct department.` 
      }, { status: 400 });
    }

    // Validate batch if provided
    if (batch && batch !== "All" && batch !== regBatch) {
      return NextResponse.json({ 
        error: `Registration ${reg} belongs to batch ${actualBatch}, but you selected batch ${batch === "20" ? "2020" : batch === "21" ? "2021" : batch === "22" ? "2022" : batch === "23" ? "2023" : batch === "24" ? "2024" : batch === "25" ? "2025" : batch}. Please select the correct batch.` 
      }, { status: 400 });
    }

    // FIXED: Load all results for the registration, optionally filtered by semesters
    const resultQuery = { Reg_No: reg };
    const semVals = (Array.isArray(semesters) ? semesters : []).filter(Boolean);
    if (semVals.length > 0 && !semVals.includes("All")) {
      resultQuery.Sem = { $in: semVals };
      console.log(`Applied semester filter for ${reg}: ${semVals.join(', ')}`);
    } else {
      console.log(`No semester filter applied for ${reg} - getting all semesters`);
    }
    
    console.log(`Querying results for ${reg} with query:`, JSON.stringify(resultQuery));
    
    const results = await db
      .collection("CUTM1")
      .find(resultQuery)
      .project({ _id: 0, Reg_No: 1, Name: 1, Subject_Code: 1, Subject_Name: 1, Credits: 1, Grade: 1, Sem: 1 })
      .toArray();
    
    console.log(`Found ${results.length} result records for ${reg}`);

    if (results.length === 0) {
      // FIXED: Enhanced error message with debugging info
      console.log(`No academic records found for ${reg}`);
      
      // Check if student exists but has no results
      const studentExists = await db
        .collection("CUTM1")
        .findOne({ Reg_No: reg }, { projection: { _id: 0, Reg_No: 1, Name: 1 } });
      
      if (studentExists) {
        return NextResponse.json({ 
          error: `Student ${studentExists.Name} (${reg}) found but has no academic records. This could mean:
          1. No results have been uploaded for this student
          2. The semester filter is too restrictive
          3. Results are stored under a different registration format
          
          Try removing semester filters or contact the administrator.` 
        }, { status: 404 });
      } else {
        return NextResponse.json({ 
          error: `No academic records found for registration ${reg}. Please verify the registration number.` 
        }, { status: 404 });
      }
    }

    // Build list of subject codes for all attempts (completed or failed)
    const codes = Array.from(
      new Set(
        results
          .map((r) => String(r.Subject_Code || "").toUpperCase().trim())
          .filter(Boolean)
      )
    );

    // Fetch CBCS mapping for codes → Basket
    const codeMap = new Map();
    if (codes.length > 0) {
      const cbcsDocs = await db
        .collection("cbcs")
        .find({ "Subject Code": { $in: codes } })
        .project({ _id: 0, "Subject Code": 1, Basket: 1 })
        .toArray();
      cbcsDocs.forEach((d) => {
        const code = String(d["Subject Code"]).toUpperCase().trim();
        codeMap.set(code, String(d.Basket || "").trim());
      });
    }

    // Initialize baskets with appropriate credit requirements
    const requiredCredits = getRequiredCreditsForStudent(reg);
    const basketNames = Object.keys(requiredCredits);
    const basketProgress = Object.fromEntries(
      basketNames.map((name) => [name, buildBasketState(requiredCredits[name])])
    );
    
    // Add lateral entry indicator to student info
    const isLateralEntry = isLateralEntryStudent(reg);

    // Assign subjects to baskets. Earn credits only for completed attempts
    results.forEach((r) => {
      const code = String(r.Subject_Code || "").toUpperCase().trim();
      const credits = parseCredits(r.Credits);
      const grade = String(r.Grade || "").toUpperCase().trim();
      const isFailed = FAIL_OR_INCOMPLETE_GRADES.has(grade);
      
      // Special handling for CUTM1057 based on branch
      let targetBasket = codeMap.get(code) || "Basket V"; // default assignment
      if (code === "CUTM1057") {
        if (actualDepartment === "Computer Science Engineering" || actualDepartment === "Electronics & Communication Engineering") {
          targetBasket = "Basket V";
        } else {
          targetBasket = "Basket IV";
        }
      }
      
      if (!basketProgress[targetBasket]) {
        // ensure presence even if mapping contains unexpected basket name
        basketProgress[targetBasket] = buildBasketState(0);
      }
      const subjectEntry = {
        code,
        name: r.Subject_Name || "",
        credits,
        grade,
        completed: !isFailed,
        failed: isFailed,
        semester: r.Sem || "",
        is_default_assigned: !codeMap.has(code) && targetBasket === "Basket V",
      };
      basketProgress[targetBasket].subjects.push(subjectEntry);
      if (!isFailed) {
        basketProgress[targetBasket].earned_credits += credits;
      } else {
        basketProgress[targetBasket].failed_credits += credits;
      }
      if (subjectEntry.is_default_assigned) {
        basketProgress[targetBasket].has_default_subjects = true;
        basketProgress[targetBasket].default_assigned_count += 1;
      }
    });

    // Recalculate each basket
    Object.values(basketProgress).forEach(recalcBasket);

    // Optionally filter to single basket
    let filteredProgress = basketProgress;
    if (basket && basket !== "All" && basketProgress[basket]) {
      filteredProgress = { [basket]: basketProgress[basket] };
    }

    // Build student meta (including failed subjects in total)
    const totalEarned = Object.values(filteredProgress).reduce((s, b) => s + (Number(b.earned_credits) || 0), 0);
    const totalFailed = Object.values(filteredProgress).reduce((s, b) => s + (Number(b.failed_credits) || 0), 0);
    const totalCredits = totalEarned + totalFailed; // Include both earned and failed
    const totalRequired = Object.values(filteredProgress).reduce((s, b) => s + (Number(b.required_credits) || 0), 0) || (isLateralEntry ? 120 : 160);
    const percentage = totalRequired > 0 ? Math.min(100, Math.round((totalEarned / totalRequired) * 100)) : 0;
    const student = {
      name: studentInfo.Name || results[0]?.Name || `Student ${reg.slice(-4)}`,
      registration: reg,
      department: actualDepartment,
      actual_batch: actualBatch,
      is_lateral_entry: isLateralEntry,
      student_type: isLateralEntry ? "Lateral Entry" : "Regular",
      overall_stats: {
        overall_status: percentage >= 100 ? "Completed" : percentage === 0 ? "Not Started" : "In Progress",
        baskets_completed: Object.values(filteredProgress).filter((b) => b.is_completed).length,
        total_baskets: Object.keys(filteredProgress).length || 5,
        total_earned_credits: totalEarned,
        total_failed_credits: totalFailed,
        total_credits: totalCredits,
        total_required_credits: totalRequired,
        percentage,
        default_assigned_subjects: Object.values(filteredProgress).reduce((s, b) => s + (Number(b.default_assigned_count) || 0), 0),
      },
    };

    return NextResponse.json({ student, basketProgress: filteredProgress });
  } catch (err) {
    console.error("/api/cbcs/track error", err);
    return NextResponse.json({ error: "Unable to load progress" }, { status: 500 });
  }
}


