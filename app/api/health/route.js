import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getRedisClient } from "@/lib/redis";

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check MongoDB connection
    try {
      const client = await clientPromise;
      const db = client.db("cutm1");
      await db.admin().ping();
      health.services.mongodb = { status: "healthy", message: "Connected" };
    } catch (error) {
      health.services.mongodb = { status: "unhealthy", message: error.message };
      health.status = "unhealthy";
    }

    // Check Redis connection
    try {
      const redis = getRedisClient();
      await redis.ping();
      health.services.redis = { status: "healthy", message: "Connected" };
    } catch (error) {
      health.services.redis = { status: "unhealthy", message: error.message };
      health.status = "unhealthy";
    }

    // Check environment variables
    const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      health.services.environment = { 
        status: "unhealthy", 
        message: `Missing environment variables: ${missingEnvVars.join(', ')}` 
      };
      health.status = "unhealthy";
    } else {
      health.services.environment = { status: "healthy", message: "All required variables present" };
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}
