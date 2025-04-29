// Arquivo: server.js

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = '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';
const ASSISTANT_ID = 'asst_dFBgwC2YY6TlOJRw78Evx36h';
const WASCRIPT_TOKEN = '1744639676762-4b4e7fd98d22c00c89613b35d1226b8f';
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${WASCRIPT_TOKEN}`;

const logPath = path.join(__dirname, 'webhook_errors.log');

app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    const errorMsg = `[${new Date().toISOString()}] ❌ Dados inválidos recebidos: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(logPath, errorMsg);
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });
    const threadId = threadRes.data.id;

    await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      role: 'user',
      content: mensagem
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const runRes = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      assistant_id: ASSISTANT_ID
    }, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const runId = runRes.data.id;

    let runStatus = 'queued';
    while (runStatus !== 'completed') {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });
      runStatus = statusRes.data.status;
    }

    const messagesRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const botReply = messagesRes.data.data[0]?.content[0]?.text?.value || 'Desculpe, não entendi.';

    await axios.post(WASCRIPT_API_URL, {
      telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });

  } catch (error) {
    const errMsg = `[${new Date().toISOString()}] ❌ Erro interno: ${JSON.stringify(error.response?.data || error.message)}\n`;
    fs.appendFileSync(logPath, errMsg);
    return res.status(500).send({ status: 'Erro ao processar mensagem.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor rodando: https://whatsapp-chatbot-rm35.onrender.com/whatsapp-incoming`)
);
