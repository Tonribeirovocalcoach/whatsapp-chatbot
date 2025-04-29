// Arquivo: server.js

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = 'sk-xxxxx'; // 🔁 Substitua pela sua chave secreta da OpenAI
const ASSISTANT_ID = 'asst_dFBgwC2YY6TlOJRw78Evx36h'; // já está correto
const WASCRIPT_TOKEN = '1744639676762-...'; // 🔁 Substitua pelo seu token da Wascript
const WASCRIPT_API_URL = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${WASCRIPT_TOKEN}`;

app.post('/whatsapp-incoming', async (req, res) => {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).send({ status: 'Telefone e mensagem obrigatórios.' });
  }

  try {
    // 1. Cria um thread na API de Assistants
    const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });
    const threadId = threadRes.data.id;

    // 2. Envia a mensagem do usuário para o thread
    await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      role: 'user',
      content: mensagem
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 3. Executa o Assistant com o thread
    const runRes = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      assistant_id: ASSISTANT_ID
    }, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const runId = runRes.data.id;

    // 4. Aguarda até a execução terminar
    let runStatus = 'queued';
    while (runStatus !== 'completed') {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
      });
      runStatus = statusRes.data.status;
    }

    // 5. Recupera a resposta da IA
    const messagesRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
    });

    const botReply = messagesRes.data.data[0]?.content[0]?.text?.value || 'Desculpe, não entendi.';

    // 6. Envia a resposta via Wascript para o WhatsApp
    await axios.post(WASCRIPT_API_URL, {
      telefone,
      mensagem: botReply
    });

    return res.status(200).send({ status: 'Mensagem enviada com sucesso!' });

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    return res.status(500).send({ status: 'Erro ao processar mensagem.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor rodando: https://whatsapp-chatbot-rm35.onrender.com/whatsapp-incoming`)
);

