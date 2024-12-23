const { Telegraf } = require("telegraf");

const bot = new Telegraf("7504692486:AAGkX1hZsvsf-DBKyd5Y88MLnkak04fh1_8");

const redis = require("redis");

const client = redis.createClient({ url: "redis://127.0.0.1:6378" });

client.connect();

bot.on("new_chat_members", (ctx) => {
  ctx.reply(
    `${ctx.message.new_chat_member.first_name} عزیز \n به گروه خوش آمدید`
  );
});

bot.on("left_chat_member", (ctx) => {
  ctx.reply(`${ctx.message.left_chat_member.first_name} از گروه لفت داد`);
});

const forbbidenWords = ["بی تربیت", "بی ادب"];

bot.on("text", async (ctx) => {
  const message = ctx.message.text;
  const chatId = ctx.message.from.id;

  if (
    forbbidenWords.some((word) => {
      return message.includes(word);
    })
  ) {
    await client.incr(`user:${chatId}:forbbidenWord`);
    const countForbbiden = await client.get(`user:${chatId}:forbbidenWord`);
    if (countForbbiden >= 5) {
      ctx.banChatMember(chatId);
      ctx.deleteMessage();
    } else {
      ctx.deleteMessage();
      ctx.reply("پیام شما حاوی کلمات نامناسب بود و حذف شد");
    }
  }
});

bot.launch(() => {
  console.log("bot running");
});
