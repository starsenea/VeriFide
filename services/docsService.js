class DocsService {
    async initialize() {
        try {
            // Just verify we can get a token
            const token = await this.getAuthToken();
            return token ? true : false;
        } catch (error) {
            console.error('Error initializing Docs API:', error);
            throw error;
        }
    }

    async getAuthToken() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
    }

    async getDocContent(docId) {
        try {
            const token = await this.getAuthToken();
            console.log('Got auth token:', token ? 'Yes' : 'No'); // Debug log

            const response = await fetch(
                `https://docs.googleapis.com/v1/documents/${docId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch document: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw document data:', data); // Debug log

            return this.parseDocument(data);
        } catch (error) {
            console.error('Error fetching document:', error);
            throw error;
        }
    }

    parseDocument(document) {
        if (!document.body || !document.body.content) {
            throw new Error('Invalid document structure');
        }

        let text = '';
        const content = document.body.content;
        
        const processContent = (elements) => {
            for (const element of elements) {
                if (element.paragraph) {
                    for (const paragraphElement of element.paragraph.elements) {
                        if (paragraphElement.textRun) {
                            text += paragraphElement.textRun.content;
                        }
                    }
                    text += '\n';
                }
                
                if (element.table) {
                    for (const row of element.table.tableRows) {
                        for (const cell of row.tableCells) {
                            if (cell.content) {
                                processContent(cell.content);
                            }
                        }
                    }
                }
            }
        };

        processContent(content);
        return text.trim();
    }
}

export default new DocsService(); 