/**
 * Explorer — lean orchestration class.
 * Delegates exploration logic to loop.ts and recovery to recovery.ts.
 *
 * Structure:
 *   index.ts     → This file: session lifecycle, constructor, run()
 *   loop.ts      → Exploration loop, per-page action selection, cookie handling
 *   recovery.ts  → Proxy-failure recovery
 */
import { ExplorerConfig } from '../config';
import { launchBrowser, closeBrowser, BrowserSession } from '../browser';
import { ProxyManager, ProxyEntry } from '../proxy';
import { Logger } from '../logger';
import { Reporter } from '../reporter';
import { humanDelay, randomInt } from '../humanizer';
import { explorationLoop, LoopContext } from './loop';
import { recoverWithNewProxy } from './recovery';

export class Explorer {
    private config: ExplorerConfig;
    private logger: Logger;
    private proxyManager: ProxyManager;
    private reporter: Reporter;
    private visitedUrls: Set<string> = new Set();
    private startTime: number = 0;
    private session: BrowserSession | null = null;
    private currentProxy: ProxyEntry | undefined;
    private instanceId: number;

    /** Resolved targets for this instance (randomized within min/max ranges) */
    private targetPages: number;
    private targetDuration: number;

    constructor(config: ExplorerConfig, logger: Logger, proxyManager: ProxyManager, instanceId = 1) {
        this.config = config;
        this.logger = logger;
        this.proxyManager = proxyManager;
        this.reporter = new Reporter(logger);
        this.instanceId = instanceId;

        // Randomize targets within min/max ranges for this instance
        this.targetPages = randomInt(config.minPages, config.maxPages);
        this.targetDuration = randomInt(config.minDuration, config.maxDuration);
    }

    /**
     * Run the full exploration session.
     */
    async run(): Promise<void> {
        this.startTime = Date.now();
        this.logger.banner(`INSTANCE #${this.instanceId} — ${this.config.url}`);
        this.logger.info('EXPLORER', `Target: ${this.targetPages} pages in ~${this.targetDuration}s`);
        this.logger.info('EXPLORER', `Actions per page: ${this.config.minActionsPerPage}–${this.config.maxActionsPerPage}`);

        try {
            // Get a proxy
            this.currentProxy = this.proxyManager.getNext();
            if (this.currentProxy) {
                this.reporter.setProxy(this.currentProxy.server);
            }

            // Launch browser
            this.session = await launchBrowser(this.config, this.logger, this.currentProxy);

            // Navigate to the initial URL
            this.logger.info('EXPLORER', `Navigating to: ${this.config.url}`);
            await this.session.page.goto(this.config.url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });

            this.visitedUrls.add(this.config.url);
            this.reporter.recordPageVisit(this.config.url);
            this.reporter.recordAction('NAVIGATE', `Initial: ${this.config.url}`, this.config.url);

            // Wait for page to fully load
            await humanDelay(2000, 4000);

            // Run the exploration loop
            const loopCtx: LoopContext = {
                config: this.config,
                page: this.session.page,
                logger: this.logger,
                reporter: this.reporter,
                visitedUrls: this.visitedUrls,
                targetPages: this.targetPages,
                targetDuration: this.targetDuration,
                startTime: this.startTime,
                instanceId: this.instanceId,
            };

            await explorationLoop(loopCtx);

        } catch (error) {
            this.logger.error('EXPLORER', `Fatal error: ${(error as Error).message}`);

            // Try to recover with a different proxy
            if (this.currentProxy && this.proxyManager.getCount() > 1) {
                this.logger.info('EXPLORER', 'Attempting recovery with a different proxy...');
                this.proxyManager.markDead(this.currentProxy);
                await this.cleanup();

                const recoveredSession = await recoverWithNewProxy({
                    config: this.config,
                    logger: this.logger,
                    proxyManager: this.proxyManager,
                    reporter: this.reporter,
                    visitedUrls: this.visitedUrls,
                    targetPages: this.targetPages,
                    targetDuration: this.targetDuration,
                    startTime: this.startTime,
                    instanceId: this.instanceId,
                });

                if (recoveredSession) {
                    this.session = recoveredSession;
                }
            }
        } finally {
            await this.cleanup();
            this.reporter.generateReport();
        }
    }

    /** Clean up browser resources */
    private async cleanup(): Promise<void> {
        if (this.session) {
            await closeBrowser(this.session, this.logger);
            this.session = null;
        }
    }
}
