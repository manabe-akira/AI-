exports.handler = async function(event, context) {
    // フロントエンド（画面）以外からのアクセスを弾く
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Netlifyの安全な金庫からAPIキーを取り出す
    const DIFY_API_KEY = process.env.DIFY_API_KEY;
    const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

    try {
        const body = JSON.parse(event.body);

        // Difyへ通信（ここにAPIキーをこっそり混ぜる）
        const response = await fetch(DIFY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DIFY_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Dify API error: ${response.status}`);
        }

        const data = await response.json();

        // 画面側に結果だけを返す
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};