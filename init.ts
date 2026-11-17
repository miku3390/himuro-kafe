import {spawn} from "node:child_process";
import * as acp from "@agentclientprotocol/sdk";
import { Readable,Writable } from "node:stream";

const cd_location = "D:\\Desktop\\himuro-kafe\\himuro-kafe";

const son_span = spawn( process.env.ComSpec ?? "cmd.exe",["/d","/c","/s","npx --yes @zed-industries/codex-acp"],
    {
        cwd: cd_location,
        //env:{},
        stdio:["pipe","pipe","pipe"],
        //windowsHide:true,
        windowsVerbatimArguments:true,

    },
    );

//change stream    
const output_stream = Writable.toWeb(son_span.stdin);
const input_stream = Readable.toWeb(son_span.stdout);

const acp_stream = acp.ndJsonStream(input_stream,output_stream);

const app = acp.client(

);

await app.connectWith(acp_stream, async (agent) => {
    await agent.request(acp.methods.agent.initialize, {
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities: {},
        clientInfo: {
            name: "himuro-kafe",
            version: "0.0.1",
        },
    }
});

await agent
    .buildSession(cd_location)
    .withSession(async (session) => {});


son_span.stdin.end();
son_span.kill("SIGINT");

