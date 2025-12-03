// bot.js  – Discord bot + full debug (404 hunt)
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios   = require('axios');
const FormData= require('form-data');
const express = require('express');

const client  = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
});

const MOONSHOT_KEY = process.env.MOONSHOT_KEY;
const PREFIX = 'k!';

client.once('ready', () => console.log('Bot live'));

client.on('messageCreate', async msg => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;
  const prompt = msg.content.slice(PREFIX.length).trim() || 'Analyse the image';
  const form   = new FormData();
  form.append('model', 'kimi-latest');
  form.append('message', prompt);

  const img = msg.attachments.first();
  if (img) {
    const buf = await axios.get(img.url, {responseType:'arraybuffer'});
    form.append('image', buf.data, {filename: img.name});
  }

  try {
    const {data} = await axios.post('https://api.moonshot.cn/v1/chat', form,
      {headers: {...form.getHeaders(), Authorization:`Bearer ${MOONSHOT_KEY}`}});
    const reply = data.choices?.[0]?.message || 'No response';
    console.log('CHANNEL:', msg.channel.id, 'MESSAGE:', msg.id);
    await msg.reply(reply.slice(0, 2000));
  } catch (e) {
    console.log('CHANNEL:', msg.channel.id, 'MESSAGE:', msg.id);
    console.error('Discord reply error:', e.message, e.response?.data);
    await msg.reply('Debug: ' + JSON.stringify(e.response?.data || e.message));
  }
});

// Health route for Render
const health = express();
health.get('/', (_,r)=>r.sendStatus(200));
health.listen(process.env.PORT||10000, ()=>console.log('Health on',process.env.PORT||10000));

client.login(process.env.DISCORD_TOKEN);
