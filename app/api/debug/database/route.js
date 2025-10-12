import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cutm1");
    
    // Get sample data to understand the structure - get ALL fields first
    const sampleStudents = await db
      .collection("CUTM1")
      .find({})
      .limit(3)
      .toArray();
    
    const totalStudents = await db.collection("CUTM1").countDocuments();
    
    // Analyze registration number patterns to understand department encoding
    const regAnalysis = {};
    const deptMap = {
      '1': 'Civil Engineering',
      '2': 'Computer Science Engineering', 
      '3': 'Electronics & Communication Engineering',
      '5': 'Electrical & Electronics Engineering',
      '6': 'Mechanical Engineering'
    };
    
    for (const [code, dept] of Object.entries(deptMap)) {
      try {
        const count = await db.collection("CUTM1").countDocuments({ 
          Reg_No: { $regex: `.{7}${code}` } 
        });
        regAnalysis[code] = { department: dept, count };
      } catch (e) {
        regAnalysis[code] = { department: dept, count: 0, error: e.message };
      }
    }
    
    // Get some sample results to see the data structure
    const sampleResults = await db
      .collection("CUTM1")
      .find({})
      .limit(5)
      .toArray();
    
    return NextResponse.json({
      success: true,
      debug: {
        totalStudents,
        regAnalysis,
        sampleStudents,
        sampleResults,
        allFields: sampleStudents.length > 0 ? Object.keys(sampleStudents[0]) : [],
        message: "Department analysis based on registration number patterns"
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to get debug information",
      details: error.message 
    }, { status: 500 });
  }
}
