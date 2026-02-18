require("dotenv").config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    PermissionsBitField 
} = require("discord.js");

const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const LOG_CHANNEL_ID = "1473628722870358181";

const SHOP = {
    knight: {
        name: "Knight",
        price: 5000,
        roleId: "1473625327879323730"
    },
    queen: {
        name: "Power Queen",
        price: 15000,
        roleId: "1473625651486527488"
    },
    king: {
        name: "The Invincible King",
        price: 30000,
        roleId: "1473626042504577189"
    }
};

const DATA_FILE = "./database.json";

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function getData() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.once("ready", () => {
    console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;
    const guild = interaction.guild;
    const member = interaction.member;

    let data = getData();
    if (!data[userId]) {
        data[userId] = {
            balance: 0,
            lastDaily: 0
        };
    }

    // ================= BALANCE =================
    if (commandName === "balance") {
        const embed = new EmbedBuilder()
            .setTitle("💰 Balance")
            .setColor("Gold")
            .setDescription(`Coin kamu: **${data[userId].balance}**`);

        return interaction.reply({ embeds: [embed] });
    }

    // ================= DAILY =================
    if (commandName === "daily") {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;

        if (now - data[userId].lastDaily < cooldown) {
            return interaction.reply({
                content: "⏳ Kamu sudah klaim daily hari ini!",
                ephemeral: true
            });
        }

        let bonus = 1000;

        if (member.roles.cache.has(SHOP.king.roleId)) bonus = 2000;
        else if (member.roles.cache.has(SHOP.queen.roleId)) bonus = 1500;
        else if (member.roles.cache.has(SHOP.knight.roleId)) bonus = 1200;

        data[userId].balance += bonus;
        data[userId].lastDaily = now;
        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("🎁 Daily Reward")
            .setColor("Green")
            .setDescription(`Kamu mendapatkan **${bonus} coin!**`);

        return interaction.reply({ embeds: [embed] });
    }

    // ================= STORE =================
    if (commandName === "store") {
        const embed = new EmbedBuilder()
            .setTitle("🏪 Royal Store")
            .setColor("Gold")
            .setDescription(`
🛡 **Knight** — 5.000 Coin
👑 **Power Queen** — 15.000 Coin
🔥 **The Invincible King** — 30.000 Coin

Gunakan:
/buy knight
/buy queen
/buy king
            `);

        return interaction.reply({ embeds: [embed] });
    }

    // ================= BUY =================
    if (commandName === "buy") {
        const item = interaction.options.getString("role");

        if (!SHOP[item]) {
            return interaction.reply({
                content: "Role tidak ditemukan!",
                ephemeral: true
            });
        }

        const roleData = SHOP[item];

        if (data[userId].balance < roleData.price) {
            return interaction.reply({
                content: "💸 Coin kamu tidak cukup!",
                ephemeral: true
            });
        }

        const role = guild.roles.cache.get(roleData.roleId);
        if (!role) {
            return interaction.reply({
                content: "Role tidak ditemukan di server!",
                ephemeral: true
            });
        }

        // Hapus semua kasta dulu
        for (const key in SHOP) {
            const rId = SHOP[key].roleId;
            if (member.roles.cache.has(rId)) {
                await member.roles.remove(rId);
            }
        }

        await member.roles.add(role);

        data[userId].balance -= roleData.price;
        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("✅ Pembelian Berhasil")
            .setColor("Blue")
            .setDescription(`
Kamu membeli **${roleData.name}**
Harga: ${roleData.price} coin
Sisa saldo: ${data[userId].balance} coin
            `);

        await interaction.reply({ embeds: [embed] });

        // ===== LOG =====
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle("🛒 Log Pembelian")
                .setColor("Red")
                .setDescription(`
User: <@${userId}>
Role: **${roleData.name}**
Harga: ${roleData.price} coin
                `)
                .setTimestamp();

            logChannel.send({ embeds: [logEmbed] });
        }
    }
});

client.login(process.env.TOKEN);
