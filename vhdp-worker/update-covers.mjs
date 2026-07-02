import { createClient } from '@libsql/client';

const client = createClient({ 
    url: 'libsql://vhdp-frenda.aws-ap-northeast-1.turso.io', 
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA0ODkwMTAsImlkIjoiMDE5ZThkNTAtY2QwMS03MWVkLTkxMWQtN2JiNzA4MzA4MWI4IiwicmlkIjoiMzM4MGMxZWYtMjQ0Zi00ZDY3LTg0ODctN2ZiYjNhNzM3ZDU5In0.gI_fxeD3fOskrOEjyaaTYVV6hfsw66pypMD2b4yJhtpGp3iaKMIXqLHj4SjsbLvI64xnNDrP-3iNPRIfes5KDw'
});

async function run() {
    const res = await client.execute("SELECT chapters.id, chapters.content, chapters.book_id FROM chapters JOIN books ON books.id = chapters.book_id WHERE books.cover_url = '' AND books.type = 'truyện tranh'");
    console.log(`Found ${res.rows.length} books without cover.`);
    for (const row of res.rows) {
        if (!row.content) continue;
        const match = row.content.match(/src=["']([^"']+)["']/);
        if (match) {
            const firstImg = match[1];
            await client.execute({ sql: 'UPDATE books SET cover_url = ? WHERE id = ?', args: [firstImg, row.book_id] });
            console.log('Updated book ' + row.book_id + ' with cover ' + firstImg);
        }
    }
}
run();
