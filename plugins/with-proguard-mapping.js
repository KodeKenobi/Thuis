const {
  withAppBuildGradle,
  withGradleProperties,
} = require("@expo/config-plugins");

/**
 * Config plugin to enable R8/ProGuard and ensure mapping file is generated
 *
 * This ensures:
 * 1. Minification is enabled for release builds (enables R8)
 * 2. Mapping file is generated for deobfuscation
 * 3. Mapping file is automatically included in the AAB for Google Play Console
 *
 * Reference: https://developer.android.com/studio/build/shrink-code
 * 
 * The mapping file will be automatically generated at:
 * app/build/outputs/mapping/release/mapping.txt
 * 
 * With Android Gradle Plugin 8.5.1+, the mapping file is automatically
 * included in the AAB and uploaded to Google Play Console.
 */
const withProguardMapping = (config) => {
  // First, ensure the gradle property is set to enable minification
  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;

    // Ensure minification is enabled by default for release builds
    const minifyPropIndex = properties.findIndex(
      (prop) => prop.key === "android.enableMinifyInReleaseBuilds"
    );
    if (minifyPropIndex !== -1) {
      properties[minifyPropIndex].value = "true";
    } else {
      properties.push({
        type: "property",
        key: "android.enableMinifyInReleaseBuilds",
        value: "true",
      });
    }

    // Also enable resource shrinking for better optimization
    const shrinkResourcesIndex = properties.findIndex(
      (prop) => prop.key === "android.enableShrinkResourcesInReleaseBuilds"
    );
    if (shrinkResourcesIndex !== -1) {
      properties[shrinkResourcesIndex].value = "true";
    } else {
      properties.push({
        type: "property",
        key: "android.enableShrinkResourcesInReleaseBuilds",
        value: "true",
      });
    }

    return config;
  });

  // Update app/build.gradle to ensure minification is enabled
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if we already have the ProGuard mapping configuration marker
    if (buildGradle.includes("PROGUARD_MAPPING_ENABLED")) {
      // Configuration already exists, but verify minifyEnabled is set correctly
      if (buildGradle.includes("minifyEnabled enableMinifyInReleaseBuilds")) {
        // Replace property-based minifyEnabled with direct true
        const updatedGradle = buildGradle.replace(
          /minifyEnabled\s+enableMinifyInReleaseBuilds/,
          `minifyEnabled true  // PROGUARD_MAPPING_ENABLED: Force enabled for mapping file generation`
        );
        config.modResults.contents = updatedGradle;
      }
      return config;
    }

    let modifiedGradle = buildGradle;

    // CRITICAL: Replace property-based minifyEnabled with direct true
    // This ensures minification is always enabled, which generates the mapping file
    if (buildGradle.includes("minifyEnabled enableMinifyInReleaseBuilds")) {
      modifiedGradle = modifiedGradle.replace(
        /minifyEnabled\s+enableMinifyInReleaseBuilds/,
        `minifyEnabled true  // PROGUARD_MAPPING_ENABLED: Force enabled for mapping file generation`
      );
    }

    // Ensure release buildType has minifyEnabled set to true
    if (buildGradle.includes("release")) {
      // Check if minifyEnabled exists in release block
      const releaseBlockMatch = buildGradle.match(/release\s*\{([^}]*)\}/);
      if (releaseBlockMatch) {
        const releaseContent = releaseBlockMatch[1];
        if (!releaseContent.includes("minifyEnabled")) {
          // Add minifyEnabled to release block
          modifiedGradle = modifiedGradle.replace(
            /(release\s*\{)/,
            `$1
            // PROGUARD_MAPPING_ENABLED: Enable R8/ProGuard for code shrinking and obfuscation
            // Mapping file will be automatically generated and included in AAB
            minifyEnabled true
            shrinkResources true`
          );
        } else if (!releaseContent.includes("minifyEnabled true") && !releaseContent.includes("minifyEnabled = true")) {
          // minifyEnabled exists but might be false or property-based, ensure it's true
          modifiedGradle = modifiedGradle.replace(
            /(release\s*\{[^}]*)(minifyEnabled\s+)(false|enableMinifyInReleaseBuilds)/,
            `$1$2true  // PROGUARD_MAPPING_ENABLED: Force enabled`
          );
        }
      }
    } else {
      // Release block doesn't exist, add it
      if (buildGradle.includes("buildTypes")) {
        modifiedGradle = modifiedGradle.replace(
          /(buildTypes\s*\{)/,
          `$1
        release {
            // PROGUARD_MAPPING_ENABLED: Enable R8/ProGuard for code shrinking and obfuscation
            // Mapping file will be automatically generated and included in AAB
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }`
        );
      }
    }

    // Ensure proguardFiles is configured
    if (buildGradle.includes("release") && !buildGradle.match(/release\s*\{[^}]*proguardFiles/)) {
      modifiedGradle = modifiedGradle.replace(
        /(release\s*\{[^}]*minifyEnabled[^\n]*\n)/,
        `$1            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
`
      );
    }

    // Add configuration marker
    if (!modifiedGradle.includes("PROGUARD_MAPPING_ENABLED")) {
      // Add comment near the top of android block
      modifiedGradle = modifiedGradle.replace(
        /(android\s*\{)/,
        `$1
    // PROGUARD_MAPPING_ENABLED: R8/ProGuard mapping file generation enabled`
      );
    }

    config.modResults.contents = modifiedGradle;
    return config;
  });

  return config;
};

module.exports = withProguardMapping;
