#!/usr/bin/env node

/**
 * Test Twitter/X login only
 * Verifies credentials work before setting up GitHub Actions
 */

require('dotenv').config();
const { chromium } = require('playwright');

const X_USERNAME = process.env.X_USERNAME || 'test';
const X_PASSWORD = process.env.X_PASSWORD || 'test';

async function testLogin() {
  console.log('🔐 Testing Twitter/X login...');
  
  let browser = null;
  try {
    browser = await chromium.launch({
      headless: false,  // Show browser for debugging
      slowMo: 100,      // Slow down for observation
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    console.log('1. Navigating to login page...');
    await page.goto('https://x.com/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('2. Entering username...');
    await page.fill('input[autocomplete="username"]', X_USERNAME);
    await page.click('div[role="button"]:has-text("Next")');
    await page.waitForTimeout(2000);

    console.log('3. Checking for password field...');
    
    // Take screenshot
    await page.screenshot({ path: 'login-step1.png' });
    console.log('📸 Screenshot: login-step1.png');

    // Check what's on the page
    const pageText = await page.textContent('body');
    console.log('Page contains:', pageText.substring(0, 200));

    // Look for password field
    const passwordField = page.locator('input[name="password"]');
    const count = await passwordField.count();
    
    if (count > 0) {
      console.log('✅ Password field found');
      await page.fill('input[name="password"]', X_PASSWORD);
      await page.click('div[role="button"]:has-text("Log in")');
    } else {
      console.log('❓ Password field not found, checking for unusual login flow...');
      
      // Check if username field appears again
      const usernameField = page.locator('input[name="text"]');
      if (await usernameField.count() > 0) {
        console.log('Found username field again (unusual login)');
        await usernameField.fill(X_USERNAME);
        await page.click('div[role="button"]:has-text("Next")');
        await page.waitForTimeout(2000);
        
        await page.fill('input[name="password"]', X_PASSWORD);
        await page.click('div[role="button"]:has-text("Log in")');
      } else {
        console.log('Could not find login form elements');
        await page.screenshot({ path: 'login-error.png' });
        throw new Error('Login form not found');
      }
    }

    console.log('4. Waiting for login to complete...');
    await page.waitForTimeout(5000);

    // Check for login errors
    const errorText = await page.locator('text=Incorrect password').count();
    if (errorText > 0) {
      throw new Error('Login failed: Incorrect password');
    }

    // Check for success (compose button or home)
    const composeButton = page.locator('a[href="/compose/post"]');
    const homeButton = page.locator('a[href="/home"]');
    
    if (await composeButton.count() > 0 || await homeButton.count() > 0) {
      console.log('🎉 Login successful!');
      await page.screenshot({ path: 'login-success.png' });
      console.log('📸 Screenshot: login-success.png');
      
      // Show username if available
      const accountSwitcher = page.locator('[data-testid="SideNav_AccountSwitcher_Button"]');
      if (await accountSwitcher.count() > 0) {
        const accountText = await accountSwitcher.textContent();
        console.log(`Logged in as: ${accountText}`);
      }
    } else {
      console.log('⚠️  Login status unclear');
      await page.screenshot({ path: 'login-ambiguous.png' });
    }

    console.log('✅ Login test completed');
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (browser) {
      try {
        const pages = await browser.contexts()[0]?.pages() || [];
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'login-failure.png' });
          console.log('📸 Screenshot saved: login-failure.png');
        }
      } catch (e) {
        // ignore
      }
      await browser.close();
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  if (!X_USERNAME || !X_PASSWORD || X_USERNAME === 'test' || X_PASSWORD === 'test') {
    console.error('Error: Set X_USERNAME and X_PASSWORD environment variables');
    console.error('Create .env file with:');
    console.error('X_USERNAME=your_username');
    console.error('X_PASSWORD=your_password');
    process.exit(1);
  }
  testLogin();
}

module.exports = { testLogin };