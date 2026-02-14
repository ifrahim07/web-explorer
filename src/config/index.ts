import * as fs from 'fs';
import * as path from 'path';

export interface ExplorerConfig {
    /** Target URL to explore */
    url: string;
    /** Number of parallel browser instances */
    instances: number;
    /** Minimum number of pages to visit */
    minPages: number;
    /** Maximum number of pages to visit */
    maxPages: number;
    /** Minimum duration in seconds */
    minDuration: number;
    /** Maximum duration in seconds */
    maxDuration: number;
    /** Minimum actions to perform per page */
    minActionsPerPage: number;
    /** Maximum actions to perform per page */
    maxActionsPerPage: number;
    /** Run in headless mode */
    headless: boolean;
    /** Browser type: chromium, firefox, webkit */
    browserType: 'chromium' | 'firefox' | 'webkit';
    /** Path to proxies file */
    proxiesFile: string;
    /** Log level */
    logLevel: 'debug' | 'info' | 'warn';
}

const DEFAULT_CONFIG: ExplorerConfig = {
    url: '',
    instances: 2,
    minPages: 5,
    maxPages: 10,
    minDuration: 60,
    maxDuration: 120,
    minActionsPerPage: 2,
    maxActionsPerPage: 5,
    headless: true,
    browserType: 'chromium',
    proxiesFile: 'proxies.txt',
    logLevel: 'info',
};

const CONFIG_FILE = 'explorer.config.json';

/**
 * Load config from explorer.config.json, then override with any CLI flags.
 * If no config file and no --url flag, prints usage and exits.
 */
export function loadConfig(args: string[]): ExplorerConfig {
    let config = { ...DEFAULT_CONFIG };

    // 1. Try to load from config file
    const configPath = path.resolve(CONFIG_FILE);
    if (fs.existsSync(configPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            config = mergeConfig(config, raw);
        } catch (error) {
            console.warn(`Warning: Could not parse ${CONFIG_FILE}: ${(error as Error).message}`);
        }
    }

    // 2. Override with CLI flags (if any)
    config = applyCliOverrides(config, args);

    // 3. Validate
    if (!config.url) {
        console.error('Error: No URL configured.');
        console.error('');
        console.error('Option 1: Set "url" in explorer.config.json');
        console.error('Option 2: Pass --url <URL> as a CLI flag');
        console.error('');
        printUsage();
        process.exit(1);
    }

    return config;
}

function mergeConfig(base: ExplorerConfig, file: Record<string, unknown>): ExplorerConfig {
    return {
        url: (file.url as string) || base.url,
        instances: (file.instances as number) || base.instances,
        minPages: (file.minPages as number) || base.minPages,
        maxPages: (file.maxPages as number) || base.maxPages,
        minDuration: (file.minDuration as number) || base.minDuration,
        maxDuration: (file.maxDuration as number) || base.maxDuration,
        minActionsPerPage: (file.minActionsPerPage as number) || base.minActionsPerPage,
        maxActionsPerPage: (file.maxActionsPerPage as number) || base.maxActionsPerPage,
        headless: file.headless !== undefined ? (file.headless as boolean) : base.headless,
        browserType: (file.browser as ExplorerConfig['browserType']) || base.browserType,
        proxiesFile: (file.proxiesFile as string) || base.proxiesFile,
        logLevel: (file.logLevel as ExplorerConfig['logLevel']) || base.logLevel,
    };
}

function applyCliOverrides(config: ExplorerConfig, args: string[]): ExplorerConfig {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '--url':
                config.url = next || config.url;
                i++;
                break;
            case '--instances':
                config.instances = parseInt(next, 10) || config.instances;
                i++;
                break;
            case '--min-pages':
                config.minPages = parseInt(next, 10) || config.minPages;
                i++;
                break;
            case '--max-pages':
                config.maxPages = parseInt(next, 10) || config.maxPages;
                i++;
                break;
            case '--min-duration':
                config.minDuration = parseInt(next, 10) || config.minDuration;
                i++;
                break;
            case '--max-duration':
            case '--duration':
                config.maxDuration = parseInt(next, 10) || config.maxDuration;
                i++;
                break;
            case '--min-actions':
                config.minActionsPerPage = parseInt(next, 10) || config.minActionsPerPage;
                i++;
                break;
            case '--max-actions':
                config.maxActionsPerPage = parseInt(next, 10) || config.maxActionsPerPage;
                i++;
                break;
            case '--headless':
                config.headless = next !== 'false';
                i++;
                break;
            case '--browser':
                config.browserType = (next as ExplorerConfig['browserType']) || config.browserType;
                i++;
                break;
            case '--proxies':
                config.proxiesFile = next || config.proxiesFile;
                i++;
                break;
            case '--log-level':
                config.logLevel = (next as ExplorerConfig['logLevel']) || config.logLevel;
                i++;
                break;
        }
    }

    return config;
}

function printUsage(): void {
    console.error('Usage: npm start [-- --url <URL>] [options]');
    console.error('');
    console.error('All options can be set in explorer.config.json or via CLI flags:');
    console.error('');
    console.error('  --url <url>            Target URL to explore');
    console.error('  --instances <n>        Number of parallel instances (default: 1)');
    console.error('  --min-pages <n>        Minimum pages per instance (default: 5)');
    console.error('  --max-pages <n>        Maximum pages per instance (default: 10)');
    console.error('  --min-duration <sec>   Minimum duration in seconds (default: 60)');
    console.error('  --max-duration <sec>   Maximum duration in seconds (default: 120)');
    console.error('  --min-actions <n>      Min actions per page (default: 2)');
    console.error('  --max-actions <n>      Max actions per page (default: 5)');
    console.error('  --headless <bool>      Run headless (default: true)');
    console.error('  --browser <type>       chromium|firefox|webkit (default: chromium)');
    console.error('  --proxies <file>       Proxies file path (default: proxies.txt)');
    console.error('  --log-level <level>    debug|info|warn (default: info)');
}
