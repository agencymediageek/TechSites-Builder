/**
 * ts-builder-proxy — TechSites AI Site Structure Generator
 *
 * Receives a chat history, calls Grok 3 mini (xAI),
 * and returns a structured site plan in Markdown.
 *
 * Environment bindings required:
 *   GROK_KEY — xAI API key (secret_text binding)
 *
 * @version 1.0.0
 * @license Proprietary — MediaGeek Agency
 */

const SYSTEM_PROMPT = `You are Apex, the TechSites AI assistant specialized in building professional websites.
When given a brief, you generate a complete, detailed site structure including:
- Hero section with compelling headline and subheadline
- Key sections (About, Services, Portfolio, Testimonials, CTA, Contact)
- Color palette and typography recommendations
- SEO meta title and description
- Conversion-focused copy for each section
- Call-to-action buttons text
Format your response in clear Markdown with sections. Be specific, professional, and conversion-focused.
After the site structure, always add a "⚡ Next Steps" section explaining that TechSites AI will build this live site in 24 hours.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    if (!env.GROK_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'messages array is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROK_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.8,
          max_tokens: 2048,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error?.message || `xAI API error: ${res.status}`;
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }

      const content = data?.choices?.[0]?.message?.content || '';
      const tokensUsed = data?.usage?.total_tokens || 0;

      return new Response(JSON.stringify({ content, tokensUsed }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });

    } catch (err) {
      console.error('[ts-builder-proxy] Error:', err.message);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  },
};
