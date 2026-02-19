#!/usr/bin/env node

/**
 * Twitter/X Posting Script for GitHub Actions
 * Uses Playwright to bypass automation detection
 * Runs in GitHub Actions with fresh IP each time
 */

require('dotenv').config();
const { chromium } = require('playwright');

// Configuration
const X_USERNAME = process.env.X_USERNAME;
const X_PASSWORD = process.env.X_PASSWORD;
const TWEET_TEXT = process.env.TWEET_TEXT || `Test tweet from GitHub Actions at ${new Date().toISOString()}`;

if (!X_USERNAME || !X_PASSWORD) {
  console.error('Error: X_USERNAME and X_PASSWORD environment variables are required');
  console.error('Set them in GitHub Secrets or .env file');
  process.exit(1);
}

async function postTweet() {
  console.log('🚀 Starting Twitter/X posting script...');
  console.log(`📝 Tweet text: "${TWEET_TEXT}"`);
  
  let browser = null;
  try {
    // Launch browser with realistic settings
    browser = await chromium.launch({
      headless: true,  // GitHub Actions requires headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    // Create context with realistic viewport
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Step 1: Navigate to Twitter/X
    console.log('🌐 Navigating to Twitter/X...');
    await page.goto('https://x.com/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 2: Login
    console.log('🔐 Logging in...');
    
    // Enter username
    await page.fill('input[autocomplete="username"]', X_USERNAME);
    await page.click('div[role="button"]:has-text("Next")');
    await page.waitForTimeout(2000);

    // If password field appears
    if (await page.locator('input[name="password"]').count() > 0) {
      await page.fill('input[name="password"]', X_PASSWORD);
      await page.click('div[role="button"]:has-text("Log in")');
    } else {
      // Sometimes Twitter asks for username again (unusual login)
      await page.fill('input[name="text"]', X_USERNAME);
      await page.click('div[role="button"]:has-text("Next")');
      await page.waitForTimeout(2000);
      await page.fill('input[name="password"]', X_PASSWORD);
      await page.click('div[role="button"]:has-text("Log in")');
    }

    // Wait for login to complete
    await page.waitForTimeout(5000);
    
    // Check if login was successful
    const loginError = await page.locator('text=Incorrect password').count();
    if (loginError > 0) {
      throw new Error('Login failed: Incorrect password');
    }

    // Look for compose button as success indicator
    const composeButton = page.locator('a[href="/compose/post"]');
    await composeButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Login successful!');

    // Step 3: Human-like activity before posting
    console.log('🤖 Simulating human activity...');
    
    // Scroll a bit
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    
    // Click home to load timeline
    await page.click('a[href="/home"]');
    await page.waitForTimeout(3000);
    
    // Scroll timeline
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2000);

    // Step 4: Compose tweet
    console.log('📝 Composing tweet...');
    await page.click('a[href="/compose/post"]');
    await page.waitForTimeout(2000);

    // Type tweet text (human-like typing)
    const tweetBox = page.locator('[data-testid="tweetTextarea_0"]');
    await tweetBox.click();
    
    // Type slowly like a human
    for (const char of TWEET_TEXT) {
      await tweetBox.press(char);
      await page.waitForTimeout(Math.random() * 50 + 20); // 20-70ms between keystrokes
    }
    
    await page.waitForTimeout(1000);

    // Step 5: Post tweet
    console.log('🚀 Posting tweet...');
    const postButton = page.locator('[data-testid="tweetButton"]');
    await postButton.click();
    
    // Wait for post to complete
    await page.waitForTimeout(5000);

    // Step 6: Verify success
    console.log('🔍 Verifying post...');
    
    // Check for success indicators
    const successIndicators = [
      'Your post was sent',
      'Your Tweet was sent',
      'Posted',
      'Tweet sent'
    ];
    
    let success = false;
    for (const indicator of successIndicators) {
      if (await page.locator(`text=${indicator}`).count() > 0) {
        success = true;
        break;
      }
    }
    
    // Alternative: Check if compose modal closed
    if (!success && await page.locator('[data-testid="tweetTextarea_0"]').count() === 0) {
      success = true;
    }

    if (success) {
      console.log('🎉 Tweet posted successfully!');
      
      // Try to get tweet URL
      await page.waitForTimeout(3000);
      await page.click('a[href="/home"]');
      await page.waitForTimeout(3000);
      
      // Get the most recent tweet link
      const tweetLinks = await page.locator('a[href*="/status/"]').all();
      if (tweetLinks.length > 0) {
        const href = await tweetLinks[0].getAttribute('href');
        console.log(`🔗 Tweet URL: https://x.com${href}`);
      }
    } else {
      console.log('⚠️  Tweet may have been posted (no error detected)');
    }

    // Step 7: Logout (clean session)
    console.log('👋 Logging out...');
    await page.click('[data-testid="SideNav_AccountSwitcher_Button"]');
    await page.waitForTimeout(1000);
    await page.click('text=Log out');
    await page.waitForTimeout(2000);
    
    // Confirm logout if needed
    const logoutConfirm = page.locator('[data-testid="confirmationSheetConfirm"]');
    if (await logoutConfirm.count() > 0) {
      await logoutConfirm.click();
    }

    console.log('✅ Script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Take screenshot for debugging
    if (browser) {
      try {
        const pages = await browser.contexts()[0]?.pages() || [];
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'error-screenshot.png' });
          console.log('📸 Screenshot saved: error-screenshot.png');
        }
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError.message);
      }
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
postTweet();