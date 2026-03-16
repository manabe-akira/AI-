exports.handler = async function(event, context) {
  // 1. フロント（画面）からのデータを受け取る
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "リクエストの形式が不正です" }) };
  }

  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  if (!DIFY_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "APIキーが設定されていません" }) };
  }

  // 2. Difyに送るデータを、厳格なルールに合わせて組み立てる
  const requestBody = {
    inputs: {},
    query: body.query,
    user: "guest_user",
    response_mode: "blocking"
  };

  // ※会話IDがある場合のみ追加する（空っぽのIDを送るとDifyに怒られるため）
  if (body.conversation_id) {
    requestBody.conversation_id = body.conversation_id;
  }

  try {
    // 3. DifyのAPI玄関（chat-messages）をノックする
    const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // 4. Difyからの返事を受け取る
    const data = await difyResponse.json();

    // 💡 もしDifyがエラー（400など）を返してきたら、その「理由」をそのまま画面に送り返す
    if (!difyResponse.ok) {
      console.error("Dify Error Details:", data); // Netlifyのログ用
      return {
        statusCode: difyResponse.status,
        body: JSON.stringify(data) // 画面側にエラーの詳細を伝える
      };
    }

    // 5. 成功したら、AIの回答を画面に返す
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Fetch Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "通信中に致命的なエラーが発生しました" }) };
  }
};