// Arquivo: server.js

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const TOKEN_WASCRIPT = '1744639676762-4b4e7fd98d22c00c89613b35d1226b8f';
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${TOKEN_WASCRIPT}`;
const OPENAI_API_KEY = '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';
const TYPEBOT_WEBHOOK_URL = 'https://typebot.io/<seu-endpoint-webhook-normal>'; // <- Altere aqui para o seu endpoint real

// Endpoint correto que recebe mensagens do WhatsApp
app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    // Enviar mensagem recebida para o fluxo do Typebot
    const typebotResponse = await axios.post(
      TYPEBOT_WEBHOOK_URL,
      { inputs: { user_last_message: mensagem } },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}` // opcional dependendo se o Typebot usar API Key
        }
      }
    );

    const botReply = typebotResponse.data.outputs?.assistant_last_message || 'Desculpe, não entendi sua pergunta.';

    await axios.post(WASCRIPT_API_URL, {
      telefone: telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro no processamento:', error.response?.data || error.message);
    return res.status(500).send({ status: 'Erro ao processar mensagem.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em https://whatsapp-chatbot-rm35.onrender.com/whatsapp-incoming`));
