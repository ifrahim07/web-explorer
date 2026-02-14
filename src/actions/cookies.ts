import { Page, Frame } from 'playwright';
import { Logger } from '../logger';
import { humanDelay } from '../humanizer';

/**
 * Cookie consent handler — 3-layer detection strategy.
 *
 * Layer 1: Known framework selectors (OneTrust, Cookiebot, etc.)
 * Layer 2: Text-based button search (multilingual EN + ES)
 * Layer 3: iframe scan (Google consent, embedded CMPs)
 */

// ─────────────────────────────────────────────────────────
// LAYER 1 — Known cookie consent framework selectors
// ─────────────────────────────────────────────────────────

const FRAMEWORK_SELECTORS = [
    // OneTrust
    '#onetrust-accept-btn-handler',
    // Cookiebot
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#CybotCookiebotDialogBodyButtonAccept',
    // Quantcast
    '.qc-cmp2-summary-buttons button[mode="primary"]',
    // GDPR Cookie Consent (Osano / Cookie Consent by Insites)
    '.cc-btn.cc-allow',
    '.cc-accept-all',
    // Didomi
    '#didomi-notice-agree-button',
    // Osano
    '.osano-cm-accept-all',
    // Borlabs Cookie
    '#BorlabsCookieBoxButtonAccept',
    // Complianz
    '.cmplz-accept',
    // Moove GDPR
    '.moove-gdpr-infobar-allow-all',
    // Cookie Notice (WP plugin)
    '#cn-accept-cookie',
    // GDPR Cookie Compliance
    '.gdpr-accept-all',
    // Cookie Law Info
    '#cookie_action_close_header',
    // Termly
    '[data-tid="banner-accept"]',
    // Generic common patterns
    '[data-cookie-accept]',
    '[data-consent-accept]',
    '.cookie-accept',
    '.cookie-consent-accept',
    '.js-accept-cookies',
    '.accept-cookies-button',
];

// ─────────────────────────────────────────────────────────
// LAYER 2 — Text patterns for accept buttons (EN + ES)
// ─────────────────────────────────────────────────────────

const ACCEPT_TEXT_PATTERNS = [
    // English
    'Accept All',
    'Accept all cookies',
    'Accept Cookies',
    'Accept',
    'Allow All',
    'Allow all cookies',
    'Allow Cookies',
    'I Agree',
    'I Accept',
    'Agree',
    'Got it',
    'OK',
    'Yes, I agree',
    'Continue',
    'Close',
    // Spanish
    'Aceptar todo',
    'Aceptar todas',
    'Aceptar todas las cookies',
    'Aceptar cookies',
    'Aceptar',
    'Permitir todo',
    'Permitir todas',
    'Permitir',
    'De acuerdo',
    'Estoy de acuerdo',
    'Entendido',
    'Continuar',
    'Cerrar',
];

// ─────────────────────────────────────────────────────────
// LAYER 3 — iframe patterns for embedded consent managers
// ─────────────────────────────────────────────────────────

const CONSENT_IFRAME_PATTERNS = [
    'consent',
    'cookie',
    'gdpr',
    'privacy',
    'cmp',
];

/** Max time (ms) to wait for cookie popup to appear */
const POPUP_WAIT_TIMEOUT = 3000;

/**
 * Attempt to detect and accept a cookie consent popup on the current page.
 * Returns true if a popup was found and accepted, false otherwise.
 */
export async function handleCookieConsent(page: Page, logger: Logger): Promise<boolean> {
    try {
        // Layer 1: Known framework selectors
        const layer1 = await tryFrameworkSelectors(page, logger);
        if (layer1) return true;

        // Layer 2: Text-based button search
        const layer2 = await tryTextBasedSearch(page, logger);
        if (layer2) return true;

        // Layer 3: iframe scan
        const layer3 = await tryIframeSearch(page, logger);
        if (layer3) return true;

        logger.debug('COOKIE', '🍪 No cookie popup detected');
        return false;
    } catch (error) {
        logger.debug('COOKIE', `🍪 Error during cookie handling: ${(error as Error).message}`);
        return false;
    }
}

/**
 * Layer 1: Try clicking known framework accept buttons.
 */
async function tryFrameworkSelectors(page: Page, logger: Logger): Promise<boolean> {
    for (const selector of FRAMEWORK_SELECTORS) {
        try {
            const element = page.locator(selector).first();
            const isVisible = await element.isVisible({ timeout: 500 }).catch(() => false);

            if (isVisible) {
                // Small human-like delay before clicking
                await humanDelay(300, 800);
                await element.click({ timeout: 2000 });
                logger.info('COOKIE', `🍪 Cookie consent accepted (framework selector: ${selector})`);
                await humanDelay(500, 1000); // Wait for banner to dismiss
                return true;
            }
        } catch {
            // Selector not found or not clickable, try next
            continue;
        }
    }
    return false;
}

/**
 * Layer 2: Search for buttons/links with accept-like text.
 */
async function tryTextBasedSearch(page: Page, logger: Logger): Promise<boolean> {
    for (const text of ACCEPT_TEXT_PATTERNS) {
        try {
            // Try button role first
            const button = page.getByRole('button', { name: text, exact: false }).first();
            const buttonVisible = await button.isVisible({ timeout: 300 }).catch(() => false);

            if (buttonVisible) {
                await humanDelay(300, 800);
                await button.click({ timeout: 2000 });
                logger.info('COOKIE', `🍪 Cookie consent accepted (button text: "${text}")`);
                await humanDelay(500, 1000);
                return true;
            }

            // Try link role
            const link = page.getByRole('link', { name: text, exact: false }).first();
            const linkVisible = await link.isVisible({ timeout: 300 }).catch(() => false);

            if (linkVisible) {
                await humanDelay(300, 800);
                await link.click({ timeout: 2000 });
                logger.info('COOKIE', `🍪 Cookie consent accepted (link text: "${text}")`);
                await humanDelay(500, 1000);
                return true;
            }
        } catch {
            continue;
        }
    }

    // Fallback: try generic visible buttons with cookie-related text in their container
    try {
        const cookieContainer = page.locator('[class*="cookie"], [class*="consent"], [class*="gdpr"], [id*="cookie"], [id*="consent"], [id*="gdpr"]').first();
        const containerVisible = await cookieContainer.isVisible({ timeout: 500 }).catch(() => false);

        if (containerVisible) {
            // Find any button inside the container
            const acceptBtn = cookieContainer.locator('button, a[role="button"], input[type="button"], input[type="submit"]').first();
            const btnVisible = await acceptBtn.isVisible({ timeout: 300 }).catch(() => false);

            if (btnVisible) {
                await humanDelay(300, 800);
                await acceptBtn.click({ timeout: 2000 });
                logger.info('COOKIE', '🍪 Cookie consent accepted (container button fallback)');
                await humanDelay(500, 1000);
                return true;
            }
        }
    } catch {
        // Fallback failed
    }

    return false;
}

/**
 * Layer 3: Search inside iframes for consent managers.
 */
async function tryIframeSearch(page: Page, logger: Logger): Promise<boolean> {
    try {
        const frames = page.frames();

        for (const frame of frames) {
            if (frame === page.mainFrame()) continue;

            const frameUrl = frame.url().toLowerCase();
            const isConsentFrame = CONSENT_IFRAME_PATTERNS.some(pattern => frameUrl.includes(pattern));

            if (!isConsentFrame) continue;

            // Search for accept buttons inside the consent iframe
            const accepted = await tryFrameworkSelectorsInFrame(frame, logger);
            if (accepted) return true;

            const textAccepted = await tryTextInFrame(frame, logger);
            if (textAccepted) return true;
        }
    } catch {
        // iframe access may fail due to cross-origin
    }

    return false;
}

/**
 * Try framework selectors inside an iframe.
 */
async function tryFrameworkSelectorsInFrame(frame: Frame, logger: Logger): Promise<boolean> {
    for (const selector of FRAMEWORK_SELECTORS) {
        try {
            const element = frame.locator(selector).first();
            const isVisible = await element.isVisible({ timeout: 300 }).catch(() => false);

            if (isVisible) {
                await humanDelay(300, 800);
                await element.click({ timeout: 2000 });
                logger.info('COOKIE', `🍪 Cookie consent accepted (iframe, selector: ${selector})`);
                await humanDelay(500, 1000);
                return true;
            }
        } catch {
            continue;
        }
    }
    return false;
}

/**
 * Try text-based search inside an iframe.
 */
async function tryTextInFrame(frame: Frame, logger: Logger): Promise<boolean> {
    for (const text of ACCEPT_TEXT_PATTERNS) {
        try {
            const button = frame.getByRole('button', { name: text, exact: false }).first();
            const visible = await button.isVisible({ timeout: 300 }).catch(() => false);

            if (visible) {
                await humanDelay(300, 800);
                await button.click({ timeout: 2000 });
                logger.info('COOKIE', `🍪 Cookie consent accepted (iframe, text: "${text}")`);
                await humanDelay(500, 1000);
                return true;
            }
        } catch {
            continue;
        }
    }
    return false;
}
