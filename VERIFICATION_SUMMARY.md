Chat widget files present and wired:
  - client/src/components/common/ChatBubble.jsx
  - client/src/styles/index.css (chat styles incl. .chat-window, .chat-launcher-label, @keyframes chatPopup)
  - client/src/App.jsx imports <ChatBubble /> and has no stray inline CSS assignment

Client API wiring:
  - client/src/api/apiServices.js exports chatBotApi.sendMessage -> POST /api/chat

Server chat route wiring:
  - server/src/routes/chatRoutes.js exposes POST /api/chat
  - returns { success: true, reply } on success, { success: false, message } on failure
  - calls Groq with config.groqApiKey
  - has try/catch error handling
  - mounted at /api/chat in server/src/app.js

Secrets/config:
  - server/.env has GROQ_API_KEY=<provided key>
  - server/src/config/index.js exports groqApiKey from process.env.GROQ_API_KEY
  - server/package.json lists groq dependency

Verification artifacts:
  - final_check.json: aligned
  - client Vite build: passed
  - chatRoutes module import: OK
  - server/src/app.js module import: had non-chat failure unrelated to chat route

Known limitation:
  - server/src/app.js import currently fails with a non-chat error (`key_id` or `oauthToken` is mandatory)
    so a full server boot test was not completed in this turn. Chat route module itself loads cleanly.