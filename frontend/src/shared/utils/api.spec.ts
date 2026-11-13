import { describe, it, expect } from 'vitest';
import { resolveStorageUrl } from './api';

describe('resolveStorageUrl', () => {
  const r2Base = 'https://pub-f25cefd3a5a349788bf015e8d7ab04e2.r2.dev';

  it('returns empty string for null, undefined, or empty path', () => {
    expect(resolveStorageUrl(null)).toBe('');
    expect(resolveStorageUrl(undefined)).toBe('');
    expect(resolveStorageUrl('')).toBe('');
    expect(resolveStorageUrl('   ')).toBe('');
  });

  it('keeps data and blob URLs unchanged', () => {
    expect(resolveStorageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(resolveStorageUrl('blob:http://localhost:5173/uuid')).toBe('blob:http://localhost:5173/uuid');
  });

  it('resolves relative product paths to Cloudflare R2', () => {
    expect(resolveStorageUrl('products/charizard.jpg')).toBe(`${r2Base}/products/charizard.jpg`);
    expect(resolveStorageUrl('/products/charizard.jpg')).toBe(`${r2Base}/products/charizard.jpg`);
  });

  it('resolves legacy /storage/ product paths to Cloudflare R2', () => {
    expect(resolveStorageUrl('/storage/products/charizard.jpg')).toBe(`${r2Base}/products/charizard.jpg`);
    expect(resolveStorageUrl('storage/products/charizard.jpg')).toBe(`${r2Base}/products/charizard.jpg`);
  });

  it('resolves old Railway or localhost /storage/ URLs to Cloudflare R2', () => {
    expect(resolveStorageUrl('https://rlg-backend.up.railway.app/storage/products/charizard.jpg')).toBe(
      `${r2Base}/products/charizard.jpg`
    );
    expect(resolveStorageUrl('http://localhost:8000/storage/products/charizard.jpg')).toBe(
      `${r2Base}/products/charizard.jpg`
    );
  });

  it('keeps Cloudflare R2 URLs intact', () => {
    expect(resolveStorageUrl(`${r2Base}/products/charizard.jpg`)).toBe(
      `${r2Base}/products/charizard.jpg`
    );
  });

  it('keeps external 3rd-party https URLs intact', () => {
    expect(resolveStorageUrl('https://images.unsplash.com/photo-123')).toBe(
      'https://images.unsplash.com/photo-123'
    );
  });
});
