import * as builder from 'botbuilder';
import { createServer } from 'restify';
import { config } from 'dotenv';

config();

const connector = new builder.ChatConnector({
    appId: process.env['MICROSOFT_APP_ID'],
    appPassword: process.env['MICROSOFT_APP_PASSWORD']
});

const server = createServer();
server.listen(process.env['port'] || process.env['PORT'] || 3978, '::', () =>
   console.log('%s listening to %s', server.name, server.url)
);
server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, (session) => {
    session.send("Sorry, I didn't understand that.")
});


bot.recognizer(new builder.LuisRecognizer(process.env.LUIS_MODEL_URL));

bot.dialog('/helloworld', (session) => {
    session.send("Hello, World");
    session.endDialog();
})
.triggerAction({
    matches: /^hello$/i
});

bot.dialog('/extract', (session, args) => {
    const place = args.intent.matched[1].trim();
    session.send(`Wherever you go, ${place} is in your heart`)
    session.endDialog();
})
.triggerAction({
    matches: /^where is (.*)$/i
});

bot.dialog('/failing_tests_howlong', (session, args) => {
    const status = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Like forever. Please consider fixing this as I am quite annoyed with this failure!");
})
.triggerAction({
    matches: /(.+) fail duration/i
});


bot.dialog('/rerun_tests', (session, args) => {
    session.privateConversationData.address = session.message.address;
    const testName = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Test scheduled for rerun. Check in later to check for the results of these tests.");
    testRerun[0].name = testName;
    testRerun[0].status = "running";
    console.log("Name  " + testRerun[0].name + "status" + testRerun[0].status );
    const interval = setInterval(() => {
        //console.log("Here ");
        if (testRerun[0].status != "running") {
            const msg = new builder.Message().address(session.privateConversationData.address).text(testRerun[0].name + testRerun[0].status);
            bot.send(msg);
            clearInterval(interval);
        }
    }, 1*1000);

    setTimeout(() => {
        console.log("Setting status of test " + testRerun[0].name);
        testRerun[0].status = "passed"
    }, 4*1000);
})
.triggerAction({
    matches: /rerun tests (.*)/i
});

bot.dialog('/luisList', (session, args) => {
	const statusEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'test status');
	console.log(args.intent.entities)
	if (statusEntity) {
    	const status = statusEntity.entity;
    	console.log(statusEntity);
    	const rslt = (statusEntity as any).resolution.values[0];
        const results = testresults.filter(test => test.status === rslt);
        //var resultList = results.map(function (r) { return '* ' + r.name + ' (Status: ' + r.step_failed + ')'; })
        //.join('<br>');
        var reply = new builder.Message(session);
        reply.attachmentLayout(builder.AttachmentLayout.carousel);
        for(var i=0; i<results.length;i++) {
    		reply.addAttachment(
        		new builder.HeroCard(session)
            		.title(results[i].name)
            		.text('Status: ' + results[i].step_failed)
            		.buttons([
                		builder.CardAction.imBack(session, 'test info ' + results[i].name, "Test Info")
                	])
            );
    	}

        session.send(reply);
    } else {
        session.send("you'll need to say 'failed' or 'passed'")
    }
})  
.triggerAction({
    matches: 'Test Results'
});

bot.dialog('/testinfo', (session, args) => {
    const name = args.intent.matched[1].trim();
    const results = testcases.filter(test => test.name === name);
    session.send(results.map(testcases => testcases.description).join(", "));
})
.triggerAction({
    matches: /test info (.+)/i
});


interface TestResults {
    name: string;
    status: "failed" | "passed";
    step_failed: string;
    instance: number;
}

const testresults: TestResults[] = [{
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

interface TestCase {
    name: string;
    description: string;
}

const testcases: TestCase[] = [{
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

let testRerun = [{name: "none", status: "none"}];

bot.dialog('/addTag', [
    (session, args, next) => {
        const tagEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'tagName');
        if (tagEntity) {
            session.dialogData.tagName = tagEntity.entity;
            return next();
        }
        builder.Prompts.text(session, "What do you want to call this tag?");
    },
    (session, args, next) => {
        if (!session.dialogData.tagName) {
            session.dialogData.tagName = args.response;
        }
        // If release tag and there are failed tests, prompt for confirmation
        var re = new RegExp("release")
        if (!re.test(session.dialogData.tagName)) {
            return next();
        }
        builder.Prompts.confirm(session, "There are failed tests for this test run. Do you still want me to create a 'release' tag?");
    }, 
    (session, args, next) => {
        console.log("Inside the prompt", args.response);
        if (args.response === false) {
            session.send("Ok. Won't create a tag yet. Cheers!");
            return;
        }
        session.send(`I created a tag called ${session.dialogData.tagName}.`);
    },
]).triggerAction({
    matches: 'Add Tag'
});

bot.dialog('/reminder', (session) => {
    session.privateConversationData.address = session.message.address;
    let a = 1
    setInterval(() => {
        if (a != 1) {
            const msg = new builder.Message().address(session.privateConversationData.address).text("Here is your reminder");
            bot.send(msg);
        }
    }, 1*1000);
}).triggerAction({
    matches: /^set reminder$/
});
