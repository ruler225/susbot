const Discord = require("discord.js");
const config = require("./config.json");
const strings = require("./en.json");
var deletedMessages = [];
const MAX_SUS_LOG_LENGTH = 20;
const DEFAULT_SUS_LOG_LENGTH = 10;

const client = new Discord.Client();
client.login(config.BOT_TOKEN);
const prefix = strings.commands.suslog.prefix;  //!


client.on("messageDelete", message => {
    if (deletedMessages.length == MAX_SUS_LOG_LENGTH)
        deletedMessages.shift();
    
    if (!message.author.bot) {
        deletedMessages.push(message);
	client.user.setActivity(deletedMessages.length + " messages in the Suslog.", {type: 'WATCHING'});
    }
});

client.on("messageUpdate", (oldMessage, newMessage) => {
    if (deletedMessages.length == MAX_SUS_LOG_LENGTH)
        deletedMessages.shift();

    if (!oldMessage.author.bot && oldMessage.content != newMessage.content) {
        deletedMessages.push(oldMessage);
	client.user.setActivity(deletedMessages.length + " messages in the Suslog.", {type: 'WATCHING'});
    }
});

client.on("message", message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);   // Remove prefix
    const args = commandBody.split(' ');                        // Get array of commands + opts
    const command = args.shift().toLowerCase();                 // Extract command

    let outgoingMsg = "";   // Placeholder for outgoing message

    // Check commands
    switch(command) {
        case strings.commands.suslog.name:
            outgoingMsg = bringOutSuslog(message, args);
            message.channel.send(outgoingMsg)  // Send outgoing message
            break;
        default:
            // Do nothing
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.error(reason);	
    process.exit(-1);
});


/**
 * Brings out the suslog and computes the outgoing message
 * @param {string[]} args List of arguments for suslog command
 * @returns Outgoing message to display
 */
function bringOutSuslog(message, args) {
    let logLength = DEFAULT_SUS_LOG_LENGTH;     // set default log length
    let userFilter = (a) => true;               // allow for all users as default

    while(args.length > 0) {
        let arg = args.shift();

        if(arg === strings.commands.suslog.arguments.help) {
            return strings.commands.suslog.usage;
        } else if(arg === strings.commands.suslog.arguments.last) {
            logLength = 1;  // Set log length to only return last log
        } else if(Number(arg) && Number(arg) > 0 && Number(arg) <= MAX_SUS_LOG_LENGTH) {
            logLength = Number(arg);    // Set log length to return desired number of messages
        }
    }
    if(message.mentions.users.size > 0) {
        // Set the filter for a specific user
        const users = message.mentions.users      //Get the Collection of users from the message
        userFilter = (msg) => users.has(msg.author.id);  // Set filter
    } 
    // Set outgoing message
    let outgoingMessage = strings.commands.suslog.messages.bringOutLog;
    // Copy deleted messages and reverse to get in most recent order
    let messages = deletedMessages.slice().reverse();
    // Filter by user, if any
    messages = messages.filter(userFilter);
    // Compile outgoing message
    for (var i = 0; i < logLength && i < messages.length; i++) {
        var susMsg = "On " + messages[i].createdAt.toLocaleString("en-US") + ", <@" + messages[i].author + "> wrote: *" + messages[i].content + "*\n";
        if (susMsg.length + outgoingMessage.length <= 2000) {
            outgoingMessage += susMsg;
        }
    }
    if (messages.length == 0)
        outgoingMessage = strings.commands.suslog.messages.noSusActivity;
    else if (deletedMessages.length > Math.min(logLength, messages.length))
        outgoingMessage += "\nThere are also " + (deletedMessages.length - Math.min(logLength, messages.length)) + " more messages that you can view. To specify the number of messages you'd like to see, use `" + prefix + "suslog <num>`";

    return outgoingMessage;
}


