import * as fs from 'fs';
import * as path from 'path';
import { ProxyEntry } from './types';

/**
 * Load proxies from a text file.
 * Supports formats:
 *   protocol://host:port
 *   protocol://user:pass@host:port
 * Lines starting with # are comments. Empty lines are skipped.
 */
export function loadProxies(filePath: string): ProxyEntry[] {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Proxies file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const proxies: ProxyEntry[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;

        try {
            const parsed = parseProxyLine(line);
            proxies.push(parsed);
        } catch {
            console.warn(`Skipping invalid proxy line: ${line}`);
        }
    }

    return proxies;
}

/**
 * Parse a single proxy line into a ProxyEntry.
 */
function parseProxyLine(line: string): ProxyEntry {
    // Try to parse as URL
    const url = new URL(line);

    const protocol = url.protocol.replace(':', '');
    const host = url.hostname;
    const port = parseInt(url.port, 10);

    if (!host || !port) {
        throw new Error(`Invalid proxy: ${line}`);
    }

    const entry: ProxyEntry = {
        server: `${protocol}://${host}:${port}`,
        protocol,
        host,
        port,
    };

    if (url.username) entry.username = decodeURIComponent(url.username);
    if (url.password) entry.password = decodeURIComponent(url.password);

    return entry;
}
