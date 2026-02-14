/**
 * Proxy failure recovery — extracted from Explorer for modularity.
 */
import { ExplorerConfig } from '../config';
import { launchBrowser, closeBrowser, BrowserSession } from '../browser';
import { ProxyManager, ProxyEntry } from '../proxy';
import { Logger } from '../logger';
import { Reporter } from '../reporter';
import { humanDelay } from '../humanizer';
import { explorationLoop, LoopContext } from './loop';

export interface RecoveryContext {
    config: ExplorerConfig;
    logger: Logger;
    proxyManager: ProxyManager;
    reporter: Reporter;
    visitedUrls: Set<string>;
    targetPages: number;
    targetDuration: number;
    startTime: number;
    instanceId: number;
}

/**
 * Attempt recovery by launching a new browser with a different proxy.
 * Returns the new session if successful, or null if all proxies exhausted.
 */
export async function recoverWithNewProxy(ctx: RecoveryContext): Promise<BrowserSession | null> {
    const { config, logger, proxyManager, reporter } = ctx;

    const newProxy = proxyManager.getNext();
    if (!newProxy) {
        logger.error('EXPLORER', 'No more proxies available for recovery');
        return null;
    }

    logger.info('EXPLORER', `Retrying with proxy: ${newProxy.server}`);
    reporter.setProxy(newProxy.server);

    try {
        const session = await launchBrowser(config, logger, newProxy);
        await session.page.goto(config.url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        await humanDelay(2000, 4000);

        // Resume exploration loop with the new session
        const loopCtx: LoopContext = {
            config,
            page: session.page,
            logger,
            reporter,
            visitedUrls: ctx.visitedUrls,
            targetPages: ctx.targetPages,
            targetDuration: ctx.targetDuration,
            startTime: ctx.startTime,
            instanceId: ctx.instanceId,
        };

        await explorationLoop(loopCtx);
        return session;
    } catch (error) {
        logger.error('EXPLORER', `Recovery failed: ${(error as Error).message}`);
        return null;
    }
}
