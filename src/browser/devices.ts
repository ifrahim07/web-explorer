/**
 * Device profiles for mobile, tablet, and desktop emulation.
 * Modify these arrays to control the device rotation pool.
 */

/** Playwright built-in device names for mobile emulation */
export const MOBILE_DEVICES = [
    'iPhone 14',
    'iPhone 14 Pro Max',
    'iPhone 13',
    'iPhone 12',
    'iPhone SE',
    'Pixel 7',
    'Pixel 5',
    'Galaxy S9+',
    'Galaxy S5',
];

/** Playwright built-in device names for tablet emulation */
export const TABLET_DEVICES = [
    'iPad (gen 7)',
    'iPad Mini',
    'iPad Pro 11',
    'Galaxy Tab S4',
];

/** Desktop viewport resolutions */
export const DESKTOP_VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1680, height: 1050 },
];
