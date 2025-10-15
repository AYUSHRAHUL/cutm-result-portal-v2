import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch") || "";
    const basket = searchParams.get("basket") || "";
    const search = searchParams.get("search") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam === null ? 200 : Number(limitParam);

    const client = await clientPromise;
    const db = client.db("cutm1");
    const query = {};
    const andConditions = [];
    
    if (branch) {
      // Handle subjects with multiple branches (e.g., "CSE/ECE/EEE" or "CSE,ECE,EEE")
      andConditions.push({
        "$or": [
          { "Branch": branch }, // Exact match
          { "Branch": { $regex: `^${branch}/`, $options: "i" } }, // Branch at start (e.g., "CSE/ECE")
          { "Branch": { $regex: `/${branch}/`, $options: "i" } }, // Branch in middle (e.g., "ECE/CSE/EEE")
          { "Branch": { $regex: `/${branch}$`, $options: "i" } }, // Branch at end (e.g., "ECE/CSE")
          { "Branch": { $regex: `^${branch},`, $options: "i" } }, // Branch at start with comma
          { "Branch": { $regex: `,${branch},`, $options: "i" } }, // Branch in middle with comma
          { "Branch": { $regex: `,${branch}$`, $options: "i" } }  // Branch at end with comma
        ]
      });
    }
    
    if (basket) {
      andConditions.push({ "Basket": basket });
    }
    
    if (search) {
      andConditions.push({
        "$or": [
          { "Subject_name": { $regex: search, $options: "i" } },
          { "Subject Code": { $regex: search, $options: "i" } },
        ]
      });
    }
    
    if (andConditions.length > 0) {
      query["$and"] = andConditions;
    }
    const cursor = db.collection("cbcs").find(query);
    const items = Number.isFinite(limit) && limit > 0 ? await cursor.limit(limit).toArray() : await cursor.toArray();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("CBCS GET error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const Branch = typeof body.Branch === 'string' ? body.Branch.trim() : '';
    const Basket = typeof body.Basket === 'string' ? body.Basket.trim() : '';
    const SubjectCode = typeof body.SubjectCode === 'string' ? body.SubjectCode.trim().toUpperCase() : '';
    const SubjectName = typeof body.SubjectName === 'string' ? body.SubjectName.trim() : '';
    const CreditsRaw = body.Credits;
    if (!Branch || !SubjectCode || !SubjectName) {
      return NextResponse.json({ error: "Branch, SubjectCode, SubjectName required" }, { status: 400 });
    }
    const Credits = CreditsRaw === undefined || CreditsRaw === null || CreditsRaw === ''
      ? ''
      : String(CreditsRaw).trim();
    const doc = { Branch, Basket, "Subject Code": SubjectCode, Subject_name: SubjectName, Credits };
    const client = await clientPromise;
    const db = client.db("cutm1");
    const res = await db.collection("cbcs").insertOne(doc);
    const item = await db.collection("cbcs").findOne({ _id: res.insertedId });
    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error("CBCS POST error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


