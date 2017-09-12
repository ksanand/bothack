"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var builder = require("botbuilder");
var restify_1 = require("restify");
var dotenv_1 = require("dotenv");
dotenv_1.config();
var connector = new builder.ChatConnector({
    appId: process.env['MICROSOFT_APP_ID'],
    appPassword: process.env['MICROSOFT_APP_PASSWORD']
});
var server = restify_1.createServer();
server.listen(process.env['port'] || process.env['PORT'] || 3978, '::', function () {
    return console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("Sorry, I didn't understand that.");
});
bot.recognizer(new builder.LuisRecognizer(process.env.LUIS_MODEL_URL));
bot.dialog('/helloworld', function (session) {
    session.send("Hello, World");
})
    .triggerAction({
    matches: /^hello$/i
});
bot.dialog('/extract', function (session, args) {
    var place = args.intent.matched[1].trim();
    session.send("Wherever you go, " + place + " is in your heart");
})
    .triggerAction({
    matches: /^where is (.*)$/i
});
bot.dialog('/failing_tests_howlong', function (session, args) {
    var status = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Like forever. Please consider fixing this as I am quite annoyed with this failure!");
})
    .triggerAction({
    matches: /(.+) fail duration/i
});
bot.dialog('/rerun_tests', function (session, args) {
    session.privateConversationData.address = session.message.address;
    var testName = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Test scheduled for rerun. Check in later to check for the results of these tests.");
    testRerun[0].name = testName;
    testRerun[0].status = "running";
    console.log("Name  " + testRerun[0].name + "status" + testRerun[0].status);
    var interval = setInterval(function () {
        //console.log("Here ");
        if (testRerun[0].status != "running") {
            var msg = new builder.Message().address(session.privateConversationData.address).text(testRerun[0].name + testRerun[0].status);
            bot.send(msg);
            clearInterval(interval);
        }
    }, 1 * 1000);
    setTimeout(function () {
        console.log("Setting status of test " + testRerun[0].name);
        testRerun[0].status = "passed";
    }, 4 * 1000);
})
    .triggerAction({
    matches: /rerun tests (.*)/i
});
bot.dialog('/luisList', function (session, args) {
    var statusEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'test status');
    console.log(args.intent.entities);
    if (statusEntity) {
        var status_1 = statusEntity.entity;
        console.log(statusEntity);
        var rslt_1 = statusEntity.resolution.values[0];
        var results = testresults.filter(function (test) { return test.status === rslt_1; });
        //var resultList = results.map(function (r) { return '* ' + r.name + ' (Status: ' + r.step_failed + ')'; })
        //.join('<br>');
        var reply = new builder.Message(session);
        reply.attachmentLayout(builder.AttachmentLayout.carousel);
        for (var i = 0; i < results.length; i++) {
            reply.addAttachment(new builder.HeroCard(session)
                .title(results[i].name)
                .text('Status: ' + results[i].step_failed)
                .buttons([
                builder.CardAction.messageBack(session, "").text('test info ' + results[i].name).title("Test Info")
            ]));
        }
        session.send(reply);
    }
    else {
        session.send("you'll need to say 'failed' or 'passed'");
    }
})
    .triggerAction({
    matches: 'Test Results'
});
bot.dialog('/testinfo', function (session, args) {
    var name = args.intent.matched[1].trim();
    var results = testcases.filter(function (test) { return test.name === name; });
    session.send(results.map(function (testcases) { return testcases.description; }).join(", "));
})
    .triggerAction({
    matches: /test info (.+)/i
});
var testresults = [{
        name: "database_check.feature",
        status: "failed",
        step_failed: "Connectivity failure",
        instance: 1
    }, {
        name: "sanity_check.feature",
        status: "passed",
        step_failed: "None",
        instance: 1
    }, {
        name: "load_testing_mailguard.feature",
        status: "failed",
        step_failed: "Virus daemon died",
        instance: 1
    }, {
        name: "integration_with_console.feature",
        status: "passed",
        step_failed: "",
        instance: 1
    }, {
        name: "operations.feature",
        status: "failed",
        step_failed: "Virusd daemon failed",
        instance: 1
    }, {
        name: "common_configs.feature",
        status: "failed",
        step_failed: "Virusd daemon failed",
        instance: 1
    }];
var testcases = [{
        name: "database_check.feature",
        description: "Checks for database access for mailguard"
    }, {
        name: "sanity_check.feature",
        description: "Checks for sanity of mailguard virus detection"
    }, {
        name: "load_testing_mailguard.feature",
        description: "mailguard can process 20000 emails/min"
    }, {
        name: "integration_with_console.feature",
        description: "Mailguard console integration"
    }, {
        name: "operations.feature",
        description: "Operational tests"
    }, {
        name: "common_configs.feature",
        description: "mailguard common configs"
    }];
var testRerun = [{ name: "none", status: "none" }];
bot.dialog('/addTag', [
    function (session, args, next) {
        var tagEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'tagName');
        if (tagEntity) {
            session.dialogData.tagName = tagEntity.entity;
            return next();
        }
        builder.Prompts.text(session, "What do you want to call this tag?");
    },
    function (session, args, next) {
        if (!session.dialogData.tagName) {
            session.dialogData.tagName = args.response;
        }
        // If release tag and there are failed tests, prompt for confirmation
        var re = new RegExp("release");
        if (!re.test(session.dialogData.tagName)) {
            return next();
        }
        builder.Prompts.confirm(session, "There are failed tests for this test run. Do you still want me to create a 'release' tag?");
    },
    function (session, args, next) {
        console.log("Inside the prompt", args.response);
        if (args.response === false) {
            session.send("Ok. Won't create a tag yet. Cheers!");
            return;
        }
        session.send("I created a tag called " + session.dialogData.tagName + ".");
    },
]).triggerAction({
    matches: 'Add Tag'
});
bot.dialog('/reminder', function (session) {
    session.privateConversationData.address = session.message.address;
    var a = 1;
    setInterval(function () {
        if (a != 1) {
            var msg = new builder.Message().address(session.privateConversationData.address).text("Here is your reminder");
            bot.send(msg);
        }
    }, 1 * 1000);
}).triggerAction({
    matches: /^set reminder$/
});
