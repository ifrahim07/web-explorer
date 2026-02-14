/**
 * Media action — interact with video and audio players.
 * Plays, pauses, adjusts volume, or seeks within media elements.
 */
import { Page } from 'playwright';
import { Logger } from '../logger';
import { humanDelay, randomInt, randomFloat } from '../humanizer';

/**
 * Find and interact with media elements on the page.
 * Returns a description of what was done, or null if no media found.
 */
export async function humanMedia(page: Page, logger: Logger): Promise<string | null> {
    try {
        // Find all video and audio elements
        const mediaInfo = await page.evaluate(() => {
            const videos = Array.from(document.querySelectorAll('video'));
            const audios = Array.from(document.querySelectorAll('audio'));

            return {
                videoCount: videos.length,
                audioCount: audios.length,
                hasPlayableVideo: videos.some(v => v.readyState >= 2 || v.src || v.querySelector('source')),
                hasPlayableAudio: audios.some(a => a.readyState >= 2 || a.src || a.querySelector('source')),
            };
        });

        if (mediaInfo.videoCount === 0 && mediaInfo.audioCount === 0) {
            logger.debug('MEDIA', 'No media elements found on page');
            return null;
        }

        logger.debug('MEDIA', `Found ${mediaInfo.videoCount} video(s), ${mediaInfo.audioCount} audio(s)`);

        // Prefer video over audio
        const mediaType = mediaInfo.videoCount > 0 ? 'video' : 'audio';

        // Pick a random interaction
        const action = pickMediaAction();

        switch (action) {
            case 'play':
                return await playMedia(page, mediaType, logger);
            case 'pause':
                return await pauseMedia(page, mediaType, logger);
            case 'mute':
                return await muteMedia(page, mediaType, logger);
            case 'seek':
                return await seekMedia(page, mediaType, logger);
            case 'fullscreen':
                if (mediaType === 'video') {
                    return await clickFullscreen(page, logger);
                }
                return await playMedia(page, mediaType, logger);
            default:
                return await playMedia(page, mediaType, logger);
        }
    } catch (error) {
        logger.debug('MEDIA', `Media interaction failed: ${(error as Error).message}`);
        return null;
    }
}

type MediaAction = 'play' | 'pause' | 'mute' | 'seek' | 'fullscreen';

function pickMediaAction(): MediaAction {
    const roll = Math.random();
    if (roll < 0.40) return 'play';       // 40% — play/resume
    if (roll < 0.55) return 'pause';      // 15% — pause
    if (roll < 0.70) return 'mute';       // 15% — toggle mute
    if (roll < 0.85) return 'seek';       // 15% — seek to position
    return 'fullscreen';                   // 15% — fullscreen
}

async function playMedia(page: Page, type: string, logger: Logger): Promise<string | null> {
    try {
        // Try clicking a play button first (more human-like)
        const playButton = page.locator('[aria-label*="play" i], [aria-label*="reproducir" i], .ytp-play-button, [class*="play-button"], [class*="play_button"], button[data-purpose="play"]').first();
        const playVisible = await playButton.isVisible({ timeout: 500 }).catch(() => false);

        if (playVisible) {
            await humanDelay(300, 800);
            await playButton.click({ timeout: 2000 });
            logger.info('MEDIA', `▶️ Clicked play button (${type})`);

            // Watch for a few seconds
            const watchTime = randomInt(3000, 8000);
            await humanDelay(watchTime, watchTime + 1000);
            return `Played ${type} for ${Math.round(watchTime / 1000)}s`;
        }

        // Fallback: play via JavaScript
        const played = await page.evaluate((mediaType) => {
            const el = document.querySelector(mediaType) as HTMLMediaElement;
            if (el && el.paused) {
                el.play().catch(() => { });
                return true;
            }
            return false;
        }, type);

        if (played) {
            logger.info('MEDIA', `▶️ Started ${type} playback`);
            const watchTime = randomInt(3000, 8000);
            await humanDelay(watchTime, watchTime + 1000);
            return `Played ${type} for ${Math.round(watchTime / 1000)}s`;
        }

        return null;
    } catch {
        return null;
    }
}

async function pauseMedia(page: Page, type: string, logger: Logger): Promise<string | null> {
    try {
        const paused = await page.evaluate((mediaType) => {
            const el = document.querySelector(mediaType) as HTMLMediaElement;
            if (el && !el.paused) {
                el.pause();
                return true;
            }
            return false;
        }, type);

        if (paused) {
            logger.info('MEDIA', `⏸️ Paused ${type}`);
            await humanDelay(1000, 3000);
            return `Paused ${type}`;
        }
        return null;
    } catch {
        return null;
    }
}

async function muteMedia(page: Page, type: string, logger: Logger): Promise<string | null> {
    try {
        const result = await page.evaluate((mediaType) => {
            const el = document.querySelector(mediaType) as HTMLMediaElement;
            if (el) {
                el.muted = !el.muted;
                return el.muted ? 'muted' : 'unmuted';
            }
            return null;
        }, type);

        if (result) {
            logger.info('MEDIA', `🔇 ${result === 'muted' ? 'Muted' : 'Unmuted'} ${type}`);
            await humanDelay(500, 1000);
            return `${result} ${type}`;
        }
        return null;
    } catch {
        return null;
    }
}

async function seekMedia(page: Page, type: string, logger: Logger): Promise<string | null> {
    try {
        const seekResult = await page.evaluate((mediaType) => {
            const el = document.querySelector(mediaType) as HTMLMediaElement;
            if (el && el.duration && isFinite(el.duration)) {
                const seekTo = Math.random() * el.duration * 0.8; // Seek to first 80%
                el.currentTime = seekTo;
                return Math.round(seekTo);
            }
            return null;
        }, type);

        if (seekResult !== null) {
            logger.info('MEDIA', `⏩ Seeked ${type} to ${seekResult}s`);
            await humanDelay(1000, 3000);
            return `Seeked ${type} to ${seekResult}s`;
        }
        return null;
    } catch {
        return null;
    }
}

async function clickFullscreen(page: Page, logger: Logger): Promise<string | null> {
    try {
        const fsButton = page.locator('[aria-label*="full" i], [aria-label*="pantalla completa" i], .ytp-fullscreen-button, [class*="fullscreen"]').first();
        const visible = await fsButton.isVisible({ timeout: 500 }).catch(() => false);

        if (visible) {
            await humanDelay(300, 800);
            await fsButton.click({ timeout: 2000 });
            logger.info('MEDIA', '🖥️ Toggled fullscreen');

            // Watch in fullscreen briefly
            await humanDelay(3000, 6000);

            // Exit fullscreen
            await page.keyboard.press('Escape');
            await humanDelay(500, 1000);
            return 'Toggled fullscreen';
        }
        return null;
    } catch {
        return null;
    }
}
