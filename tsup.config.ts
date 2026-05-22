import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['form-engine/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external: [
    'react',
    'react-dom',
    'react-hook-form',
    'zod',
    'zustand',
    'lucide-react',
    'react-hot-toast',
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@tiptap/extension-image',
    '@tiptap/extension-link',
    '@tiptap/extension-placeholder',
  ],
});
