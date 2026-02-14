import { BrowserContext } from 'playwright';
import { SelectedIdentity } from './identity';

/**
 * Apply stealth overrides to a browser context.
 * Overrides navigator.webdriver, plugins, languages, and platform
 * to reduce bot detection fingerprints.
 *
 * Add new stealth techniques here without touching the launcher.
 */
export async function applyStealthScripts(
    context: BrowserContext,
    identity: SelectedIdentity
): Promise<void> {
    // Main stealth overrides
    await context.addInitScript(() => {
        // Hide webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });

        // Override plugins to appear real
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });

        // Override languages to match locale (injected below)
        // @ts-ignore
        const langs: string[] = (window as any).__explorerLanguages || ['en-US', 'en'];
        Object.defineProperty(navigator, 'languages', {
            get: () => langs,
        });

        // Override platform to match user agent
        const ua = navigator.userAgent;
        let platform = 'Win32';
        if (ua.includes('Mac')) platform = 'MacIntel';
        else if (ua.includes('Linux')) platform = 'Linux x86_64';
        else if (ua.includes('iPhone')) platform = 'iPhone';
        else if (ua.includes('iPad')) platform = 'iPad';
        else if (ua.includes('Android')) platform = 'Linux armv8l';

        Object.defineProperty(navigator, 'platform', {
            get: () => platform,
        });
    });

    // Inject locale languages for the navigator.languages override
    await context.addInitScript((languages: string[]) => {
        (window as any).__explorerLanguages = languages;
    }, identity.locale.languages);
}
