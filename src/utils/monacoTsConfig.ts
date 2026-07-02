/**
 * Configures Monaco's TypeScript/JavaScript language service to avoid false
 * "Cannot find module 'react'" and similar errors in creatorWeb/localStorage,
 * where validation is done by Rigobot/tests, not by the editor.
 *
 * Solution 1: set compiler options (moduleResolution, jsx, etc.).
 * Solution 2: disable semantic validation, keep syntax validation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function configureMonacoTypeScript(monaco: any): void {
  const ts = monaco.languages.typescript;

  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.ReactJSX,
    allowNonTsExtensions: true,
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true,
  };

  ts.typescriptDefaults.setCompilerOptions(compilerOptions);
  ts.javascriptDefaults.setCompilerOptions(compilerOptions);

  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
  ts.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
}
