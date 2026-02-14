/**
 * Locale profiles with weighted random selection.
 * Add new locales here — just append to the LOCALE_POOL array with a weight.
 * Weights should sum to 1.0.
 */

export interface LocaleProfile {
    locale: string;
    timezoneId: string;
    languages: string[];
    label: string;
}

export const LOCALE_POOL: { profile: LocaleProfile; weight: number }[] = [
    {
        weight: 0.80,
        profile: {
            locale: 'es-ES',
            timezoneId: 'Europe/Madrid',
            languages: ['es-ES', 'es'],
            label: '🇪🇸 Spanish (Spain)',
        },
    },
    {
        weight: 0.10,
        profile: {
            locale: 'en-US',
            timezoneId: 'America/New_York',
            languages: ['en-US', 'en'],
            label: '🇺🇸 English (US)',
        },
    },
    {
        weight: 0.10,
        profile: {
            locale: 'en-GB',
            timezoneId: 'Europe/London',
            languages: ['en-GB', 'en'],
            label: '🇬🇧 English (UK)',
        },
    },
];

/**
 * Pick a locale using weighted random selection.
 */
export function pickRandomLocale(): LocaleProfile {
    const roll = Math.random();
    let cumulative = 0;
    for (const entry of LOCALE_POOL) {
        cumulative += entry.weight;
        if (roll < cumulative) return entry.profile;
    }
    return LOCALE_POOL[0].profile;
}
