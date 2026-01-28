# Case Converter

Convert text between common naming conventions.

## Endpoint

`POST /api/skills/case-converter/execute`

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | yes | Text to convert |
| `to` | string | yes | Target case: `camel`, `pascal`, `snake`, `kebab`, `constant`, `title`, `sentence`, `dot`, `path` |
| `from` | string | no | Source case (auto-detected if omitted) |

## Supported Cases

- **camel**: `myVariableName`
- **pascal**: `MyVariableName`
- **snake**: `my_variable_name`
- **kebab**: `my-variable-name`
- **constant**: `MY_VARIABLE_NAME`
- **title**: `My Variable Name`
- **sentence**: `My variable name`
- **dot**: `my.variable.name`
- **path**: `my/variable/name`

## Examples

Convert API response field to JavaScript variable:
```json
{
  "text": "user_profile_data",
  "to": "camel"
}
```
Result: `userProfileData`

Convert class name to file path:
```json
{
  "text": "MyComponentName",
  "to": "kebab"
}
```
Result: `my-component-name`

Convert to environment variable style:
```json
{
  "text": "apiSecretKey",
  "to": "constant"
}
```
Result: `API_SECRET_KEY`

## Use Cases

- Normalize API response keys to code conventions
- Generate file names from class names
- Convert database columns to model properties
- Format environment variable names
- Standardize naming across codebases
