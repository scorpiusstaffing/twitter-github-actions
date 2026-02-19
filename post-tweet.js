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
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔧 Platform: ${process.platform}`);
  
  let browser = null;
  try {
    // Launch browser with minimal settings for GitHub Actions
    browser = await chromium.launch({
      headless: true,  // GitHub Actions requires headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    // Create context with basic settings
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Minimal anti-detection: remove webdriver property
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    const page = await context.newPage();

    // Step 1: Navigate to Twitter/X with multiple URL attempts
    console.log('🌐 Navigating to Twitter/X...');
    
    // Try multiple URLs (Twitter changes these)
    const urls = [
      'https://x.com/i/flow/login',
      'https://twitter.com/i/flow/login',
      'https://x.com/login',
      'https://twitter.com/login'
    ];
    
    let loginSuccess = false;
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        console.log(`✅ Loaded: ${url}`);
        
        // Wait for page to settle
        await page.waitForTimeout(3000);
        
        // Check if we're on a login page
        const hasLoginElements = await page.locator('input[autocomplete="username"], input[name="text"], input[type="email"]').count() > 0;
        if (hasLoginElements) {
          loginSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Failed to load ${url}: ${error.message}`);
      }
    }
    
    if (!loginSuccess) {
      throw new Error('Could not load Twitter/X login page');
    }

    // Step 2: Login with multiple selector attempts
    console.log('🔐 Logging in...');
    
    // Try multiple username field selectors
    const usernameSelectors = [
      'input[autocomplete="username"]',
      'input[name="text"]',
      'input[type="email"]',
      'input[autocomplete="email"]'
    ];
    
    let usernameField = null;
    for (const selector of usernameSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        usernameField = page.locator(selector);
        console.log(`✅ Found username field: ${selector}`);
        break;
      }
    }
    
    if (!usernameField) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-error.png' });
      throw new Error('Could not find username field on login page');
    }
    
    // Enter username
    await usernameField.fill(X_USERNAME);
    await page.waitForTimeout(1000);
    
    // Find and click Next button
    const nextButtons = [
      'div[role="button"]:has-text("Next")',
      'button:has-text("Next")',
      'span:has-text("Next")',
      '[data-testid="LoginForm_Login_Button"]'
    ];
    
    let nextClicked = false;
    for (const buttonSelector of nextButtons) {
      const buttonCount = await page.locator(buttonSelector).count();
      if (buttonCount > 0) {
        await page.locator(buttonSelector).click();
        console.log(`✅ Clicked Next button: ${buttonSelector}`);
        nextClicked = true;
        break;
      }
    }
    
    if (!nextClicked) {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      console.log('✅ Pressed Enter instead of Next button');
    }
    
    await page.waitForTimeout(3000);

    // Step 3: Enter password
    console.log('🔑 Entering password...');
    
    // Try multiple password field selectors
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[autocomplete="current-password"]'
    ];
    
    let passwordField = null;
    for (const selector of passwordSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        passwordField = page.locator(selector);
        console.log(`✅ Found password field: ${selector}`);
        break;
      }
    }
    
    if (!passwordField) {
      throw new Error('Could not find password field after username');
    }
    
    await passwordField.fill(X_PASSWORD);
    await page.waitForTimeout(1000);
    
    // Find and click Login button
    const loginButtons = [
      'div[role="button"]:has-text("Log in")',
      'button:has-text("Log in")',
      'span:has-text("Log in")',
      '[data-testid="LoginForm_Login_Button"]'
    ];
    
    let loginClicked = false;
    for (const buttonSelector of loginButtons) {
      const buttonCount = await page.locator(buttonSelector).count();
      if (buttonCount > 0) {
        await page.locator(buttonSelector).click();
        console.log(`✅ Clicked Login button: ${buttonSelector}`);
        loginClicked = true;
        break;
      }
    }
    
    if (!loginClicked) {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      console.log('✅ Pressed Enter to login');
    }

    // Wait for login to complete with multiple success checks
    console.log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(8000);
    
    // Check for login errors
    const loginErrors = [
      'Incorrect password',
      'Wrong password',
      'Invalid password',
      'Your password is incorrect',
      'Something went wrong',
      'Try again later'
    ];
    
    for (const errorText of loginErrors) {
      const errorCount = await page.locator(`text=${errorText}`).count();
      if (errorCount > 0) {
        await page.screenshot({ path: 'login-error-detail.png' });
        throw new Error(`Login failed: ${errorText}`);
      }
    }
    
    // Check for successful login indicators
    const successIndicators = [
      'a[href="/compose/post"]',  // Compose button
      '[data-testid="AppTabBar_Home_Link"]',  // Home link
      '[aria-label="Home"]',  // Home icon
      'text=Home',  // Home text
      'text=Following',  // Following tab
      'text=For you'  // For you tab
    ];
    
    let loginVerified = false;
    for (const indicator of successIndicators) {
      const count = await page.locator(indicator).count();
      if (count > 0) {
        console.log(`✅ Login successful! Found: ${indicator}`);
        loginVerified = true;
        break;
      }
    }
    
    if (!loginVerified) {
      // Take screenshot to see what's on the page
      await page.screenshot({ path: 'login-unknown-state.png' });
      const pageText = await page.textContent('body');
      console.log('Page content sample:', pageText.substring(0, 500));
      throw new Error('Login status unclear - could not find success indicators');
    }

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
    console.error('❌ CRITICAL ERROR posting tweet:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    console.error(`   Stack: ${error.stack}`);
    
    // Take screenshot if browser is available
    if (browser) {
      try {
        const contexts = await browser.contexts();
        if (contexts.length > 0) {
          const pages = await contexts[0].pages();
          if (pages.length > 0) {
            await pages[0].screenshot({ path: 'error-screenshot.png' });
            console.log('📸 Error screenshot saved: error-screenshot.png');
          }
        }
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError.message);
      }
      
      try {
        await browser.close();
        console.log('✅ Browser closed');
      } catch (closeError) {
        console.error('Failed to close browser:', closeError.message);
      }
    } else {
      console.log('⚠️ Browser was never launched or already closed');
    }
    
    console.log(`⏰ Script ran for: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
postTweet();