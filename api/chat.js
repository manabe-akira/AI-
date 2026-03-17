export default async function handler(req, res) {
  // POST通信以外は弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Dify APIへリクエストを転送
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 成功したら画面（フロント）に返す
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
