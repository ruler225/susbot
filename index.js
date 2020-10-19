const Discord = require("discord.js");
const config = require("./config.json");
var deletedMessages = [];
const suslogLength = 20;

const client = new Discord.Client();
client.login(config.BOT_TOKEN);
const prefix = "!";


client.on("messageDelete", message => {
    if (deletedMessages.length == suslogLength)
        deletedMessages.shift();
    
    if (!message.author.bot)
        deletedMessages.push(message);
});

client.on("messageUpdate", (oldMessage, newMessage) => {
    if (deletedMessages.length == suslogLength)
        deletedMessages.shift();

    if (!oldMessage.author.bot && oldMessage.content != newMessage.content)
        deletedMessages.push(oldMessage);
});

client.on("message", message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command == "suslog") {
        var logLength;
	if (!args[0])
	    logLength = 10;
	else if (Number(args[0]))
            logLength = Number(args[0]);
	else if (args[0].toLowerCase() == "last")
	    logLength = 1;
        if (deletedMessages.length <= logLength)
            logLength = deletedMessages.length;
        var outgoingMsg = "Bringing out the log of *sus*:\n\n";
        for (var i = deletedMessages.length - 1; i > deletedMessages.length - logLength - 1; i--) {
            var susMsg = "On " + deletedMessages[i].createdAt.toLocaleString("en-US") + ", <@" + deletedMessages[i].author + "> wrote: *" + deletedMessages[i].content + "*\n";
            //console.log("susMsg length: " + susMsg.length);
            if (susMsg.length + outgoingMsg.length <= 2000) {
                outgoingMsg += susMsg;
                //console.log(outgoingMsg);
            }
        }
        if (deletedMessages.length == 0)
            outgoingMsg = "Hmmmmm... I haven't seen any suspicious activity yet. Good job.... for now...";
        else if (deletedMessages.length > logLength)
            outgoingMsg += "\nThere are also " + (deletedMessages.length - logLength) + " more messages that you can view. To specify the number of messages you'd like to see, use `" + prefix + "suslog <num>`";
        message.channel.send(outgoingMsg);

    }
});

process.on('unhandledRejection', (reason, p) => {
    console.error(reason);	
    process.exit(-1);
  });



