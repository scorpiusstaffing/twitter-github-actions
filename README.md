# Twitter/X GitHub Actions Poster

Post tweets to Twitter/X using GitHub Actions and Playwright. Runs for free on GitHub's infrastructure with fresh IP addresses each time.

## How It Works

1. **GitHub Actions** runs Playwright in headless mode
2. **Fresh IP each run** - GitHub's cloud provides clean IPs
3. **Human-like behavior** - Simulates real user activity
4. **Bypasses automation detection** - Looks like a real browser session

## Setup

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/twitter-github-actions.git
git push -u origin main
```

### 2. Set GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions → New repository secret:

- `X_USERNAME` - Your Twitter/X username (email or handle)
- `X_PASSWORD` - Your Twitter/X password

### 3. Test Manually
Go to Actions tab → "Post Tweet" workflow → "Run workflow"

## Features

- **Free forever** - GitHub Actions provides 2,000 free minutes/month
- **Reliable** - Fresh IP each run bypasses rate limiting
- **Scheduled** - Post every 6 hours automatically
- **Manual trigger** - Post anytime from GitHub UI
- **Error handling** - Screenshots on failure

## Usage

### Schedule Tweets
Edit `.github/workflows/post-tweet.yml` to change schedule:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  - cron: '0 9 * * *'    # Daily at 9 AM
```

### Post Custom Tweet
1. Go to Actions tab
2. Click "Post Tweet" workflow
3. Click "Run workflow"
4. Enter tweet text (optional)
5. Click "Run workflow"

### Environment Variables
- `X_USERNAME` - Required (GitHub Secret)
- `X_PASSWORD` - Required (GitHub Secret)
- `TWEET_TEXT` - Optional (default includes timestamp)

## Cost

**$0/month** - Uses GitHub Actions free tier:
- 2,000 minutes/month (enough for ~100 tweets)
- 500 MB storage
- Unlimited public repositories

## Troubleshooting

### Login Issues
1. Check username/password in GitHub Secrets
2. Twitter may require email instead of handle
3. Try manual login first to ensure credentials work

### Automation Detection
If blocked:
1. GitHub provides fresh IP next run
2. Reduce frequency (change schedule)
3. Add more human-like behavior in script

### Screenshots
On error, check "Artifacts" in workflow run for screenshot.

## Security

- Credentials stored in GitHub Secrets (encrypted)
- No credentials in code
- Automatic logout after each run
- Fresh browser session each time

## License

MIT