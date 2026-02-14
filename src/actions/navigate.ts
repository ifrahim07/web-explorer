import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, pickRandom, shuffle } from '../humanizer';

/**
 * Collect all internal links on the current page.
 * Filters to same-origin links and removes duplicates/anchors.
 */
export async function collectInternalLinks(page: Page): Promise<string[]> {
    // Guard: skip non-http pages (e.g. about:blank)
    const rawUrl = page.url();
    if (!rawUrl.startsWith('http')) return [];

    const currentUrl = new URL(rawUrl);

    const links = await page.evaluate((origin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
            .map((a) => {
                try {
                    const href = (a as HTMLAnchorElement).href;
                    const url = new URL(href);
                    // Only same-origin links
                    if (url.origin !== origin) return null;
                    // Keep path + query string, strip hash only
                    return `${url.origin}${url.pathname}${url.search}`;
                } catch {
                    return null;
                }
            })
            .filter((href): href is string => href !== null);
    }, currentUrl.origin);

    // Deduplicate
    return [...new Set(links)];
}

/**
 * Navigate to a random unvisited internal link on the page.
 * Returns the URL navigated to, or null if no unvisited links found.
 */
export async function navigateToRandomLink(
    page: Page,
    visitedUrls: Set<string>,
    logger: Logger
): Promise<string | null> {
    const allLinks = await collectInternalLinks(page);

    // Filter out already-visited URLs
    const unvisited = allLinks.filter((url) => !visitedUrls.has(url));

    if (unvisited.length === 0) {
        logger.warn('NAVIGATE', 'No unvisited internal links found');
        return null;
    }

    // Shuffle and pick a random one
    const shuffled = shuffle(unvisited);
    const target = shuffled[0];

    logger.info('NAVIGATE', `→ ${target} (${unvisited.length} unvisited links available)`);

    await humanDelay(500, 1500);

    try {
        await page.goto(target, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        // Wait a bit for page to settle
        await humanDelay(1000, 3000);
        return target;
    } catch (error) {
        logger.warn('NAVIGATE', `Failed to navigate to ${target}: ${(error as Error).message}`);
        return null;
    }
}
