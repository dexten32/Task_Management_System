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

const files = walk('components').filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    if (!file.includes('taskDetailComponent.tsx')) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Add extra padding to the right side of the Task header to avoid the absolute Close button
    const regex1 = /relative px-8 py-6/g;
    if (regex1.test(content)) {
        content = content.replace(
            regex1,
            'relative pl-8 pr-16 py-6'
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed header padding to avoid close button overlap in:', file);
    }
});
