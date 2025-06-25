import { NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function GET() {
  try {
    const analyses = await storage.getAllApkAnalyses()
    return NextResponse.json(analyses)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ message: "Failed to fetch analyses" }, { status: 500 })
  }
}
