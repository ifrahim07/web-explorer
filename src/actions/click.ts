import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, microPause, pickRandom } from '../humanizer';

/** Selectors for clickable elements, ordered by priority */
const CLICKABLE_SELECTORS = [
    'a[href]:not([href="#"]):not([href="javascript:void(0)"])',
    'button:not([disabled])',
    '[role="button"]',
    '[onclick]',
];

/**
 * Click a random visible, clickable element on the page.
 * Returns the text/href of the clicked element or null if nothing was clicked.
 */
export async function humanClick(page: Page, logger: Logger): Promise<string | null> {
    try {
        // Gather all clickable elements
        const candidates: { selector: string; index: number; text: string }[] = [];

        for (const selector of CLICKABLE_SELECTORS) {
            const elements = page.locator(selector);
            const count = await elements.count();

            for (let i = 0; i < count; i++) {
                try {
                    const el = elements.nth(i);
                    const isVisible = await el.isVisible({ timeout: 1000 });
                    if (!isVisible) continue;

                    // Skip tiny/hidden elements (honeypots)
                    const box = await el.boundingBox();
                    if (!box || box.width < 5 || box.height < 5) continue;

                    const text = (await el.textContent()) || '';
                    candidates.push({ selector, index: i, text: text.trim().substring(0, 50) });
                } catch {
                    // Element might have become stale
                    continue;
                }
            }
        }

        if (candidates.length === 0) {
            logger.debug('CLICK', 'No clickable elements found');
            return null;
        }

        // Pick a random candidate
        const target = pickRandom(candidates);
        if (!target) return null;

        const element = page.locator(target.selector).nth(target.index);

        // Small pause before clicking (human decision time)
        await microPause();

        // Scroll element into view first
        await element.scrollIntoViewIfNeeded({ timeout: 3000 });
        await microPause();

        // Click with a slight position offset for realism
        await element.click({
            delay: 50 + Math.random() * 100,
            position: {
                x: Math.random() * 5 + 2,
                y: Math.random() * 5 + 2,
            },
        });

        logger.info('CLICK', `Clicked: "${target.text || target.selector}"`);
        await humanDelay(1000, 3000);
        return target.text || target.selector;
    } catch (error) {
        logger.debug('CLICK', `Click failed: ${(error as Error).message}`);
        return null;
    }
}
