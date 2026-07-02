import { createClient } from "@libsql/client";
const client = createClient({ 
    url: "libsql://vhdp-frenda.aws-ap-northeast-1.turso.io", 
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA0ODkwMTAsImlkIjoiMDE5ZThkNTAtY2QwMS03MWVkLTkxMWQtN2JiNzA4MzA4MWI4IiwicmlkIjoiMzM4MGMxZWYtMjQ0Zi00ZDY3LTg0ODctN2ZiYjNhNzM3ZDU5In0.gI_fxeD3fOskrOEjyaaTYVV6hfsw66pypMD2b4yJhtpGp3iaKMIXqLHj4SjsbLvI64xnNDrP-3iNPRIfes5KDw"
});
async function run() {
    await client.execute({sql: "DELETE FROM books WHERE author = ?", args: ["Dân tộc M'Nông"]});
    console.log('Deleted ALL Dân tộc M Nong books to ensure a clean upload.');
}
run();
