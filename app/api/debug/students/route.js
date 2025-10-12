import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cutm1");

    // Get sample students to see the data structure
    const sampleStudents = await db
      .collection("CUTM1")
      .find({})
      .project({ _id: 0, Reg_No: 1, Name: 1, Branch: 1 })
      .limit(10)
      .toArray();

    // Get all unique departments/branches
    const departments = await db
      .collection("CUTM1")
      .distinct("Branch");

    // Get sample registration numbers
    const sampleRegNos = await db
      .collection("CUTM1")
      .find({})
      .project({ _id: 0, Reg_No: 1 })
      .limit(10)
      .toArray();

    // Test a specific department query
    const cseStudents = await db
      .collection("CUTM1")
      .find({ Branch: "Computer Science Engineering" })
      .project({ _id: 0, Reg_No: 1, Name: 1, Branch: 1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      totalStudents: await db.collection("CUTM1").countDocuments(),
      departments: departments.filter(Boolean),
      sampleStudents,
      sampleRegNos: sampleRegNos.map(r => r.Reg_No),
      cseStudents,
      message: "Debug information for students API"
    });

  } catch (err) {
    console.error("Debug students error", err);
    return NextResponse.json({ error: "Unable to fetch debug data" }, { status: 500 });
  }
}
