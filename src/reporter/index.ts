import { Logger } from '../logger';

export interface ActionRecord {
    timestamp: number;
    action: string;
    detail: string;
    page: string;
}

export interface SessionReport {
    startTime: number;
    endTime: number;
    durationSeconds: number;
    pagesVisited: number;
    visitedUrls: string[];
    totalActions: number;
    actions: ActionRecord[];
    proxyUsed: string | null;
}

/**
 * Reporter — tracks actions during a session and generates a summary report.
 */
export class Reporter {
    private actions: ActionRecord[] = [];
    private startTime: number;
    private visitedUrls: Set<string> = new Set();
    private proxyUsed: string | null = null;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.startTime = Date.now();
    }

    /** Record an action */
    recordAction(action: string, detail: string, pageUrl: string): void {
        this.actions.push({
            timestamp: Date.now(),
            action,
            detail,
            page: pageUrl,
        });
    }

    /** Record a page visit */
    recordPageVisit(url: string): void {
        this.visitedUrls.add(url);
    }

    /** Set the proxy used for this session */
    setProxy(proxy: string): void {
        this.proxyUsed = proxy;
    }

    /** Generate and print the session report */
    generateReport(): SessionReport {
        const endTime = Date.now();
        const report: SessionReport = {
            startTime: this.startTime,
            endTime,
            durationSeconds: Math.round((endTime - this.startTime) / 1000),
            pagesVisited: this.visitedUrls.size,
            visitedUrls: [...this.visitedUrls],
            totalActions: this.actions.length,
            actions: this.actions,
            proxyUsed: this.proxyUsed,
        };

        this.printReport(report);
        return report;
    }

    private printReport(report: SessionReport): void {
        this.logger.banner('SESSION REPORT');

        console.log(`  📊 Duration:       ${report.durationSeconds}s`);
        console.log(`  📄 Pages visited:  ${report.pagesVisited}`);
        console.log(`  🎯 Total actions:  ${report.totalActions}`);
        console.log(`  🔒 Proxy used:     ${report.proxyUsed || 'none'}`);
        console.log('');

        // Action breakdown
        const actionCounts: Record<string, number> = {};
        for (const action of report.actions) {
            actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
        }

        console.log('  Action breakdown:');
        for (const [action, count] of Object.entries(actionCounts)) {
            console.log(`    ${action}: ${count}`);
        }
        console.log('');

        console.log('  Visited URLs:');
        for (const url of report.visitedUrls) {
            console.log(`    • ${url}`);
        }

        console.log('');
        console.log(`\x1b[35m${'═'.repeat(60)}\x1b[0m`);
    }
}
