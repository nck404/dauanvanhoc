<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let logs = $state([]);
    let status = $state("ready");

    const targetTitles = [
        "SỰ TÍCH VỀ NGUỒN GỐC CỦA NGƯỜI M'NÔNG",
        "SỰ TÍCH QUẢ BẦU",
        "SỰ TÍCH CÂY NÊU THẦN",
        "QUẢ BẦU MẸ",
        "CẬU BÉ BỤNG CHƠ LAN",
        "CON VƯỢN VÀ THẦN LÚA",
        "CHÀNG PIỆNG GIẾT CON RỒNG",
        "CHÀNG K'MBÔNG",
        "CHUYỆN THẨN LÚA",
        "CHUYỆN K'TAR LUT-NDUR",
        "BÀ MẸ KẾ",
        "Chàng Khỉ",
        "Chàng khỉ"
    ];

    function log(msg) {
        logs = [...logs, msg];
    }

    async function startUpdate() {
        status = "running";
        logs = [];
        log("Bat dau qua trinh cap nhat bia...");

        try {
            const API_BASE = "https://vhdp-worker.frenda.workers.dev";
            const res = await apiFetch("/api/books?limit=999");
            if (!res.ok) {
                log("Loi khi lay danh sach truyen: " + res.status);
                status = "error";
                return;
            }

            const data = await res.json();
            const books = data.books || [];
            log(`Tim thay tong cong ${books.length} truyen.`);

            for (const book of books) {
                if (targetTitles.includes(book.title)) {
                    log(`Dang xu ly truyen: ${book.title} (ID: ${book.id})`);
                    const detailRes = await apiFetch(`/api/books/${book.id}`);
                    if (!detailRes.ok) {
                        log(`  Loi khi lay chi tiet truyen ${book.id}`);
                        continue;
                    }

                    const detailData = await detailRes.json();
                    const chapters = detailData.chapters || [];
                    const imageUrls = [];

                    for (const ch of chapters) {
                        const regex = /<img[^>]+src=["']([^"']+)["']/g;
                        let match;
                        while ((match = regex.exec(ch.content)) !== null) {
                            imageUrls.push(match[1]);
                        }
                    }

                    if (imageUrls.length > 0) {
                        let lastImage = imageUrls[imageUrls.length - 1];
                        if (lastImage.startsWith("/")) {
                            lastImage = `${API_BASE}${lastImage}`;
                        }
                        log(`  Tim thay anh bia: ${lastImage}`);

                        const updateRes = await apiFetch(`/api/books/${book.id}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                title: book.title,
                                author: book.author,
                                type: book.type,
                                category: book.category,
                                description: book.description,
                                status: book.status,
                                cover_url: lastImage
                            })
                        });

                        if (updateRes.ok) {
                            log(`  Cap nhat bia thanh cong cho truyen ${book.id}`);
                        } else {
                            const errBody = await updateRes.text();
                            log(`  Loi khi cap nhat bia ${book.id}: ${updateRes.status} - ${errBody}`);
                        }
                    } else {
                        log(`  Khong tim thay anh trong cac chuong cua truyen ${book.id}`);
                    }
                }
            }
            log("Hoan thanh cap nhat tat ca cac truyen.");
            status = "done";
        } catch (e) {
            log("Loi he thong: " + e.message);
            status = "error";
        }
    }
</script>

<div style="padding: 40px; font-family: monospace; max-width: 800px; margin: 0 auto;">
    <h1>Cap nhat anh bia truyen</h1>
    <p>Truy cap trang nay bang tai khoan Admin de cap nhat bia.</p>
    
    <div style="margin-bottom: 20px;">
        <button 
            onclick={startUpdate} 
            disabled={status === 'running'}
            style="padding: 10px 20px; font-size: 16px; cursor: pointer;"
        >
            {status === 'running' ? 'Dang cap nhat...' : 'Bat dau cap nhat'}
        </button>
    </div>

    <div style="background: #f4f4f4; padding: 20px; border: 1px solid #ccc; height: 400px; overflow-y: scroll;">
        {#each logs as item}
            <div style="margin-bottom: 4px;">{item}</div>
        {/each}
        {#if logs.length === 0}
            <div style="color: #666;">Logs se hien thi o day...</div>
        {/if}
    </div>
</div>
