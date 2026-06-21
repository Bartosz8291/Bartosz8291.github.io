const fs = require('fs');
const path = require('path');

const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');
const htmlMinify = require('html-minifier-terser').minify;

async function processDirectory(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            await processDirectory(fullPath);
        } else {
            const ext = path.extname(fullPath);

            if (ext === '.css') {
                const css = fs.readFileSync(fullPath, 'utf8');
                const result = new CleanCSS({ level: 2 }).minify(css).styles;
                fs.writeFileSync(fullPath, result);
            }

            else if (ext === '.html') {
                const html = fs.readFileSync(fullPath, 'utf8');
                const result = await htmlMinify(html, {
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyCSS: true,
                    minifyJS: true
                });
                fs.writeFileSync(fullPath, result);
            }

            else if (ext === '.js') {
                const js = fs.readFileSync(fullPath, 'utf8');
                let code = js;

                if (item !== 'meow.js') {
                    const minified = await minify(js, { compress: true, mangle: true });
                    code = minified.code;
                }

                const obfuscated = JavaScriptObfuscator.obfuscate(code, {
                    compact: true,
                    controlFlowFlattening: true,
                    deadCodeInjection: true,
                    stringArray: true,
                    rotateStringArray: true,
                    stringArrayEncoding: ['base64'],
                    identifierNamesGenerator: 'hexadecimal',
                    selfDefending: true
                });

                fs.writeFileSync(fullPath, obfuscated.getObfuscatedCode());
            }
        }
    }
}

async function build() {
    try {
        await processDirectory('.');
        console.log('Build complete.');
    } catch (err) {
        console.error('Build failed:', err);
    }
}

build();
