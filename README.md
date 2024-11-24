# BashBoard ⌨️

BashBoard is a lightweight, browser-based snippet manager designed for developers working with various file types such as bash scripts, configuration files, and code snippets. Built with vanilla JavaScript, it offers an intuitive interface for managing and accessing your code snippets with no external dependencies.

## Features

- **Multi-file Support**: Handle multiple files simultaneously with a tabbed interface
- **Drag & Drop**: Reorder tabs with intuitive drag-and-drop functionality
- **File Types**: Support for numerous file types including:
  - Shell scripts (.sh)
  - Text files (.txt)
  - Markdown (.md)
  - Configuration files (.json, .yaml, .yml, .xml)
  - Programming languages (.py, .php, .rb, .pl, .java, .cpp, .c, .h, .go, .cs, .ts, .tsx)
  - Web technologies (.html, .css, .js)
  - Database (.sql)
  - Windows scripts (.bat, .cmd, .ps1)
- **Dark Mode**: Toggle between light and dark themes
- **Local Storage**: All data is handled locally in your browser
- **Copy to Clipboard**: Quick copy functionality for individual commands
- **Comment Support**: Maintains and displays comments from your scripts
- **Responsive Design**: Works across different screen sizes

## Browser Support

BashBoard supports all modern browsers including:

- Chrome
- Firefox
- Safari
- Edge

## Usage

1. **Opening Files**:

   - Click "Open File" to upload your snippet files
   - Files are automatically displayed in tabs

2. **Managing Tabs**:

   - Click tabs to switch between files
   - Drag tabs to reorder them
   - Click the 'x' to close tabs

3. **Working with Snippets**:

   - Commands are displayed with associated comments
   - Use copy buttons to quickly copy commands
   - Comments are preserved and displayed above their commands

4. **Theme Toggle**:

   - Use the theme switch to toggle between light and dark modes
   - Theme preference is saved between sessions

5. **Storage**:
   - Files are automatically saved in local storage
   - Use "Clear Files" to remove all stored files

## Technical Details

- **File Size Limit**: 10MB per file
- **Storage**: Uses browser's localStorage
- **Browser Support**: Works in all modern browsers
- **No Dependencies**: Built with vanilla JavaScript

## Security

- All processing is done client-side
- No data is sent to any servers
- Files are stored only in browser's localStorage
- Content sanitization is implemented for security

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bashboard.git
```
