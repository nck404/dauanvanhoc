import { createClient } from "@libsql/client";
import * as googleTTS from "google-tts-api";
import { put } from "@vercel/blob";

const dbUrl = "libsql://vhdp-frenda.aws-ap-northeast-1.turso.io";
const dbToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA0ODkwMTAsImlkIjoiMDE5ZThkNTAtY2QwMS03MWVkLTkxMWQtN2JiNzA4MzA4MWI4IiwicmlkIjoiMzM4MGMxZWYtMjQ0Zi00ZDY3LTg0ODctN2ZiYjNhNzM3ZDU5In0.gI_fxeD3fOskrOEjyaaTYVV6hfsw66pypMD2b4yJhtpGp3iaKMIXqLHj4SjsbLvI64xnNDrP-3iNPRIfes5KDw";
const blobToken = "vercel_blob_rw_JpSYEJ0vtrqjv9Kk_pvqOANUZt9WiihtHJnx6sIgDGxJfxQ";

const client = createClient({ url: dbUrl, authToken: dbToken });

async function main() {
    try {
        console.log("Fetching audios without audio_url or where audio_url 404s...");
        const res = await client.execute("SELECT id, title, lyrics FROM audios");
        
        for (const row of res.rows) {
            const id = row.id;
            const title = row.title;
            const htmlLyrics = row.lyrics;
            
            if (!htmlLyrics) {
                console.log(`Skipping ID ${id}: no lyrics.`);
                continue;
            }
            
            console.log(`\nProcessing ID ${id} - ${title}`);
            
            // Strip HTML
            let text = htmlLyrics.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 5000) {
                text = text.substring(0, 5000); // limit to 5000 chars to avoid crazy generation times
            }
            
            console.log("Generating TTS base64...");
            const results = await googleTTS.getAllAudioBase64(text, {
                lang: 'vi',
                slow: false,
                host: 'https://translate.google.com',
                splitPunct: ',.?!',
            });
            
            console.log(`Generated ${results.length} chunks. Combining...`);
            
            const buffers = results.map(res => Buffer.from(res.base64, 'base64'));
            const finalBuffer = Buffer.concat(buffers);
            
            const fileName = `audios/${Date.now()}-tts-${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;
            console.log(`Uploading to Vercel Blob as ${fileName}...`);
            
            const blob = await put(fileName, finalBuffer, {
                access: "private",
                token: blobToken,
                addRandomSuffix: false
            });
            
            const finalUrl = `/uploads/${fileName}`;
            console.log(`Upload success: ${finalUrl}`);
            
            await client.execute({
                sql: "UPDATE audios SET audio_url = ? WHERE id = ?",
                args: [finalUrl, id]
            });
            
            console.log(`Updated database for ID ${id}.`);
        }
        
        console.log("\nAll done!");
    } catch (err) {
        console.error(err);
    }
}

main();
