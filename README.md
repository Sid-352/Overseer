# Overseer

![Scheduled Tweet Fetch](https://github.com/Sid-352/Overseer/actions/workflows/scheduled_check.yml/badge.svg)
![Manual Tweet Fetch](https://github.com/Sid-352/Overseer/actions/workflows/manual_fetch.yml/badge.svg)

An upgrade of the original tweet scraper, now fully functional and packed with a variety of modern features. Overseer monitors X/Twitter profiles for new tweets and sends them as formatted notifications to a Discord webhook.

## Features

- Uses Playwright to scrape content from X.com.
- Automatically ignores pinned tweets to fetch only the true latest tweet.
- Remembers the last tweet posted for each handle to prevent spamming Discord channels.
- Contains two GitHub Actions workflows for both scheduled and manual operation.
- Posts formatted embeds with the user's name, profile picture, tweet content, attached content alongside the tweet's url and post date.

## Setup & Configuration


### 1. Initial Setup
First, clone the repository to your local machine (or into another Github repo) and install the necessary dependencies.

```bash
# Clone the repository
git clone https://github.com/Sid-352/Overseer.git

# Navigate into the project directory
cd Overseer

# Install dependencies
npm install
```

### 2. Environment Variables & Secrets
Overseer requires two secret keys to function. These should **never** be committed to the repository.

**A. Create the `.env` File (for local testing)**

Create a file named `.env` in the root of your project folder. Copy the following format:

```
# Secret token from your browser's cookies
AUTH_TOKEN=auth_token_here

# Your Discord channel's webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```


**B. Get Your `AUTH_TOKEN`**

This token allows the scraper to access X.com as a logged-in user.

1.  In a web browser, log in to `https://x.com`.
2.  Press `F12` to open Developer Tools.
3.  Go to the **Application** tab (Chromium) or **Storage** tab (Firefox).
4.  On the left, find **Cookies** > `https://x.com`.
5.  In the filter box, type `auth_token`.
6.  Copy the entire long string from the **"Cookie Value"** field and paste it into your `.env` file.


**C. Get Your `DISCORD_WEBHOOK_URL`**

1. In Discord, go to the settings of the channel you want to post in (`Edit Channel` > `Integrations`).
2. Click on "Webhooks" and create a "New Webhook".
3. Copy the new Webhook URL. Paste this into your `.env` file.


**D. Add Secrets to GitHub**

For the GitHub Actions to work, you must add these two secrets to your repository's settings:

1. In your GitHub repo, go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Create a secret named `AUTH_TOKEN` and paste your token value.
4. Create another secret named `DISCORD_WEBHOOK_URL` and paste your webhook URL.

## Usage

Overseer operates via two GitHub Actions workflows, which can be found in the **"Actions"** tab of your repository.

### Scheduled Tweet Fetch
- **What it does**: Automatically checks for a new tweet from a pre-defined handle.
- **How it runs**: Runs on a schedule (every 12 hours). Can also be triggered manually from the **Actions** tab.
- **To configure**: To change the handle it checks, edit the `run` command in the `.github/workflows/scheduled_check.yml` file.

### Manual Tweet Fetch
- **What it does**: Allows you to fetch the latest tweet from any handle on demand.
- **How to use**:
  1. Go to the **Actions** tab in your repository.
  2. Click on **"Manual Tweet Fetch"** in the sidebar.
  3. Click the **"Run workflow"** dropdown button.
  4. Enter the Twitter handle you want to check (without the `@`) into the text box.
  5. Click the "Run workflow" button.
