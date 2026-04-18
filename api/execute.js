export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, clientSecret, script, language, versionIndex } = req.body;

  try {
    // 2. The server (Vercel) calls JDoodle (CORS does not apply to servers!)
    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script,
        language,
        versionIndex
      })
    });

    const data = await response.json();
    
    // 3. Return the data back to your React app
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect to JDoodle' });
  }
}