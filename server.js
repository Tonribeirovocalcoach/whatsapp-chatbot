// Arquivo: server.js

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// === Substitua abaixo com SEUS dados reais ===
const TOKEN_WASCRIPT = 'SEU_TOKEN_DO_WASCRIPT_AQUI';
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${TOKEN_WASCRIPT}`;

const TYPEBOT_WEBHOOK_URL = 'https://typebot.co/api/v1/typebots/SEU_ID_DO_TYPEBOT/blocks/SEU_BLOCO/web/executeTestWebhook';
// ============================================

app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    const typebotResponse = await axios.post(TYPEBOT_WEBHOOK_URL, {
      inputs: { user_last_message: mensagem }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const botReply = typebotResponse.data.reply || 'Desculpe, não entendi sua pergunta.';

    await axios.post(WASCRIPT_API_URL, {
      telefone: telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });

  } catch (error) {
    console.error('Erro no processamento:', error?.response?.data || error.message);
    return res.status(500).send({ status: 'Erro ao processar mensagem.', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
