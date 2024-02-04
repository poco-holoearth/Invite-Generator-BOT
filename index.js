const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const channelConfigFile = 'channel_config.json';

let channelConfig = {};

function saveChannelConfig() {
  fs.writeFileSync(channelConfigFile, JSON.stringify(channelConfig, null, 2), 'utf-8');
}

function loadChannelConfig() {
  try {
    const data = fs.readFileSync(channelConfigFile, 'utf-8');
    channelConfig = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      saveChannelConfig();
    } else {
      const Error = `[${new Date().toLocaleString()}] Error: ${err.message}`;
      console.error(Error);
      log(Error);
    }
  }
}

loadChannelConfig();


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
        name: `Generate Invite link! | ${client.ws.ping}ms | ${client.guilds.cache.size} Servers`
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
        description: 'Ping値を表示します。BOTの動作確認などにご使用ください。',
      },
      {
        name: 'log',
        description: '招待コードが生成された時に指定されたチャンネルにログを残します。',
        options: [
          {
            name: 'channel',
            description: 'ログを送信するチャンネルを選択してください。',
            type: 'CHANNEL',
            required: true,
          },
        ],
      },
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

      if (!channel.permissionsFor(interaction.user)?.has('CREATE_INSTANT_INVITE')) {
        await interaction.followUp({
          content: 'あなたは「招待を作成」の権限を持っていません。\nYou do not have "Create invite" permission.',
          ephemeral: true,
        });

        const logMessage = `[${new Date().toLocaleString()}] Error: no permission, Slash commands: invite, User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
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
        reason: `Generated from /invite by ${interaction.user.tag} (${interaction.user.id}).`,
      });

      const logMessage = `[${new Date().toLocaleString()}] Slash commands: invite,  User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
      console.log(logMessage);
      log(logMessage);

      // logの送信
      const logChannelId = channelConfig[interaction.guild.id];

      const logChannel = client.channels.cache.get(logChannelId);

      // optionのchoicesのところのnameを持ってきたいけどやり方わからん
      const embed = new MessageEmbed()
        .setTitle('Generate invite link')
        .setDescription(`Generator: <@${interaction.user.id}> (${interaction.user.id})\nExpire: ${expire} sec\nUses: ${uses} uses\nChannel: ${channel}\nInvite link: ${invite.url}`)
        .setTimestamp();

      logChannel.send({ embeds: [embed] });

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

  // log
  if (interaction.commandName === "log") {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        await interaction.followUp({
          content: 'このコマンドを実行するためには管理者権限が必要です。\nYou need administrator permissions to execute this command.',
          ephemeral: true,
        });

        const logMessage = `[${new Date().toLocaleString()}] Error: no permission, Slash commands: log, User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
        console.log(logMessage);
        log(logMessage);
        return;
      }

      const logChannel = interaction.options.getChannel('channel') || interaction.channel;

      // ログチャンネルの保存
      channelConfig[interaction.guild.id] = logChannel.id;
      saveChannelConfig();

      await interaction.followUp({
        content: `ログを送信するチャンネルを ${logChannel.toString()} に設定しました。\nSet the log channel to ${logChannel.toString()}.`,
        ephemeral: true,
      });

      const logMessage = `[${new Date().toLocaleString()}] Slash commands: log, User: ${interaction.user.tag} (ID: ${interaction.user.id}), Server: ${interaction.guild?.name || 'DM'}`;
      console.log(logMessage);
      log(logMessage);

    } catch (error) {
      const logMessage = `[${new Date().toLocaleString()}] Error: ${error.message}`;
      console.log(logMessage);
      log(logMessage);
      await interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }
});


client.login(config.token);
