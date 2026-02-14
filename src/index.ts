import { loadConfig } from './config';
import { Logger } from './logger';
import { ProxyManager } from './proxy';
import { Explorer } from './explorer';

/**
 * Website Explorer — Entry Point
 *
 * Reads configuration from explorer.config.json (or CLI flags).
 * Run with: npm start
 */
async function main(): Promise<void> {
    // Load config from file + CLI overrides
    const config = loadConfig(process.argv.slice(2));
    const logger = new Logger(config.logLevel);

    logger.banner('WEBSITE EXPLORER v1.0.0');
    logger.info('CONFIG', `URL: ${config.url}`);
    logger.info('CONFIG', `Instances: ${config.instances}`);
    logger.info('CONFIG', `Pages: ${config.minPages}–${config.maxPages} per instance`);
    logger.info('CONFIG', `Duration: ${config.minDuration}–${config.maxDuration}s per instance`);
    logger.info('CONFIG', `Actions/page: ${config.minActionsPerPage}–${config.maxActionsPerPage}`);
    logger.info('CONFIG', `Browser: ${config.browserType}, Headless: ${config.headless}`);

    // Initialize proxy manager
    const proxyManager = new ProxyManager(logger);

    try {
        await proxyManager.initialize(config.proxiesFile);
    } catch (error) {
        logger.warn('PROXY', `Proxy setup: ${(error as Error).message}`);
        logger.info('PROXY', 'Continuing without proxies...');
    }

    if (proxyManager.hasProxies()) {
        logger.info('CONFIG', `Proxies: ${proxyManager.getCount()} working`);
    } else {
        logger.info('CONFIG', 'Proxies: none (direct connection)');
    }

    // Launch instances
    if (config.instances === 1) {
        // Single instance — run directly
        const explorer = new Explorer(config, logger, proxyManager, 1);
        await explorer.run();
    } else {
        // Multiple instances — run in parallel
        logger.banner(`LAUNCHING ${config.instances} INSTANCES`);

        const promises: Promise<void>[] = [];

        for (let i = 1; i <= config.instances; i++) {
            const instanceLogger = new Logger(config.logLevel);
            const explorer = new Explorer(config, instanceLogger, proxyManager, i);

            // Stagger launches slightly so proxies rotate cleanly
            const delay = (i - 1) * 2000;
            const promise = new Promise<void>((resolve) => {
                setTimeout(async () => {
                    try {
                        await explorer.run();
                    } catch (error) {
                        logger.error(`INSTANCE #${i}`, `Failed: ${(error as Error).message}`);
                    }
                    resolve();
                }, delay);
            });

            promises.push(promise);
        }

        await Promise.all(promises);
        logger.banner('ALL INSTANCES COMPLETE');
    }
}

main().catch((error) => {
    console.error('Fatal:', error);
    process.exit(1);
});
