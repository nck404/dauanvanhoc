import fs from "fs/promises";
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";

const dbUrl = "libsql://vhdp-frenda.aws-ap-northeast-1.turso.io";
const dbToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA0ODkwMTAsImlkIjoiMDE5ZThkNTAtY2QwMS03MWVkLTkxMWQtN2JiNzA4MzA4MWI4IiwicmlkIjoiMzM4MGMxZWYtMjQ0Zi00ZDY3LTg0ODctN2ZiYjNhNzM3ZDU5In0.gI_fxeD3fOskrOEjyaaTYVV6hfsw66pypMD2b4yJhtpGp3iaKMIXqLHj4SjsbLvI64xnNDrP-3iNPRIfes5KDw";
const blobToken = "vercel_blob_rw_JpSYEJ0vtrqjv9Kk_pvqOANUZt9WiihtHJnx6sIgDGxJfxQ";

const client = createClient({ url: dbUrl, authToken: dbToken });

async function run() {
    const srcPath = "c:\\Users\\NGUYEN TRI KHOA\\Downloads\\1783611502581_8287295495076670392_8287295495076670392_3e76bff8dc8524f246911529676de452.jpg";
    const destName = `covers/${Date.now()}-cover-Ch_ng_Kh_.jpg`;
    
    const fileData = await fs.readFile(srcPath);
    const blob = await put(destName, fileData, {
        access: "private",
        token: blobToken,
        addRandomSuffix: false
    });
    
    const coverUrl = `/uploads/${destName}`;
    console.log("Uploaded cover URL:", coverUrl);
    
    const res = await client.execute({
        sql: "UPDATE books SET cover_url = ? WHERE id = ?",
        args: [coverUrl, 201]
    });
    console.log("Update database result:", res);
}

run();
