// Import libraries
const { chromium } = require('playwright');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function sendToDiscord(tweetData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ Error: DISCORD_WEBHOOK_URL is not set in the .env file.');
    return;
  }
  const webhookClient = new WebhookClient({ url: webhookUrl });
  const embed = new EmbedBuilder()
    .setColor(0x1DA1F2)
    .setAuthor({ 
      name: `${tweetData.authorName} (${tweetData.authorHandle})`, 
      iconURL: tweetData.profilePicUrl, 
      url: tweetData.tweetUrl 
    })
    .setDescription(tweetData.tweetText)
    .setTimestamp(new Date(tweetData.tweetTimestamp))
    .setFooter({ text: 'Posted from X' });
  if (tweetData.tweetImageUrl) {
    embed.setImage(tweetData.tweetImageUrl);
  }
  console.log(`Sending tweet from @${tweetData.handle} to Discord...`);
  try {
    await webhookClient.send({
      username: 'Twitter Updates',
      avatarURL: tweetData.profilePicUrl,
      embeds: [embed],
    });
    console.log('✅ Successfully sent to Discord!');
  } catch (error) {
    console.error('❌ Error sending to Discord:', error);
    throw error;
  }
}

async function main() {
  const handle = process.argv[2];
  if (!handle) {
    console.error('❌ Error: No Twitter handle provided. Usage: node scraper.js <handle>');
    return;
  }
  console.log(`Starting scraper for handle: @${handle}`);
  const logFilePath = path.join(__dirname, 'log', `${handle}_last_tweet.txt`);
  const targetUrl = `https://x.com/${handle}`;

  let lastPostedUrl = '';
  try {
    lastPostedUrl = await fs.readFile(logFilePath, 'utf-8');
    console.log(`Found last posted URL for @${handle}: ${lastPostedUrl}`);
  } catch (error) {
    console.log(`Log file for @${handle} not found. This is the first run for this handle.`);
  }

  const authToken = process.env.AUTH_TOKEN;
  if (!authToken) {
    console.error('❌ Error: AUTH_TOKEN is not set in the .env file.');
    return;
  }

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  });
  const cookies = [{ name: 'auth_token', value: authToken, domain: '.x.com', path: '/', httpOnly: true, secure: true }];
  await context.addCookies(cookies);
  const page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    let connected = false;
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Navigating to ${targetUrl} (Attempt ${i + 1})...`);
        await page.goto(targetUrl, { timeout: 60000 });
        connected = true;
        break;
      } catch (error) {
        if (error.message.includes('net::ERR_CONNECTION_RESET') && i < 2) {
          console.warn('Connection reset, retrying in 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }
    if (!connected) {
      console.error("Failed to connect after multiple retries.");
      return;
    }
    
    await page.locator('main[role="main"]').waitFor();
    console.log('Scraping the latest tweet...');
    const latestTweet = page.locator('article[data-testid="tweet"]:not(:has-text("Pinned"))').first();
    
    const tweetUrl = `https://x.com${await latestTweet.locator('time').first().locator('..').getAttribute('href')}`;

    if (tweetUrl === lastPostedUrl) {
      console.log('No new tweet found. Exiting.');
      return;
    }

    const tweetData = {
        handle: handle,
        authorName: (await latestTweet.locator('[data-testid="User-Name"] span').first().textContent() || '').trim(),
        authorHandle: (await latestTweet.locator('[data-testid="User-Name"] span:has-text("@")').first().textContent() || '').trim(),
        tweetText: (await latestTweet.locator('[data-testid="tweetText"]').first().textContent() || '').trim(),
        tweetUrl: tweetUrl,
        tweetTimestamp: await latestTweet.locator('time').first().getAttribute('datetime'),
        tweetImageUrl: null,
        profilePicUrl: await page.locator(`a[href="/${handle}/photo"] img`).getAttribute('src'),
    };
    const imageElement = latestTweet.locator('[data-testid="tweetPhoto"] img');
    if (await imageElement.count() > 0) {
      tweetData.tweetImageUrl = await imageElement.first().getAttribute('src');
    }
    
    await sendToDiscord(tweetData);

    console.log(`Updating log file for @${handle} with new URL: ${tweetData.tweetUrl}`);
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });
    await fs.writeFile(logFilePath, tweetData.tweetUrl);

  } catch (error) {
    console.error(`❌ An error occurred for handle @${handle}:`, error);
    await page.screenshot({ path: `error_${handle}.png` });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

main();