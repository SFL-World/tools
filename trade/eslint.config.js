import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules", "dist", "version-alpha"]),

  {
    files: ["**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    settings: {
      react: {
        version: "detect",
      },
    },

    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
      },
    },

    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],

      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
    },
  },
]);
