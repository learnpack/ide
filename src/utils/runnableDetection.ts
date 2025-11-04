/**
 * Detección automática de bloques de código ejecutables
 * Similar al patrón usado en EventProxy.ts para detectar inputs
 */

/**
 * Detecta si un bloque de código debe ser ejecutable basándose en sus statements de salida
 * @param code - Contenido del bloque de código
 * @param language - Lenguaje de programación del bloque
 * @returns true si el bloque contiene statements de salida que lo hacen ejecutable
 */
export const isRunnableCodeBlock = (code: string, language: string): boolean => {
  // Si el código está vacío o solo espacios, no es runnable
  const trimmedCode = code.trim();
  if (!trimmedCode) return false;

  // Detectar según lenguaje (22 lenguajes populares)
  const normalizedLang = language.toLowerCase();
  
  switch (normalizedLang) {
    case 'javascript':
    case 'js':
      return detectJavaScriptRunnable(trimmedCode);
    case 'typescript':
    case 'ts':
      return detectTypeScriptRunnable(trimmedCode);
    case 'python':
    case 'py':
      return detectPythonRunnable(trimmedCode);
    case 'java':
      return detectJavaRunnable(trimmedCode);
    case 'csharp':
    case 'c#':
      return detectCSharpRunnable(trimmedCode);
    case 'cpp':
    case 'c++':
      return detectCppRunnable(trimmedCode);
    case 'c':
      return detectCRunnable(trimmedCode);
    case 'php':
      return detectPHPRunnable(trimmedCode);
    case 'ruby':
    case 'rb':
      return detectRubyRunnable(trimmedCode);
    case 'go':
      return detectGoRunnable(trimmedCode);
    case 'rust':
    case 'rs':
      return detectRustRunnable(trimmedCode);
    case 'swift':
      return detectSwiftRunnable(trimmedCode);
    case 'kotlin':
    case 'kt':
      return detectKotlinRunnable(trimmedCode);
    case 'scala':
      return detectScalaRunnable(trimmedCode);
    case 'dart':
      return detectDartRunnable(trimmedCode);
    case 'r':
      return detectRRunnable(trimmedCode);
    case 'bash':
    case 'shell':
    case 'sh':
      return detectBashRunnable(trimmedCode);
    case 'powershell':
    case 'ps1':
      return detectPowerShellRunnable(trimmedCode);
    case 'lua':
      return detectLuaRunnable(trimmedCode);
    case 'julia':
    case 'jl':
      return detectJuliaRunnable(trimmedCode);
    case 'matlab':
      return detectMATLABRunnable(trimmedCode);
    case 'perl':
    case 'pl':
      return detectPerlRunnable(trimmedCode);
    default:
      // Para otros lenguajes, no hacer runnable automáticamente
      return false;
  }
};

// JavaScript: console.log, console.error, console.warn, etc.
const detectJavaScriptRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const consolePattern = /console\.(log|error|warn|info|debug|trace)\s*\(/;
  return consolePattern.test(withoutComments);
};

// TypeScript: igual que JavaScript
const detectTypeScriptRunnable = detectJavaScriptRunnable;

// Python: print(), sys.stdout.write()
const detectPythonRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const printPattern = /(print\s*\(|sys\.stdout\.write\s*\()/;
  return printPattern.test(withoutComments);
};

// Java: System.out.println, System.out.print, System.err.println
const detectJavaRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const systemOutPattern = /System\.(out|err)\.(println|print)\s*\(/;
  return systemOutPattern.test(withoutComments);
};

// C#: Console.WriteLine, Console.Write
const detectCSharpRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const consolePattern = /Console\.(WriteLine|Write)\s*\(/;
  return consolePattern.test(withoutComments);
};

// C++: cout, cerr, printf
const detectCppRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const outputPattern = /(std::cout|std::cerr|cout|cerr|\bprintf\s*\()/;
  return outputPattern.test(withoutComments);
};

// C: printf, fprintf
const detectCRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const printPattern = /(printf|fprintf)\s*\(/;
  return printPattern.test(withoutComments);
};

// PHP: echo, print, var_dump, print_r
const detectPHPRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/#.*$/gm, '');
  const outputPattern = /\b(echo|print|var_dump|print_r)\s*\(/;
  return outputPattern.test(withoutComments);
};

// Ruby: puts, print, p
const detectRubyRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const outputPattern = /\b(puts|print|p)\s+/;
  return outputPattern.test(withoutComments);
};

// Go: fmt.Println, fmt.Print, fmt.Printf
const detectGoRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/\/\/.*$/gm, '');
  const fmtPattern = /fmt\.(Println|Print|Printf)\s*\(/;
  return fmtPattern.test(withoutComments);
};

// Rust: println!, print!, eprintln!
const detectRustRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const macroPattern = /\b(println!|print!|eprintln!|eprint!)\s*\(/;
  return macroPattern.test(withoutComments);
};

// Swift: print()
const detectSwiftRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const printPattern = /print\s*\(/;
  return printPattern.test(withoutComments);
};

// Kotlin: println(), print()
const detectKotlinRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const printPattern = /(println|print)\s*\(/;
  return printPattern.test(withoutComments);
};

// Scala: println(), print()
const detectScalaRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const printPattern = /(println|print)\s*\(/;
  return printPattern.test(withoutComments);
};

// Dart: print()
const detectDartRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const printPattern = /print\s*\(/;
  return printPattern.test(withoutComments);
};

// R: print(), cat()
const detectRRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const outputPattern = /\b(print|cat)\s*\(/;
  return outputPattern.test(withoutComments);
};

// Bash/Shell: echo, printf
const detectBashRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const outputPattern = /\b(echo|printf)\s+/;
  return outputPattern.test(withoutComments);
};

// PowerShell: Write-Host, Write-Output
const detectPowerShellRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const outputPattern = /\b(Write-Host|Write-Output)\s+/;
  return outputPattern.test(withoutComments);
};

// Lua: print()
const detectLuaRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/--.*$/gm, '');
  const printPattern = /print\s*\(/;
  return printPattern.test(withoutComments);
};

// Julia: print(), println()
const detectJuliaRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/#.*$/gm, '');
  const printPattern = /\b(print|println)\s*\(/;
  return printPattern.test(withoutComments);
};

// MATLAB: fprintf(), disp()
const detectMATLABRunnable = (code: string): boolean => {
  const withoutComments = code.replace(/%.*$/gm, '');
  const outputPattern = /\b(fprintf|disp)\s*\(/;
  return outputPattern.test(withoutComments);
};

// Perl: print, say
const detectPerlRunnable = (code: string): boolean => {
  const withoutComments = code
    .replace(/#.*$/gm, '')
    .replace(/=pod[\s\S]*?=cut/g, '');
  const outputPattern = /\b(print|say)\s+/;
  return outputPattern.test(withoutComments);
};

