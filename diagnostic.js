#!/usr/bin/env node

/**
 * Diagnostic script to figure out why Playwright is failing on GitHub Actions
 */

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');

async function runDiagnostics() {
  console.log('🔍 Running Playwright diagnostics...');
  console.log(`📊 System info:`);
  console.log(`  - Platform: ${process.platform}`);
  console.log(`  - Arch: ${process.arch}`);
  console.log(`  - Node: ${process.version}`);
  console.log(`  - CPUs: ${os.cpus().length}`);
  console.log(`  - Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
  console.log(`  - Free memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
  
  console.log(`\n📦 Playwright info:`);
  console.log(`  - Version: ${require('playwright/package.json').version}`);
  
  // Check if chromium is installed
  console.log(`\n🔧 Checking Chromium installation...`);
  try {
    const { execSync } = require('child_process');
    const result = execSync('npx playwright install --dry-run chromium', { encoding: 'utf8' });
    console.log(`  - Chromium check: ${result.includes('chromium') ? '✅ Installed' : '❌ Not installed'}`);
  } catch (error) {
    console.log(`  - Chromium check failed: ${error.message}`);
  }
  
  console.log(`\n🚀 Testing browser launch...`);
  let browser = null;
  try {
    // Try with minimal args
    console.log(`  - Attempting to launch with --no-sandbox...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log(`  - ✅ Browser launched successfully!`);
    
    console.log(`\n🌐 Testing page creation...`);
    const page = await browser.newPage();
    console.log(`  - ✅ Page created successfully!`);
    
    console.log(`\n🔗 Testing navigation...`);
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log(`  - ✅ Navigated to example.com!`);
    
    const title = await page.title();
    console.log(`  - Page title: "${title}"`);
    
    console.log(`\n📸 Taking screenshot...`);
    await page.screenshot({ path: 'diagnostic-success.png' });
    console.log(`  - ✅ Screenshot saved: diagnostic-success.png`);
    
    await browser.close();
    console.log(`\n🎉 All diagnostics passed! Playwright is working correctly.`);
    process.exit(0);
    
  } catch (error) {
    console.log(`\n❌ Diagnostic failed:`);
    console.log(`  - Error: ${error.message}`);
    console.log(`  - Stack: ${error.stack}`);
    
    // Try to get more info about the error
    if (error.message.includes('browserType.launch')) {
      console.log(`  - Issue: Browser launch failed`);
      console.log(`  - Possible causes:`);
      console.log(`    1. Chromium not installed (run: npx playwright install chromium)`);
      console.log(`    2. Missing system dependencies`);
      console.log(`    3. Insufficient memory/disk space`);
      console.log(`    4. Sandbox issues (try different --no-sandbox flags)`);
    } else if (error.message.includes('navigation')) {
      console.log(`  - Issue: Navigation failed`);
    } else if (error.message.includes('timeout')) {
      console.log(`  - Issue: Timeout occurred`);
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }
    
    process.exit(1);
  }
}

runDiagnostics();