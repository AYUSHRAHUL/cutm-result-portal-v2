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

// Helper function to get department from registration number
function getDepartmentFromRegNo(regNo) {
  const deptCode = regNo.charAt(7);
  const deptMap = {
    '1': 'Civil Engineering',
    '2': 'Computer Science Engineering', 
    '3': 'Electronics & Communication Engineering',
    '5': 'Electrical & Electronics Engineering',
    '6': 'Mechanical Engineering'
  };
  return deptMap[deptCode] || 'Unknown';
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

function parseCredits(creditStr) {
  if (!creditStr) return 0;
  const parts = creditStr
    .toString()
    .split(/[+\-]/)
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

    // Get user role for access control
    const userRole = payload.role?.toLowerCase();
    
    // Security check: Only teachers and admins can access bulk data
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.json({ 
        error: "Access denied - Only teachers and admins can access bulk student data" 
      }, { status: 403 });
    }

    console.log(`Bulk access granted to ${userRole}: ${payload.email}`);

    const { registration, department, batch, semesters = [], basket } = await req.json();
    
    // Department is optional for bulk analysis - if not provided, get all students

    const client = await clientPromise;
    const db = client.db("cutm1");

    // Build query for students with proper filtering
    let query = {};
    
    // FIXED: Apply department filter using registration number pattern
    if (department && department !== "All" && department !== "Select Department" && department !== "") {
      // Map department names to department codes (8th character in registration)
      const deptMap = {
        'Civil Engineering': '1',
        'Computer Science Engineering': '2', 
        'Electronics & Communication Engineering': '3',
        'Electrical & Electronics Engineering': '5',
        'Mechanical Engineering': '6'
      };
      const deptCode = deptMap[department];
      
      if (deptCode) {
        // Filter by department code in registration number (8th character)
        query.Reg_No = { ...query.Reg_No, $regex: `.{7}${deptCode}` };
        console.log(`Applied department filter: ${department} -> code ${deptCode}, regex: .{7}${deptCode}`);
      } else {
        console.log(`Department not found in map: ${department}`);
      }
    } else if (registration === "all" && (!department || department === "All" || department === "Select Department" || department === "")) {
      // If registration is "all" and no specific department, get all students
      console.log("No department filter applied - getting all students");
    }
    
    // FIXED: Apply batch filter
    if (batch && batch !== "All" && batch !== "") {
      // Combine batch and department filters
      if (query.Reg_No && query.Reg_No.$regex) {
        // If department filter is already applied, combine with batch
        // Department filter: .{7}${deptCode} -> should become ^${batch}.{5}${deptCode}
        const deptCode = query.Reg_No.$regex.slice(-1); // Get the department code
        query.Reg_No = { $regex: `^${batch}.{5}${deptCode}` };
        console.log(`Combined batch + department filter: batch ${batch}, dept code ${deptCode}, regex: ^${batch}.{5}${deptCode}`);
      } else {
        // Just batch filter
        query.Reg_No = { $regex: `^${batch}` };
        console.log(`Applied batch filter only: ^${batch}`);
      }
    }
    
    // Get students with the combined query - get unique students only
    let students = await db
      .collection("CUTM1")
      .find(query)
      .project({ _id: 0, Reg_No: 1, Name: 1 })
      .toArray();
    
    // Remove duplicates based on Reg_No to avoid duplicate students
    const uniqueStudents = students.reduce((acc, student) => {
      if (!acc.find(s => s.Reg_No === student.Reg_No)) {
        acc.push(student);
      }
      return acc;
    }, []);
    
    students = uniqueStudents;
    
    console.log(`Final query:`, JSON.stringify(query));
    console.log(`Found ${students.length} unique students`);
    if (students.length > 0) {
      console.log(`Sample students:`, students.slice(0, 3).map(s => ({ Reg_No: s.Reg_No, Name: s.Name, DeptCode: s.Reg_No.charAt(7) })));
    }
    
    // If no students found, return error with debug info
    if (students.length === 0) {
      const sampleStudents = await db
        .collection("CUTM1")
        .find({})
        .project({ _id: 0, Reg_No: 1, Name: 1 })
        .limit(5)
        .toArray();
      
      const totalStudents = await db.collection("CUTM1").countDocuments();
      
      return NextResponse.json({ 
        error: `No students found. Please check your filters.`,
        debug: {
          query,
          department,
          batch,
          registration,
          totalStudents,
          sampleStudents: sampleStudents.map(s => ({ 
            Reg_No: s.Reg_No, 
            Name: s.Name,
            DeptCode: s.Reg_No.charAt(7),
            DeptName: getDepartmentFromRegNo(s.Reg_No)
          })),
          suggestions: `Try these department codes: 1=Civil, 2=CSE, 3=ECE, 5=EEE, 6=ME`
        }
      }, { status: 404 });
    }

    // Get unique registration numbers
    const regNumbers = [...new Set(students.map(s => s.Reg_No))];

    // Build results query - no need for department filter since we already filtered students
    const resultQuery = { Reg_No: { $in: regNumbers } };
    
    // FIXED: Apply semester filter
    const semVals = (Array.isArray(semesters) ? semesters : []).filter(Boolean);
    if (semVals.length > 0 && !semVals.includes("All")) {
      resultQuery.Sem = { $in: semVals };
      console.log(`Applied semester filter: ${semVals.join(', ')}`);
    } else {
      console.log("No semester filter applied - getting all semesters");
    }

    // Get all results for these students
    const results = await db
      .collection("CUTM1")
      .find(resultQuery)
      .project({ _id: 0, Reg_No: 1, Name: 1, Subject_Code: 1, Subject_Name: 1, Credits: 1, Grade: 1, Sem: 1 })
      .toArray();

    if (results.length === 0) {
      return NextResponse.json({ 
        error: `No academic records found for students in department ${department}` 
      }, { status: 404 });
    }

    // Get CBCS mappings
    const codes = Array.from(
      new Set(
        results
          .map((r) => String(r.Subject_Code || "").toUpperCase().trim())
          .filter(Boolean)
      )
    );

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

    // Process each student
    const studentsData = [];
    
    for (const student of students) {
      const studentResults = results.filter(r => r.Reg_No === student.Reg_No);
      
      if (studentResults.length === 0) continue;

      // Get department from registration number
      const actualDepartment = getDepartmentFromRegNo(student.Reg_No);
      
      // Skip if department doesn't match the filter (only if department filter is applied and not "all")
      if (department && department !== "All" && department !== "Select Department" && actualDepartment !== department) {
        continue;
      }

      // Initialize baskets with appropriate credit requirements for lateral entry students
      const requiredCredits = getRequiredCreditsForStudent(student.Reg_No);
      const basketNames = Object.keys(requiredCredits);
      const basketProgress = Object.fromEntries(
        basketNames.map((name) => [name, buildBasketState(requiredCredits[name])])
      );
      
      // Add lateral entry indicator
      const isLateralEntry = isLateralEntryStudent(student.Reg_No);

      // Process student results
      studentResults.forEach((r) => {
        const code = String(r.Subject_Code || "").toUpperCase().trim();
        const credits = parseCredits(r.Credits);
        const grade = String(r.Grade || "").toUpperCase().trim();
        const isFailed = FAIL_OR_INCOMPLETE_GRADES.has(grade);
        
        // Special handling for CUTM1057 based on department
        let targetBasket = codeMap.get(code) || "Basket V";
        if (code === "CUTM1057") {
          if (actualDepartment === "Computer Science Engineering" || actualDepartment === "Electronics & Communication Engineering") {
            targetBasket = "Basket V";
          } else {
            targetBasket = "Basket IV";
          }
        }
        
        if (!basketProgress[targetBasket]) {
          basketProgress[targetBasket] = buildBasketState(0);
        }
        
        if (!isFailed) {
          basketProgress[targetBasket].earned_credits += credits;
        } else {
          basketProgress[targetBasket].failed_credits += credits;
        }
      });

      // Recalculate each basket
      Object.values(basketProgress).forEach(recalcBasket);

      // Calculate totals (including failed subjects)
      const totalEarned = Object.values(basketProgress).reduce((s, b) => s + (Number(b.earned_credits) || 0), 0);
      const totalFailed = Object.values(basketProgress).reduce((s, b) => s + (Number(b.failed_credits) || 0), 0);
      const totalCredits = totalEarned + totalFailed; // Include both earned and failed
      const totalRequired = Object.values(basketProgress).reduce((s, b) => s + (Number(b.required_credits) || 0), 0) || (isLateralEntry ? 120 : 160);
      const percentage = totalRequired > 0 ? Math.min(100, Math.round((totalEarned / totalRequired) * 100)) : 0;

      // FIXED: Filter to specific basket if requested
      let filteredProgress = basketProgress;
      if (basket && basket !== "All" && basket !== "" && basketProgress[basket]) {
        filteredProgress = { [basket]: basketProgress[basket] };
        console.log(`Applied basket filter: ${basket}`);
      } else {
        console.log("No basket filter applied - showing all baskets");
      }

      // Build student data
      const studentData = {
        name: student.Name || `Student ${student.Reg_No.slice(-4)}`,
        registration: student.Reg_No,
        department: actualDepartment,
        is_lateral_entry: isLateralEntry,
        student_type: isLateralEntry ? "Lateral Entry" : "Regular",
        totalCredits: totalCredits,
        totalRequiredCredits: totalRequired,
        percentage: percentage,
        status: percentage >= 100 ? "Completed" : percentage === 0 ? "Not Started" : "In Progress",
        // Individual basket credits (including failed subjects)
        basketI: (basketProgress["Basket I"]?.earned_credits || 0) + (basketProgress["Basket I"]?.failed_credits || 0),
        basketII: (basketProgress["Basket II"]?.earned_credits || 0) + (basketProgress["Basket II"]?.failed_credits || 0),
        basketIII: (basketProgress["Basket III"]?.earned_credits || 0) + (basketProgress["Basket III"]?.failed_credits || 0),
        basketIV: (basketProgress["Basket IV"]?.earned_credits || 0) + (basketProgress["Basket IV"]?.failed_credits || 0),
        basketV: (basketProgress["Basket V"]?.earned_credits || 0) + (basketProgress["Basket V"]?.failed_credits || 0),
        // FIXED: For specific basket view
        basketCredits: basket && basket !== "All" && basket !== "" ? (basketProgress[basket]?.earned_credits || 0) : 0,
        basketStatus: basket && basket !== "All" && basket !== "" ? (basketProgress[basket]?.status || "Not Started") : "N/A"
      };

      studentsData.push(studentData);
    }

    return NextResponse.json({ 
      success: true, 
      students: studentsData,
      totalStudents: studentsData.length,
      department,
      batch: batch || "All",
      basket: basket || "All"
    });

  } catch (err) {
    return NextResponse.json({ error: "Unable to load bulk data" }, { status: 500 });
  }
}
