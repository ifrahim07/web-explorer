import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, humanTypingDelay, pickRandom, randomInt } from '../humanizer';

/** Common search terms to type when a search box is found */
const SEARCH_TERMS = [
    'about', 'contact', 'products', 'services', 'pricing',
    'blog', 'news', 'help', 'faq', 'support',
];

/** Selectors for search/input fields */
const INPUT_SELECTORS = [
    'input[type="search"]',
    'input[type="text"][name*="search"]',
    'input[type="text"][placeholder*="search" i]',
    'input[type="text"][name*="query"]',
    'input[type="text"][name*="q"]',
];

/**
 * Find a search box and type in it with human-like behavior.
 * Occasionally makes typos and corrects them.
 */
export async function humanType(page: Page, logger: Logger): Promise<boolean> {
    // Try to find a search input
    let targetInput = null;

    for (const selector of INPUT_SELECTORS) {
        try {
            const el = page.locator(selector).first();
            const visible = await el.isVisible({ timeout: 1000 });
            if (visible) {
                targetInput = el;
                break;
            }
        } catch {
            continue;
        }
    }

    if (!targetInput) {
        logger.debug('TYPE', 'No search input found');
        return false;
    }

    const searchTerm = pickRandom(SEARCH_TERMS) || 'about';

    // Click on the input first
    await targetInput.click();
    await humanDelay(300, 600);

    logger.info('TYPE', `Typing: "${searchTerm}"`);

    // Type character by character with human-like delays
    for (let i = 0; i < searchTerm.length; i++) {
        const char = searchTerm[i];

        // Occasionally make a typo (10% chance)
        if (Math.random() < 0.1 && i > 0) {
            const typoChar = String.fromCharCode(char.charCodeAt(0) + randomInt(-2, 2));
            await page.keyboard.type(typoChar, { delay: humanTypingDelay() });
            await humanDelay(200, 500);

            // Correct the typo
            await page.keyboard.press('Backspace');
            await humanDelay(100, 300);
            logger.debug('TYPE', 'Made and corrected typo');
        }

        await page.keyboard.type(char, { delay: humanTypingDelay() });
    }

    // Pause after typing as if reviewing
    await humanDelay(800, 2000);

    // 50% chance to submit
    if (Math.random() > 0.5) {
        await page.keyboard.press('Enter');
        logger.info('TYPE', 'Submitted search');
        await humanDelay(2000, 4000);
    }

    return true;
}
