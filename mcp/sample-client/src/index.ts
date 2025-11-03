import { Anthropic } from "@anthropic-ai/sdk";
import type {
	MessageParam,
	Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "node:readline/promises";
import dotenv from "dotenv";

const localEnv = dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
	throw new Error("ANTHROPIC_API_KEY is not set");
}

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

class MCPClient {
	private mcp: Client;
	private anthropic: Anthropic;
	private transport: StdioClientTransport | null = null;
	private tools: Tool[] = [];

	constructor() {
		this.anthropic = new Anthropic({
			apiKey: ANTHROPIC_API_KEY,
		});
		this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
	}
	// methods will go here

	async connectToServer(serverScriptPath: string) {
		try {
			const isJs = serverScriptPath.endsWith(".js");
			const isPy = serverScriptPath.endsWith(".py");
			if (!isJs && !isPy) {
				throw new Error("Server script must be a .js or .py file");
			}
			const command = isPy
				? process.platform === "win32"
					? "python"
					: "python3"
				: process.execPath;

			this.transport = new StdioClientTransport({
				command,
				args: [serverScriptPath],
				env: localEnv.parsed || {},
			});
			await this.mcp.connect(this.transport);

			const toolsResult = await this.mcp.listTools();
			this.tools = toolsResult.tools.map((tool) => {
				return {
					name: tool.name,
					description: tool.description ?? "",
					input_schema: {
						...tool.inputSchema,
						required: tool.inputSchema.required ?? null,
					},
				};
			});
			console.log(
				"Connected to server with tools:",
				this.tools.map(({ name }) => name),
			);
		} catch (e) {
			console.log("Failed to connect to MCP server: ", e);
			throw e;
		}
	}

	async processQuery(query: string) {
		const messages: MessageParam[] = [
			{
				role: "user",
				content: query,
			},
		];

		let response = await this.anthropic.messages.create({
			system: `You are an AI assistant that can use tools to answer user queries. Use the provided tools when necessary. Today date is ${new Date().toISOString().split("T")[0]}.`,
			model: ANTHROPIC_MODEL,
			max_tokens: 1000,
			messages,
			tools: this.tools,
		});

		const finalText = [];

		for (const content of response.content) {
			if (content.type === "text") {
				finalText.push(content.text);
			} else if (content.type === "tool_use") {
				const toolName = content.name;
				const toolArgs = content.input as { [x: string]: unknown } | undefined;

				const result = await this.mcp.callTool({
					name: toolName,
					arguments: toolArgs,
				});
				finalText.push(
					`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`,
				);

				// Add assistant's response with tool use to messages
				messages.push({
					role: "assistant",
					content: response.content,
				});

				// Add tool result as user message
				messages.push({
					role: "user",
					content: [
						{
							type: "tool_result",
							tool_use_id: content.id,
							content: result.content as string,
						},
					],
				});

				// Get final response with complete message history
				response = await this.anthropic.messages.create({
					model: ANTHROPIC_MODEL,
					max_tokens: 1000,
					messages,
					tools: this.tools,
				});

				const firstContent = response.content[0];
				if (firstContent && firstContent.type === "text") {
					finalText.push(firstContent.text);
				}
			}
		}

		return finalText.join("\n");
	}

	async chatLoop() {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		try {
			console.log("\nMCP Client Started!");
			console.log("Type your queries or 'quit' to exit.");

			while (true) {
				const message = await rl.question("\nQuery: ");
				if (message.toLowerCase() === "quit") {
					break;
				}
				const response = await this.processQuery(message);
				console.log("\n" + response);
			}
		} finally {
			rl.close();
		}
	}

	async cleanup() {
		await this.mcp.close();
	}
}

async function main() {
	if (process.argv.length < 3) {
		console.log("Usage: node index.ts <path_to_server_script>");
		return;
	}
	const serverScript = process.argv[2];
	if (!serverScript) {
		console.log("Server script path is required");
		return;
	}
	const mcpClient = new MCPClient();
	try {
		await mcpClient.connectToServer(serverScript);
		await mcpClient.chatLoop();
	} catch (e) {
		console.error("Error occurred:", e);
	} finally {
		await mcpClient.cleanup();
		process.exit(0);
	}
}

main();
