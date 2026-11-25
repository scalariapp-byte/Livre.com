import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkForUpdate } from '@/lib/updates';

const release = (tag: string, assets = [{ name: 'Livre.apk', browser_download_url: 'https://x/Livre.apk' }]) => ({
  tag_name: tag,
  html_url: 'https://github.com/r',
  published_at: '2026-11-25T22:00:00Z',
  draft: false,
  prerelease: false,
  assets,
});

const mockFetch = (body: unknown, status = 200) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

afterEach(() => vi.unstubAllGlobals());

describe('mise à jour', () => {
  it('propose une version plus récente avec son APK', async () => {
    mockFetch(release('v1.0.7'));
    expect(await checkForUpdate()).toMatchObject({ build: 7, version: '1.0.7', apkUrl: 'https://x/Livre.apk' });
  });
  it('ne propose rien sans APK ou pour un tag non conforme', async () => {
    mockFetch(release('v1.0.7', []));
    expect(await checkForUpdate()).toBeNull();
    mockFetch(release('v2-beta'));
    expect(await checkForUpdate()).toBeNull();
  });
  it('signale une erreur GitHub', async () => {
    mockFetch({}, 500);
    await expect(checkForUpdate()).rejects.toThrow('500');
  });
});
