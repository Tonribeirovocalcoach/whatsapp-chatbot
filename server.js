// Arquivo: server.js

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const TOKEN_WASCRIPT = '1744639676762-4b4e7fd98d22c00c89613b35d1226b8f';
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${TOKEN_WASCRIPT}`;
const OPENAI_API_KEY = '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';
const TYPEBOT_WEBHOOK_URL = 'https://typebot.co/api/v1/typebots/bqj4nxgbtzph3ahpz14ympwu/blocks/v7wd8ubv1xnj36yra8fgi8g4/web/executeTestWebhook';

// Endpoint que recebe mensagens do EnvMassa
app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    // Envia a mensagem para o seu ChatBot Typebot
    const typebotResponse = await axios.post(
      TYPEBOT_WEBHOOK_URL,
      { mensagem: mensagem },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = typebotResponse.data.reply || 'Desculpe, não entendi sua pergunta.';

    // Envia a resposta para o WhatsApp via EnvMassa API
    await axios.post(WASCRIPT_API_URL, {
      telefone: telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro no processamento:', error.message);
    return res.status(500).send({ status: 'Erro ao processar mensagem.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));