import * as cheerio from 'cheerio';
import { Vibrant } from 'node-vibrant/node';
import type { ArtifactType } from '@/types/artifact';

export interface ExtractedMetadata {
  title: string;
  description: string;
  site_name: string;
  media_url?: string | null;
  favicon_url?: string | null;
  type: ArtifactType;
  metadata?: Record<string, unknown>;
}

function resolveUrl(baseUrl: string, relativeOrAbsolute?: string | null): string | null {
  if (!relativeOrAbsolute) return null;
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Non-blocking dominant color extraction with a 300ms timeout fallback.
 */
export async function extractDominantColor(imageSource: string | Buffer): Promise<string> {
  const fallbackColor = '#C6A664';

  const timeoutPromise = new Promise<string>((resolve) =>
    setTimeout(() => resolve(fallbackColor), 300)
  );

  const extractionPromise = (async () => {
    try {
      let buffer: Buffer;
      if (typeof imageSource === 'string') {
        if (imageSource.startsWith('data:')) {
          const base64Data = imageSource.split(';base64,').pop() || '';
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          const response = await fetch(imageSource, {
            signal: AbortSignal.timeout(1500),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
          });
          if (!response.ok) return fallbackColor;
          const arrayBuf = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        }
      } else {
        buffer = imageSource;
      }

      const palette = await Vibrant.from(buffer).getPalette();
      const dominant =
        palette.Vibrant?.hex ||
        palette.DarkVibrant?.hex ||
        palette.LightVibrant?.hex ||
        palette.Muted?.hex ||
        palette.DarkMuted?.hex ||
        fallbackColor;

      return dominant;
    } catch {
      return fallbackColor;
    }
  })();

  return Promise.race([extractionPromise, timeoutPromise]);
}

/**
 * Rapid metadata extraction with a strict 2-second timeout and anti-throttling headers.
 */
export async function extractMetadata(rawUrl: string): Promise<ExtractedMetadata> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();

  // 1. Check for GitHub Repository
  const githubMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/#?]+)(?:\/.*)?$/i);
  if (githubMatch) {
    const owner = githubMatch[1];
    const repo = githubMatch[2].replace(/\.git$/i, '');
    
    // Ignore reserved GitHub paths like settings, explore, notifications, etc.
    const nonRepoPaths = ['features', 'pricing', 'security', 'login', 'join', 'explore', 'topics', 'trending', 'collections', 'events', 'settings'];
    if (!nonRepoPaths.includes(owner.toLowerCase())) {
      try {
        const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          signal: AbortSignal.timeout(2000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PitaaraApp/1.0; +https://github.com)',
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (ghResponse.ok) {
          const ghData = await ghResponse.json();
          return {
            title: ghData.full_name || `${owner}/${repo}`,
            description: ghData.description || `GitHub repository by ${owner}`,
            site_name: 'GitHub',
            media_url: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
            favicon_url: 'https://github.githubassets.com/favicons/favicon.svg',
            type: 'github_repo',
            metadata: {
              stars: ghData.stargazers_count,
              forks: ghData.forks_count,
              language: ghData.language,
              open_issues: ghData.open_issues_count,
              owner,
              repo,
            },
          };
        }
      } catch (err) {
        console.warn('GitHub API fetch failed, falling back to page scraper:', err);
      }

      // Fallback for GitHub repo if API fails
      return {
        title: `${owner}/${repo}`,
        description: `GitHub repository by ${owner}`,
        site_name: 'GitHub',
        media_url: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
        favicon_url: 'https://github.githubassets.com/favicons/favicon.svg',
        type: 'github_repo',
        metadata: { owner, repo },
      };
    }
  }

  // 2. Check for Tweet / X Post
  const isTwitter = hostname.includes('twitter.com') || hostname.includes('x.com');
  const isTweet = isTwitter && /\/status\/\d+/i.test(parsedUrl.pathname);

  // 3. Direct Image URL check
  const isDirectImage = /\.(png|jpe?g|webp|gif|svg|avif)($|\?)/i.test(parsedUrl.pathname);
  if (isDirectImage) {
    return {
      title: parsedUrl.pathname.split('/').pop() || 'Image',
      description: `Image from ${hostname}`,
      site_name: hostname,
      media_url: url,
      favicon_url: `${parsedUrl.origin}/favicon.ico`,
      type: 'image',
    };
  }

  // 4. Standard Web Scraping with Cheerio (2-second timeout, anti-throttling browser headers)
  let title = '';
  let description = '';
  let site_name = hostname;
  let media_url: string | null = null;
  let favicon_url: string | null = `${parsedUrl.origin}/favicon.ico`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract title
      title =
        $('meta[property="og:title"]').attr('content')?.trim() ||
        $('meta[name="twitter:title"]').attr('content')?.trim() ||
        $('title').first().text().trim() ||
        $('h1').first().text().trim() ||
        parsedUrl.hostname;

      // Extract description
      description =
        $('meta[property="og:description"]').attr('content')?.trim() ||
        $('meta[name="twitter:description"]').attr('content')?.trim() ||
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[name="Description"]').attr('content')?.trim() ||
        '';

      // Extract site name
      site_name =
        $('meta[property="og:site_name"]').attr('content')?.trim() ||
        $('meta[name="twitter:site"]').attr('content')?.trim() ||
        hostname;

      // Extract image
      const rawImage =
        $('meta[property="og:image"]').attr('content')?.trim() ||
        $('meta[property="og:image:url"]').attr('content')?.trim() ||
        $('meta[name="twitter:image"]').attr('content')?.trim() ||
        $('meta[name="twitter:image:src"]').attr('content')?.trim() ||
        $('link[rel="image_src"]').attr('href')?.trim();

      if (rawImage) {
        media_url = resolveUrl(url, rawImage);
      }

      // Extract favicon
      const rawFavicon =
        $('link[rel~="icon"]').attr('href')?.trim() ||
        $('link[rel~="shortcut"]').attr('href')?.trim() ||
        $('link[rel~="apple-touch-icon"]').attr('href')?.trim();

      if (rawFavicon) {
        favicon_url = resolveUrl(url, rawFavicon);
      }
    }
  } catch (err) {
    console.warn(`Extraction timeout/error for ${url}:`, err);
    title = parsedUrl.hostname;
    description = `Link from ${parsedUrl.hostname}`;
  }

  // Fallback defaults
  if (!title) title = parsedUrl.hostname;
  if (!favicon_url) favicon_url = `${parsedUrl.origin}/favicon.ico`;

  const finalType: ArtifactType = isTweet ? 'tweet' : 'url';

  return {
    title,
    description,
    site_name,
    media_url,
    favicon_url,
    type: finalType,
  };
}
