import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');
    
    // Parse CSV content
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "File must contain at least a header row and one data row" }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = ['Branch', 'Basket', 'Subject Code', 'Subject Name', 'Credits'];
    
    // Validate headers
    const hasRequiredHeaders = expectedHeaders.every(header => 
      headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );
    
    if (!hasRequiredHeaders) {
      return NextResponse.json({ 
        error: `File must contain headers: ${expectedHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // Find column indices
    const getColumnIndex = (headerName) => {
      return headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
    };

    const branchIndex = getColumnIndex('Branch');
    const basketIndex = getColumnIndex('Basket');
    const subjectCodeIndex = getColumnIndex('Subject Code');
    const subjectNameIndex = getColumnIndex('Subject Name');
    const creditsIndex = getColumnIndex('Credits');

    // Parse data rows
    const subjects = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < headers.length) continue; // Skip incomplete rows
      
      const branch = values[branchIndex]?.trim();
      const basket = values[basketIndex]?.trim() || '';
      const subjectCode = values[subjectCodeIndex]?.trim();
      const subjectName = values[subjectNameIndex]?.trim();
      const credits = values[creditsIndex]?.trim() || '';

      if (!branch || !subjectCode || !subjectName) continue; // Skip invalid rows

      subjects.push({
        Branch: branch,
        Basket: basket,
        "Subject Code": subjectCode.toUpperCase(),
        Subject_name: subjectName,
        Credits: credits
      });
    }

    if (subjects.length === 0) {
      return NextResponse.json({ error: "No valid subjects found in file" }, { status: 400 });
    }

    // Insert subjects into database
    const client = await clientPromise;
    const db = client.db("cutm1");
    
    // Check for duplicates and insert only new ones
    const existingSubjects = await db.collection("cbcs").find({
      "Subject Code": { $in: subjects.map(s => s["Subject Code"]) }
    }).toArray();
    
    const existingCodes = new Set(existingSubjects.map(s => s["Subject Code"]));
    const newSubjects = subjects.filter(s => !existingCodes.has(s["Subject Code"]));
    
    if (newSubjects.length === 0) {
      return NextResponse.json({ 
        error: "All subjects already exist in the database",
        count: 0,
        duplicates: subjects.length
      }, { status: 400 });
    }

    const result = await db.collection("cbcs").insertMany(newSubjects);
    
    return NextResponse.json({ 
      success: true, 
      count: result.insertedCount,
      duplicates: subjects.length - newSubjects.length,
      message: `Successfully uploaded ${result.insertedCount} subjects. ${subjects.length - newSubjects.length} duplicates skipped.`
    });

  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
