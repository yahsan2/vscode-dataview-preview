export interface ListItem {
    symbol: string; // '-', '*', '1.' etc
    text: string;
    section: string; // The header this list item belongs to
    line: number;
    task?: string; // 'x', ' ', etc if it is a task
}

export class ListParser {
    public static parse(content: string): ListItem[] {
        const lines = content.split(/\r?\n/);
        const items: ListItem[] = [];
        let currentSection = ''; // Default section (top of file)

        const headerRegex = /^(#{1,6})\s+(.*)/;
        // Simple list regex: space* - or * or 1. space+ text
        const listRegex = /^(\s*)([-*+]|\d+\.)\s+(\[([ xX])\]\s+)?(.*)/;

        lines.forEach((line, index) => {
            // Check for header
            const headerMatch = line.match(headerRegex);
            if (headerMatch) {
                currentSection = headerMatch[2].trim();
                return;
            }

            // Check for list item
            const listMatch = line.match(listRegex);
            if (listMatch) {
                const isTask = !!listMatch[3];
                const taskStatus = listMatch[4];
                const text = listMatch[5].trim();

                items.push({
                    symbol: listMatch[2],
                    text: text,
                    section: currentSection,
                    line: index + 1,
                    task: isTask ? (taskStatus || ' ') : undefined
                });
            }
        });

        return items;
    }
}
