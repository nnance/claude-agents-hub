import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";

// Parse the first command line argument as the prompt
const prompt = process.argv[2];

if (!prompt) {
	console.error("Error: Please provide a prompt as the first argument");
	console.error('Usage: npm start "Your prompt here"');
	process.exit(1);
}

const responseStream = query({
	prompt,
	options: {
		model: "claude-sonnet-4-5-20250929",
		permissionMode: "bypassPermissions",
		systemPrompt: {
			type: "preset",
			preset: "claude_code", // Use Claude Code's system prompt
		},
		settingSources: ["project"], // Required to load CLAUDE.md from project
	},
});

// Process streaming responses
for await (const response of responseStream) {
	let sessionId = null;
	// The first message is a system init message with the session ID
	if (response.type === "system" && response.subtype === "init") {
		sessionId = response.session_id;
		console.log(`Session started with ID: ${sessionId}`);
		// You can save this ID for later resumption
	} else if (response.type === "result" && response.subtype === "success") {
		console.log(response.result);
	} else if (
		response.type === "assistant" &&
		response.message.content[0].type === "tool_use"
	) {
		console.log(`Using tool: ${response.message.content[0].name}`);
		console.log(JSON.stringify(response.message.content[0].input, null, 2));
	}
}
