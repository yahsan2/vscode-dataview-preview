import { PageMetadata } from '../indexer/FrontmatterParser';
import { DateTime } from 'luxon';
import { DataArray } from './DataArray';

export class DataviewApi {
    private index: PageMetadata[];

    constructor(index: PageMetadata[]) {
        this.index = index;
    }

    /**
     * Get all pages or filter by query
     * @param query Source query (e.g. "#tag", "folder")
     */
    public pages(query: string = ""): DataArray<any> {
        let pages = this.index.map(p => new PageObject(p));

        if (!query) {
            return new DataArray(pages);
        }

        // Basic filtering for Phase 1
        // Support: #tag, "folder"
        const q = query.trim();
        if (q.startsWith('#')) {
            const tag = q.substring(1);
            pages = pages.filter(p => p.file.tags.has(tag));
        } else if (q.startsWith('"') && q.endsWith('"')) {
            const folder = q.slice(1, -1);
            pages = pages.filter(p => p.file.path.includes(folder));
        }

        return new DataArray(pages);
    }

    /**
     * Create a data array from a raw array
     */
    public array(values: any[]): DataArray<any> {
        return new DataArray(values);
    }

    /**
     * Render a table
     */
    public table(headers: string[], values: any[] | DataArray<any>) {
        const container = document.createElement('div');
        container.className = 'dataview-table-container';
        
        const table = document.createElement('table');
        table.className = 'dataview-table';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.border = '1px solid #444';
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        
        // Handle DataArray or standard Array
        const rows = values instanceof DataArray ? values.array() : values;

        rows.forEach((row: any) => {
            const tr = document.createElement('tr');
            
            // Handle if row is not an array (single value)
            const cells = Array.isArray(row) ? row : [row];

            cells.forEach((cell: any) => {
                const td = document.createElement('td');
                td.style.border = '1px solid #444';
                td.style.padding = '8px';
                
                // Handle rendering of different types (links, dates, etc.)
                if (cell instanceof HTMLElement) {
                    td.appendChild(cell);
                } else if (typeof cell === 'object' && cell !== null && cell.path && cell.type === 'file') {
                    // Link object
                    const a = document.createElement('a');
                    a.href = cell.path; 
                    a.textContent = cell.name || cell.path;
                    a.title = cell.path;
                    // Add click handler to open file in VSCode
                    a.onclick = (e) => {
                        e.preventDefault();
                        // We need a way to message the extension to open the file
                        // For now, just log or use command URI if possible
                        // In preview, we can use command: links
                        // a.href = `command:vscode.open?${encodeURIComponent(JSON.stringify(vscode.Uri.file(cell.path)))}`;
                    };
                    td.appendChild(a);
                } else if (DateTime.isDateTime(cell)) {
                    td.textContent = cell.toFormat("yyyy-MM-dd HH:mm");
                } else {
                    td.textContent = String(cell);
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        return container;
    }

    /**
     * Render a list
     */
    public list(values: any[] | DataArray<any>) {
        const ul = document.createElement('ul');
        const items = values instanceof DataArray ? values.array() : values;
        
        items.forEach((v: any) => {
            const li = document.createElement('li');
            // Basic rendering logic similar to table cell
            if (typeof v === 'object' && v !== null && v.path && v.type === 'file') {
                const a = document.createElement('a');
                a.href = v.path;
                a.textContent = v.name;
                li.appendChild(a);
            } else {
                li.textContent = String(v);
            }
            ul.appendChild(li);
        });
        return ul;
    }
    
    public span(text: string) {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
    }
}

class PageObject {
    file: {
        path: string;
        name: string;
        ctime: DateTime;
        mtime: DateTime;
        tags: Set<string>;
        link: { path: string; display: string; type: 'file' };
        [key: string]: any;
    };
    [key: string]: any;

    constructor(metadata: PageMetadata) {
        this.file = {
            path: metadata.path,
            name: metadata.name,
            ctime: DateTime.fromMillis(metadata.ctime),
            mtime: DateTime.fromMillis(metadata.mtime),
            tags: new Set(metadata.tags),
            link: { path: metadata.path, display: metadata.name, type: 'file' }
        };

        // Flatten frontmatter properties onto the object
        if (metadata.frontmatter) {
            Object.assign(this, metadata.frontmatter);
        }
    }
}
