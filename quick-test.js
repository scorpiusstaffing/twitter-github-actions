#!/usr/bin/env node

/**
 * Quick test: Can we even launch Playwright and navigate to Twitter?
 */

const { chromium } = require('playwright');

async function quickTest() {
  console.log('🚀 Quick Playwright test...');
  
  let browser = null;
  try {
    // Test headless launch (like GitHub Actions)
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched');
    
    const page = await browser.newPage();
    console.log('✅ Page created');
    
    // Try to navigate
    await page.goto('https://x.com', { waitUntil: 'domcontentloaded' });
    console.log('✅ Navigated to Twitter/X');
    
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Take screenshot
    await page.screenshot({ path: 'quick-test.png' });
    console.log('📸 Screenshot: quick-test.png');
    
    await browser.close();
    console.log('🎉 Quick test passed! Playwright works.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

quickTest();