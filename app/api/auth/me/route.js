import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { clientPromise } from "@/lib/mongodb";

async function decode(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await decode(token);
    if (!payload?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("cutm1");
    const user = await db.collection("users").findOne({ email: payload.email }, { projection: { password: 0 } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


