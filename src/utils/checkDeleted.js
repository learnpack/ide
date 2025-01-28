const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Define ANSI escape codes for red text
const redText = "\x1b[31m"; // Start red text
const resetText = "\x1b[0m"; // Reset text color

// Archivos y directorios a eliminar
const targets = [
    { path: 'public/.learn', type: 'directory' },
    { path: 'public/exercises', type: 'directory' },
    { path: 'public/config.json', type: 'file' }
];

// Función para eliminar archivos y directorios
function deleteTarget(target) {
    const fullPath = path.resolve(target.path);

    if (fs.existsSync(fullPath)) {
        try {
            if (target.type === 'directory') {
                fs.rmSync(fullPath, { recursive: true, force: true });
            } else if (target.type === 'file') {
                fs.unlinkSync(fullPath);
            }
            console.log(`✅ Eliminado: ${fullPath}`);
        } catch (err) {
            throw new Error(`❌ No se pudo eliminar ${fullPath}: ${err.message}`);
        }
    } else {
        console.log(`✅ No existe: ${fullPath}`);
    }
}

function attemptDeletion() {
    console.log(`${redText}Intentando eliminar los archivos y directorios necesarios...${resetText}`);
    targets.forEach(deleteTarget);
}





// Ejecutar el intento de eliminación y luego preguntar al usuario
try {
    attemptDeletion();

} catch (error) {
    console.error(`${redText}${error.message}${resetText}`);
    rl.close();
    process.exit(1);
}
