import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("cutm1");
    const cutm = db.collection("CUTM1");

    // Clear action
    if (body.action === "clear") {
      const { registration, subject_code } = body;
      if (!registration || !subject_code) return NextResponse.json({ error: "registration and subject_code required" }, { status: 400 });
      const res = await cutm.updateOne(
        { Reg_No: registration.toUpperCase(), Subject_Code: subject_code.toUpperCase() },
        { $set: { Grade: "P" } }
      );
      if (res.matchedCount === 0) return NextResponse.json({ error: "Record not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    // Search
    const { registration, subject_code, branch, year } = body;
    const query = { Grade: { $in: ["F","M","S","I","R"] } };
    if (registration) query.Reg_No = registration.toUpperCase();
    if (subject_code) query.Subject_Code = subject_code.toUpperCase();
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

    const backlogs = await cutm.find(query).project({ _id: 0 }).toArray();
    return NextResponse.json({ backlogs });
  } catch (err) {
    console.error("/api/backlogs error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function branchCode(name) {
  const map = { Civil: '1', CSE: '2', ECE: '3', EEE: '5', Mechanical: '6' };
  return map[name] || null;
}


