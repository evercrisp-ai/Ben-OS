import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../..');

describe('1.1 Project Initialization', () => {
  test('1.1.1 Next.js project structure exists', () => {
    expect(fs.existsSync(path.join(projectRoot, 'src/app'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/app/layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/app/page.tsx'))).toBe(true);
  });

  test('1.1.2 TypeScript strict mode enabled', () => {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('1.1.3 Tailwind CSS configured', () => {
    // Check for tailwind config (v4 uses CSS-based config or tailwind.config.ts)
    const hasTailwindConfig =
      fs.existsSync(path.join(projectRoot, 'tailwind.config.ts')) ||
      fs.existsSync(path.join(projectRoot, 'tailwind.config.js'));
    
    // Check globals.css for tailwind directives
    const globalsCssPath = path.join(projectRoot, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsCssPath, 'utf-8');
    const hasTailwindImport = 
      globalsContent.includes('@tailwind') || 
      globalsContent.includes('@import "tailwindcss"') ||
      globalsContent.includes("@import 'tailwindcss'");
    
    expect(hasTailwindConfig || hasTailwindImport).toBe(true);
  });

  test('1.1.4 shadcn/ui initialized', () => {
    expect(fs.existsSync(path.join(projectRoot, 'components.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/components/ui'))).toBe(true);
  });

  test('1.1.5 Core dependencies installed', () => {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    expect(pkg.dependencies['@supabase/supabase-js']).toBeDefined();
    expect(pkg.dependencies['zustand']).toBeDefined();
    expect(pkg.dependencies['@tanstack/react-query']).toBeDefined();
    expect(pkg.dependencies['@dnd-kit/core']).toBeDefined();
    expect(pkg.dependencies['recharts']).toBeDefined();
  });

  test('1.1.6 ESLint configured', () => {
    const hasEslintConfig =
      fs.existsSync(path.join(projectRoot, '.eslintrc.json')) ||
      fs.existsSync(path.join(projectRoot, '.eslintrc.js')) ||
      fs.existsSync(path.join(projectRoot, 'eslint.config.js')) ||
      fs.existsSync(path.join(projectRoot, 'eslint.config.mjs'));
    expect(hasEslintConfig).toBe(true);
  });

  test('1.1.7 Vitest configured', () => {
    expect(fs.existsSync(path.join(projectRoot, 'vitest.config.ts'))).toBe(true);
    
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts.test).toBeDefined();
  });

  test('1.1.8 Folder structure complete', () => {
    const requiredDirs = [
      'src/app',
      'src/components',
      'src/components/ui',
      'src/lib',
      'src/hooks',
      'src/stores',
      'src/types',
    ];
    
    requiredDirs.forEach((dir) => {
      expect(fs.existsSync(path.join(projectRoot, dir))).toBe(true);
    });
  });

  test('1.1.9 README exists with content', () => {
    const readmePath = path.join(projectRoot, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    
    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('Ben OS');
  });

  test('1.1.10 Git repository initialized', () => {
    expect(fs.existsSync(path.join(projectRoot, '.git'))).toBe(true);
  });
});
