const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'refactor-technical-review', 'components', 'constants', 'Procesadores.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the ' \/ Ultra X' or ' \/ Core X' string from 'nombre'
    content = content.replace(/nombre:\s*'Core (i\d)\s*\/\s*Ultra\s*\d',/g, "nombre: 'Core $1',");
    content = content.replace(/nombre:\s*'Core (i\d)\s*\/\s*Core\s*\d',/g, "nombre: 'Core $1',");

    // Remove "Core i9 / Ultra 9" without commas just in case
    content = content.replace(/'Core (i\d)\s*\/\s*Ultra\s*\d'/g, "'Core $1'");
    content = content.replace(/'Core (i\d)\s*\/\s*Core\s*\d'/g, "'Core $1'");

    // Specifically for id names, remove -ultraX
    content = content.replace(/-ultra\d/g, "");

    // Find and remove generations containing Ultra or Serie Core
    // We regex match the { id: ..., nombre: ..., modelos: [...] }
    const genRegex = /\{\s*id:\s*'[^']*',\s*nombre:\s*'(?:Ultra|Serie Core)[^']*',\s*(?:año:\s*\d+,\s*)?(?:arquitectura:\s*'[^']*',\s*)?modelos:\s*\[[\s\S]*?\]\s*\},?/g;
    
    content = content.replace(genRegex, '');
    
    // Clean up empty lines or double commas
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/\[\s*,/g, '[');

    fs.writeFileSync(filePath, content);
    console.log("Success");
} catch (error) {
    console.error("Error:", error);
}
