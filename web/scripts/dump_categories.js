
const fs = require('fs');

async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/categories?flat=true');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        const categories = data.categories || [];

        fs.writeFileSync('categories_dump.json', JSON.stringify(categories, null, 2));
        console.log(`Saved ${categories.length} categories to categories_dump.json`);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
