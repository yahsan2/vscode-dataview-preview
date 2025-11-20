export type QueryType = 'TABLE' | 'LIST' | 'TASK';

export interface Query {
    type: QueryType;
    fields: { expression: string, label: string }[]; 
    sources: string[]; 
    flatten?: { field: string, alias: string }; 
    filter?: string; 
    sort?: { field: string, direction: 'asc' | 'desc' }[]; 
    limit?: number;
}

export class QueryParser {
    public parse(queryString: string): Query {
        // Normalize
        const q = queryString.trim();
        
        // Determine type
        let type: QueryType = 'LIST';
        let rest = q;

        if (q.match(/^TABLE/i)) {
            type = 'TABLE';
            rest = q.substring(5);
        } else if (q.match(/^LIST/i)) {
            type = 'LIST';
            rest = q.substring(4);
        } else if (q.match(/^TASK/i)) {
            type = 'TASK';
            rest = q.substring(4);
        }

        const parts = this.splitByKeywords(rest);
        
        const fieldsStr = parts.fields ? parts.fields.split(',') : [];
        const fields = fieldsStr.map(s => {
            const trimmed = s.trim();
            if (!trimmed) return null;
            
            // Check for AS
            // e.g. file.day AS "Date"
            const match = trimmed.match(/^(.*?)\s+AS\s+(.*)$/i);
            if (match) {
                const expr = match[1].trim();
                let label = match[2].trim();
                // Remove quotes from label if present
                if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
                    label = label.slice(1, -1);
                }
                return { expression: expr, label: label };
            }
            return { expression: trimmed, label: trimmed };
        }).filter(f => f !== null) as { expression: string, label: string }[];

        const sources = parts.from ? [parts.from.trim()] : [];
        const filter = parts.where ? parts.where.trim() : undefined;
        
        let flatten: { field: string, alias: string } | undefined;
        if (parts.flatten) {
            // FLATTEN field AS alias
            const match = parts.flatten.match(/(.*?)\s+as\s+(.*)/i);
            if (match) {
                flatten = { field: match[1].trim(), alias: match[2].trim() };
            } else {
                // Default alias? For now require AS
                flatten = { field: parts.flatten.trim(), alias: parts.flatten.trim() };
            }
        }
        
        const sort: { field: string, direction: 'asc' | 'desc' }[] = [];
        if (parts.sort) {
            const sortParts = parts.sort.split(',');
            sortParts.forEach(s => {
                const trimmed = s.trim();
                const match = trimmed.match(/(.*?)\s+(asc|desc)$/i);
                if (match) {
                    sort.push({ field: match[1], direction: match[2].toLowerCase() as 'asc' | 'desc' });
                } else {
                    sort.push({ field: trimmed, direction: 'asc' });
                }
            });
        }

        return {
            type,
            fields,
            sources,
            flatten,
            filter,
            sort,
            limit: parts.limit ? parseInt(parts.limit) : undefined
        };
    }

    private splitByKeywords(text: string): Record<string, string> {
        const keywords = ['FROM', 'WHERE', 'SORT', 'LIMIT', 'FLATTEN'];
        const result: Record<string, string> = { fields: '' };
        
        let currentKey = 'fields';
        // ... (rest of the method is same, just regex needs to include FLATTEN)
        const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
        
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const keyword = match[1].toLowerCase();
            const content = text.substring(lastIndex, match.index).trim();
            
            if (currentKey) {
                result[currentKey] = content;
            }
            
            currentKey = keyword; 
            lastIndex = regex.lastIndex;
        }
        
        if (currentKey) {
            result[currentKey] = text.substring(lastIndex).trim();
        }

        return result;
    }
}
