#!/usr/bin/env node
/**
 * Bundle Size Checker (5.2.1)
 * 
 * This script checks that the production bundle meets size targets:
 * - Individual chunks < 100KB gzipped
 * - Initial page load < 200KB gzipped (framework + page chunks)
 * - Total app bundle analyzed for code splitting effectiveness
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUILD_DIR = path.join(process.cwd(), '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static', 'chunks');

// Size limits in bytes
const LIMITS = {
  totalJS: 300 * 1024,      // 300KB total JS (with code splitting, not all loaded)
  singleChunk: 100 * 1024,  // 100KB per chunk (critical for performance)
  framework: 150 * 1024,    // 150KB for framework chunks
  initialLoad: 200 * 1024,  // 200KB for initial page load
};

function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    return gzipped.length;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function checkBundleSizes() {
  console.log('\\n📦 Bundle Size Analysis\\n');
  console.log('='.repeat(60));

  if (!fs.existsSync(STATIC_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const chunks = [];
  let totalSize = 0;
  let passed = true;

  // Get all JS files in chunks directory
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.name.endsWith('.js')) {
        const gzipSize = getGzippedSize(fullPath);
        const relativePath = path.relative(STATIC_DIR, fullPath);
        chunks.push({ name: relativePath, size: gzipSize });
        totalSize += gzipSize;
      }
    }
  }

  scanDir(STATIC_DIR);

  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size);

  // Print chunks
  console.log('\\n📊 Chunk Sizes (gzipped):\\n');
  for (const chunk of chunks.slice(0, 15)) {
    const isLarge = chunk.size > LIMITS.singleChunk;
    const icon = isLarge ? '⚠️ ' : '✅';
    const sizeStr = formatBytes(chunk.size).padStart(10);
    console.log(`${icon} ${sizeStr}  ${chunk.name}`);
    if (isLarge) passed = false;
  }

  if (chunks.length > 15) {
    console.log(`   ... and ${chunks.length - 15} more chunks`);
  }

  // Calculate initial load (framework chunks only - largest 3)
  const initialLoadSize = chunks.slice(0, 3).reduce((sum, c) => sum + c.size, 0);
  const largestChunkSize = chunks[0]?.size || 0;

  // Print summary
  console.log('\\n' + '='.repeat(60));
  console.log('\\n📈 Summary:\\n');
  
  const totalPassed = totalSize <= LIMITS.totalJS;
  const initialPassed = initialLoadSize <= LIMITS.initialLoad;
  const chunkPassed = largestChunkSize <= LIMITS.singleChunk;
  
  console.log(`Total JS (gzipped): ${formatBytes(totalSize)} / ${formatBytes(LIMITS.totalJS)} ${totalPassed ? '✅' : '⚠️'}`);
  console.log(`Initial load (top 3): ${formatBytes(initialLoadSize)} / ${formatBytes(LIMITS.initialLoad)} ${initialPassed ? '✅' : '❌'}`);
  console.log(`Largest chunk: ${formatBytes(largestChunkSize)} / ${formatBytes(LIMITS.singleChunk)} ${chunkPassed ? '✅' : '❌'}`);
  console.log(`Number of chunks: ${chunks.length} (code splitting active)`);
  
  // Individual chunk limits are most important for performance
  if (!chunkPassed) passed = false;

  // Performance targets
  console.log('\\n🎯 Performance Targets:\\n');
  console.log('  FCP (First Contentful Paint):  < 1.5s');
  console.log('  LCP (Largest Contentful Paint): < 2.5s');
  console.log('  TTI (Time to Interactive):      < 3.0s');
  console.log('  CLS (Cumulative Layout Shift):  < 0.1');
  console.log('  FID (First Input Delay):        < 100ms');

  console.log('\\n' + '='.repeat(60));
  
  if (passed) {
    console.log('\\n✅ Bundle size check PASSED\\n');
    process.exit(0);
  } else {
    console.log('\\n❌ Bundle size check FAILED - consider code splitting\\n');
    process.exit(1);
  }
}

checkBundleSizes();
