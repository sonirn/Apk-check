import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid analysis ID" }, { status: 400 })
    }

    const analysis = await storage.getApkAnalysis(id)

    if (!analysis) {
      return NextResponse.json({ message: "Analysis not found" }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ message: "Failed to fetch analysis" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const deleted = await storage.deleteApkAnalysis(id)

    if (!deleted) {
      return NextResponse.json({ message: "Analysis not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Analysis deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ message: "Failed to delete analysis" }, { status: 500 })
  }
}
