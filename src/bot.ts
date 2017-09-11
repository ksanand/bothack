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

bot.dialog('/helloworld', (session) => {
    session.send("Hello, World");
})
.triggerAction({
    matches: /^hello$/i
});

bot.dialog('/extract', (session, args) => {
    const place = args.intent.matched[1].trim();
    session.send(`Wherever you go, ${place} is in your heart`)
})
.triggerAction({
    matches: /^where is (.*)$/i
});

bot.dialog('/list', (session, args) => {
    const status = args.intent.matched[1].trim();
    const results = tests.filter(test => test.status === status);
    session.send(results.map(tests => tests.name).join(", "));
})
.triggerAction({
    matches: /^which tests (failed|passed) today$/i
});

interface Test {
    name: string;
    status: "failed" | "passed";
}

const tests: Test[] = [{
    name: "Dependency Injection",
    status: "failed"
}, {
    name: "Input/Output",
    status: "passed"
}, {
    name: "Database",
    status: "failed"
}, {
    name: "Server",
    status: "passed"
}];

