/**
 * Prettier Configuration
 * Consistent code formatting for the Executive Assistant AI project
 */

module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // TypeScript specific
  parser: 'typescript',
  
  // Bracket formatting
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Line endings
  endOfLine: 'lf',

  // Quote properties
  quoteProps: 'as-needed',

  // JSX (if needed in future)
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Embedded languages
  embeddedLanguageFormatting: 'auto',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Vue files (if needed in future)
  vueIndentScriptAndStyle: false,

  // Prose wrap
  proseWrap: 'preserve',

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '*.scss',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    }
  ]
};
