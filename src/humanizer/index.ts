/**
 * Humanizer — random delays and timing utilities
 * Uses Gaussian distribution for natural human-like timing patterns.
 */

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random integer between min and max (inclusive) */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max */
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Gaussian (normal) random number using Box-Muller transform.
 * Results cluster around `mean` with spread of `stddev`.
 */
export function gaussianRandom(mean: number, stddev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stddev + mean;
}

/** Delay that mimics a human pause — clusters around 1-3 seconds */
export async function humanDelay(minMs = 800, maxMs = 3000): Promise<void> {
    const mean = (minMs + maxMs) / 2;
    const stddev = (maxMs - minMs) / 4;
    const delay = Math.max(minMs, Math.min(maxMs, gaussianRandom(mean, stddev)));
    await sleep(delay);
}

/** Typing delay per keystroke — 50ms to 200ms, clustered around 100ms */
export function humanTypingDelay(): number {
    return Math.max(50, Math.min(200, gaussianRandom(100, 30)));
}

/** Short micro-pause like a human reading or deciding — 200ms to 800ms */
export async function microPause(): Promise<void> {
    await sleep(randomInt(200, 800));
}

/** Longer thinking pause — 2 to 6 seconds */
export async function thinkingPause(): Promise<void> {
    const delay = gaussianRandom(3500, 800);
    await sleep(Math.max(2000, Math.min(6000, delay)));
}

/** Pick a random element from an array */
export function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[randomInt(0, arr.length - 1)];
}

/** Shuffle an array in place (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
