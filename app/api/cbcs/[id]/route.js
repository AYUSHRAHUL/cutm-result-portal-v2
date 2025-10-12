import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(req, { params }) {
  try {
    const id = params.id;
    const updates = await req.json();
    const client = await clientPromise;
    const db = client.db("cutm1");
    const set = {};
    if (typeof updates.Branch === "string") set["Branch"] = updates.Branch;
    if (typeof updates.Basket === "string") set["Basket"] = updates.Basket;
    if (typeof updates.SubjectCode === "string") set["Subject Code"] = updates.SubjectCode.trim().toUpperCase();
    if (typeof updates.SubjectName === "string") set["Subject_name"] = updates.SubjectName;
    if (typeof updates.Credits === "string") set["Credits"] = updates.Credits;
    const res = await db.collection("cbcs").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: set },
      { returnDocument: "after" }
    );
    if (!res?.value) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, item: res.value });
  } catch (err) {
    console.error("CBCS PUT error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;
    const client = await clientPromise;
    const db = client.db("cutm1");
    const res = await db.collection("cbcs").deleteOne({ _id: new ObjectId(id) });
    if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CBCS DELETE error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


