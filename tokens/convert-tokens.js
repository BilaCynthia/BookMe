const fs = require('fs');
const path = require('path');

// Helper to convert camelCase/spaces to kebab-case
function toKebabCase(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

// Helper to resolve color token values, with fallback logic for missing palette keys
function resolveColor(value, colorData) {
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        const pathParts = value.slice(1, -1).split('.');
        
        // Try resolving path directly from the JSON structure
        let current = colorData;
        for (const part of pathParts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                current = undefined;
                break;
            }
        }
        
        if (current !== undefined) {
            return current;
        }

        // Fallback logic for undefined color references (e.g. error palette or neutral variants)
        // Expected format: color.palette.name.shade or similar
        if (pathParts[0] === 'color' && pathParts[1] === 'palette') {
            const paletteName = pathParts[2];
            const shade = pathParts[3];
            const shadeNum = parseInt(shade, 10);
            
            if (paletteName === 'error') {
                if (shadeNum === 100) return 'hsl(0, 0%, 100%)';
                if (shadeNum === 0) return 'hsl(0, 0%, 0%)';
                return `hsl(0, 75%, ${shadeNum}%)`;
            }
            if (paletteName === 'neutral') {
                if (shadeNum === 100) return 'hsl(0, 0%, 100%)';
                if (shadeNum === 0) return 'hsl(0, 0%, 0%)';
                return `hsl(60, 1%, ${shadeNum}%)`;
            }
        }
        
        // Return original if no fallback is possible
        return value;
    }
    return value;
}

// Helper to format typography values (dimensions need 'px', font family names need quotes)
function formatTypographyValue(propName, propObj) {
    const val = propObj.value;
    if (propObj.type === 'dimension' && typeof val === 'number') {
        return `${val}px`;
    }
    if (propName === 'fontFamily' && typeof val === 'string') {
        if (val.includes(' ') && !val.startsWith("'") && !val.startsWith('"')) {
            return `'${val}'`;
        }
    }
    return val;
}

function generateCSS() {
    const colourTokenPath = path.join(__dirname, 'colour-token.json');
    const typographyTokenPath = path.join(__dirname, 'design-tokens.tokens.json');
    const outputPath = path.join(__dirname, 'tokens.css');

    console.log(`Reading color tokens from ${colourTokenPath}...`);
    const colorData = JSON.parse(fs.readFileSync(colourTokenPath, 'utf8'));

    console.log(`Reading typography tokens from ${typographyTokenPath}...`);
    const typographyData = JSON.parse(fs.readFileSync(typographyTokenPath, 'utf8'));

    let cssLines = [];
    cssLines.push('/* ==========================================================================');
    cssLines.push('   Generated Design Tokens (CSS Variables)');
    cssLines.push('   ========================================================================== */');
    cssLines.push('');

    // Start :root selector block
    cssLines.push(':root {');

    // 1. Process Typography Tokens
    cssLines.push('  /* --- Typography --- */');
    const typography = typographyData.typography;
    if (typography) {
        for (const [category, styles] of Object.entries(typography)) {
            const kebabCategory = toKebabCase(category);
            for (const [propName, propObj] of Object.entries(styles)) {
                const kebabProp = toKebabCase(propName);
                const formattedVal = formatTypographyValue(propName, propObj);
                cssLines.push(`  --typography-${kebabCategory}-${kebabProp}: ${formattedVal};`);
            }
            cssLines.push(''); // Spacer between categories
        }
    }

    // 2. Process Color Role (Light) Tokens
    cssLines.push('  /* --- Color Roles (Light Theme) --- */');
    const lightRoles = colorData.color.role.light;
    if (lightRoles) {
        for (const [roleName, rawValue] of Object.entries(lightRoles)) {
            const kebabRole = toKebabCase(roleName);
            const resolvedColor = resolveColor(rawValue, colorData);
            cssLines.push(`  --color-${kebabRole}: ${resolvedColor};`);
        }
    }

    // Close :root
    cssLines.push('}');
    cssLines.push('');

    // 3. Process Color Role (Dark) Tokens
    cssLines.push('.dark {');
    cssLines.push('  /* --- Color Roles (Dark Theme) --- */');
    const darkRoles = colorData.color.role.dark;
    if (darkRoles) {
        for (const [roleName, rawValue] of Object.entries(darkRoles)) {
            const kebabRole = toKebabCase(roleName);
            const resolvedColor = resolveColor(rawValue, colorData);
            cssLines.push(`  --color-${kebabRole}: ${resolvedColor};`);
        }
    }
    cssLines.push('}');
    cssLines.push('');

    // Write output to file
    fs.writeFileSync(outputPath, cssLines.join('\n'), 'utf8');
    console.log(`Successfully generated CSS variables at ${outputPath}`);
}

generateCSS();
