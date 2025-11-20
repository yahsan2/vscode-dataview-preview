import * as vscode from 'vscode';
import * as fs from 'fs';
import { FrontmatterParser, PageMetadata } from './FrontmatterParser';
import { ListParser } from './ListParser';
import { DateTime } from 'luxon';

export class FileIndexer {
    private index: Map<string, PageMetadata> = new Map();
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor() {}

    public async init() {
        // Initial scan
        await this.scanWorkspace();

        // Watch for changes
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.md');
        this.watcher.onDidChange(uri => this.indexFile(uri));
        this.watcher.onDidCreate(uri => this.indexFile(uri));
        this.watcher.onDidDelete(uri => this.removeFile(uri));
    }

    public getIndex(): PageMetadata[] {
        return Array.from(this.index.values());
    }

    private async scanWorkspace() {
        const files = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**');
        console.log(`Scanning ${files.length} markdown files...`);
        
        for (const file of files) {
            await this.indexFile(file);
        }
        console.log('Scan complete.');
    }

    public async indexFile(uri: vscode.Uri) {
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf-8');
            const stats = await fs.promises.stat(uri.fsPath);
            
            const { frontmatter, contentBody } = FrontmatterParser.parse(content);
            
            // Extract tags
            let tags: string[] = [];
            if (frontmatter.tags) {
                if (Array.isArray(frontmatter.tags)) {
                    tags = [...frontmatter.tags];
                } else if (typeof frontmatter.tags === 'string') {
                    tags = frontmatter.tags.split(',').map(t => t.trim());
                }
            }
            const bodyTags = FrontmatterParser.extractTags(contentBody);
            tags = [...new Set([...tags, ...bodyTags])];

            // Parse lists
            const lists = ListParser.parse(content);

            // Resolve file.day
            let day: any = null;
            // 1. Try frontmatter 'date'
            if (frontmatter.date) {
                day = frontmatter.date; // Assuming string or date object
            } 
            // 2. Try filename yyyy-mm-dd
            if (!day) {
                const name = uri.path.split('/').pop() || '';
                const match = name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (match) {
                    // Create date from filename
                    day = `${match[1]}-${match[2]}-${match[3]}`;
                }
            }

            const metadata: PageMetadata = {
                path: uri.fsPath,
                name: uri.path.split('/').pop() || '',
                ctime: stats.birthtimeMs,
                mtime: stats.mtimeMs,
                frontmatter,
                tags,
                lists,
                day: day ? DateTime.fromISO(new Date(day).toISOString()) : null
            };

            this.index.set(uri.fsPath, metadata);
        } catch (e) {
            console.error(`Error indexing file ${uri.fsPath}:`, e);
        }
    }

    private removeFile(uri: vscode.Uri) {
        this.index.delete(uri.fsPath);
    }

    public dispose() {
        this.watcher?.dispose();
    }
}
