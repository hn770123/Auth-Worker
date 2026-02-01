export const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>認証プロキシ テスト</title>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <style>
        body {
            font-family: sans-serif;
            max-width: 600px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .container {
            border: 1px solid #ccc;
            padding: 2rem;
            border-radius: 8px;
        }
        button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            font-size: 1rem;
            cursor: pointer;
        }
        #result {
            margin-top: 1rem;
            padding: 1rem;
            background-color: #f0f0f0;
            border-radius: 4px;
            white-space: pre-wrap;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>認証プロキシ テスト</h1>
        <p>以下のreCAPTCHAをチェックして、認証プロキシの動作確認を行ってください。</p>

        <form id="auth-form">
            <!-- テスト用サイトキーを使用 -->
            <div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"></div>
            <button type="submit">検証を実行</button>
        </form>

        <div id="result"></div>
    </div>

    <script>
        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'none';
            resultDiv.textContent = '';

            const token = grecaptcha.getResponse();
            if (!token) {
                alert('reCAPTCHAをチェックしてください');
                return;
            }

            resultDiv.style.display = 'block';
            resultDiv.textContent = '検証中...';

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();
                resultDiv.textContent = '結果:\\n' + JSON.stringify(data, null, 2);

                if (data.success) {
                    resultDiv.style.backgroundColor = '#d4edda';
                    resultDiv.style.color = '#155724';
                } else {
                    resultDiv.style.backgroundColor = '#f8d7da';
                    resultDiv.style.color = '#721c24';
                }

                // トークンは一度しか使えないのでリセット
                grecaptcha.reset();

            } catch (err) {
                resultDiv.style.backgroundColor = '#f8d7da';
                resultDiv.style.color = '#721c24';
                resultDiv.textContent = 'エラーが発生しました:\\n' + err.message;
            }
        });
    </script>
</body>
</html>
`;
