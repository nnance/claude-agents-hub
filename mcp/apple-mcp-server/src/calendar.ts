import { exec } from "node:child_process";
import { promisify } from "node:util";

// Load and validate required environment variable
const DEFAULT_CALENDAR_NAME = process.env.APPLE_CALENDAR_NAME || "Calendar";

export interface CalendarEvent {
	summary: string;
	startDate: string;
	endDate: string;
	calendar: string;
}

export interface EventDetail extends CalendarEvent {
	description: string;
	location: string;
	url: string;
}

export class CalendarManager {
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

	async listCalendars(): Promise<string[] | null> {
		const script = `
      tell application "Calendar"
        set calendarList to {}
        repeat with c in calendars
          set end of calendarList to name of c
        end repeat
        return calendarList
      end tell
    `;

		const result = await this.executeAppleScript(script);
		// return as array
		if (result) {
			return result.split(", ");
		}
		return null;
	}

	async listEvents(
		calendarName = DEFAULT_CALENDAR_NAME,
		days = 7,
	): Promise<CalendarEvent[] | null> {
		const script = `
      tell application "Calendar"
        set startDate to (current date)
        set targetDate to startDate + (${days} * days)
        set eventList to ""
        tell calendar "${calendarName}"
          set filteredEvents to (events whose start date ≥ startDate and start date ≤ targetDate)
          repeat with e in filteredEvents
            if eventList is not "" then
              set eventList to eventList & ":::"
            end if
            set eventList to eventList & (summary of e) & "|||" & (start date of e as string) & "|||" & (end date of e as string) & "|||" & "${calendarName}"
          end repeat
        end tell
        return eventList
      end tell
    `;

		const result = await this.executeAppleScript(script);
		// return as array of events with properties: summary, startDate, endDate, calendar
		if (result) {
			const eventStrings = result.split(":::");
			const events: CalendarEvent[] = eventStrings.map((eventStr) => {
				const [summary, startDate, endDate, calendar] = eventStr.split("|||");
				return { summary, startDate, endDate, calendar } as CalendarEvent;
			});
			return events;
		}
		return null;
	}

	async searchEvents(
		query: string,
		calendarName = DEFAULT_CALENDAR_NAME,
		days = 90,
	): Promise<CalendarEvent[] | null> {
		const script = `
      tell application "Calendar"
        set searchResults to ""
        set startDate to (current date)
        set endDate to startDate + (${days} * days)
        tell calendar "${calendarName}"
          set filteredEvents to (events whose start date ≥ startDate and start date ≤ endDate)
          repeat with e in filteredEvents
            if (summary of e contains "${query}") or (description of e contains "${query}") then
              if searchResults is not "" then
                set searchResults to searchResults & ":::"
              end if
              set searchResults to searchResults & (summary of e) & "|||" & (start date of e as string) & "|||" & (end date of e as string) & "|||" & "${calendarName}"
            end if
          end repeat
        end tell
        return searchResults
      end tell
    `;

		const result = await this.executeAppleScript(script);
		if (result) {
			const eventStrings = result.split(":::");
			const events: CalendarEvent[] = eventStrings.map((eventStr) => {
				const [summary, startDate, endDate, calendar] = eventStr.split("|||");
				return { summary, startDate, endDate, calendar } as CalendarEvent;
			});
			return events;
		}
		return null;
	}

	async createEvent(
		calendarName: string,
		title: string,
		startDate: string,
		endDate: string,
		description = "",
	) {
		const script = `
      tell application "Calendar"
        tell calendar "${calendarName}"
          set newEvent to make new event with properties {summary:"${title}", start date:date "${startDate}", end date:date "${endDate}", description:"${description}"}
          return "Event created: ${title}"
        end tell
      end tell
    `;

		const result = await this.executeAppleScript(script);
		return result;
	}

	async deleteEvent(calendarName: string, eventTitle: string) {
		const script = `
      tell application "Calendar"
        tell calendar "${calendarName}"
          set deleted to false
          repeat with e in events
            if summary of e is "${eventTitle}" then
              delete e
              set deleted to true
              exit repeat
            end if
          end repeat
          if deleted then
            return "Event deleted: ${eventTitle}"
          else
            return "Event not found: ${eventTitle}"
          end if
        end tell
      end tell
    `;

		const result = await this.executeAppleScript(script);
		return result;
	}

	async getTodayEvents() {
		// Just use the optimized listEvents function with 1 day
		return this.listEvents(DEFAULT_CALENDAR_NAME, 1);
	}

	async getEventDetails(
		calendarName: string,
		eventTitle: string,
	): Promise<EventDetail | null> {
		const script = `
      tell application "Calendar"
        tell calendar "${calendarName}"
          repeat with e in events
            if summary of e is "${eventTitle}" then
              return (summary of e) & "|||" & (start date of e as string) & "|||" & (end date of e as string) & "|||" & "${calendarName}" & "|||" & (description of e) & "|||" & (location of e) & "|||" & (url of e)
            end if
          end repeat
          return ""
        end tell
      end tell
    `;

		const result = await this.executeAppleScript(script);
		if (result) {
			const [
				summary,
				startDate,
				endDate,
				calendar,
				description,
				location,
				url,
			] = result.split("|||");
			return {
				summary,
				startDate,
				endDate,
				calendar,
				description,
				location,
				url,
			} as EventDetail;
		}
		return null;
	}
}
