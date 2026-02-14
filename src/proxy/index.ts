import { ProxyEntry } from './types';
import { loadProxies } from './loader';
import { filterWorkingProxies } from './checker';
import { Logger } from '../logger';

export { ProxyEntry } from './types';

/**
 * ProxyManager — loads, health-checks, and rotates proxies.
 * Each call to getNext() returns the next working proxy in round-robin order.
 */
export class ProxyManager {
    private proxies: ProxyEntry[] = [];
    private currentIndex = 0;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Initialize: load proxies from file and filter to working ones.
     * Throws if no proxies pass health check.
     */
    async initialize(filePath: string): Promise<void> {
        const allProxies = loadProxies(filePath);

        if (allProxies.length === 0) {
            this.logger.warn('PROXY', 'No proxies found in file — running without proxy');
            return;
        }

        this.proxies = await filterWorkingProxies(allProxies, this.logger);

        if (this.proxies.length === 0) {
            throw new Error('No working proxies found! All proxies failed health check.');
        }

        this.logger.success('PROXY', `${this.proxies.length} working proxies available`);
    }

    /** Get the next proxy in round-robin rotation */
    getNext(): ProxyEntry | undefined {
        if (this.proxies.length === 0) return undefined;

        const proxy = this.proxies[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        return proxy;
    }

    /** Mark a proxy as dead and remove from rotation */
    markDead(proxy: ProxyEntry): void {
        this.proxies = this.proxies.filter((p) => p.server !== proxy.server);
        if (this.currentIndex >= this.proxies.length) {
            this.currentIndex = 0;
        }
        this.logger.warn('PROXY', `Removed dead proxy: ${proxy.server} (${this.proxies.length} remaining)`);
    }

    /** Number of available proxies */
    getCount(): number {
        return this.proxies.length;
    }

    /** Whether any proxies are available */
    hasProxies(): boolean {
        return this.proxies.length > 0;
    }
}
