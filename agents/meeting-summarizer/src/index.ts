import "dotenv/config";
import { type AgentDefinition, type Query, type McpStdioServerConfig, query } from "@anthropic-ai/claude-agent-sdk";

const SYSTEM_PROMPT = `
You are an AI assistant that helps users analyze and extract insights from meeting transcripts using the Fathom tool. 
Use Fathom transcript tools to read, summarize, and extract action items from meeting transcripts following
the workflow described by the user.

Make sure to reference the meeting transcript content when providing summaries or action items.

Today's date is ${new Date().toLocaleDateString()}.
`;

const PLANNING_PROMPT = `
Build a plan to download the transcripts for last weeks meetings into the ./meetings folder 
and organize them into folders based on each persons name I met with. 

Once they have been downloaded, create a summary of the downloaded transcript using the "summary-agent" 
and save it to a summary markdown file.

do not take action on the plan, just return it.
`;

const WORKFLOW_PROMPT = `
follow the plan below by executing the implementation steps in order using only the tools available to you.  
do not write code to complete the plan.

Here is the plan you must follow:
`;

const SUMMARY_PROMPT = `
You are a helpful AI assistant that summarizes meeting transcripts.

Start by reading the meeting transcript provided.  Organize the information as follows:

1. generate a concise summary of the meeting, highlighting the top 5 key points discussed.
2. identify and list the key topics discussed during the meeting and provide a brief description of each topic and its significance to the meeting.
3. identify and list all key decision points made during the meeting. For each decision point, provide context and any relevant details discussed.
4. list any action items assigned during the meeting along with responsible parties and deadlines.
5. list any follow up items for the next meetings, ensuring clarity on what needs to be addressed.

Format the output in markdown with appropriate headings and bullet points for clarity.
`;

const apiKey = process.env.FATHOM_API_KEY;
if (!apiKey) {
  console.error("Error: FATHOM_API_KEY environment variable is not set.");
  process.exit(1);
}

const summaryAgent: AgentDefinition = {
  description: "An agent that summarizes meeting transcripts.",
  prompt: SUMMARY_PROMPT,
  model: "sonnet",
  tools: ["Read", "Write", "Edit", "Grep"],
};

const fathomMcpServerConfig: McpStdioServerConfig = {
  type: "stdio",
  command: "node",
  args: ["../../mcp/fathom-mcp-server/dist/index.js"],
  env: {
    FATHOM_API_KEY: process.env.FATHOM_API_KEY || "",
  },
};

const createPlan = async () =>
  query({
    prompt: PLANNING_PROMPT,
    options: {
      model: "sonnet",
      systemPrompt: SYSTEM_PROMPT,
      mcpServers: {
        fathom: fathomMcpServerConfig,
      },
      maxTurns: 10,
      permissionMode: "plan",
      allowedTools: ["Read", "Grep", "mcp__fathom__list_meetings"],
      settingSources: ["project"], // Required to load CLAUDE.md from project
    },
  });

const createWorkflow = async (plan: string) =>
  query({
    prompt: WORKFLOW_PROMPT + plan,
    options: {
      model: "haiku",
      systemPrompt: SYSTEM_PROMPT,
      mcpServers: {
        fathom: fathomMcpServerConfig,
      },
      agents: {
        "summary-agent": summaryAgent,
      },
      maxTurns: 50,
      permissionMode: "acceptEdits",
      allowedTools: [
        "Read",
        "Write",
        "Edit",
        "Grep",
        "WebFetch",
        "mcp__fathom__list_meetings",
        "mcp__fathom__download_transcript",
      ],
      settingSources: ["project"], // Required to load CLAUDE.md from project
    },
  });

const processQuery = async (responseStream: Query) => {
  let sessionId = null;
  let result = null;
  // Process streaming responses
  for await (const response of responseStream) {
    // The first message is a system init message with the session ID
    if (response.type === "system" && response.subtype === "init") {
      sessionId = response.session_id;
      console.log(`Session started with ID: ${sessionId}`);
      // You can save this ID for later resumption
    } else if (response.type === "result" && response.subtype === "success") {
      console.log(response.result);
      result = response.result;
    } else if (response.type === "assistant" && response.message.content[0].type === "tool_use") {
      console.log(`Using tool: ${response.message.content[0].name}`);
      console.log(JSON.stringify(response.message.content[0].input, null, 2));
    }
  }
  if (!result) {
    throw new Error("No result received from the query.");
  }
  return result;
};

// Start the planning step
createPlan()
  .then(processQuery)
  .then(createWorkflow)
  .then(processQuery)
  .then((finalResult) => {
    console.log("Workflow completed. Final result:");
    console.log(finalResult);
  })
  .catch((error) => {
    console.error("Error during processing:", error);
  });