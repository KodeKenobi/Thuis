const {
  withAppBuildGradle,
  withGradleProperties,
} = require("@expo/config-plugins");

/**
 * Config plugin to add 16 KB page size support for Android
 *
 * Required by Google Play Store starting November 1, 2025 for apps targeting Android 15+ (API 35+)
 *
 * Reference: https://developer.android.com/guide/practices/page-sizes
 *
 * This plugin ensures:
 * 1. Native libraries (.so files) are NOT compressed (required for 16 KB alignment)
 * 2. Proper NDK configuration (NDK r28+ recommended, handled by EAS Build)
 * 3. Packaging options that support 16 KB alignment
 * 4. Gradle properties for 16 KB support
 *
 * CRITICAL REQUIREMENTS:
 * - NDK r28 or higher (EAS Build "latest" image includes this)
 * - Android Gradle Plugin 8.5.1+ (EAS Build "latest" image includes this)
 * - Native libraries must NOT be compressed (useLegacyPackaging = false)
 * - All native libraries must be built with NDK r28+ (React Native and dependencies)
 *
 * NOTE: For React Native/Expo apps, native libraries come from:
 * - React Native itself (must use version with 16 KB support)
 * - Third-party libraries (must be updated to versions with 16 KB support)
 * - Expo modules (should support 16 KB if using recent Expo SDK)
 *
 * This plugin configures the build to ensure proper packaging and alignment.
 */
const with16KbPageSize = (config) => {
  // Update gradle.properties to ensure compatibility
  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;

    // Ensure AndroidX is enabled (required for modern Android builds)
    if (!properties.find((prop) => prop.key === "android.useAndroidX")) {
      properties.push({
        type: "property",
        key: "android.useAndroidX",
        value: "true",
      });
    }

    // Remove deprecated property if it exists
    // With Android Gradle Plugin 8.1+, native libraries are stored uncompressed by default,
    // which is required for 16 KB page size support. The deprecated property causes build failures.
    const deprecatedPropIndex = properties.findIndex(
      (prop) => prop.key === "android.bundle.enableUncompressedNativeLibs"
    );
    if (deprecatedPropIndex !== -1) {
      properties.splice(deprecatedPropIndex, 1);
    }

    // CRITICAL: Ensure legacy packaging is disabled (required for 16 KB support)
    // Native libraries MUST NOT be compressed for 16 KB page size alignment
    const legacyPackagingIndex = properties.findIndex(
      (prop) => prop.key === "expo.useLegacyPackaging"
    );
    if (legacyPackagingIndex !== -1) {
      properties[legacyPackagingIndex].value = "false";
    } else {
      properties.push({
        type: "property",
        key: "expo.useLegacyPackaging",
        value: "false",
      });
    }

    // CRITICAL: Force NDK r28+ for 16 KB alignment support
    // This ensures React Native and all native modules are built with NDK r28+
    const ndkVersionIndex = properties.findIndex(
      (prop) => prop.key === "android.ndkVersion"
    );
    if (ndkVersionIndex !== -1) {
      // Update to ensure r28+ (format: 28.0.12345678 or similar)
      const currentVersion = properties[ndkVersionIndex].value;
      if (
        !currentVersion.startsWith("28.") &&
        !currentVersion.startsWith("29.") &&
        !currentVersion.startsWith("30.")
      ) {
        properties[ndkVersionIndex].value = "28.0.12698887"; // NDK r28
      }
    } else {
      // Add NDK version - EAS Build "latest" should have r28+, but we set it explicitly
      // Note: EAS Build will use its own NDK, but this ensures compatibility
      properties.push({
        type: "property",
        key: "android.ndkVersion",
        value: "28.0.12698887", // NDK r28 - minimum for 16 KB support
      });
    }

    // CRITICAL: Add linker flags to force 16KB page size alignment
    // This applies to ALL native libraries built by React Native and dependencies
    // The -Wl,-z,max-page-size=16384 flag forces 16KB alignment during linking
    const ndkBuildFlagsIndex = properties.findIndex(
      (prop) => prop.key === "android.defaults.ndk.buildFlags"
    );
    if (ndkBuildFlagsIndex !== -1) {
      // Update existing flags to include 16KB alignment
      const currentFlags = properties[ndkBuildFlagsIndex].value;
      if (!currentFlags.includes("max-page-size=16384")) {
        properties[
          ndkBuildFlagsIndex
        ].value = `${currentFlags} -Wl,-z,max-page-size=16384`;
      }
    } else {
      // Add linker flags for 16KB alignment
      properties.push({
        type: "property",
        key: "android.defaults.ndk.buildFlags",
        value: "-Wl,-z,max-page-size=16384",
      });
    }

    return config;
  });

  // Update app/build.gradle to configure 16 KB page size support
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if we already have the 16 KB page size configuration marker
    if (
      buildGradle.includes("16KB_PAGE_SIZE_SUPPORT") ||
      buildGradle.includes("16 KB page size support")
    ) {
      // Configuration already exists, but let's verify it's complete
      if (
        !buildGradle.includes("useLegacyPackaging = false") &&
        buildGradle.includes("packagingOptions")
      ) {
        // Need to update existing packagingOptions
        if (buildGradle.includes("jniLibs")) {
          modifiedGradle = buildGradle.replace(
            /(jniLibs\s*\{[\s\S]*?)(useLegacyPackaging\s*=)[\s\S]*?(\n)/,
            `$1$2 false  // 16 KB page size support$3`
          );
        }
      } else {
        // Configuration is complete, return early
        return config;
      }
    }

    let modifiedGradle = buildGradle;

    // CRITICAL: Ensure packagingOptions has useLegacyPackaging = false
    // This is the most important setting for 16 KB page size support
    // Native libraries must NOT be compressed
    if (buildGradle.includes("packagingOptions")) {
      // Update existing packagingOptions
      if (buildGradle.includes("jniLibs")) {
        // Replace the common pattern: def enableLegacyPackaging = findProperty(...) followed by useLegacyPackaging
        // This is the pattern used in Expo's default build.gradle
        // CRITICAL: We need to replace the entire block to ensure useLegacyPackaging is set to false directly
        if (buildGradle.includes("def enableLegacyPackaging")) {
          // Match the entire pattern including the def statement and useLegacyPackaging line
          // This handles the exact pattern: "def enableLegacyPackaging = findProperty('expo.useLegacyPackaging') ?: 'false'\n            useLegacyPackaging enableLegacyPackaging.toBoolean()"
          modifiedGradle = modifiedGradle.replace(
            /(\s+)(def\s+enableLegacyPackaging\s*=\s*findProperty\([^)]+\)\s*\?:?\s*['"][^'"]+['"][^\n]*\n\s+)(useLegacyPackaging\s+enableLegacyPackaging\.toBoolean\(\))/,
            `$1// 16 KB page size support: native libraries must NOT be compressed
$1useLegacyPackaging = false`
          );
        }
        // Also handle any remaining useLegacyPackaging patterns that use toBoolean() (fallback)
        if (modifiedGradle.includes("enableLegacyPackaging.toBoolean()")) {
          modifiedGradle = modifiedGradle.replace(
            /(\s+)(useLegacyPackaging\s+enableLegacyPackaging\.toBoolean\(\))/,
            `$1// 16 KB page size support: native libraries must NOT be compressed
$1useLegacyPackaging = false`
          );
        }
        // Handle any other useLegacyPackaging patterns that might use findProperty directly
        modifiedGradle = modifiedGradle.replace(
          /(\s+)(useLegacyPackaging\s*=\s*)(findProperty\([^)]+\)|enableLegacyPackaging\.toBoolean\(\)|true)/,
          `$1$2false  // 16 KB page size support`
        );
        // If useLegacyPackaging still doesn't exist after replacements, add it
        if (!modifiedGradle.match(/jniLibs\s*\{[\s\S]*?useLegacyPackaging/)) {
          modifiedGradle = modifiedGradle.replace(
            /(jniLibs\s*\{)/,
            `$1
            // 16 KB page size support: native libraries must NOT be compressed
            useLegacyPackaging = false`
          );
        }
      } else {
        // Add jniLibs block to existing packagingOptions
        modifiedGradle = modifiedGradle.replace(
          /(packagingOptions\s*\{)/,
          `$1
        // 16 KB page size support: native libraries must NOT be compressed
        jniLibs {
            useLegacyPackaging = false
        }`
        );
      }
    } else {
      // Add packagingOptions block if it doesn't exist
      // Find the android block closing brace
      const androidBlockMatch = modifiedGradle.match(/(android\s*\{)/);
      if (androidBlockMatch) {
        // Find the closing brace of android block
        let braceCount = 0;
        let foundStart = false;
        let insertPos = -1;

        for (let i = androidBlockMatch.index; i < modifiedGradle.length; i++) {
          if (modifiedGradle[i] === "{") {
            braceCount++;
            foundStart = true;
          } else if (modifiedGradle[i] === "}") {
            braceCount--;
            if (foundStart && braceCount === 0) {
              insertPos = i;
              break;
            }
          }
        }

        if (insertPos !== -1) {
          const beforeContent = modifiedGradle.substring(0, insertPos);
          const afterContent = modifiedGradle.substring(insertPos);

          modifiedGradle =
            beforeContent +
            `
    // 16 KB page size support (required for Android 15+)
    // CRITICAL: Native libraries must NOT be compressed for 16 KB alignment
    packagingOptions {
        jniLibs {
            useLegacyPackaging = false
        }
    }` +
            afterContent;
        }
      }
    }

    // Add NDK configuration to defaultConfig if not present
    // This helps ensure proper ABI filtering and NDK version awareness
    // CRITICAL: Also add CMake arguments for 16KB alignment
    // CMake builds don't automatically use gradle.properties flags, so we must set them explicitly
    if (buildGradle.includes("defaultConfig")) {
      const hasNdkBlock = buildGradle.match(
        /defaultConfig\s*\{[\s\S]*?ndk\s*\{/
      );
      const hasExternalNativeBuild = buildGradle.match(
        /defaultConfig\s*\{[\s\S]*?externalNativeBuild\s*\{/
      );

      if (!hasNdkBlock) {
        // Add NDK configuration to existing defaultConfig
        modifiedGradle = modifiedGradle.replace(
          /(defaultConfig\s*\{)/,
          `$1
        // 16 KB page size support: NDK r28+ required
        // Note: EAS Build "latest" image includes NDK r28+
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }`
        );
      }

      // CRITICAL: Add CMake arguments for 16KB alignment
      // This ensures ALL CMake-based native libraries (React Native, Expo modules, etc.) are built with 16KB alignment
      if (!hasExternalNativeBuild) {
        // Add externalNativeBuild block with CMake arguments
        modifiedGradle = modifiedGradle.replace(
          /(defaultConfig\s*\{)/,
          `$1
        // CRITICAL: CMake arguments for 16KB page size alignment
        // These flags are passed to ALL CMake builds (React Native, Expo modules, etc.)
        // NOTE: Only add linker flags, NOT compiler flags (to avoid "unused argument" errors)
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384",
                          "-DCMAKE_EXE_LINKER_FLAGS=-Wl,-z,max-page-size=16384"
            }
        }`
        );
      } else {
        // Update existing externalNativeBuild block to include CMake arguments
        if (!buildGradle.includes("max-page-size=16384")) {
          // Check if there's already a cmake block
          if (buildGradle.match(/externalNativeBuild\s*\{[\s\S]*?cmake\s*\{/)) {
            // Add arguments to existing cmake block
            modifiedGradle = modifiedGradle.replace(
              /(cmake\s*\{)/,
              `$1
                // CRITICAL: 16KB page size alignment flags
                // NOTE: Only add linker flags, NOT compiler flags (to avoid "unused argument" errors)
                arguments "-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384",
                          "-DCMAKE_EXE_LINKER_FLAGS=-Wl,-z,max-page-size=16384"`
            );
          } else {
            // Add cmake block to existing externalNativeBuild
            modifiedGradle = modifiedGradle.replace(
              /(externalNativeBuild\s*\{)/,
              `$1
            // CRITICAL: CMake arguments for 16KB page size alignment
            // NOTE: Only add linker flags, NOT compiler flags (to avoid "unused argument" errors)
            cmake {
                arguments "-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384",
                          "-DCMAKE_EXE_LINKER_FLAGS=-Wl,-z,max-page-size=16384"
            }`
            );
          }
        }
      }
    }

    // CRITICAL: Add packaging configuration to ensure native libraries are properly aligned
    // This is already handled above, but ensure it's in the right place

    // Add a comment marker to indicate 16 KB support is configured
    if (!modifiedGradle.includes("16KB_PAGE_SIZE_SUPPORT")) {
      // Add comment near the top of android block
      modifiedGradle = modifiedGradle.replace(
        /(android\s*\{)/,
        `$1
    // 16KB_PAGE_SIZE_SUPPORT: Configured for 16 KB page size compatibility
    // IMPORTANT: All native libraries must be built with NDK r28+ for 16 KB alignment
    // EAS Build "latest" image includes NDK r28+, but ensure all dependencies are updated`
      );
    }

    config.modResults.contents = modifiedGradle;
    return config;
  });

  return config;
};

module.exports = with16KbPageSize;
