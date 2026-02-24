const fs = require('fs');
const path = require('path');

const walk = dir => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
};

const files = walk('app').filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1) Replace wrapper padding, scroll, and hard height
    const regex1 = /p-6 rounded-2xl shadow-2xl border border-gray-200 w-\[95%\] max-w-2xl h-\[90vh\] overflow-y-auto/g;
    if (regex1.test(content)) {
        content = content.replace(
            regex1,
            'rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'
        );
        changed = true;
    }

    // 2) Protect close button visibility by bringing it above the component
    const regex2 = /absolute top-3 right-3([^"]*)/g;
    if (regex2.test(content) && content.includes('<ClientTaskDetail')) {
        content = content.replace(
            regex2,
            'absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm $1'
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed wrapper in:', file);
    }
});
