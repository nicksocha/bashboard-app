class BashBoard {
    constructor() {
        this.tabCounter = 0;
        this.activeTabId = null;
        this.draggedTab = null;
        this.draggedTabRect = null;
        this.config = {
            allowedFileTypes: [
                'sh', 'txt', 'md', 'json', 'yaml', 'yml', 'xml',
                'py', 'php', 'rb', 'pl', 'java', 'cpp', 'c', 'h',
                'go', 'cs', 'ts', 'tsx', 'html', 'css', 'js',
                'sql', 'bat', 'cmd', 'ps1'
            ],
            maxFileSize: 10 * 1024 * 1024
        };
        this.init();
    }

    init() {
        try {
            this.initializeTheme();
            this.loadSavedFiles();
            this.setupEventListeners();
            this.initializeTabDragAndDrop();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showNotification('Application initialization failed', 'error');
        }
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
        try {
            const storedFiles = JSON.parse(localStorage.getItem('storedFiles')) || [];
            storedFiles.forEach(file => this.addTab(file.name, file.content));
        } catch (error) {
            console.error('Error loading saved files:', error);
            this.showNotification('Failed to load saved files', 'error');
        }
    }

    setupEventListeners() {
        const fileUpload = document.getElementById('file-upload');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const clearStorageBtn = document.getElementById('clear-storage');

        if (fileUpload) {
            fileUpload.addEventListener('change', this.handleFileUpload.bind(this));
        }
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', this.toggleDarkMode.bind(this));
        }
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', this.clearStorage.bind(this));
        }
    }

    initializeTabDragAndDrop() {
        const tabBar = document.getElementById('tab-bar');
        if (!tabBar) return;

        tabBar.addEventListener('mousedown', e => {
            const tab = e.target.closest('.tab');
            if (!tab) return;

            tab.draggable = true;
            tab.addEventListener('dragend', () => {
                tab.draggable = false;
            }, { once: true });
        });

        tabBar.addEventListener('dragstart', e => {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            this.draggedTab = tab;
            tab.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        tabBar.addEventListener('dragover', e => {
            e.preventDefault();
            if (!this.draggedTab) return;

            const tab = e.target.closest('.tab');
            if (!tab || tab === this.draggedTab) return;

            const rect = tab.getBoundingClientRect();
            const next = e.clientX - rect.left > rect.width / 2;

            if (next && tab.nextSibling !== this.draggedTab) {
                tab.parentNode.insertBefore(this.draggedTab, tab.nextSibling);
            } else if (!next && tab.previousSibling !== this.draggedTab) {
                tab.parentNode.insertBefore(this.draggedTab, tab);
            }
        });

        tabBar.addEventListener('dragend', () => {
            if (!this.draggedTab) return;
            this.draggedTab.classList.remove('dragging');
            this.updateTabOrder();
            this.draggedTab = null;
        });
    }

    updateTabOrder() {
        const tabBar = document.getElementById('tab-bar');
        if (!tabBar) return;

        const reorderedTabs = [...tabBar.querySelectorAll('.tab')].map(tab => {
            const tabContent = document.getElementById(tab.id.replace('tab-', 'content-'));
            return {
                name: tab.textContent.replace('×', '').trim(),
                content: tabContent ? tabContent.innerHTML : ''
            };
        });

        localStorage.setItem('storedFiles', JSON.stringify(reorderedTabs));
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!this.validateFile(file)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = this.sanitizeContent(e.target.result);
                this.addTab(file.name, content);
                this.saveFileToStorage(file.name, content);
                event.target.value = '';
            } catch (error) {
                console.error('Error processing file:', error);
                this.showNotification('Failed to process file', 'error');
            }
        };

        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };

        reader.readAsText(file);
    }

    validateFile(file) {
        if (!file) {
            this.showNotification('Please select a file', 'error');
            return false;
        }

        if (file.size > this.config.maxFileSize) {
            this.showNotification('File size exceeds 10MB limit', 'error');
            return false;
        }

        const fileType = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFileTypes.includes(fileType)) {
            this.showNotification('Unsupported file type', 'error');
            return false;
        }

        return true;
    }

    sanitizeContent(content) {
        if (typeof content !== 'string') {
            throw new Error('Invalid content type');
        }
        return content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[^\S\r\n]+$/gm, '');
    }

    addTab(fileName, content) {
        this.tabCounter++;
        const tabId = `tab-${this.tabCounter}`;

        const tab = this.createTabElement(fileName, tabId);
        const tabContent = this.createTabContent(content, this.tabCounter);

        const tabBar = document.getElementById('tab-bar');
        const contentContainer = document.getElementById('tab-content-container');

        if (tabBar && contentContainer) {
            tabBar.appendChild(tab);
            contentContainer.appendChild(tabContent);
            this.activateTab(tabId);
        }
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

    displaySnippets(content, container) {
        const lines = content.split('\n');
        let comment = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (trimmedLine.startsWith('#')) {
                comment = trimmedLine;
            } else {
                const commandBox = this.createCommandBox(trimmedLine, comment);
                container.appendChild(commandBox);
                comment = null;
            }
        });
    }

    createCommandBox(command, comment) {
        const commandBox = document.createElement('div');
        commandBox.classList.add('command-box');

        if (comment) {
            const commentText = document.createElement('p');
            commentText.textContent = comment;
            commentText.classList.add('comment');
            commandBox.appendChild(commentText);
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
        copyButton.onclick = () => this.copyToClipboard(command);

        const commandText = document.createElement('pre');
        commandText.textContent = command;

        commandWrapper.appendChild(copyButton);
        commandWrapper.appendChild(commandText);
        commandBox.appendChild(commandWrapper);

        return commandBox;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification('Copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy:', err);
                this.showNotification('Failed to copy', 'error');
            });
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.visibility = 'visible';
            notification.style.opacity = '1';

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.visibility = 'hidden';
            }, 2000);
        }
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

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) toggle.checked = true;
        localStorage.setItem('darkMode', 'enabled');
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) toggle.checked = false;
        localStorage.setItem('darkMode', 'disabled');
    }

    toggleDarkMode() {
        document.body.classList.contains('dark-mode')
            ? this.disableDarkMode()
            : this.enableDarkMode();
    }

    clearStorage() {
        localStorage.removeItem('storedFiles');
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bashBoard = new BashBoard();
});