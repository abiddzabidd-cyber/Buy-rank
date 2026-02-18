require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================
   DAFTAR ROLE & HARGA
========================= */

const rolesData = {
  knight: { name: "Knight", price: 10000 },
  queen: { name: "Power Queen", price: 20000 },
  king: { name: "The Invincible King", price: 50000 }
};

/* =========================
   REGISTER SLASH COMMAND
========================= */

const commands = [
  {
    name: "store",
    description: "Melihat daftar role yang tersedia"
  },
  {
    name: "buy",
    description: "Membeli role",
    options: [
      {
        name: "role",
        description: "Pilih role yang ingin dibeli",
        type: 3,
        required: true,
        choices: [
          { name: "Knight", value: "knight" },
          { name: "Power Queen", value: "queen" },
          { name: "The Invincible King", value: "king" }
        ]
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Register slash command...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Slash command berhasil didaftarkan!");
  } catch (error) {
    console.error(error);
  }
})();

/* =========================
   BOT READY
========================= */

client.once("clientReady", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

/* =========================
   HANDLE COMMAND
========================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "store") {
    const embed = new EmbedBuilder()
      .setTitle("🛒 Royal Store")
      .setDescription(
        `⚔️ **Knight** - Rp${rolesData.knight.price}\n` +
        `👑 **Power Queen** - Rp${rolesData.queen.price}\n` +
        `🔥 **The Invincible King** - Rp${rolesData.king.price}`
      )
      .setColor("Gold");

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "buy") {
    const selected = interaction.options.getString("role");
    const roleInfo = rolesData[selected];

    if (!roleInfo) {
      return interaction.reply({ content: "Role tidak ditemukan!", ephemeral: true });
    }

    const role = interaction.guild.roles.cache.find(r => r.name === roleInfo.name);

    if (!role) {
      return interaction.reply({
        content: `Role **${roleInfo.name}** belum ada di server.`,
        ephemeral: true
      });
    }

    try {
      await interaction.member.roles.add(role);
      return interaction.reply(
        `✅ Berhasil membeli role **${roleInfo.name}** seharga Rp${roleInfo.price}`
      );
    } catch (err) {
      return interaction.reply({
        content: "❌ Gagal memberi role. Pastikan role bot paling atas.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
