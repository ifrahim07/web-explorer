/**
 * Zoom action — simulate zooming in/out on the page.
 * Desktop: Ctrl+scroll or Ctrl+Plus/Minus
 * Mobile: pinch-to-zoom (via viewport scale)
 */
import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, randomInt } from '../humanizer';

/**
 * Perform a zoom interaction.
 * Returns a description of what was done, or null if it failed.
 */
export async function humanZoom(page: Page, logger: Logger): Promise<string | null> {
    try {
        // Detect if we're on mobile
        const isMobile = await page.evaluate(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);

        if (isMobile) {
            return await mobileZoom(page, logger);
        } else {
            return await desktopZoom(page, logger);
        }
    } catch (error) {
        logger.debug('ZOOM', `Zoom failed: ${(error as Error).message}`);
        return null;
    }
}

/**
 * Desktop zoom using keyboard shortcuts (Ctrl+Plus / Ctrl+Minus / Ctrl+0).
 */
async function desktopZoom(page: Page, logger: Logger): Promise<string | null> {
    const zoomAction = pickZoomAction();

    switch (zoomAction) {
        case 'in': {
            // Zoom in 1-3 steps
            const steps = randomInt(1, 3);
            for (let i = 0; i < steps; i++) {
                await page.keyboard.down('Control');
                await page.keyboard.press('Equal'); // Ctrl+= (zoom in)
                await page.keyboard.up('Control');
                await humanDelay(300, 600);
            }
            logger.info('ZOOM', `🔍 Zoomed in ${steps} step(s)`);

            // Look at the zoomed content
            await humanDelay(2000, 4000);

            // Reset zoom
            await page.keyboard.down('Control');
            await page.keyboard.press('Digit0'); // Ctrl+0 (reset)
            await page.keyboard.up('Control');
            await humanDelay(300, 600);

            logger.info('ZOOM', '🔍 Reset zoom to default');
            return `Zoomed in ${steps} steps, then reset`;
        }

        case 'out': {
            // Zoom out 1-2 steps
            const steps = randomInt(1, 2);
            for (let i = 0; i < steps; i++) {
                await page.keyboard.down('Control');
                await page.keyboard.press('Minus'); // Ctrl+- (zoom out)
                await page.keyboard.up('Control');
                await humanDelay(300, 600);
            }
            logger.info('ZOOM', `🔍 Zoomed out ${steps} step(s)`);

            // Look at the zoomed-out content
            await humanDelay(1500, 3000);

            // Reset zoom
            await page.keyboard.down('Control');
            await page.keyboard.press('Digit0');
            await page.keyboard.up('Control');
            await humanDelay(300, 600);

            logger.info('ZOOM', '🔍 Reset zoom to default');
            return `Zoomed out ${steps} steps, then reset`;
        }

        case 'image': {
            // Try to zoom into an image by clicking it
            return await zoomImage(page, logger);
        }

        default:
            return null;
    }
}

/**
 * Mobile zoom using touch gestures (pinch-to-zoom simulation via JS).
 */
async function mobileZoom(page: Page, logger: Logger): Promise<string | null> {
    try {
        // Simulate zoom by changing the viewport meta tag
        const zoomed = await page.evaluate(() => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                const originalContent = viewport.getAttribute('content') || '';
                // Temporarily allow zoom
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.5, user-scalable=yes');

                // Restore after a moment
                setTimeout(() => {
                    viewport.setAttribute('content', originalContent);
                }, 4000);

                return true;
            }
            return false;
        });

        if (zoomed) {
            logger.info('ZOOM', '🔍 Mobile zoom in (pinch simulation)');
            await humanDelay(2000, 4000);
            logger.info('ZOOM', '🔍 Mobile zoom reset');
            return 'Mobile pinch zoom, then reset';
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Try to click on an image to view it larger (lightbox/modal).
 */
async function zoomImage(page: Page, logger: Logger): Promise<string | null> {
    try {
        // Find clickable images (not tiny icons)
        const images = page.locator('img[src]:not([width="1"]):not([height="1"])');
        const count = await images.count();

        if (count === 0) return null;

        // Filter to reasonably sized images
        const candidates: number[] = [];
        for (let i = 0; i < Math.min(count, 20); i++) {
            const box = await images.nth(i).boundingBox();
            if (box && box.width > 100 && box.height > 100) {
                candidates.push(i);
            }
        }

        if (candidates.length === 0) return null;

        const pick = candidates[randomInt(0, candidates.length - 1)];
        const img = images.nth(pick);

        await humanDelay(300, 800);
        await img.click({ timeout: 2000 });
        logger.info('ZOOM', '🖼️ Clicked image to enlarge');

        // Look at the enlarged image
        await humanDelay(2000, 4000);

        // Try to close any modal/lightbox
        try {
            await page.keyboard.press('Escape');
            await humanDelay(300, 600);
        } catch { /* no modal to close */ }

        return 'Clicked image to enlarge';
    } catch {
        return null;
    }
}

type ZoomAction = 'in' | 'out' | 'image';

function pickZoomAction(): ZoomAction {
    const roll = Math.random();
    if (roll < 0.45) return 'in';      // 45% — zoom in
    if (roll < 0.70) return 'out';     // 25% — zoom out
    return 'image';                     // 30% — click image
}
