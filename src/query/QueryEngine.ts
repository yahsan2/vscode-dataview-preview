import { PageMetadata } from '../indexer/FrontmatterParser';
import { DataArray } from '../api/DataArray';
import { Query } from './QueryParser';
import { DateTime } from 'luxon';

export class QueryEngine {
    private index: PageMetadata[];

    constructor(index: PageMetadata[]) {
        this.index = index;
    }

    public execute(query: Query): { headers: string[], rows: any[][] } | string[] {
        // 1. Start with all pages
        let data = new DataArray(this.index);

        // 2. Filter by Source (FROM)
        if (query.sources.length > 0) {
            data = data.where(p => {
                return query.sources.some(src => {
                    if (src.startsWith('#')) {
                        // Tag
                        const tag = src.substring(1);
                        return p.tags && (p.tags.includes(tag) || p.tags.includes(src)); 
                    } else if (src.startsWith('"') || src.startsWith("'")) {
                        // Folder/File path
                        const path = src.slice(1, -1);
                        return p.path.includes(path);
                    }
                    return false;
                });
            });
        }

        // 3. FLATTEN
        if (query.flatten) {
            // Expand the array based on the field
            // e.g. FLATTEN file.lists as item
            const field = query.flatten.field;
            const alias = query.flatten.alias;

            const flattened: any[] = [];
            data.forEach(page => {
                const values = this.getValue(page, field);
                if (Array.isArray(values)) {
                    values.forEach(val => {
                        // Create a new object that inherits from page but has the alias
                        const newPage = { ...page, [alias]: val };
                        flattened.push(newPage);
                    });
                } else if (values) {
                    const newPage = { ...page, [alias]: values };
                    flattened.push(newPage);
                }
            });
            data = new DataArray(flattened);
        }

        // 4. Filter by WHERE
        if (query.filter) {
            const filterExp = query.filter;
            data = data.where(p => this.evaluateCondition(p, filterExp));
        }

        // 5. Sort
        if (query.sort) {
            query.sort.forEach(s => {
                data = data.sort(p => this.getValue(p, s.field), s.direction);
            });
        }

        // 6. Limit
        if (query.limit) {
            data = data.limit(query.limit);
        }

        // 7. Select Fields (Output)
        if (query.type === 'TABLE') {
            const headers = query.fields.length > 0 ? query.fields.map(f => f.label) : ['File'];
            const rows = data.map(p => {
                if (query.fields.length === 0) {
                    return [{ path: p.path, name: p.name, type: 'file' }];
                }
                return query.fields.map(f => this.getValue(p, f.expression));
            }).array();
            return { headers, rows };
        } else {
            // LIST
            return data.map(p => {
                if (query.fields.length > 0) {
                    return this.getValue(p, query.fields[0].expression);
                }
                // If flattened, maybe show the item text?
                if (query.flatten && p[query.flatten.alias]) {
                    const item = p[query.flatten.alias];
                    return item.text || item;
                }
                return { path: p.path, name: p.name, type: 'file' };
            }).array();
        }
    }

    private getValue(page: any, field: string): any {
        // Check if field is an alias from FLATTEN
        // field might be "item.text" where item is the alias
        const parts = field.split('.');
        if (parts.length > 1 && page[parts[0]]) {
            // Access property of alias object
            // e.g. item.text, item.section
            const obj = page[parts[0]];
            // Handle nested access like item.section (if section is object) or just properties
            // In our ListParser, section is string. But Obsidian uses item.section.subpath sometimes.
            // Let's support item.section and item.text
            const prop = parts[1];
            if (obj && typeof obj === 'object' && prop in obj) {
                return obj[prop];
            }
            // Special case: item.section.subpath -> we stored section as string
            if (prop === 'section' && parts[2] === 'subpath') {
                 return obj.section; 
            }
        }

        // Handle "file.name", "file.lists", etc.
        if (field.startsWith('file.')) {
            const key = field.substring(5);
            if (key === 'name') return page.name;
            if (key === 'path') return page.path;
            if (key === 'day') return page.day;
            if (key === 'ctime') return DateTime.fromMillis(page.ctime);
            if (key === 'mtime') return DateTime.fromMillis(page.mtime);
            if (key === 'tags') return page.tags;
            if (key === 'lists') return page.lists;
            if (key === 'link') return { path: page.path, name: page.name, type: 'file' };
        }
        
        // Handle frontmatter
        if (page.frontmatter && field in page.frontmatter) {
            return page.frontmatter[field];
        }
        
        // Direct access (alias itself)
        if (field in page) {
            return page[field];
        }

        return null;
    }

    private evaluateCondition(page: PageMetadata, condition: string): boolean {
        // Very basic parser for: field op value
        // e.g. "rating > 3", "file.name != 'foo'"
        
        const match = condition.match(/(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+)/);
        if (!match) return true; // Could not parse, pass through

        const field = match[1].trim();
        const op = match[2];
        const valueStr = match[3].trim();

        const actualValue = this.getValue(page, field);
        
        // Parse valueStr
        let targetValue: any = valueStr;
        if (valueStr.startsWith('"') || valueStr.startsWith("'")) {
            targetValue = valueStr.slice(1, -1);
        } else if (valueStr === 'true') targetValue = true;
        else if (valueStr === 'false') targetValue = false;
        else if (!isNaN(Number(valueStr))) targetValue = Number(valueStr);

        // Compare
        switch (op) {
            case '=': return actualValue == targetValue;
            case '!=': return actualValue != targetValue;
            case '>': return actualValue > targetValue;
            case '<': return actualValue < targetValue;
            case '>=': return actualValue >= targetValue;
            case '<=': return actualValue <= targetValue;
        }
        
        return true;
    }
}
