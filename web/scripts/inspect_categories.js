
async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/categories?flat=true');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        const categories = data.categories || [];

        const jeonnam = categories.find(c => c.slug === 'jeonnam');

        if (!jeonnam) {
            console.log("NOT FOUND: Jeonnam category");
            return;
        }

        console.log("=== Target: Jeonnam ===");
        console.log(JSON.stringify(jeonnam, null, 2));

        const children = categories.filter(c => c.parent_id === jeonnam.id);
        console.log("\n=== Children of Jeonnam ===");
        children.forEach(c => {
            console.log(`[${c.name}] slug: ${c.slug}, id: ${c.id}`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
