const { Client, Intents } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Logging
function log(log) {
  const currentDate = new Date();
  const logFilePath = path.join(`log/log-${currentDate.toISOString().split('T')[0]}.txt`);
  fs.appendFileSync(logFilePath, `${log}\n`);
}

client.once("ready", async () => {
  try {
    const logMessage = `[${new Date().toLocaleString()}] Ready`;
    console.log(logMessage);
    log(logMessage);

    setInterval(() => {
      client.user.setActivity({
        name: `Create invite link! | ${client.ws.ping}ms | ${client.guilds.cache.size}Servers`
      });
    }, 10000); // 10秒ごとにアクティビティを更新

    // スラッシュコマンド一覧
    const commands = [
      {
        name: 'invite',
        description: '指定の条件で招待リンクを生成します。',
        options: [
          {
            name: 'expire',
            description: '有効期限を選択してください。',
            type: 'STRING',
            choices: [
              { name: '30 minutes', value: '1800' },
              { name: '1 hour', value: '3600' },
              { name: '6 hours', value: '21600' },
              { name: '12 hours', value: '43200' },
              { name: '1 day', value: '86400' },
              { name: '7 day', value: '604800' },
              { name: 'Never', value: '0' },
            ],
            required: true,
          },
          {
            name: 'uses',
            description: '最大使用数を選択してください。',
            type: 'STRING',
            choices: [
              { name: '1 use', value: '1' },
              { name: '5 uses', value: '5' },
              { name: '10 uses', value: '10' },
              { name: '25 uses', value: '25' },
              { name: '50 uses', value: '50' },
              { name: '100 uses', value: '100' },
              { name: 'No limit', value: '0' },
            ],
            required: true,
          },
          {
            name: 'channel',
            description: '招待リンクを作成するチャンネルを指定してください。',
            type: 'CHANNEL',
            required: true,
          },
        ],
      },
      {
        name: "ping",
        description: "Ping値を表示します。BOTの動作確認などにご使用ください。",
      }
    ];

    await client.application.commands.set(commands);

    const successfully = `[${new Date().toLocaleString()}] Slash commands registered successfully`;
    console.log(successfully);
    log(successfully);
  } catch (error) {
    const Error = `[${new Date().toLocaleString()}] Error: ${error.message}`;
    console.error(Error);
    log(Error);
  }
});


client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  // ping
  if (interaction.commandName === "ping") {
    try {
      await interaction.deferReply({ ephemeral: true });
      const ping = client.ws.ping;

      const logMessage = (`[${new Date().toLocaleString()}] Slash commands: ping, Ping: ${ping}ms, User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`);
      console.log(logMessage);
      log(logMessage);

      await interaction.followUp({
        content: `Ping: ${ping}ms`, ephemeral: true
      });
    } catch (error) {
      const logMessage = `[${new Date().toLocaleString()}] Error: ${error.message}`;
      console.log(logMessage);
      log(logMessage);
      await interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  // invite
  if (interaction.commandName === "invite") {
    try {
      await interaction.deferReply({ ephemeral: true });

      const expire = interaction.options.getString('expire');
      const uses = interaction.options.getString('uses');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (!channel || (channel.type !== 'GUILD_TEXT')) {
        await interaction.followUp({
          content: '指定されたチャンネルはテキストチャンネルではありません。\nThe specified channel is not a text channel.',
          ephemeral: true,
        });
        const logMessage = `[${new Date().toLocaleString()}] Error: not text channel, Slash commands: invite, User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
        console.log(logMessage);
        log(logMessage);
        return;
      }

      //招待リンク生成
      const invite = await channel.createInvite({
        temporary: false,
        maxAge: expire === '0' ? 0 : parseInt(expire),
        maxUses: uses === '0' ? 0 : parseInt(uses),
        unique: true,
        reason: `Generated from /invite by ${interaction.user.tag}.`,
      });

      const logMessage = `[${new Date().toLocaleString()}] Slash commands: invite,  User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
      console.log(logMessage);
      log(logMessage);

      await interaction.followUp({
        content: `招待リンクが生成されました。\nInvite link generated.\n${invite.url}`,
        ephemeral: true,
      });

    } catch (error) {
      const logMessage = `[${new Date().toLocaleString()}] Error: ${error.message}`;
      console.log(logMessage);
      log(logMessage);
      await interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }
});


client.login(config.token);
