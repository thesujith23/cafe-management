import { Router } from 'express';
import config from '../config/index.js';
import { loadCafeKnowledge } from '../config/chatKnowledge.js';
import { chatLimiter } from '../middleware/limiters.js';
import { validateBody } from '../middleware/validate.js';
import { chatSchema } from '../validators/schemas.js';
import logger from '../utils/logger.js';

const router = Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const SYSTEM_PLEASE = [
  'You are the Little Window Café assistant.'
  , 'Keep answers short, friendly, and practical.'
  , 'Answer in English.'
  , 'This café serves coffee, light meals, snacks, desserts, and drinks at table-side QR ordering.'
  , 'Customers scan a table QR code, check in with a name, browse the menu, add items to a cart, and pay to place the order.'
  , 'Paid orders go to the kitchen; staff cook them and place them on the counter for pickup.'
  , 'Guests can usually cancel only within the first minute; after that they should ask at the counter.'
  ,     'Do not invent prices, opening hours, addresses, phone numbers, menu items, or facts you do not know.',
    'Never name or recommend specific menu items or drinks, not even as examples; the menu page is the only source of current items and prices.', 'If someone asks for private order details, tell them the app can show their own order on the tracking page, and that staff can help in person.'
  , 'If a question is off-topic, politely bring it back to the café.'
  , 'Always end with one concrete next step when it helps, like: scan the table QR, open the menu, or check the order tracker.'
].join(' ');

const assemblePrompt = (userMessage) => {
  const knowledge = loadCafeKnowledge();
  const knowledgeSection = knowledge.trim()
    ? `\n\nAPPROVED CAFÉ KNOWLEDGE:\n\n${knowledge}\n\nEND OF APPROVED CAFÉ KNOWLEDGE.\n\n`
    : '';

  return [
    'System instructions:',
    SYSTEM_PLEASE,
    knowledgeSection,
    'Use the approved café knowledge above when it helps. If a question needs live data you do not have, do not invent it; point the customer to the menu, the order tracker, or staff.',
    'Customer message:',
    userMessage,
  ].join('\n');
};

const chatApi = async (prompt) => {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: '' },
      ],
      temperature: 0.2,
      max_tokens: 320,
      stream: false,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error?.message || `HTTP ${response.status}`;
    const error = new Error(`Groq request failed: ${detail}`);
    error.statusCode = response.status === 429 ? 503 : 502;
    throw error;
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from chat model');
  return text;
};

router.post('/', chatLimiter, validateBody(chatSchema), async (req, res) => {
  try {
    if (!config.groqApiKey) {
      logger.error('chat is not configured', { requestId: req.id });
      return res.status(503).json({ success: false, message: 'Chat is not configured' });
    }
    const reply = await chatApi(assemblePrompt(req.body.message));
    return res.json({ success: true, reply });
  } catch (error) {
    // Upstream detail stays in the logs; the guest gets a plain sentence.
    logger.error('chat failed', { requestId: req.id, error: error?.message });
    return res.status(503).json({ success: false, message: 'Chat is unavailable right now' });
  }
});

export default router;
