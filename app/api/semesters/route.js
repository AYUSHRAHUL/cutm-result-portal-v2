import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { registration } = await req.json();
    if (!registration) {
      return NextResponse.json({ error: "registration required" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("cutm1");
    const cutm = db.collection("CUTM1");
    const semesters = await cutm.distinct("Sem", { Reg_No: registration.toUpperCase() });
    return NextResponse.json({ semesters: (semesters || []).filter(Boolean).sort() });
  } catch (err) {
    console.error("/api/semesters error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
