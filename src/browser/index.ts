/**
 * Browser module — lean launcher that delegates to sub-modules.
 *
 * Structure:
 *   user-agents.ts  → UA string pool (add/remove UAs here)
 *   devices.ts      → Mobile, tablet, desktop viewport pools
 *   locales.ts      → Locale profiles with weighted selection
 *   identity.ts     → Combines UA + device + locale into one identity
 *   stealth.ts      → Anti-detection init scripts
 *   index.ts        → This file: launcher + session management
 */
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import { ProxyEntry } from '../proxy';
import { ExplorerConfig } from '../config';
import { Logger } from '../logger';
import { SelectedIdentity, pickRandomIdentity } from './identity';
import { applyStealthScripts } from './stealth';

// Re-export types used by other modules
export { SelectedIdentity } from './identity';
export { LocaleProfile } from './locales';

const BROWSER_LAUNCHERS = {
    chromium,
    firefox,
    webkit,
};

export interface BrowserSession {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    identity: SelectedIdentity;
}

/**
 * Launch a browser with stealth settings, randomized identity, and optional proxy.
 */
export async function launchBrowser(
    config: ExplorerConfig,
    logger: Logger,
    proxy?: ProxyEntry
): Promise<BrowserSession> {
    const launcher = BROWSER_LAUNCHERS[config.browserType];
    const identity = pickRandomIdentity();

    // Log identity details
    logger.info('BROWSER', `Launching ${config.browserType} (headless: ${config.headless})`);
    logger.info('IDENTITY', `🎭 Device: ${identity.deviceName} [${identity.category}]`);
    logger.info('IDENTITY', `📐 Viewport: ${identity.viewport.width}×${identity.viewport.height} (scale: ${identity.deviceScaleFactor}x, touch: ${identity.hasTouch})`);
    logger.info('IDENTITY', `🌐 User-Agent: ${identity.userAgent.substring(0, 80)}...`);
    logger.info('IDENTITY', `🗣️ Locale: ${identity.locale.label} (${identity.locale.locale}, tz: ${identity.locale.timezoneId})`);
    if (proxy) {
        logger.info('BROWSER', `🔒 Proxy: ${proxy.server}`);
    }

    // Build launch options
    const launchOptions: Record<string, unknown> = {
        headless: config.headless,
    };

    if (proxy) {
        const proxyConfig: { server: string; username?: string; password?: string } = {
            server: proxy.server,
        };
        if (proxy.username) proxyConfig.username = proxy.username;
        if (proxy.password) proxyConfig.password = proxy.password;
        launchOptions.proxy = proxyConfig;
    }

    const browser = await launcher.launch(launchOptions);

    // Create context with device identity
    const context = await browser.newContext({
        userAgent: identity.userAgent,
        viewport: identity.viewport,
        isMobile: identity.isMobile,
        hasTouch: identity.hasTouch,
        deviceScaleFactor: identity.deviceScaleFactor,
        locale: identity.locale.locale,
        timezoneId: identity.locale.timezoneId,
        javaScriptEnabled: true,
        bypassCSP: true,
    });

    // Apply stealth overrides
    await applyStealthScripts(context, identity);

    const page = await context.newPage();

    return { browser, context, page, identity };
}

/**
 * Cleanly close a browser session.
 */
export async function closeBrowser(session: BrowserSession, logger: Logger): Promise<void> {
    try {
        await session.context.close();
        await session.browser.close();
        logger.info('BROWSER', 'Session closed');
    } catch (error) {
        logger.warn('BROWSER', `Error closing: ${(error as Error).message}`);
    }
}
