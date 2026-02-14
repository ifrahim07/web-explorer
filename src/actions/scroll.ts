import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, randomInt, randomFloat } from '../humanizer';

/**
 * Perform human-like scrolling on a page.
 * Scrolls down in variable increments, pauses, occasionally scrolls up.
 */
export async function humanScroll(page: Page, logger: Logger): Promise<number> {
    const scrollSteps = randomInt(3, 8);
    let totalScrolled = 0;

    for (let i = 0; i < scrollSteps; i++) {
        const direction = Math.random() > 0.15 ? 1 : -1; // 85% down, 15% up
        const amount = randomInt(100, 500) * direction;

        await page.mouse.wheel(0, amount);
        totalScrolled += amount;

        const url = new URL(page.url()).pathname;
        logger.debug('SCROLL', `${direction > 0 ? '↓' : '↑'} ${Math.abs(amount)}px on ${url}`);

        // Random pause between scrolls (human reading speed)
        await humanDelay(500, 2500);

        // Occasionally pause longer as if reading something interesting
        if (Math.random() < 0.2) {
            logger.debug('SCROLL', 'Pausing to read...');
            await humanDelay(2000, 5000);
        }
    }

    logger.info('SCROLL', `Scrolled ${scrollSteps} times (net: ${totalScrolled}px)`);
    return totalScrolled;
}

/**
 * Scroll to a specific element smoothly.
 */
export async function scrollToElement(page: Page, selector: string, logger: Logger): Promise<boolean> {
    try {
        const element = page.locator(selector).first();
        await element.scrollIntoViewIfNeeded({ timeout: 3000 });
        logger.debug('SCROLL', `Scrolled to element: ${selector}`);
        await humanDelay(300, 800);
        return true;
    } catch {
        return false;
    }
}
