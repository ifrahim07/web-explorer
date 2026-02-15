import { pickRandomIdentity } from '../src/browser/identity';

describe('Identity Selection', () => {
    test('should return a valid identity object', () => {
        const identity = pickRandomIdentity();

        expect(identity).toHaveProperty('userAgent');
        expect(identity).toHaveProperty('viewport');
        expect(identity).toHaveProperty('category');
        expect(identity).toHaveProperty('locale');

        expect(typeof identity.userAgent).toBe('string');
        expect(identity.viewport).toHaveProperty('width');
        expect(identity.viewport).toHaveProperty('height');
    });

    test('should respect category probabilities over many runs', () => {
        const categories = { desktop: 0, mobile: 0, tablet: 0 };
        const iterations = 500;

        for (let i = 0; i < iterations; i++) {
            const identity = pickRandomIdentity();
            categories[identity.category]++;
        }

        // desktop ~60%, mobile ~25%, tablet ~15%
        expect(categories.desktop).toBeGreaterThan(iterations * 0.4);
        expect(categories.mobile).toBeGreaterThan(iterations * 0.1);
        expect(categories.tablet).toBeGreaterThan(iterations * 0.05);
    });
});
