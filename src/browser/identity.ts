/**
 * Identity selection — combines device, user agent, viewport, and locale
 * into a single randomized identity per browser instance.
 */
import { devices } from 'playwright';
import { pickRandom } from '../humanizer';
import { DESKTOP_USER_AGENTS } from './user-agents';
import { MOBILE_DEVICES, TABLET_DEVICES, DESKTOP_VIEWPORTS } from './devices';
import { LocaleProfile, pickRandomLocale } from './locales';

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet';

export interface SelectedIdentity {
    category: DeviceCategory;
    deviceName: string;
    userAgent: string;
    viewport: { width: number; height: number };
    isMobile: boolean;
    hasTouch: boolean;
    deviceScaleFactor: number;
    locale: LocaleProfile;
}

/**
 * Pick a random device identity (desktop, mobile, or tablet).
 * Probabilities: 60% desktop, 25% mobile, 15% tablet.
 */
export function pickRandomIdentity(): SelectedIdentity {
    const roll = Math.random();
    let category: DeviceCategory;

    if (roll < 0.60) {
        category = 'desktop';
    } else if (roll < 0.85) {
        category = 'mobile';
    } else {
        category = 'tablet';
    }

    const locale = pickRandomLocale();

    if (category === 'desktop') {
        const userAgent = pickRandom(DESKTOP_USER_AGENTS)!;
        const viewport = pickRandom(DESKTOP_VIEWPORTS)!;

        // Derive a friendly name from the UA
        let deviceName = 'Desktop';
        if (userAgent.includes('Windows')) deviceName = 'Windows PC';
        else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
        else if (userAgent.includes('Linux')) deviceName = 'Linux PC';
        if (userAgent.includes('Edg/')) deviceName += ' (Edge)';
        else if (userAgent.includes('Firefox')) deviceName += ' (Firefox)';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceName += ' (Safari)';
        else deviceName += ' (Chrome)';

        return {
            category,
            deviceName,
            userAgent,
            viewport,
            isMobile: false,
            hasTouch: false,
            deviceScaleFactor: 1,
            locale,
        };
    }

    // Mobile or tablet — use Playwright's built-in device descriptors
    const devicePool = category === 'mobile' ? MOBILE_DEVICES : TABLET_DEVICES;
    const deviceName = pickRandom(devicePool)!;
    const descriptor = devices[deviceName];

    return {
        category,
        deviceName,
        userAgent: descriptor.userAgent,
        viewport: descriptor.viewport,
        isMobile: descriptor.isMobile,
        hasTouch: descriptor.hasTouch,
        deviceScaleFactor: descriptor.deviceScaleFactor,
        locale,
    };
}
