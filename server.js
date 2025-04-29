// Arquivo: server.js

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configurações
const TOKEN_WASCRIPT = '1744639676762-4b4e7fd98d22c00c89613b35d1226b8f';
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${TOKEN_WASCRIPT}`;
const TYPEBOT_WEBHOOK_URL = 'https://typebot.co/api/v1/typebots/bqj4nxgbtzph3ahpz14ympwu/blocks/v7wd8ubv1xnj36yra8fgi8g4/web/executeTestWebhook';

// Endpoint que recebe mensagens
app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    const typebotResponse = await axios.post(
      TYPEBOT_WEBHOOK_URL,
      {
        inputs: {
          user_last_message: mensagem
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = typebotResponse.data?.reply || 'Desculpe, não entendi sua pergunta.';

    await axios.post(WASCRIPT_API_URL, {
      telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro no processamento:', error.message);
    return res.status(500).send({ status: 'Erro ao processar mensagem.' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
