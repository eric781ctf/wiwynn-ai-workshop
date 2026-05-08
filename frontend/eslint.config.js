import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // shadcn 元件慣例：與元件同檔案 export variants/常數
      'react-refresh/only-export-components': 'off',
      // MVP 直接用 useEffect + setState 做資料載入；之後可改用 react-query
      'react-hooks/set-state-in-effect': 'off',
      // react-hook-form 的 watch() 在無 react-compiler 時誤報
      'react-hooks/incompatible-library': 'off',
    },
  },
])
