import * as yaml from 'js-yaml';
import { ListItem } from './ListParser';

export interface PageMetadata {
    path: string;
    name: string;
    ctime: number;
    mtime: number;
    frontmatter: Record<string, any>;
    tags: string[];
    lists: ListItem[];
    [key: string]: any;
}

export class FrontmatterParser {
    /**
     * Parse frontmatter from markdown content
     */
    public static parse(content: string): { frontmatter: Record<string, any>, contentBody: string } {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);

        if (match) {
            try {
                const yamlContent = match[1];
                const frontmatter = yaml.load(yamlContent) as Record<string, any>;
                const contentBody = content.slice(match[0].length);
                return { frontmatter: frontmatter || {}, contentBody };
            } catch (e) {
                console.error('Failed to parse frontmatter:', e);
                return { frontmatter: {}, contentBody: content };
            }
        }

        return { frontmatter: {}, contentBody: content };
    }

    /**
     * Extract tags from content (simple regex approach for Phase 1)
     * Matches #tag
     */
    public static extractTags(content: string): string[] {
        const tagRegex = /#([a-zA-Z0-9_\-/]+)/g;
        const tags = new Set<string>();
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            tags.add(match[1]);
        }
        return Array.from(tags);
    }
}
