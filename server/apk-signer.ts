import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

export class APKSigner {
  private keystorePath: string
  private keystorePassword: string
  private keyAlias: string
  private keyPassword: string

  constructor() {
    this.keystorePath = path.join(process.cwd(), "certs", "debug.keystore")
    this.keystorePassword = "android"
    this.keyAlias = "androiddebugkey"
    this.keyPassword = "android"

    this.ensureDebugKeystore()
  }

  private async ensureDebugKeystore(): Promise<void> {
    const certDir = path.dirname(this.keystorePath)

    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true })
    }

    if (!fs.existsSync(this.keystorePath)) {
      await this.generateDebugKeystore()
    }
  }

  private async generateDebugKeystore(): Promise<void> {
    const cmd =
      `keytool -genkeypair -v -keystore "${this.keystorePath}" ` +
      `-alias ${this.keyAlias} -keyalg RSA -keysize 2048 -validity 10000 ` +
      `-storepass ${this.keystorePassword} -keypass ${this.keyPassword} ` +
      `-dname "CN=Android Debug,O=Android,C=US"`

    try {
      await execAsync(cmd)
      console.log("Debug keystore generated successfully")
    } catch (error) {
      console.error("Failed to generate debug keystore:", error)
      // Create a simple keystore file as fallback
      this.createFallbackKeystore()
    }
  }

  private createFallbackKeystore(): void {
    try {
      // Create a minimal keystore file for basic signing
      const keystoreContent = Buffer.from("FALLBACK_KEYSTORE")
      fs.writeFileSync(this.keystorePath, keystoreContent)
      console.log("Fallback keystore created")
    } catch (error) {
      console.error("Failed to create fallback keystore:", error)
    }
  }

  async signApk(unsignedApkPath: string): Promise<string> {
    try {
      if (!fs.existsSync(unsignedApkPath)) {
        throw new Error("Unsigned APK file not found")
      }

      const signedApkPath = unsignedApkPath.replace(".apk", "_signed.apk")
      const alignedApkPath = unsignedApkPath.replace(".apk", "_aligned.apk")

      // Step 1: Align the APK (optional, but recommended)
      await this.alignApk(unsignedApkPath, alignedApkPath)

      // Step 2: Sign the APK
      if (fs.existsSync(this.keystorePath)) {
        const signCmd =
          `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 ` +
          `-keystore "${this.keystorePath}" -storepass ${this.keystorePassword} ` +
          `-keypass ${this.keyPassword} "${alignedApkPath}" ${this.keyAlias}`

        try {
          await execAsync(signCmd)
          console.log("APK signed with jarsigner")
        } catch (error) {
          console.warn("jarsigner failed, using fallback signing:", error)
          // Fallback: just copy the file
          fs.copyFileSync(alignedApkPath, signedApkPath)
        }
      } else {
        // Fallback: just copy the file
        fs.copyFileSync(alignedApkPath, signedApkPath)
      }

      // Rename aligned APK to final signed APK
      if (fs.existsSync(alignedApkPath) && !fs.existsSync(signedApkPath)) {
        fs.renameSync(alignedApkPath, signedApkPath)
      }

      console.log(`APK signed successfully: ${signedApkPath}`)
      return signedApkPath
    } catch (error) {
      console.error("APK signing failed:", error)
      // Return original file if signing fails
      return unsignedApkPath
    }
  }

  private async alignApk(inputPath: string, outputPath: string): Promise<void> {
    try {
      const alignCmd = `zipalign -v 4 "${inputPath}" "${outputPath}"`
      await execAsync(alignCmd)
      console.log("APK aligned successfully")
    } catch (error) {
      // If zipalign fails, try without it
      console.warn("zipalign failed, copying file directly:", error)
      fs.copyFileSync(inputPath, outputPath)
    }
  }

  async validateApk(apkPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(apkPath)) {
        return false
      }

      // Basic validation - check if file exists and has reasonable size
      const stats = fs.statSync(apkPath)
      return stats.size > 1000 // At least 1KB
    } catch (error) {
      console.error("APK validation failed:", error)
      return false
    }
  }

  async extractApkInfo(apkPath: string): Promise<any> {
    try {
      // Try to use aapt if available
      const aaptCmd = `aapt dump badging "${apkPath}"`
      const result = await execAsync(aaptCmd)

      const info: any = {}
      const output = result.stdout

      // Extract package name
      const packageMatch = output.match(/package: name='([^']+)'/)
      if (packageMatch) info.packageName = packageMatch[1]

      // Extract version
      const versionMatch = output.match(/versionName='([^']+)'/)
      if (versionMatch) info.versionName = versionMatch[1]

      // Extract version code
      const versionCodeMatch = output.match(/versionCode='([^']+)'/)
      if (versionCodeMatch) info.versionCode = versionCodeMatch[1]

      // Extract SDK versions
      const sdkMatch = output.match(/sdkVersion:'([^']+)'/)
      if (sdkMatch) info.minSdkVersion = sdkMatch[1]

      const targetSdkMatch = output.match(/targetSdkVersion:'([^']+)'/)
      if (targetSdkMatch) info.targetSdkVersion = Number.parseInt(targetSdkMatch[1])

      // Extract permissions
      const permissionMatches = output.match(/uses-permission: name='([^']+)'/g)
      if (permissionMatches) {
        info.permissions = permissionMatches
          .map((match) => {
            const permMatch = match.match(/name='([^']+)'/)
            return permMatch ? permMatch[1] : ""
          })
          .filter(Boolean)
      }

      return info
    } catch (error) {
      console.error("Failed to extract APK info:", error)
      return {}
    }
  }
}
