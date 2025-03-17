#!/usr/bin/env python3

import os
import sys

def main():
    args = sys.argv[1:]

    if len(args) < 2:
        print('Usage: polycompiler <file1> <file2> [output-file]')
        sys.exit(1)

    file1_path = args[0]
    file2_path = args[1]
    output_path = args[2] if len(args) > 2 else 'out/result.py.js'

    # Check if files exist
    if not os.path.exists(file1_path) or not os.path.exists(file2_path):
        print('Error: One or more input files do not exist.')
        sys.exit(1)

    # Get file extensions
    ext1 = os.path.splitext(file1_path)[1].lower()
    ext2 = os.path.splitext(file2_path)[1].lower()

    # Check if one is Python and one is JavaScript
    def is_python(ext):
        return ext in ['.py']

    def is_javascript(ext):
        return ext in ['.js', '.cjs', '.mjs']

    has_python = is_python(ext1) or is_python(ext2)
    has_js = is_javascript(ext1) or is_javascript(ext2)

    if not (has_python and has_js):
        print(f'Merging {ext1[1:]} and {ext2[1:]} is not supported. Only Python and JavaScript files can be merged.')
        sys.exit(1)

    # Read file contents
    with open(file1_path, 'r', encoding='utf-8') as f:
        content1 = f.read()
    with open(file2_path, 'r', encoding='utf-8') as f:
        content2 = f.read()

    # Determine which file is Python and which is JavaScript
    python_content = content1 if is_python(ext1) else content2
    js_content = content1 if is_javascript(ext1) else content2

    # Call the merge function (to be defined by the user)
    merged = merge_files(python_content, js_content)

    # Ensure the output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir: os.makedirs(output_dir, exist_ok=True)

    # Write the result to the output file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(merged)
    print(f'Merged files written to {output_path}')

def merge_files(python_content, js_content):
    # Escape backslashes first, then newlines, then quotes
    escaped_python_content = python_content.replace('\\', '\\\\').replace('\n', '\\n').replace('"""', '\\"\\"\\"')
    escaped_js_content = js_content.replace('\\', '\\\\').replace('\n', '\\n').replace('"', '\\"')

    return f'1 // (lambda: exec("""{escaped_python_content}""", globals()) or 1)()\nlambda: eval("{escaped_js_content}")'

if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print('Error:', err)
        sys.exit(1)
