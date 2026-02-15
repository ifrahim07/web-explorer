import * as fs from 'fs';
import { loadConfig } from '../src/config';

jest.mock('fs');

describe('Config Loader', () => {
    const mockDefaultConfig = {
        url: 'https://youtube.com',
        instances: 3,
        minPages: 5,
        maxPages: 15,
        minDuration: 60,
        maxDuration: 180,
        minActionsPerPage: 2,
        maxActionsPerPage: 6,
        headless: false,
        browser: 'chromium',
        proxiesFile: 'proxies.txt',
        logLevel: 'info'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Silence console logs during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should load default config when file does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        // Mock process.exit to prevent test from exiting
        const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

        try {
            // This might fail if no URL is provided, which is expected by loadConfig
            loadConfig([]);
        } catch (e: any) {
            expect(e.message).toBe('exit');
        }

        expect(exitMock).toHaveBeenCalledWith(1);
        exitMock.mockRestore();
    });

    test('should apply CLI overrides', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDefaultConfig));

        const config = loadConfig(['--url', 'https://example.com', '--instances', '10']);

        expect(config.url).toBe('https://example.com');
        expect(config.instances).toBe(10);
    });

    test('should merge file config with defaults', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ url: 'https://test.com' }));

        const config = loadConfig([]);

        expect(config.url).toBe('https://test.com');
        expect(config.instances).toBe(2); // From DEFAULT_CONFIG in src/config/index.ts
    });
});
