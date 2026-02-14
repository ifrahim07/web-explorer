import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, pickRandom, randomInt } from '../humanizer';

/** Elements that are interesting to hover over */
const HOVERABLE_SELECTORS = [
    'img',
    'a',
    'button',
    '[role="button"]',
    '.card',
    'article',
    'nav a',
    'h2',
    'h3',
];

/**
 * Hover over random visible elements on the page, simulating curiosity.
 */
export async function humanHover(page: Page, logger: Logger): Promise<number> {
    const hoverCount = randomInt(1, 4);
    let actualHovers = 0;

    for (let i = 0; i < hoverCount; i++) {
        const selector = pickRandom(HOVERABLE_SELECTORS);
        if (!selector) continue;

        try {
            const elements = page.locator(selector);
            const count = await elements.count();
            if (count === 0) continue;

            const index = randomInt(0, Math.min(count - 1, 10));
            const element = elements.nth(index);

            const isVisible = await element.isVisible({ timeout: 1000 });
            if (!isVisible) continue;

            const box = await element.boundingBox();
            if (!box || box.width < 5 || box.height < 5) continue;

            await element.hover({ timeout: 2000 });
            actualHovers++;

            const text = ((await element.textContent()) || '').trim().substring(0, 40);
            logger.debug('HOVER', `Hovering on ${selector}: "${text}"`);

            // Dwell on element as if reading/looking
            await humanDelay(500, 2000);
        } catch {
            // Element may have gone stale
            continue;
        }
    }

    if (actualHovers > 0) {
        logger.info('HOVER', `Hovered over ${actualHovers} elements`);
    }

    return actualHovers;
}
