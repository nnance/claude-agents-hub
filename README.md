# Claude Agents Hub

Welcome to the Claude Agents Hub! This repository contains a collection of agents built using Anthropic's Claude Agent SDK and Claude AI model. These agents are designed to be easily deployable and customizable for various use cases and solid examples of how to build agents using the Claude Agent SDK.

* 10+ ready-to-use agents for different tasks
* Easy deployment with Docker and cloud platforms
* Modular architecture for easy customization and extension
* Comprehensive documentation and examples

## Getting Started

To get started with the Claude Agents Hub, follow these steps:
1. Clone the repository:
    ```bash
    git clone https://github.com/nnance/claude-agents-hub.git
    cd claude-agents-hub
    ```

2. Install the required dependencies:
    ```bash
    npm install
    ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your Anthropic API key:
    ```
    ANTHROPIC_API_KEY=your_api_key_here
    ```

4. Run an agent:
    ```bash
    npm start --agent <agent-name>
    ```
    Replace `<agent-name>` with the name of the agent you want to run.

## Available Agents

The Claude Agents Hub includes the following agents:

- **[Auto Coder](./agents//agent-auto-coder/)**: An experimental tool that performs coding tasks via YOLO mode in a sandboxed environment.

- **[Meeting Summarizer](./agents/meeting-summarizer/)**: Summarizes meeting notes and action items from transcripts

## Available MCP Servers

- **[Apple MCP Server](./mcp/apple-mcp-server/)**: A collection of MCP servers for macOS that provide access to native Apple applications (Calendar, Contacts, and Notes) via AppleScript.

- **[Fathom MCP Server](./mcp/fathom-mcp-servers/)**: Integrates with the Fathom API to provide access to meeting recordings, summaries, and transcripts

### Future Agents (coming soon):
- **Deep Research Agent**: Conducts in-depth research on specified topics and compiles comprehensive reports.
- **Investment Research Agent**: Analyzes financial data and provides investment recommendations.
- **Email Assistant Agent**: Manages and responds to emails.
- **Customer Support Agent**: Handles customer inquiries and support tickets.
- **Content Generation Agent**: Creates blog posts, articles, and marketing content.
- **Scheduling Agent**: Manages calendars and schedules appointments.

## Contributing
We welcome contributions from the community! If you have an idea for a new agent or want to improve an existing one, feel free to open a pull request.  Please follow our [contribution guidelines](CONTRIBUTING.md) for more information.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Happy coding!
