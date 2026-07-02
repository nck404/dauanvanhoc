import fs from "fs/promises";
import path from "path";
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";

const dbUrl = "libsql://vhdp-frenda.aws-ap-northeast-1.turso.io";
const dbToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA0ODkwMTAsImlkIjoiMDE5ZThkNTAtY2QwMS03MWVkLTkxMWQtN2JiNzA4MzA4MWI4IiwicmlkIjoiMzM4MGMxZWYtMjQ0Zi00ZDY3LTg0ODctN2ZiYjNhNzM3ZDU5In0.gI_fxeD3fOskrOEjyaaTYVV6hfsw66pypMD2b4yJhtpGp3iaKMIXqLHj4SjsbLvI64xnNDrP-3iNPRIfes5KDw";
const blobToken = "vercel_blob_rw_JpSYEJ0vtrqjv9Kk_pvqOANUZt9WiihtHJnx6sIgDGxJfxQ";

const client = createClient({ url: dbUrl, authToken: dbToken });

async function uploadFileToVercelBlob(filePath, destPath) {
    console.log(`Uploading ${filePath} to ${destPath}...`);
    const fileData = await fs.readFile(filePath);
    const blob = await put(destPath, fileData, {
        access: "private",
        token: blobToken,
        addRandomSuffix: false
    });
    return `/uploads/${destPath}`;
}

async function processFolder(dirPath, category, type) {
    const folders = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const folder of folders) {
        if (!folder.isDirectory()) continue;
        
        const title = folder.name;
        console.log(`\n--- Processing book: ${title} ---`);
        
        // Check if book already exists
        const existing = await client.execute({ sql: "SELECT id FROM books WHERE title = ? AND type = ?", args: [title, type] });
        if (existing.rows.length > 0) {
            console.log(`Book ${title} of type ${type} already exists. Skipping...`);
            continue;
        }
        
        const bookPath = path.join(dirPath, title);
        
        const files = await fs.readdir(bookPath);
        
        // Find cover
        const coverFileName = files.find(f => 
            f.toLowerCase() === "bìa.png" || 
            f.toLowerCase() === "bia.png" ||
            f.toLowerCase() === "0.png"
        );
        let cover_url = "";
        
        if (coverFileName) {
            const destCoverName = `covers/${Date.now()}-cover-${title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
            cover_url = await uploadFileToVercelBlob(path.join(bookPath, coverFileName), destCoverName);
        } else {
            console.log(`No cover found for ${title}`);
        }
        
        // Find pages
        const pageFiles = files.filter(f => 
            f !== coverFileName && 
            f !== "bìa.png" && 
            f !== "bia.png" &&
            f !== "0.png" &&
            (f.toLowerCase().endsWith(".png") || f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg"))
        );
        
        // Sort pages numerically if they are named like 1.png, 2.png, or 01.png
        pageFiles.sort((a, b) => {
            const aMatch = a.match(/(\d+)/);
            const bMatch = b.match(/(\d+)/);
            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            return a.localeCompare(b);
        });
        
        const pageUrls = [];
        for (let i = 0; i < pageFiles.length; i++) {
            const pageFile = pageFiles[i];
            const destPageName = `pages/${Date.now()}-page-${i}-${title.replace(/[^a-zA-Z0-9]/g, "_")}${path.extname(pageFile)}`;
            const url = await uploadFileToVercelBlob(path.join(bookPath, pageFile), destPageName);
            pageUrls.push(url);
        }
        
        let contentHtml = '<div class="image-viewer" style="display:flex;flex-direction:column;gap:1rem;">';
        pageUrls.forEach((url, idx) => {
            contentHtml += `<div class="image-container" style="text-align:center;"><img src="${url}" alt="Page ${idx + 1}" style="max-width:100%;height:auto;" /></div>`;
        });
        contentHtml += "</div>";
        
        if (!cover_url && pageUrls.length > 0) {
            cover_url = pageUrls[0];
            console.log(`Using first page as cover for ${title}`);
        }
        
        // Insert into Turso DB
        const res = await client.execute({
            sql: "INSERT INTO books (title, author, description, cover_url, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [
                title,
                "Dân tộc M'Nông",
                "",
                cover_url,
                type,
                category,
                "completed"
            ]
        });
        
        const bookId = Number(res.lastInsertRowid);
        
        if (contentHtml && pageUrls.length > 0) {
            await client.execute({
                sql: "INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, 1, 'Chương 1', ?)",
                args: [bookId, contentHtml]
            });
            console.log(`Successfully added chapter 1 with ${pageUrls.length} pages.`);
        } else {
            console.log(`Book created but no pages found.`);
        }
    }
}

async function main() {
    try {
        console.log("Starting script...");
        const tranhPath = "D:\\money\\dauanvanhoc\\truyện tranh";
        const storyPath = "D:\\money\\dauanvanhoc\\story";
        
        await processFolder(tranhPath, "Truyện tranh", "truyện tranh");
        await processFolder(storyPath, "Truyện cổ tích", "truyện tranh");
        
        console.log("Done processing all!");
    } catch (err) {
        console.error(err);
    }
}

main();
