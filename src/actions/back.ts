/**
 * Back action — simulate pressing the browser back button.
 * Real users frequently go back to previous pages.
 */
import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay } from '../humanizer';

/**
 * Go back to the previous page in history.
 * Returns the new URL if navigation succeeded, or null if there's no history
 * or if the previous page is not a valid http(s) URL (e.g. about:blank).
 */
export async function humanBack(page: Page, logger: Logger): Promise<string | null> {
    try {
        const currentUrl = page.url();

        // Don't go back if we're already on a non-http page
        if (!currentUrl.startsWith('http')) {
            logger.debug('BACK', 'Current page is not http — skipping back');
            return null;
        }

        // Check if we can go back (page must have meaningful history)
        const historyLength = await page.evaluate(() => window.history.length);
        if (historyLength <= 1) {
            logger.debug('BACK', 'No history to go back to');
            return null;
        }

        // Small pause before hitting back — humans hesitate
        await humanDelay(500, 1500);

        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });

        const afterUrl = page.url();

        // Guard: don't stay on about:blank or non-http pages — go forward again
        if (!afterUrl.startsWith('http')) {
            logger.debug('BACK', `Back led to ${afterUrl} — reverting with goForward`);
            await page.goForward({ waitUntil: 'domcontentloaded', timeout: 10000 });
            return null;
        }

        if (afterUrl !== currentUrl) {
            logger.info('BACK', `⬅️ Went back to: ${afterUrl}`);
            // Pause to "look at" the page we returned to
            await humanDelay(1000, 2500);
            return afterUrl;
        }

        return null;
    } catch (error) {
        logger.debug('BACK', `Back navigation failed: ${(error as Error).message}`);
        return null;
    }
}
