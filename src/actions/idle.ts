/**
 * Idle action — simulate natural idle behavior.
 * Humans don't constantly interact — they read, think, get distracted,
 * switch apps, check their phone, etc.
 */
import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, randomInt, gaussianRandom } from '../humanizer';

/**
 * Simulate an idle period with subtle natural behavior.
 * Returns a description of the idle type.
 */
export async function humanIdle(page: Page, logger: Logger): Promise<string> {
    const idleType = pickIdleType();

    switch (idleType) {
        case 'reading':
            return await simulateReading(page, logger);
        case 'distracted':
            return await simulateDistraction(logger);
        case 'slow-scroll':
            return await simulateSlowScroll(page, logger);
        case 'mouse-drift':
            return await simulateMouseDrift(page, logger);
        default:
            return await simulateReading(page, logger);
    }
}

type IdleType = 'reading' | 'distracted' | 'slow-scroll' | 'mouse-drift';

function pickIdleType(): IdleType {
    const roll = Math.random();
    if (roll < 0.35) return 'reading';       // 35% — reading the page
    if (roll < 0.60) return 'distracted';    // 25% — looking away
    if (roll < 0.80) return 'slow-scroll';   // 20% — lazy scrolling
    return 'mouse-drift';                     // 20% — aimless mouse movement
}

/**
 * Simulate reading content — long pause with occasional small scrolls.
 */
async function simulateReading(page: Page, logger: Logger): Promise<string> {
    const readingTime = Math.round(gaussianRandom(6000, 2000));
    const duration = Math.max(3000, Math.min(12000, readingTime));

    logger.info('IDLE', `📖 Reading content (~${Math.round(duration / 1000)}s)`);

    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
        // Occasionally do a tiny scroll (like following text with eyes)
        if (Math.random() < 0.3) {
            const smallScroll = randomInt(30, 120);
            await page.mouse.wheel(0, smallScroll);
        }
        await humanDelay(1500, 3000);
    }

    return `Read content for ${Math.round(duration / 1000)}s`;
}

/**
 * Simulate being distracted — just a long pause with no interaction.
 * Like checking your phone, looking away, talking to someone.
 */
async function simulateDistraction(logger: Logger): Promise<string> {
    const distractedTime = randomInt(4000, 10000);

    logger.info('IDLE', `💭 Distracted (~${Math.round(distractedTime / 1000)}s)`);
    await humanDelay(distractedTime, distractedTime + 1000);

    return `Distracted for ${Math.round(distractedTime / 1000)}s`;
}

/**
 * Simulate lazy scrolling — slow, aimless scrolling up and down.
 */
async function simulateSlowScroll(page: Page, logger: Logger): Promise<string> {
    const scrollCount = randomInt(3, 6);

    logger.info('IDLE', `🐌 Slow-scrolling (${scrollCount} movements)`);

    for (let i = 0; i < scrollCount; i++) {
        // Mix of up and down, small amounts
        const direction = Math.random() < 0.7 ? 1 : -1; // Mostly down
        const distance = randomInt(50, 200) * direction;

        await page.mouse.wheel(0, distance);

        // Long pause between scrolls — this is lazy browsing
        await humanDelay(1500, 3500);
    }

    return `Slow-scrolled ${scrollCount} times`;
}

/**
 * Simulate aimless mouse movement — cursor drifting around the page.
 */
async function simulateMouseDrift(page: Page, logger: Logger): Promise<string> {
    const viewport = page.viewportSize();
    if (!viewport) return 'No viewport';

    const moves = randomInt(3, 7);
    logger.info('IDLE', `🖱️ Mouse drifting (${moves} movements)`);

    for (let i = 0; i < moves; i++) {
        const x = randomInt(50, viewport.width - 50);
        const y = randomInt(50, viewport.height - 50);

        // Move mouse slowly (higher step count = smoother/slower)
        await page.mouse.move(x, y, { steps: randomInt(15, 30) });

        // Pause between drifts
        await humanDelay(800, 2000);
    }

    return `Mouse drifted ${moves} times`;
}
