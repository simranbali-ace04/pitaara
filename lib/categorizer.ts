export type ArtifactCategory = 'visuals' | 'videos' | 'reads' | 'code';

export function getArtifactCategory(artifact: {
  raw_url?: string | null;
  type?: string | null;
  raw_content?: string | null;
  media_url?: string | null;
}): ArtifactCategory {
  const url = (artifact.raw_url || '').toLowerCase();
  const type = (artifact.type || '').toLowerCase();
  const content = (artifact.raw_content || '').trim();

  // 1. VIDEOS (YouTube, Vimeo, Loom, Direct Video Files)
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('loom.com') ||
    url.match(/\.(mp4|webm|mov)(\?.*)?$/i)
  ) {
    return 'videos';
  }

  // 2. CODE (GitHub, Gists, CodePen, StackOverflow, Code Snippets)
  if (
    url.includes('github.com') ||
    url.includes('gist.github.com') ||
    url.includes('codepen.io') ||
    url.includes('stackoverflow.com') ||
    type === 'github_repo' ||
    type === 'code_snippet' ||
    content.startsWith('```') ||
    /(const|let|var|function|import|export|class|def|System\.out)\b/.test(content)
  ) {
    return 'code';
  }

  // 3. READS (Twitter/X, MDN, Dev.to, Medium, Substack, Reddit, AI Chats, Quotes)
  if (
    url.includes('x.com') ||
    url.includes('twitter.com') ||
    url.includes('developer.mozilla.org') ||
    url.includes('medium.com') ||
    url.includes('substack.com') ||
    url.includes('reddit.com') ||
    url.includes('dev.to') ||
    url.includes('gemini.google.com') ||
    url.includes('chatgpt.com') ||
    url.includes('claude.ai') ||
    type === 'quote'
  ) {
    return 'reads';
  }

  // 4. VISUALS (Pinterest, Instagram, Behance, Dribbble, Unsplash, Direct Image Uploads)
  if (
    url.includes('pinterest.com') ||
    url.includes('pin.it') ||
    url.includes('instagram.com') ||
    url.includes('behance.net') ||
    url.includes('dribbble.com') ||
    url.includes('unsplash.com') ||
    type === 'image' ||
    (Boolean(artifact.media_url) && !url)
  ) {
    return 'visuals';
  }

  // Fallback for general blog/article URLs
  return 'reads';
}

// Backwards-compatible alias
export const determineCategory = getArtifactCategory;
