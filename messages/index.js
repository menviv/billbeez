/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");

var Promise = require('bluebird');
var request = require('request-promise').defaults({ encoding: null });

var azure = require('azure-storage');
var blobSvc = azure.createBlobServiceAnonymous('https://gtechdevdata.blob.core.windows.net/');

var http = require('http');
var fs = require('fs');


var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        //builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
        builder.Prompts.attachment(session, "Can you attach a screeshot that will help me better understanbd your request? [attach an image or just type 'NO']");

    },
    function (session, results) {
        //session.userData.coding = results.response;
        //var contentUrl = results.response[0].contentUrl;
        //var pictureLength = results.response.length;
        //var msg = session.message;
        //var attachment = msg.attachments[0];
        //var contentUrl = attachment.contentUrl
        //session.send('attachment: ', attachment);
        //builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);



            var msg = session.message;
            if (msg.attachments && msg.attachments.length > 0) {
            // Echo back attachment
            var attachment = msg.attachments[0];
            session.send("dddddd:"+ attachment.contentUrl);

            
            var url = attachment.contentUrl;
            session.send("url:"+ url);

            var dest = "./images/" + attachment.name;

            session.send("dest:"+ dest);
            /*

            var options = {
                directory: "./images",
                filename: attachment.name
            }


            download(url, options, function(err){
                if (err) throw err
                console.log("meow")
                //session.send("ddddggggddddd:" + attachment.contentUrl);
            });

           */ 
                session.send({
                    text: "You sent:",
                    attachments: [
                        {
                            contentType: attachment.contentType,
                            contentUrl: attachment.contentUrl,
                            name: attachment.name
                        }
                    ]
                });



                var file;
                
                var download = function(url, dest, cb) {
                    file = fs.createWriteStream(dest);
                var request = http.get(url, function(response) {
                    response.pipe(file);
                    file.on('finish', function() {
                    file.close(cb);  // close() is async, call cb after close completes.
                    });
                });

                }

                session.send("file:"+ file);






            } else {
                // Echo back users text
                session.send("You said: %s", session.message.text);
            }



/*

        var msg = session.message;
        if (msg.attachments.length) {

            // Message with attachment, proceed to download it.
            // Skype & MS Teams attachment URLs are secured by a JwtToken, so we need to pass the token from our bot.
            var attachment = msg.attachments[0];
            var fileDownload = checkRequiresToken(msg)
                ? requestWithToken(attachment.contentUrl)
                : request(attachment.contentUrl);

            fileDownload.then(
                function (response) {

                    // Send reply with attachment type & size
                    var reply = new builder.Message(session)
                        .text('Attachment of %s type and size of %s bytes received.', attachment.contentType, response.length);
                    session.send(reply);

                }).catch(function (err) {
                    console.log('Error downloading attachment:', { statusCode: err.statusCode, message: err.response.statusMessage });
                });

                blobSvc.createBlockBlobFromLocalFile('images', afileDownload, attachment.name, function(error, result, response){
                if(!error){
                    // file uploaded
                }
                });

                
        }

*/


    }
]);


bot.dialog('resetDialog', function (session, args) {

    if (args.topic == 'ResetPassword') {

        session.endDialog();

        session.beginDialog("/");

    }

}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/reset':
                // You can trigger the action with callback(null, 1.0) but you're also
                // allowed to return additional properties which will be passed along to
                // the triggered dialog.
                callback(null, 1.0, { topic: 'ResetPassword' });
                break;
            default:
                callback(null, 0.0);
                break;
        }
    } 
});



// Helper methods

// Request file with Authentication Header
var requestWithToken = function (url) {
    return obtainToken().then(function (token) {
        return request({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/octet-stream'
            }
        });
    });
};

// Promise for obtaining JWT Token (requested once)
var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));

var checkRequiresToken = function (message) {
    return message.source === 'skype' || message.source === 'msteams';
};





if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}



