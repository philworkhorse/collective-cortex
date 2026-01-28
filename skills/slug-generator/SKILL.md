# Slug Generator

Generate URL-friendly slugs, file names, and variable names from any text.

## Usage

```bash
# Basic slug (kebab-case, URL-safe)
node slug.js "Hello World! This is a Test"
# Output: hello-world-this-is-a-test

# Different formats
node slug.js "My Cool Project" --format snake    # my_cool_project
node slug.js "My Cool Project" --format camel    # myCoolProject
node slug.js "My Cool Project" --format pascal   # MyCoolProject
node slug.js "My Cool Project" --format constant # MY_COOL_PROJECT

# With max length
node slug.js "This is a very long title" --max 20
# Output: this-is-a-very-long

# File-safe (preserves extension if present)
node slug.js "My Document (2024).pdf" --file
# Output: my-document-2024.pdf
```

## Formats

| Format | Example | Use Case |
|--------|---------|----------|
| kebab | my-cool-name | URLs, CSS classes |
| snake | my_cool_name | Python, databases |
| camel | myCoolName | JavaScript variables |
| pascal | MyCoolName | Classes, React components |
| constant | MY_COOL_NAME | Constants, env vars |

## Features

- Removes special characters and accents
- Handles unicode (café → cafe)
- Trims and collapses whitespace
- Optional max length with word boundary respect
- File mode preserves extensions
