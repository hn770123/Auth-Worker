/**
 * 認証プロキシWorkerモジュール
 * Google reCAPTCHAを使用して人間かどうかを判定します。
 * 他のWorkerから呼び出されることを想定しています。
 */

export default {
  /**
   * fetchハンドラ
   * HTTPリクエストまたはService Bindings経由の呼び出しを処理します。
   *
   * @param {Request} request - リクエストオブジェクト
   * @param {Object} env - 環境変数を含むオブジェクト
   * @param {Object} ctx - 実行コンテキスト
   * @returns {Promise<Response>} レスポンスオブジェクト
   */
  async fetch(request, env, ctx) {
    // 日本語コメント: リクエストメソッドがPOSTであることを確認します
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      // 日本語コメント: リクエストボディからトークンを取得します
      const { token } = await request.json();

      if (!token) {
        return new Response(JSON.stringify({ error: 'Token is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 日本語コメント: 環境変数からreCAPTCHAのシークレットキーを取得します
      const secretKey = env.RECAPTCHA_SECRET_KEY;
      if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY is not set');
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 日本語コメント: Google reCAPTCHA APIに検証リクエストを送信します
      // application/x-www-form-urlencoded 形式で送信する必要があります
      const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
      const body = new URLSearchParams({
        secret: secretKey,
        response: token,
      });

      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      const verifyResult = await verifyResponse.json();

      // 日本語コメント: 検証結果を返します
      // verifyResult.success が true なら人間と判定されます
      return new Response(JSON.stringify(verifyResult), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // 日本語コメント: エラーハンドリング
      console.error('Error during reCAPTCHA verification:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
