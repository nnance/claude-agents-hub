#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ContactsManager } from "./contacts.js";

// Create the MCP server
const server = new McpServer({
	name: "apple-contacts-mcp-server",
	version: "1.0.0",
});

// Initialize Contacts manager
const contactsManager = new ContactsManager();

// Register search contacts tool
server.registerTool(
	"search_contacts",
	{
		title: "Search Contacts",
		description: "Search for contacts by name or organization",
		inputSchema: {
			query: z.string().describe("Search query to match against contact name or organization"),
		},
		outputSchema: {
			contacts: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					emails: z.array(z.string()),
					phones: z.array(z.string()),
					organization: z.string().optional(),
					birthday: z.string().optional(),
				}),
			),
		},
	},
	async (args) => {
		const contacts = await contactsManager.searchContacts(args.query);

		if (!contacts) {
			throw new Error("Failed to search contacts");
		}

		const output = { contacts };

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(output, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(output)),
		};
	},
);

// Register create contact tool
server.registerTool(
	"create_contact",
	{
		title: "Create Contact",
		description: "Create a new contact in the Contacts app",
		inputSchema: {
			name: z.string().describe("Full name of the contact"),
			email: z.string().email().optional().describe("Email address"),
			phone: z.string().optional().describe("Phone number"),
			organization: z.string().optional().describe("Organization/Company name"),
			birthday: z.string().optional().describe("Birthday in AppleScript date format"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await contactsManager.createContact(
			args.name,
			args.email,
			args.phone,
			args.organization,
			args.birthday,
		);

		if (!result) {
			throw new Error("Failed to create contact");
		}

		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
			structuredContent: { result },
		};
	},
);

// Register list contacts tool
server.registerTool(
	"list_contacts",
	{
		title: "List All Contacts",
		description: "List all contacts from the Contacts app",
		inputSchema: {},
		outputSchema: {
			contacts: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					emails: z.array(z.string()),
					phones: z.array(z.string()),
					organization: z.string().optional(),
					birthday: z.string().optional(),
				}),
			),
		},
	},
	async () => {
		const contacts = await contactsManager.listContacts();

		if (!contacts) {
			throw new Error("Failed to list contacts");
		}

		const output = { contacts };

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(output, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(output)),
		};
	},
);

// Register get contact tool
server.registerTool(
	"get_contact",
	{
		title: "Get Contact",
		description: "Get details for a specific contact by name",
		inputSchema: {
			contactName: z.string().describe("Full name of the contact to retrieve"),
		},
		outputSchema: {
			contact: z.object({
				id: z.string(),
				name: z.string(),
				emails: z.array(z.string()),
				phones: z.array(z.string()),
				organization: z.string().optional(),
				birthday: z.string().optional(),
			}),
		},
	},
	async (args) => {
		const contact = await contactsManager.getContact(args.contactName);

		if (!contact) {
			throw new Error("Contact not found");
		}

		const output = { contact };

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(output, null, 2),
				},
			],
			structuredContent: JSON.parse(JSON.stringify(output)),
		};
	},
);

// Register delete contact tool
server.registerTool(
	"delete_contact",
	{
		title: "Delete Contact",
		description: "Delete a contact by name",
		inputSchema: {
			contactName: z.string().describe("Full name of the contact to delete"),
		},
		outputSchema: {
			result: z.string(),
		},
	},
	async (args) => {
		const result = await contactsManager.deleteContact(args.contactName);

		if (!result) {
			throw new Error("Failed to delete contact");
		}

		return {
			content: [
				{
					type: "text",
					text: result,
				},
			],
			structuredContent: { result },
		};
	},
);

// Register a resource for Contacts status
server.registerResource(
	"contacts-status",
	"apple-contacts://status",
	{
		title: "Apple Contacts Status",
		description: "Current status of the Apple Contacts integration",
		mimeType: "text/plain",
	},
	async (uri) => ({
		contents: [
			{
				uri: uri.href,
				text: "Apple Contacts integration initialized and ready",
			},
		],
	}),
);

// Start the server with stdio transport
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Apple Contacts MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
