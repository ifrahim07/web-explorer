/**
 * Exploration loop — extracted from Explorer for modularity.
 * Handles per-page action selection, cookie handling, and navigation.
 */
import { Page } from 'playwright';
import { ExplorerConfig } from '../config';
import {
    humanScroll, humanClick, humanHover, humanType,
    navigateToRandomLink, handleCookieConsent,
    humanBack, humanMedia, humanZoom, humanIdle,
} from '../actions';
import { Logger } from '../logger';
import { Reporter } from '../reporter';
import { thinkingPause, randomInt } from '../humanizer';

export interface LoopContext {
    config: ExplorerConfig;
    page: Page;
    logger: Logger;
    reporter: Reporter;
    visitedUrls: Set<string>;
    targetPages: number;
    targetDuration: number;
    startTime: number;
    instanceId: number;
}

/**
 * Check if the duration limit has been exceeded.
 */
export function isTimedOut(ctx: LoopContext): boolean {
    return (Date.now() - ctx.startTime) / 1000 >= ctx.targetDuration;
}

/**
 * Main exploration loop — visit pages, handle cookies, perform actions, navigate.
 */
export async function explorationLoop(ctx: LoopContext): Promise<void> {
    const { config, page, logger, reporter, visitedUrls } = ctx;

    while (visitedUrls.size < ctx.targetPages && !isTimedOut(ctx)) {
        const currentUrl = page.url();

        // Guard: if we're on a non-http page (e.g. about:blank), navigate back to target
        if (!currentUrl.startsWith('http')) {
            logger.warn('EXPLORER', `On non-http page (${currentUrl}) — navigating back to target`);
            try {
                await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch {
                logger.error('EXPLORER', 'Failed to recover to target URL — ending exploration');
                break;
            }
            continue;
        }

        logger.info('EXPLORER', `━━━ Page ${visitedUrls.size}/${ctx.targetPages}: ${currentUrl} ━━━`);

        // ── FIRST ACTION: Handle cookie consent popup ──
        const cookieHandled = await handleCookieConsent(page, logger);
        if (cookieHandled) {
            reporter.recordAction('COOKIE', 'Accepted cookie consent', currentUrl);
        }

        // ── Decide how many actions to perform on this page ──
        const actionsTarget = randomInt(config.minActionsPerPage, config.maxActionsPerPage);
        let actionsPerformed = 0;

        logger.debug('EXPLORER', `Will perform ${actionsTarget} actions on this page`);

        // ── Action loop ──
        while (actionsPerformed < actionsTarget && !isTimedOut(ctx)) {
            const navigatedAway = await performRandomAction(ctx, currentUrl);
            actionsPerformed++;

            if (navigatedAway) break;
        }

        // ── If we didn't navigate via click/type/back, navigate via link ──
        if (page.url() === currentUrl && visitedUrls.size < ctx.targetPages) {
            const nextUrl = await navigateToRandomLink(page, visitedUrls, logger);

            if (nextUrl) {
                visitedUrls.add(nextUrl);
                reporter.recordPageVisit(nextUrl);
                reporter.recordAction('NAVIGATE', nextUrl, nextUrl);
            } else {
                logger.info('EXPLORER', 'No more unvisited links — exploration complete');
                break;
            }
        }

        // Think before moving to next page
        await thinkingPause();
    }

    // Log completion reason
    if (isTimedOut(ctx)) {
        logger.info('EXPLORER', `Duration limit reached (~${ctx.targetDuration}s)`);
    }

    logger.info('EXPLORER', `Instance #${ctx.instanceId} complete! Visited ${visitedUrls.size} pages`);
}

/**
 * Perform a single random action. Returns true if navigation occurred.
 *
 * Action probabilities (total = 100%):
 *   Scroll:  25%    Hover:  12%    Type:   8%
 *   Click:   18%    Back:   8%     Media:  7%
 *   Zoom:    7%     Idle:   15%
 */
async function performRandomAction(ctx: LoopContext, currentUrl: string): Promise<boolean> {
    const { page, logger, reporter } = ctx;
    const roll = Math.random();

    // ── 25% — Scroll ──
    if (roll < 0.25) {
        const scrolled = await humanScroll(page, logger);
        reporter.recordAction('SCROLL', `${scrolled}px`, currentUrl);
        return false;
    }

    // ── 12% — Hover ──
    if (roll < 0.37) {
        const hovered = await humanHover(page, logger);
        if (hovered > 0) {
            reporter.recordAction('HOVER', `${hovered} elements`, currentUrl);
        }
        return false;
    }

    // ── 8% — Type ──
    if (roll < 0.45) {
        const typed = await humanType(page, logger);
        if (typed) {
            reporter.recordAction('TYPE', 'Search query', currentUrl);
            if (page.url() !== currentUrl) {
                ctx.visitedUrls.add(page.url());
                reporter.recordPageVisit(page.url());
                return true;
            }
        }
        return false;
    }

    // ── 18% — Click ──
    if (roll < 0.63) {
        const clicked = await humanClick(page, logger);
        if (clicked) {
            reporter.recordAction('CLICK', clicked, currentUrl);
            if (page.url() !== currentUrl) {
                ctx.visitedUrls.add(page.url());
                reporter.recordPageVisit(page.url());
                return true;
            }
        }
        return false;
    }

    // ── 8% — Back ──
    if (roll < 0.71) {
        const backUrl = await humanBack(page, logger);
        if (backUrl) {
            reporter.recordAction('BACK', backUrl, currentUrl);
            // Back navigates, but we've already visited that page
            return true;
        }
        return false;
    }

    // ── 7% — Media ──
    if (roll < 0.78) {
        const mediaResult = await humanMedia(page, logger);
        if (mediaResult) {
            reporter.recordAction('MEDIA', mediaResult, currentUrl);
        }
        return false;
    }

    // ── 7% — Zoom ──
    if (roll < 0.85) {
        const zoomResult = await humanZoom(page, logger);
        if (zoomResult) {
            reporter.recordAction('ZOOM', zoomResult, currentUrl);
        }
        return false;
    }

    // ── 15% — Idle ──
    const idleResult = await humanIdle(page, logger);
    reporter.recordAction('IDLE', idleResult, currentUrl);
    return false;
}
