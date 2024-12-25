const { Telegraf } = require("telegraf");

const bot = new Telegraf("7504692486:AAGkX1hZsvsf-DBKyd5Y88MLnkak04fh1_8");

const redis = require("redis");

const client = redis.createClient({ url: "redis://127.0.0.1:6378" });

client.connect();

bot.start((ctx) => {
  ctx.reply(
    "ربات را به گروه خود اضافه کنید \n ربات را ادمین گروه کنید با تمام دسترسی ها \n /ban 'زمان مورد نظر بر حسب ثانیه با فرمت عددی' \n /ban \n /unban \n /promote \n /demote \n /del \n /kill \n /alive \n و تمام با دستورات بالا از راحتی مدیریت گروه خود لذت ببرید"
  );
});

bot.on("new_chat_members", async (ctx) => {
  ctx.reply(
    `${ctx.message.new_chat_member.first_name} عزیز \n به گروه خوش آمدید`
  );

  const newMembers = ctx.message.new_chat_members;
  const invitedId = ctx.message.from.id;

  for (const member of newMembers) {
    await client.incr(`invited:${invitedId}`);
  }

  const invitedCount = await client.get(`invited:${invitedId}`);
});

bot.on("left_chat_member", (ctx) => {
  ctx.reply(`${ctx.message.left_chat_member.first_name} از گروه حذف شد`);
});

const forbbidenWords = ["بی تربیت", "بی ادب"];

bot.on("text", async (ctx) => {
  const message = ctx.message.text;
  const chatId = ctx.message.from.id;
  const groupId = ctx.chat.id;
  let invitedCount = await client.get(`invited:${chatId}`);
  const chatMemberRole = await ctx.telegram.getChatMember(groupId, chatId);

  // if (
  //   chatMemberRole.status == "creator" ||
  //   chatMemberRole.status == "adminstrator"
  // ) {
  //   if (invitedCount < 10) {
  //     await client.INCRBY(`invited:${chatId}`, 10 - invitedCount);
  //     invitedCount = await client.get(`invited:${chatId}`);
  //   }
  // }

  // if (invitedCount >= 10) {
  if (ctx.message.reply_to_message) {
    const userId = ctx.message.reply_to_message.from.id;
    if (
      chatMemberRole.status == "creator" ||
      chatMemberRole.status == "adminstrator"
    ) {
      if (message.startsWith("/ban")) {
        if (message.length > 5) {
          // console.log(userId);
          const messageTime = message.slice(4);
          const messageTimeNumber = Number(messageTime);
          if (messageTimeNumber) {
            const untilDate = Math.floor(Date.now() / 1000) + messageTimeNumber;
            ctx.restrictChatMember(userId, {
              until_date: untilDate,
              can_send_messages: false,
            });
            ctx.reply(
              `کاربر ${ctx.message.reply_to_message.from.first_name} با موفقیت محدود شد`
            );
          } else {
            ctx.reply(
              "فرمت وارد شده درست نیست \n فرمت مورد نیاز: \n /ban 'تایم مورد نظر به ثانیه به فرمت عددی'"
            );
          }
        } else if (message == "/ban") {
          ctx.restrictChatMember(userId);
          ctx.reply(
            `کاربر ${ctx.message.reply_to_message.from.first_name} با موفقیت محدود شد`
          );
        } else {
          ctx.reply(
            "فرمت وارد شده درست نیست \n فرمت مورد نیاز: \n /ban 'تایم مورد نظر به ثانیه به فرمت عددی'"
          );
        }
      } else if (message == "/unban") {
        // console.log(userId);
        ctx.restrictChatMember(userId, {
          can_send_messages: true,
        });
        ctx.reply(
          `کاربر ${ctx.message.reply_to_message.from.first_name} با موفقیت رفع محدودیت شد`
        );
      } else if (message == "/promote") {
        ctx.promoteChatMember(userId, {
          can_promote_members: true,
          can_pin_messages: true,
          can_change_info: true,
          can_send_polls: true,
        });
        ctx.reply("کاربر پروموت شد");
      } else if (message == "/demote") {
        ctx.promoteChatMember(userId, {
          can_promote_members: false,
          can_pin_messages: false,
          can_change_info: false,
          can_send_polls: false,
        });
        ctx.reply("کاربر دیموت شد");
      } else if (message == "/del") {
        const messageId = ctx.message.reply_to_message.message_id;
        ctx.deleteMessage(messageId);
        ctx.reply(
          `پیام کاربر ${ctx.message.reply_to_message.from.first_name} حذف شد`
        );
      } else if (message == "/kill") {
        ctx.banChatMember(userId);
      } else if (message == "/alive") {
        ctx.unbanChatMember(userId);
      }
    }
  }

  if (
    forbbidenWords.some((word) => {
      return message.includes(word);
    })
  ) {
    await client.incr(`user:${chatId}:forbbidenWord`);
    const countForbbiden = await client.get(`user:${chatId}:forbbidenWord`);
    if (countForbbiden >= 50) {
      ctx.banChatMember(chatId);
      ctx.deleteMessage();
    } else {
      ctx.deleteMessage();
      ctx.reply("پیام شما حاوی کلمات نامناسب بود و حذف شد");
    }
  }
  // }
  // else {
  //   ctx.deleteMessage();
  //   ctx.reply(
  //     ` ${
  //       ctx.message.from.first_name
  //     } شما برای دسترسی باید 10 نفر را به گروه اضافه کنید\n تعداد نفراتی که شما در گروه باید اضافه کنید :${
  //       10 - invitedCount
  //     }`
  //   );
  // }
});

bot.launch(() => {
  console.log("bot running");
});
