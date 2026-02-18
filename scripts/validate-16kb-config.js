#!/usr/bin/env node

/**
 * Script to validate 16 KB page size configuration before building
 * Usage: node scripts/validate-16kb-config.js
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");
const BUILD_GRADLE = path.join(PROJECT_ROOT, "android", "app", "build.gradle");
const GRADLE_PROPERTIES = path.join(
  PROJECT_ROOT,
  "android",
  "gradle.properties"
);

console.log("🔍 Validating 16 KB page size configuration...\n");

let hasErrors = false;
let hasWarnings = false;

// Check if Android directory exists
if (!fs.existsSync(path.join(PROJECT_ROOT, "android"))) {
  console.log("⚠️  Android directory not found. Run: npx expo prebuild");
  console.log("   This will apply the 16 KB page size plugin configuration.\n");
  process.exit(0);
}

// Check build.gradle
if (fs.existsSync(BUILD_GRADLE)) {
  console.log("📄 Checking build.gradle...");
  const buildGradleContent = fs.readFileSync(BUILD_GRADLE, "utf8");

  // Check for useLegacyPackaging = false
  if (buildGradleContent.includes("useLegacyPackaging = false")) {
    console.log(
      "   ✅ useLegacyPackaging = false (native libs not compressed)"
    );
  } else if (
    buildGradleContent.includes(
      "useLegacyPackaging enableLegacyPackaging.toBoolean()"
    )
  ) {
    console.log("   ❌ useLegacyPackaging still uses findProperty pattern");
    console.log(
      "      This needs to be replaced with: useLegacyPackaging = false"
    );
    console.log("      Run: npx expo prebuild --clean");
    hasErrors = true;
  } else if (buildGradleContent.includes("useLegacyPackaging = true")) {
    console.log("   ❌ useLegacyPackaging = true (native libs are compressed)");
    console.log("      This must be false for 16 KB support");
    hasErrors = true;
  } else {
    console.log("   ⚠️  Could not find useLegacyPackaging setting");
    hasWarnings = true;
  }

  // Check for 16KB_PAGE_SIZE_SUPPORT marker
  if (buildGradleContent.includes("16KB_PAGE_SIZE_SUPPORT")) {
    console.log("   ✅ 16 KB page size plugin configuration marker found");
  } else {
    console.log("   ⚠️  16 KB page size plugin marker not found");
    hasWarnings = true;
  }

  // Check for packagingOptions
  if (buildGradleContent.includes("packagingOptions")) {
    console.log("   ✅ packagingOptions block found");
  } else {
    console.log("   ⚠️  packagingOptions block not found");
    hasWarnings = true;
  }

  // Check for NDK configuration
  if (buildGradleContent.match(/defaultConfig\s*\{[\s\S]*?ndk\s*\{/)) {
    console.log("   ✅ NDK configuration found in defaultConfig");
  } else {
    console.log(
      "   ⚠️  NDK configuration not found (may be OK if using rootProject.ext.ndkVersion)"
    );
  }

  // Check for CMake arguments (CRITICAL for 16KB alignment)
  if (buildGradleContent.includes("max-page-size=16384")) {
    if (
      buildGradleContent.includes("CMAKE_CXX_FLAGS") ||
      buildGradleContent.includes("CMAKE_SHARED_LINKER_FLAGS") ||
      buildGradleContent.includes("CMAKE_C_FLAGS")
    ) {
      console.log("   ✅ CMake arguments for 16KB alignment found");
    } else {
      console.log(
        "   ⚠️  max-page-size found but CMake flags may be incomplete"
      );
    }
  } else {
    console.log("   ❌ CMake arguments for 16KB alignment NOT found");
    console.log("      This is CRITICAL - CMake builds won't be 16KB-aligned");
    hasErrors = true;
  }

  // Check for externalNativeBuild.cmake block
  if (buildGradleContent.match(/externalNativeBuild\s*\{[\s\S]*?cmake\s*\{/)) {
    console.log("   ✅ externalNativeBuild.cmake block found");
  } else {
    console.log("   ⚠️  externalNativeBuild.cmake block not found");
    console.log(
      "      This may be OK if app has no native code, but CMake flags won't apply"
    );
  }

  console.log("");
} else {
  console.log("⚠️  build.gradle not found. Run: npx expo prebuild\n");
  hasWarnings = true;
}

// Check gradle.properties
if (fs.existsSync(GRADLE_PROPERTIES)) {
  console.log("📄 Checking gradle.properties...");
  const gradlePropsContent = fs.readFileSync(GRADLE_PROPERTIES, "utf8");

  // Check for expo.useLegacyPackaging
  if (gradlePropsContent.includes("expo.useLegacyPackaging=false")) {
    console.log("   ✅ expo.useLegacyPackaging=false");
  } else if (gradlePropsContent.includes("expo.useLegacyPackaging=true")) {
    console.log("   ❌ expo.useLegacyPackaging=true (should be false)");
    hasErrors = true;
  } else {
    console.log(
      "   ⚠️  expo.useLegacyPackaging not found (will be added by plugin)"
    );
  }

  // Check for NDK build flags (for non-CMake builds)
  if (gradlePropsContent.includes("android.defaults.ndk.buildFlags")) {
    if (gradlePropsContent.includes("max-page-size=16384")) {
      console.log("   ✅ NDK build flags for 16KB alignment found");
    } else {
      console.log(
        "   ⚠️  NDK build flags found but missing max-page-size=16384"
      );
    }
  } else {
    console.log("   ⚠️  NDK build flags not found (will be added by plugin)");
  }

  console.log("");
} else {
  console.log("⚠️  gradle.properties not found\n");
  hasWarnings = true;
}

// Check app.json for plugin
const appJsonPath = path.join(PROJECT_ROOT, "app.json");
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const plugins = appJson.expo?.plugins || [];

  const has16KbPlugin = plugins.some((plugin) => {
    if (typeof plugin === "string") {
      return plugin.includes("16kb") || plugin.includes("16-kb");
    }
    if (Array.isArray(plugin) && plugin.length > 0) {
      return plugin[0].includes("16kb") || plugin[0].includes("16-kb");
    }
    return false;
  });

  if (has16KbPlugin) {
    console.log("✅ 16 KB page size plugin found in app.json");
  } else {
    console.log("❌ 16 KB page size plugin NOT found in app.json");
    console.log('   Add: "./plugins/with-16kb-page-size" to plugins array');
    hasErrors = true;
  }
  console.log("");
}

// Summary
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
);
console.log("");

if (hasErrors) {
  console.log("❌ Configuration issues found!");
  console.log("");
  console.log("To fix:");
  console.log("  1. Run: npx expo prebuild --clean");
  console.log(
    "     This will regenerate Android files with the plugin applied"
  );
  console.log("  2. Verify build.gradle has: useLegacyPackaging = false");
  console.log(
    "  3. Rebuild with: eas build --platform android --profile production"
  );
  process.exit(1);
} else if (hasWarnings) {
  console.log("⚠️  Some warnings found, but configuration looks mostly OK");
  console.log("");
  console.log("Recommendations:");
  console.log(
    "  1. Run: npx expo prebuild --clean (if Android files are outdated)"
  );
  console.log(
    "  2. After building, use: ./scripts/check-16kb-support.sh <your-aab-file>"
  );
  process.exit(0);
} else {
  console.log("✅ Configuration looks good!");
  console.log("");
  console.log("Next steps:");
  console.log(
    "  1. Build with: eas build --platform android --profile production"
  );
  console.log(
    "  2. After build, validate with: ./scripts/check-16kb-support.sh <your-aab-file>"
  );
  console.log("  3. Test on Android 15 emulator with 16 KB page size");
  process.exit(0);
}
