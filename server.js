// Arquivo: server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WASCRIPT_TOKEN = process.env.WASCRIPT_TOKEN;
const TYPEBOT_WEBHOOK_URL = process.env.TYPEBOT_WEBHOOK_URL;
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
    const typebotResponse = await axios.post(
      TYPEBOT_WEBHOOK_URL,
      { inputs: { user_last_message: mensagem } },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = typebotResponse.data?.outputs?.assistant_last_message || 'Desculpe, não entendi.';

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
