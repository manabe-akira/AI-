exports.handler = async function(event, context) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "リクエスト形式エラー" }) };
  }

  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  if (!DIFY_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "APIキー未設定" }) };
  }

  // 💡 ここを "streaming" に変更し、Difyのルールに従います！
  const requestBody = {
    inputs: {},
    query: body.query,
    user: "guest_user",
    response_mode: "streaming" 
  };

  if (body.conversation_id) {
    requestBody.conversation_id = body.conversation_id;
  }

  try {
    const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.json();
      console.error("Dify Error:", errorData);
      return { statusCode: difyResponse.status, body: JSON.stringify(errorData) };
    }

    // 💡 パラパラ送られてくるストリーミングデータを読み込み、1つの文章に合体させる処理
    const responseText = await difyResponse.text();
    const lines = responseText.split('\n');
    let fullAnswer = "";
    let convoId = "";

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6).trim();
        if (dataStr === '[DONE]') continue; // 終了の合図は無視
        
        try {
          const data = JSON.parse(dataStr);
          // エージェントの返答テキストをどんどん結合していく
          if (data.event === 'agent_message' || data.event === 'message') {
            if (data.answer) fullAnswer += data.answer;
            if (data.conversation_id) convoId = data.conversation_id;
          }
        } catch (e) {
          // JSONパースエラーは無視して次へ
        }
      }
    }

    // 💡 画面側（HTML）が待っている形に整えてから返す
    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: fullAnswer,
        conversation_id: convoId || body.conversation_id
      })
    };

  } catch (error) {
    console.error("Fetch Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "通信エラー" }) };
  }
};