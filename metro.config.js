const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .woff and .woff2 to asset extensions
config.resolver.assetExts.push("woff", "woff2", "otf", "ttf");

module.exports = config;
