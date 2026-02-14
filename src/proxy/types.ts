/**
 * Proxy types shared across the proxy module.
 */
export interface ProxyEntry {
    /** Full proxy URL string, e.g. http://host:port */
    server: string;
    /** Protocol: http, https, socks5 */
    protocol: string;
    /** Proxy host */
    host: string;
    /** Proxy port */
    port: number;
    /** Optional username for authenticated proxies */
    username?: string;
    /** Optional password for authenticated proxies */
    password?: string;
}
