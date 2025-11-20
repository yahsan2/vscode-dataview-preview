import { DataviewApi } from '../api/DataviewApi';
import { PageMetadata } from '../indexer/FrontmatterParser';
import { QueryParser } from '../query/QueryParser';
import { QueryEngine } from '../query/QueryEngine';

console.log('Dataview Preview script loaded.');

declare global {
    interface Window {
        dataviewIndex?: PageMetadata[];
    }
}

window.addEventListener('vscode.markdown.updateContent', () => {
    renderDataviewBlocks();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDataviewBlocks);
} else {
    renderDataviewBlocks();
}

function renderDataviewBlocks() {
    const index = window.dataviewIndex || [];
    
    // 1. Handle 'dataview' blocks (DQL) - Secure
    const dqlBlocks = document.querySelectorAll('pre > code.language-dataview');
    if (dqlBlocks.length > 0) {
        console.log(`Rendering ${dqlBlocks.length} DQL blocks`);
        const parser = new QueryParser();
        const engine = new QueryEngine(index);
        const dvApi = new DataviewApi(index); // Reuse for table/list rendering

        dqlBlocks.forEach(block => {
            const container = block.parentElement?.parentElement;
            if (!block.parentElement || block.parentElement.getAttribute('data-processed') === 'true') return;
            
            block.parentElement.setAttribute('data-processed', 'true');
            const outputContainer = document.createElement('div');
            outputContainer.className = 'dataview-output';

            try {
                const queryStr = block.textContent || '';
                const query = parser.parse(queryStr);
                const result = engine.execute(query);

                let element: HTMLElement;
                if (query.type === 'TABLE') {
                    const res = result as { headers: string[], rows: any[][] };
                    element = dvApi.table(res.headers, res.rows);
                } else {
                    const res = result as any[];
                    element = dvApi.list(res);
                }
                
                outputContainer.appendChild(element);
            } catch (e: any) {
                outputContainer.innerHTML = `<div style="color:red">Query Error: ${e.message}</div>`;
            }

            block.parentElement.style.display = 'none';
            block.parentElement.insertAdjacentElement('afterend', outputContainer);
        });
    }

    // 2. Handle 'dataviewjs' blocks - Still blocked by CSP usually, but kept for reference
    const jsBlocks = document.querySelectorAll('pre > code.language-dataviewjs');
    if (jsBlocks.length > 0) {
        // ... (Keep existing logic or show warning)
        // For now, let's show a warning that JS is disabled in standard preview
        jsBlocks.forEach(block => {
             if (!block.parentElement || block.parentElement.getAttribute('data-processed') === 'true') return;
             block.parentElement.setAttribute('data-processed', 'true');
             
             const div = document.createElement('div');
             div.style.color = 'orange';
             div.style.border = '1px solid orange';
             div.style.padding = '8px';
             div.textContent = 'DataviewJS (eval) is restricted by VSCode security policies. Please use "dataview" (DQL) blocks instead.';
             
             block.parentElement.insertAdjacentElement('afterend', div);
        });
    }
}
