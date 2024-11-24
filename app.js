class BashBoard {
    constructor() {
        this.tabCounter = 0;
        this.activeTabId = null;
        this.config = {
            allowedFileTypes: ['sh', 'txt', 'md', 'json', 'yaml', 'yml', 'xml', 'py', 'php', 'rb', 'pl', 'java', 'cpp', 'c', 'h', 'go', 'cs', 'ts', 'tsx', 'html', 'css', 'js', 'sql', 'bat', 'cmd', 'ps1']
        };
    }

    init() {
        this.initializeTheme();
        this.loadSavedFiles();
        this.setupEventListeners();
        this.initializeTabReordering();
    }

    initializeTheme() {
        const userPreference = localStorage.getItem('darkMode');
        if (userPreference) {
            userPreference === 'enabled' ? this.enableDarkMode() : this.disableDarkMode();
        } else {
            window.matchMedia('(prefers-color-scheme: dark)').matches && this.enableDarkMode();
        }
    }

    loadSavedFiles() {
        const storedFiles = JSON.parse(localStorage.getItem('storedFiles')) || [];
        storedFiles.forEach(file => this.addTab(file.name, file.content));
    }

    setupEventListeners() {
        document.getElementById('file-upload').addEventListener('change', this.handleFileUpload.bind(this));
        document.getElementById('dark-mode-toggle').addEventListener('change', this.toggleDarkMode.bind(this));
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!this.validateFile(file)) return;

        const reader = new FileReader();
        reader.onload = e => {
            const content = this.sanitizeContent(e.target.result);
            this.addTab(file.name, content);
            this.saveFileToStorage(file.name, content);
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    validateFile(file) {
        if (!file) {
            this.showNotification('Please upload a valid file.', 'error');
            return false;
        }

        const fileType = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFileTypes.includes(fileType)) {
            this.showNotification('Unsupported file type.', 'error');
            return false;
        }
        return true;
    }

    sanitizeContent(content) {
        return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    addTab(fileName, content) {
        this.tabCounter++;
        const tabId = `tab-${this.tabCounter}`;

        const tab = this.createTabElement(fileName, tabId);
        const tabContent = this.createTabContent(content, this.tabCounter);

        document.getElementById('tab-bar').appendChild(tab);
        document.getElementById('tab-content-container').appendChild(tabContent);

        this.activateTab(tabId);
        this.initializeTabReordering();
    }

    createTabElement(fileName, tabId) {
        const tab = document.createElement('div');
        tab.classList.add('tab');
        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');
        tab.textContent = fileName;
        tab.onclick = () => this.activateTab(tabId);

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-tab');
        closeButton.setAttribute('aria-label', 'Close tab');
        closeButton.textContent = '×';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
            this.removeFileFromStorage(fileName);
        };
        tab.appendChild(closeButton);

        return tab;
    }

    createTabContent(content, tabCounter) {
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.id = `content-${tabCounter}`;
        this.displaySnippets(content, tabContent);
        return tabContent;
    }

    displaySnippets(content, container) {
        const lines = content.split('\n');
        let comment = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (trimmedLine.startsWith('#')) {
                comment = trimmedLine;
            } else {
                const commandBox = document.createElement('div');
                commandBox.classList.add('command-box');

                if (comment) {
                    const commentText = document.createElement('p');
                    commentText.textContent = comment;
                    commentText.classList.add('comment');
                    commandBox.appendChild(commentText);
                    comment = null;
                }

                const commandWrapper = document.createElement('div');
                commandWrapper.classList.add('command-wrapper');

                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-button');
                copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M19 9h-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v4h10a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2zM5 17V5h8v4H9a2 2 0 0 0-2 2v6zm14 4H9V11h10z"/>
                    </svg>
                `;
                copyButton.onclick = () => this.copyToClipboard(trimmedLine);

                const commandText = document.createElement('pre');
                commandText.textContent = trimmedLine;

                commandWrapper.appendChild(copyButton);
                commandWrapper.appendChild(commandText);
                commandBox.appendChild(commandWrapper);
                container.appendChild(commandBox);
            }
        });
    }

    activateTab(tabId) {
        const allTabs = document.querySelectorAll('.tab');
        const allContent = document.querySelectorAll('.tab-content');

        allTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        allContent.forEach(content => content.classList.remove('active'));

        const tab = document.getElementById(tabId);
        const content = document.getElementById(`content-${tabId.split('-')[1]}`);

        if (tab && content) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            content.classList.add('active');
            this.activeTabId = tabId;
        }
    }

    closeTab(tabId) {
        const tab = document.getElementById(tabId);
        const content = document.getElementById(`content-${tabId.split('-')[1]}`);

        if (tab && content) {
            tab.remove();
            content.remove();

            const remainingTabs = document.querySelectorAll('.tab');
            if (remainingTabs.length > 0) {
                this.activateTab(remainingTabs[0].id);
            } else {
                this.activeTabId = null;
            }
        }
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
        localStorage.setItem('darkMode', 'enabled');
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        document.getElementById('dark-mode-toggle').checked = false;
        localStorage.setItem('darkMode', 'disabled');
    }

    toggleDarkMode() {
        if (document.body.classList.contains('dark-mode')) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification('Copied to clipboard!'))
            .catch(err => {
                console.error('Error copying text:', err);
                this.showNotification('Failed to copy.', 'error');
            });
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.visibility = 'visible';
        notification.style.opacity = '1';

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.visibility = 'hidden';
        }, 2000);
    }

    saveFileToStorage(fileName, content) {
        let storedFiles = JSON.parse(localStorage.getItem('storedFiles')) || [];
        storedFiles.push({ name: fileName, content: content });
        localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
    }

    removeFileFromStorage(fileName) {
        let storedFiles = JSON.parse(localStorage.getItem('storedFiles')) || [];
        storedFiles = storedFiles.filter(file => file.name !== fileName);
        localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
    }

    initializeTabReordering() {
        const tabBar = document.getElementById('tab-bar');
        if (window.Sortable) {
            Sortable.create(tabBar, {
                animation: 150,
                onEnd: function () {
                    const reorderedTabs = [...document.querySelectorAll('.tab')].map(tab => {
                        const tabContent = document.getElementById(tab.id.replace('tab-', 'content-'));
                        return { name: tab.textContent.replace('×', '').trim(), content: tabContent.innerHTML };
                    });
                    localStorage.setItem('storedFiles', JSON.stringify(reorderedTabs));
                }
            });
        }
    }

    clearStorage() {
        localStorage.removeItem('storedFiles');
        location.reload();
    }
}

// Initialize the app when the window loads
window.addEventListener('load', () => {
    window.bashBoard = new BashBoard();
    window.bashBoard.init();
});