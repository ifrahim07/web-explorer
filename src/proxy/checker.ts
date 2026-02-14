import { chromium } from 'playwright';
import { ProxyEntry } from './types';
import { Logger } from '../logger';

const CHECK_URL = 'https://httpbin.org/ip';
const CHECK_TIMEOUT = 10000; // 10 seconds

/**
 * Check if a single proxy is working by launching a quick browser request through it.
 */
export async function checkProxy(proxy: ProxyEntry, logger: Logger): Promise<boolean> {
    let browser;
    try {
        const proxyConfig: { server: string; username?: string; password?: string } = {
            server: proxy.server,
        };
        if (proxy.username) proxyConfig.username = proxy.username;
        if (proxy.password) proxyConfig.password = proxy.password;

        browser = await chromium.launch({
            headless: true,
            proxy: proxyConfig,
        });

        const page = await browser.newPage();
        const response = await page.goto(CHECK_URL, { timeout: CHECK_TIMEOUT });

        if (response && response.ok()) {
            logger.success('PROXY', `✓ Working: ${proxy.server}`);
            return true;
        }

        logger.warn('PROXY', `✗ Bad response from ${proxy.server}`);
        return false;
    } catch (error) {
        logger.warn('PROXY', `✗ Failed: ${proxy.server} — ${(error as Error).message}`);
        return false;
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
}

/**
 * Filter proxies to only working ones.
 * Checks up to `concurrency` proxies at a time.
 */
export async function filterWorkingProxies(
    proxies: ProxyEntry[],
    logger: Logger,
    concurrency = 3
): Promise<ProxyEntry[]> {
    logger.info('PROXY', `Health-checking ${proxies.length} proxies (concurrency: ${concurrency})...`);

    const working: ProxyEntry[] = [];
    const chunks: ProxyEntry[][] = [];

    // Split into chunks for parallel checking
    for (let i = 0; i < proxies.length; i += concurrency) {
        chunks.push(proxies.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const results = await Promise.all(
            chunk.map(async (proxy) => ({
                proxy,
                ok: await checkProxy(proxy, logger),
            }))
        );

        for (const result of results) {
            if (result.ok) working.push(result.proxy);
        }
    }

    logger.info('PROXY', `${working.length}/${proxies.length} proxies passed health check`);
    return working;
}
