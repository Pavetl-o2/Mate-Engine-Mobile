// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 3D model extensions so Metro can bundle .glb and .gltf files
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
