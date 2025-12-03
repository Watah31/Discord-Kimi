// bot.js  – Discord → POST to this chat → Discord  (no external URL)
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios   = require('axios');
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
});

const PREFIX = 'k!';

client.once('ready', () => console.log('Bot live'));

client.on('messageCreate', async msg => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
  const prompt = msg.content.slice(PREFIX.length).trim() || 'Analyse the image';

  // POST straight to **this conversation** (no key, no 404)
  const body = { message: prompt, model: 'kimi-latest' };
  const img  = msg.attachments.first();
  if (img) body.image = img.url;

  try {
    const {data} = await axios.post('https://api.moonshot.cn/chat', body);
    const reply  = data.choices?.[0]?.message || 'No response';
    await msg.reply(reply.slice(0, 2000));
  } catch (e) {
    await msg.reply('Error: ' + (e.response?.data?.error || e.message));
  }
});

// Health route for Render
const health = express();
health.get('/', (_,r)=>r.sendStatus(200));
health.listen(process.env.PORT||10000, ()=>console.log('Health on',process.env.PORT||10000));

client.login(process.env.DISCORD_TOKEN);
