#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: polycompiler <file1> <file2> [output-file]');
        process.exit(1);
    }

    const file1Path = args[0];
    const file2Path = args[1];
    const outputPath = args[2] || 'out/result.py.js';

    // Check if files exist
    try {
        await fs.access(file1Path);
        await fs.access(file2Path);
    } catch (err) {
        console.error(`Error: One or more input files do not exist.`);
        process.exit(1);
    }

    // Get file extensions
    const ext1 = path.extname(file1Path).toLowerCase();
    const ext2 = path.extname(file2Path).toLowerCase();

    // Check if one is Python and one is JavaScript
    const isPython = ext => ['.py'].includes(ext);
    const isJavaScript = ext => ['.js', '.cjs', '.mjs'].includes(ext);

    const hasPython = isPython(ext1) || isPython(ext2);
    const hasJS = isJavaScript(ext1) || isJavaScript(ext2);

    if (!(hasPython && hasJS)) {
        console.error(`Merging ${ext1.slice(1)} and ${ext2.slice(1)} is not supported. Only Python and JavaScript files can be merged.`);
        process.exit(1);
    }

    // Read file contents
    const content1 = await fs.readFile(file1Path, 'utf8');
    const content2 = await fs.readFile(file2Path, 'utf8');

    // Determine which file is Python and which is JavaScript
    const pythonContent = isPython(ext1) ? content1 : content2;
    const jsContent = isJavaScript(ext1) ? content1 : content2;

    // Call the merge function (to be defined by the user)
    const merged = mergeFiles(pythonContent, jsContent);

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the result to the output file
    await fs.writeFile(outputPath, merged);
    console.log(`Merged files written to ${outputPath}`);
}

/**
 * Merges Python and JavaScript files
 * @param {string} pythonContent - Content of the Python file
 * @param {string} jsContent - Content of the JavaScript file
 * @returns {string} - Merged content
 */
function mergeFiles(pythonContent, jsContent) {
    // Escape backslashes first, then newlines, then quotes
    const escapedPythonContent = pythonContent
        .replace(/\\/g, '\\\\')         // Double backslashes first
        .replace(/\n/g, '\\n')          // Escape newlines
        .replace(/"""/g, '\\"\\"\\"');  // Escape triple quotes

    // Escape backslashes first, then newlines, then quotes
    const escapedJsContent = jsContent
        .replace(/\\/g, '\\\\')         // Double backslashes first
        .replace(/\n/g, '\\n')          // Escape newlines
        .replace(/"/g, '\\"');          // Escape double quotes

    return `1 // (lambda: exec("""${escapedPythonContent}""", globals()) or 1)()
lambda: eval("${escapedJsContent}")`;
}
main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
