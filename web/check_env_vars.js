const fs = require('fs');
const path = require('path');

// 부모 디렉토리의 .env 파싱
const envPath = path.resolve(process.cwd(), '../.env');
let env = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

if (env.DATABASE_URL) {
    console.log('DATABASE_URL FOUND');
} else {
    console.log('DATABASE_URL NOT FOUND');
}
