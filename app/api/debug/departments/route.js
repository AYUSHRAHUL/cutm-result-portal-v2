import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("cutm1");

    // Get all unique departments/branches
    const departments = await db
      .collection("CUTM1")
      .distinct("Branch");

    // Get sample students with their departments
    const sampleStudents = await db
      .collection("CUTM1")
      .find({})
      .project({ _id: 0, Reg_No: 1, Name: 1, Branch: 1 })
      .limit(10)
      .toArray();

    // Get registration number patterns
    const regNumbers = await db
      .collection("CUTM1")
      .find({})
      .project({ _id: 0, Reg_No: 1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      departments: departments.filter(Boolean),
      sampleStudents,
      sampleRegNumbers: regNumbers.map(r => r.Reg_No),
      totalStudents: await db.collection("CUTM1").countDocuments()
    });

  } catch (err) {
    console.error("Debug departments error", err);
    return NextResponse.json({ error: "Unable to fetch department data" }, { status: 500 });
  }
}
