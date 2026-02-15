import { randomInt, randomFloat, pickRandom, shuffle } from '../src/humanizer';

describe('Humanizer Utilities', () => {
    test('randomInt should return an integer within range', () => {
        for (let i = 0; i < 100; i++) {
            const val = randomInt(5, 10);
            expect(val).toBeGreaterThanOrEqual(5);
            expect(val).toBeLessThanOrEqual(10);
            expect(Number.isInteger(val)).toBe(true);
        }
    });

    test('randomFloat should return a float within range', () => {
        const val = randomFloat(1.5, 2.5);
        expect(val).toBeGreaterThanOrEqual(1.5);
        expect(val).toBeLessThanOrEqual(2.5);
    });

    test('pickRandom should return an element from the array', () => {
        const arr = ['a', 'b', 'c'];
        const val = pickRandom(arr);
        expect(arr).toContain(val);
    });

    test('pickRandom should return undefined for empty array', () => {
        expect(pickRandom([])).toBeUndefined();
    });

    test('shuffle should return an array with same elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const shuffled = shuffle(arr);
        expect(shuffled).toHaveLength(arr.length);
        expect(shuffled.sort()).toEqual(arr.sort());
    });
});
