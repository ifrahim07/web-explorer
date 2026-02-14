export type LogLevel = 'debug' | 'info' | 'warn';

const LOG_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
};

export class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = 'info') {
        this.level = level;
    }

    private timestamp(): string {
        return new Date().toLocaleTimeString('en-GB', { hour12: false });
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_PRIORITY[level] >= LOG_PRIORITY[this.level];
    }

    debug(tag: string, message: string): void {
        if (this.shouldLog('debug')) {
            console.log(`\x1b[90m[${this.timestamp()}] DEBUG ${tag}: ${message}\x1b[0m`);
        }
    }

    info(tag: string, message: string): void {
        if (this.shouldLog('info')) {
            console.log(`\x1b[36m[${this.timestamp()}]\x1b[0m \x1b[32m${tag}\x1b[0m ${message}`);
        }
    }

    warn(tag: string, message: string): void {
        if (this.shouldLog('warn')) {
            console.log(`\x1b[33m[${this.timestamp()}] WARN ${tag}: ${message}\x1b[0m`);
        }
    }

    success(tag: string, message: string): void {
        console.log(`\x1b[36m[${this.timestamp()}]\x1b[0m \x1b[32m✓ ${tag}\x1b[0m ${message}`);
    }

    error(tag: string, message: string): void {
        console.error(`\x1b[31m[${this.timestamp()}] ERROR ${tag}: ${message}\x1b[0m`);
    }

    banner(message: string): void {
        console.log('');
        console.log(`\x1b[35m${'═'.repeat(60)}\x1b[0m`);
        console.log(`\x1b[35m  ${message}\x1b[0m`);
        console.log(`\x1b[35m${'═'.repeat(60)}\x1b[0m`);
        console.log('');
    }
}
