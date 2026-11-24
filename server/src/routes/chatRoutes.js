import { Router } from 'express';
import config from '../config/index.js';
import { loadCafeKnowledge } from '../config/chatKnowledge.js';
import { chatLimiter, speechLimiter } from '../middleware/limiters.js';
import { validateBody } from '../middleware/validate.js';
import { chatSchema, speakSchema } from '../validators/schemas.js';
import logger from '../utils/logger.js';

const router = Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Short replies repeat a lot ("the menu on your table page shows it"), so a small bounded
// cache keeps the fox instant and saves characters. Keyed by voice, model and exact text.
const SPEECH_CACHE_LIMIT = 40;
const speechCache = new Map();
const speechUsage = { day: '', chars: 0 };
const CHAT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const SYSTEM_PLEASE = [
  'You are Finnegan, the Little Window Café assistant, a small friendly fox who helps guests order.'
  , 'Answer the exact question asked, in English, in one short sentence of about 20 words; use a second sentence only when the answer truly needs it.'
  , 'If the question is yes/no, start with "Yes" or "No", then the reason in one clause.'
  , 'Do not use bullet lists, headings, tables, emojis, or a menu of options unless the guest explicitly asks for a list. No filler greetings, no apologies you do not mean, and no closing offers of more help.'
  , 'The guest is already on their table menu page inside this app. Never tell them to scan a QR code, download an app, install anything, or sign in; say "the menu on this page" instead.'
  , 'This café serves coffee, light meals, snacks, desserts, and drinks with table-side ordering from the guest\'s phone.'
  , 'A paid order goes to the counter, then the kitchen, then the pickup counter; the tracker page shows the live stage and estimated ready time.'
  , 'Guests can usually cancel only within the first minute; after that they should ask at the counter.'
  , 'Do not invent prices, opening hours, addresses, phone numbers, menu items, offers, or policies.'
  , 'Never name or recommend specific menu items or drinks, not even as examples; the menu page on this page is the only source of current items and prices.'
  , 'If someone asks for private order details, tell them the app can show their own order on the tracking page, and that staff can help in person.'
  , 'If a question is off-topic, answer it in one short line and bring the guest back to the menu, their order, or the counter.'
  , 'For allergies, ingredient or spice questions, refunds, lost items, or anything you cannot verify, say you do not have that detail and send the guest to the counter staff.'
].join(' ');

// Some questions have one correct answer and a small model will dress it up or invent it
// ("yes, free Wi-Fi" was a real reply). These are answered directly, before the model runs:
// they are exact, instant, free, and they are the questions guests ask most.
const DIRECT_ANSWERS = [
  {
    test: /\b(qr|scan|scanner|scanning|barcode|bar code)\b/i,
    reply: 'No scanning needed — the menu on this page is already yours.',
  },
  {
    test: /\b(vegan|vegetarian|veg|pure veg|jain)\b/i,
    reply: 'The menu on this page has a pure-veg filter; for vegan or ingredient details, please ask the counter.',
  },
  {
    test: /\b(allerg\w*|ingredient\w*|spic\w*|gluten\w*|nut\w*|halal|dairy|lactose)\b/i,
    reply: 'I do not have ingredient, spice or allergen details — please ask the counter before you order.',
  },
  {
    test: /\b(wi-?fi|internet|parking|toilet|restroom|washroom|pets?|dogs?|music|deliver\w*|home delivery|opening|closing|open till|open until|address|phone|contact number|discount\w*|offers?|coupon\w*|loyalty|gift ?cards?|hiring|jobs?|careers?)\b/i,
    reply: 'I do not have that detail — please ask the counter staff.',
  },
  {
    test: /\b(invoice|receipt|gst bill|printed bill)\b/i,
    reply: 'The bill with CGST and SGST is shown in your cart; for a printed invoice, ask the counter.',
  },
  {
    test: /\b(bill|total|amount|charges?|subtotal)\b/i,
    reply: 'The cart shows the full bill — items, CGST, SGST and any service charge — before you pay.',
  },
  {
    test: /\b(price\w*|cost\w*|how much|expensive|cheap\w*)\b/i,
    reply: 'The menu on this page shows the current price of every dish.',
  },
  {
    test: /\b(how (do|can|should) i pay|payment methods?|pay (by|with|using|in) (cash|card|upi|online)|do you (take|accept) (cash|card|upi|money)|razorpay|upi|cash|card)\b/i,
    reply: 'Payment is online in the cart on this page, before your order is placed.',
  },
  {
    test: /\b(cancel\w*|cancellation)\b/i,
    reply: 'Yes — you can cancel in the app within the first minute; after that, please ask the counter.',
  },
  {
    test: /\b(where('| i)?s? my (order|food)|order status|track\w*|how long|ready yet|is (it|my (food|order)) ready|order late|delayed|late|never (came|arrived)|find (my|the) order|see (my|the) order|my orders?)\b/i,
    reply: 'The tracker under “My orders” shows the live stage and the estimated ready time.',
  },
  {
    test: /\b(table|tables|seat|seats|booking|book a table|reservation|reserve)\b/i,
    reply: 'This page is your table; the seat row on the website shows which tables are free, and bookings open up to ninety days ahead.',
  },
  {
    test: /\b(order again|reorder|repeat order|same order)\b/i,
    reply: 'Add the same dishes from the menu to the cart again — past orders can be seen under “My orders”.',
  },
  {
    test: /\b(thanks|thank you|thx|ty)\b/i,
    reply: 'Happy to help. Enjoy your coffee.',
  },
];

const directAnswer = (message) => {
  const text = String(message || '').trim();
  if (!text) return null;
  const found = DIRECT_ANSWERS.find((rule) => rule.test.test(text));
  return found ? found.reply : null;
};

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
      // gpt-oss spends part of the budget thinking before it answers, so keep the cap
      // generous and the reasoning effort low: short replies either way.
      max_tokens: 320,
      reasoning_effort: 'low',
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
    const direct = directAnswer(req.body.message);
    if (direct) {
      return res.json({ success: true, reply: direct });
    }

    // A reasoning model occasionally returns nothing at all; one retry turns that into an
    // answer instead of "the assistant is unavailable".
    let reply;
    try {
      reply = await chatApi(assemblePrompt(req.body.message));
    } catch {
      reply = await chatApi(assemblePrompt(req.body.message));
    }
    return res.json({ success: true, reply });
  } catch (error) {
    // Upstream detail stays in the logs; the guest gets a plain sentence.
    logger.error('chat failed', { requestId: req.id, error: error?.message });
    return res.status(503).json({ success: false, message: 'Chat is unavailable right now' });
  }
});

// A library voice answers 402 on a free plan, so the first sniff of that uses the premade
// voice instead of leaving the fox silent. The verdict is remembered, so the failing voice
// is skipped (rather than retried) for the rest of the process.
let voiceNeedsPaidPlan = false;
const requestSpeech = async (apiKey, voiceId, model, text) => {
  const send = (voice) => fetch(
    `${ELEVENLABS_URL}/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    },
  );

  const { fallbackVoiceId } = config.elevenLabs;
  const canFallBack = Boolean(fallbackVoiceId) && fallbackVoiceId !== voiceId;
  if (canFallBack && voiceNeedsPaidPlan) {
    return { upstream: await send(fallbackVoiceId), voice: fallbackVoiceId };
  }

  const upstream = await send(voiceId);
  if (upstream.ok || !canFallBack) {
    return { upstream, voice: voiceId };
  }

  const detail = await upstream.text().catch(() => '');
  if (upstream.status !== 402 && !/paid_plan_required/i.test(detail)) {
    return { upstream, voice: voiceId, detail };
  }

  voiceNeedsPaidPlan = true;
  logger.error('speech voice needs a paid plan; using the premade voice', {
    status: upstream.status,
    voiceId,
    fallbackVoiceId,
  });
  return { upstream: await send(fallbackVoiceId), voice: fallbackVoiceId };
};

// Reads a reply out loud for the fox mascot. The API key stays on the server; the browser
// only ever receives audio bytes.
router.post('/speak', speechLimiter, validateBody(speakSchema), async (req, res) => {
  const { apiKey, voiceId, model, dailyCharLimit } = config.elevenLabs;

  if (!apiKey) {
    return res.status(503).json({ success: false, message: 'Voice is not configured' });
  }

  const text = req.body.text;
  const cacheKey = `${voiceId}|${model}|${text}`;
  const cached = speechCache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(cached);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (speechUsage.day !== today) {
    speechUsage.day = today;
    speechUsage.chars = 0;
  }
  if (speechUsage.chars + text.length > dailyCharLimit) {
    logger.error('speech daily cap reached', { requestId: req.id, cap: dailyCharLimit });
    return res.status(429).json({ success: false, message: 'The fox has said enough for today.' });
  }

  try {
    const { upstream, voice, detail } = await requestSpeech(apiKey, voiceId, model, text);

    if (!upstream.ok) {
      const body = detail ?? await upstream.text().catch(() => '');
      logger.error('speech upstream failed', {
        requestId: req.id,
        status: upstream.status,
        voice,
        detail: body.slice(0, 200),
      });
      return res.status(503).json({ success: false, message: 'Voice is unavailable right now' });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    speechUsage.chars += text.length;
    speechCache.set(cacheKey, audio);
    if (speechCache.size > SPEECH_CACHE_LIMIT) {
      speechCache.delete(speechCache.keys().next().value);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(audio);
  } catch (error) {
    logger.error('speech failed', { requestId: req.id, error: error?.message });
    return res.status(503).json({ success: false, message: 'Voice is unavailable right now' });
  }
});

export default router;
