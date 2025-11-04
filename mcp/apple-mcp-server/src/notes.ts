import { exec } from "node:child_process";
import { promisify } from "node:util";

export interface Note {
	id: string;
	name: string;
	body: string;
}

export class NotesManager {
	private execAsync = promisify(exec);

	async executeAppleScript(script: string) {
		try {
			const { stdout, stderr } = await this.execAsync(
				`osascript -e '${script}'`,
			);
			if (stderr) console.error(`AppleScript error: ${stderr}`);
			return stdout.trim();
		} catch (error: unknown) {
			console.error(`Error executing AppleScript: ${(error as Error).message}`);
			return null;
		}
	}

	async searchNotes(query: string): Promise<Note[] | null> {
		const script = `
      tell application "Notes"
        set searchResults to ""
        repeat with n in notes
          if (name of n contains "${query}") or (body of n contains "${query}") then
            if searchResults is not "" then
              set searchResults to searchResults & ":::"
            end if
            set searchResults to searchResults & (id of n) & "|||" & (name of n) & "|||" & (body of n)
          end if
        end repeat
        return searchResults
      end tell
    `;

		const result = await this.executeAppleScript(script);
		if (result) {
			const noteStrings = result.split(":::");
			const notes: Note[] = noteStrings.map((noteStr) => {
				const [id, name, body] = noteStr.split("|||");
				return { id, name, body } as Note;
			});
			return notes;
		}
		return null;
	}

	async createNote(title: string, body = "") {
		const script = `
      tell application "Notes"
        make new note with properties {name:"${title}", body:"${body}"}
        return "Note created: ${title}"
      end tell
    `;

		const result = await this.executeAppleScript(script);
		return result;
	}

	async editNote(noteTitle: string, newBody: string) {
		const script = `
      tell application "Notes"
        repeat with n in notes
          if name of n is "${noteTitle}" then
            set body of n to "${newBody}"
            return "Note updated: ${noteTitle}"
          end if
        end repeat
        return "Note not found: ${noteTitle}"
      end tell
    `;

		const result = await this.executeAppleScript(script);
		return result;
	}

	async listNotes(): Promise<Note[] | null> {
		const script = `
      tell application "Notes"
        set noteList to ""
        repeat with n in notes
          if noteList is not "" then
            set noteList to noteList & ":::"
          end if
          set noteList to noteList & (id of n) & "|||" & (name of n) & "|||" & (body of n)
        end repeat
        return noteList
      end tell
    `;

		const result = await this.executeAppleScript(script);
		if (result) {
			const noteStrings = result.split(":::");
			const notes: Note[] = noteStrings.map((noteStr) => {
				const [id, name, body] = noteStr.split("|||");
				return { id, name, body } as Note;
			});
			return notes;
		}
		return null;
	}

	async getNoteContent(noteTitle: string) {
		const script = `
      tell application "Notes"
        repeat with n in notes
          if name of n is "${noteTitle}" then
            return body of n
          end if
        end repeat
        return "Note not found: ${noteTitle}"
      end tell
    `;

		const result = await this.executeAppleScript(script);
		return result;
	}
}
