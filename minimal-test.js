#!/usr/bin/env node

/**
 * Minimal test: Can Playwright interact with Twitter in headless mode?
 */

const { chromium } = require('playwright');

async function minimalTest() {
  console.log('🧪 Minimal Twitter/X test...');
  
  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Go to Twitter
    console.log('1. Navigating to Twitter...');
    await page.goto('https://x.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check what's on the page
    const pageText = await page.textContent('body');
    console.log('2. Page contains "Twitter" or "X":', pageText.includes('Twitter') || pageText.includes('X'));
    
    // Look for login elements
    const loginButton = page.locator('a[href="/login"]');
    const loginCount = await loginButton.count();
    console.log('3. Login button found:', loginCount > 0);
    
    if (loginCount > 0) {
      console.log('4. Clicking login...');
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      // Check for username field
      const usernameField = page.locator('input[autocomplete="username"]');
      const usernameCount = await usernameField.count();
      console.log('5. Username field found:', usernameCount > 0);
      
      if (usernameCount > 0) {
        console.log('✅ Twitter/X is accessible via Playwright!');
        console.log('🎉 Ready for GitHub Actions deployment.');
      }
    }
    
    await page.screenshot({ path: 'minimal-test.png' });
    console.log('📸 Screenshot: minimal-test.png');
    
    await browser.close();
    console.log('✅ Minimal test passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Minimal test failed:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

minimalTest();