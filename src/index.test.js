import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from './index.js';

describe('Auth Proxy Worker', () => {
  const env = {
    RECAPTCHA_SECRET_KEY: 'test_secret_key',
  };

  const ctx = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };

  beforeEach(() => {
    // fetchをモックする
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const request = new Request('http://localhost', { method: 'GET' });
    const response = await worker.fetch(request, env, ctx);
    expect(response.status).toBe(405);
  });

  it('should return 400 if token is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await worker.fetch(request, env, ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Token is required');
  });

  it('should return 500 if RECAPTCHA_SECRET_KEY is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ token: 'test_token' }),
    });
    const emptyEnv = {};
    const response = await worker.fetch(request, emptyEnv, ctx);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Server configuration error');
  });

  it('should verify token successfully', async () => {
    // Google APIのレスポンスをモック
    const mockApiResponse = { success: true };
    global.fetch.mockResolvedValue({
      json: async () => mockApiResponse,
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid_token' }),
    });

    const response = await worker.fetch(request, env, ctx);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Google APIへの呼び出しを確認
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // bodyの内容確認はURLSearchParamsなので少し複雑だが、ここでは呼び出されたこととURLを確認
      })
    );
  });

  it('should handle verification failure', async () => {
    // Google APIのレスポンスをモック（失敗）
    const mockApiResponse = { success: false, 'error-codes': ['invalid-input-response'] };
    global.fetch.mockResolvedValue({
      json: async () => mockApiResponse,
    });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid_token' }),
    });

    const response = await worker.fetch(request, env, ctx);
    expect(response.status).toBe(200); // ステータスは200で返ってくる（Google APIの仕様に準ずるか、Workerの設計次第だが、ここではプロキシとしてそのまま返す）
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
