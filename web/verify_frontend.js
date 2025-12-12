// Native fetch used

async function verify() {
    try {
        console.log("Fetching http://localhost:3000...");
        const res = await fetch('http://localhost:3000');
        const text = await res.text();

        console.log(`Response Status: ${res.status}`);

        const checks = [
            { name: 'HomeHero Big Placeholder', pattern: 'text-3xl text-slate-200">Korea NEWS' },
            { name: 'HomeHero No Image Text', pattern: '이미지가 없습니다' },
            { name: 'NewsGrid Placeholder', pattern: 'font-bold text-xl text-slate-200">Korea NEWS' }
        ];

        let success = true;
        checks.forEach(check => {
            if (text.includes(check.pattern)) {
                console.log(`[PASS] ${check.name} found.`);
            } else {
                console.log(`[FAIL] ${check.name} NOT found.`);
                success = false;
            }
        });

        if (success) {
            console.log("\nVERIFICATION SUCCESS: All placeholders are rendering correctly.");
        } else {
            console.log("\nVERIFICATION FAILED: Some placeholders are missing.");
            console.log("Partial HTML content for debug:");
            console.log(text.substring(0, 1000));
        }

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verify();
