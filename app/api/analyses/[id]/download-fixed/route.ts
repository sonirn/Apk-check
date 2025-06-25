import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"
import fs from "fs"

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

    if (!analysis.fixedApkPath) {
      return NextResponse.json({ message: "Dev mode APK not available" }, { status: 404 })
    }

    if (!fs.existsSync(analysis.fixedApkPath)) {
      return NextResponse.json({ message: "Dev mode APK file not found" }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(analysis.fixedApkPath)
    const fileName = `dev-mode-${analysis.fileName}`

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading dev mode APK:", error)
    return NextResponse.json({ message: "Failed to download dev mode APK" }, { status: 500 })
  }
}
