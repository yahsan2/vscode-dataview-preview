import * as vscode from 'vscode';
import { FileIndexer } from './indexer/FileIndexer';
import { QueryParser } from './query/QueryParser';
import { QueryEngine } from './query/QueryEngine';
import { DateTime } from 'luxon';

export async function activate(context: vscode.ExtensionContext) {
    const fileIndexer = new FileIndexer();
    fileIndexer.init(); // Start async init
    context.subscriptions.push(fileIndexer);

    // Index the current active file immediately if it's markdown
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
        fileIndexer.indexFile(vscode.window.activeTextEditor.document.uri);
    }

    // Also listen for active editor changes to index new files as they are opened
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
        if (editor && editor.document.languageId === 'markdown') {
            await fileIndexer.indexFile(editor.document.uri);
            // Refresh preview to update rendered HTML
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    // Refresh preview when file is saved (and indexed)
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async doc => {
        if (doc.languageId === 'markdown') {
            // Re-index is handled by watcher in FileIndexer, but we need to refresh preview
            // Wait a bit for watcher to finish indexing
            setTimeout(() => {
                vscode.commands.executeCommand('markdown.preview.refresh');
            }, 500);
        }
    }));

    // Command to manually re-index
    context.subscriptions.push(vscode.commands.registerCommand('dataview.reindex', async () => {
        vscode.window.showInformationMessage('Re-indexing Dataview...');
        // Re-scan all files in workspace if available, or just active file
        if (vscode.workspace.workspaceFolders) {
             // We need to expose scanWorkspace or just re-init
             fileIndexer.init(); 
        } else if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
             fileIndexer.indexFile(vscode.window.activeTextEditor.document.uri);
        }
        
        const index = fileIndexer.getIndex();
        vscode.window.showInformationMessage(`Indexed ${index.length} files. Refreshing preview...`);
        vscode.commands.executeCommand('markdown.preview.refresh');
    }));

    return {
        extendMarkdownIt(md: any) {
            const defaultRender = md.renderer.rules.fence || function(tokens: any, idx: any, options: any, env: any, self: any) {
                return self.renderToken(tokens, idx, options);
            };

            md.renderer.rules.fence = function(tokens: any, idx: any, options: any, env: any, self: any) {
                const token = tokens[idx];
                const lang = token.info.trim();

                if (lang === 'dataview') {
                    try {
                        const code = token.content;
                        const parser = new QueryParser();
                        const query = parser.parse(code);
                        const engine = new QueryEngine(fileIndexer.getIndex());
                        const result = engine.execute(query);

                        // Render HTML based on result type
                        if (Array.isArray(result)) {
                            // LIST
                            if (result.length === 0) {
                                return '<p class="dataview-empty">No results</p>';
                            }
                            const listItems = result.map((item: any) => {
                                let text = String(item);
                                if (item === null || item === undefined) return '';
                                
                                if (typeof item === 'object' && item.path) {
                                    const uri = vscode.Uri.file(item.path);
                                    const args = encodeURIComponent(JSON.stringify([uri]));
                                    text = `<a href="command:vscode.open?${args}">${item.name}</a>`;
                                }
                                return `<li>${text}</li>`;
                            }).join('');
                            return `<ul class="dataview-list">${listItems}</ul>`;
                        } else {
                            // TABLE
                            const { headers, rows } = result;
                            if (rows.length === 0) {
                                return '<p class="dataview-empty">No results</p>';
                            }
                            
                            const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
                            const rowsHtml = rows.map(row => {
                                const cells = row.map(cell => {
                                    let content = cell;
                                    
                                    // Handle null/undefined
                                    if (cell === null || cell === undefined) {
                                        content = '';
                                    } else if (cell && typeof cell === 'object') {
                                        if (cell.type === 'file') {
                                            const uri = vscode.Uri.file(cell.path);
                                            const args = encodeURIComponent(JSON.stringify([uri]));
                                            content = `<a href="command:vscode.open?${args}">${cell.name}</a>`;
                                        } else if (cell instanceof DateTime) {
                                            content = cell.toFormat('yyyy-MM-dd');
                                        } else if (Array.isArray(cell)) {
                                            content = cell.join(', ');
                                        } else {
                                            content = JSON.stringify(cell);
                                        }
                                    } else if (typeof cell === 'string') {
                                        // Try to parse ISO date string
                                        // e.g. "2025-12-01T00:00:00.000Z"
                                        const isoDate = DateTime.fromISO(cell);
                                        if (isoDate.isValid) {
                                            content = isoDate.toFormat('yyyy-MM-dd');
                                        }
                                    }
                                    
                                    return `<td>${content}</td>`;
                                }).join('');
                                return `<tr>${cells}</tr>`;
                            }).join('');

                            // Inject CSS for better styling
                            const styles = `
                                <style>
                                    .dataview-table {
                                        border-collapse: collapse;
                                        width: 100%;
                                        margin: 1.5em 0;
                                        font-size: 1em;
                                    }
                                    .dataview-table th {
                                        text-align: left;
                                        padding: 12px 10px;
                                        border-bottom: 1px solid var(--vscode-widget-border);
                                        font-weight: 600;
                                        color: var(--vscode-editor-foreground);
                                        opacity: 0.9;
                                    }
                                    .dataview-table td {
                                        padding: 10px;
                                        border-bottom: 1px solid var(--vscode-widget-border);
                                        color: var(--vscode-descriptionForeground);
                                    }
                                    .dataview-table tr:hover td {
                                        background-color: var(--vscode-list-hoverBackground);
                                        color: var(--vscode-editor-foreground);
                                    }
                                    .dataview-list {
                                        margin: 1em 0;
                                        padding-left: 1.5em;
                                    }
                                    .dataview-empty {
                                        color: var(--vscode-descriptionForeground);
                                        font-style: italic;
                                        padding: 1em 0;
                                    }
                                </style>
                            `;

                            return `
                                ${styles}
                                <table class="dataview-table">
                                    <thead><tr>${headerHtml}</tr></thead>
                                    <tbody>${rowsHtml}</tbody>
                                </table>
                            `;
                        }
                    } catch (e: any) {
                        return `<div style="color: red;">Dataview Error: ${e.message || e}</div>`;
                    }
                }

                return defaultRender(tokens, idx, options, env, self);
            };
            
            return md;
        }
    };
    if (fileIndexer) {
        fileIndexer.dispose();
    }
}
