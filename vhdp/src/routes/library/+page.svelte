<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import { apiFetch } from "$lib/api.js";

    let bookmarkedBooks = $state([]);
    let activeFilter = $state("all");
    let loading = $state(true);

    async function loadLibrary() {
        try {
            const res = await apiFetch("/api/library");
            if (res.ok) {
                const data = await res.json();
                bookmarkedBooks = data.bookmarkedBooks || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadLibrary();
    });

    async function removeBookmark(bookId, e) {
        e.preventDefault();
        try {
            const res = await apiFetch("/api/library", {
                method: "DELETE",
                body: JSON.stringify({ bookId })
            });
            if (res.ok) {
                bookmarkedBooks = bookmarkedBooks.filter(b => b.id !== bookId);
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<svelte:head>
    <title>Thư viện của tôi - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="library-container">
    <div class="header">
        <div class="title-section">
            <h2 class="gradient-text">Thư viện của bạn</h2>
            <p class="subtitle">Nơi lưu giữ những câu chuyện bạn yêu thích</p>
        </div>

        <div class="filters">
            <button
                class:active={activeFilter === "all"}
                onclick={() => (activeFilter = "all")}
            >
                Đã lưu ({bookmarkedBooks.length})
            </button>
        </div>
    </div>

    {#if loading}
        <div style="text-align: center; padding: 40px; font-size: 16px;">Đang tải...</div>
    {:else if bookmarkedBooks.length === 0}
        <div class="empty-state">
            <div class="empty-icon">
                <i class="bx bx-bookmark-plus"></i>
            </div>
            <h3>Thư viện trống</h3>
            <p>
                Bạn chưa lưu cuốn sách nào. Hãy khám phá và tìm cho mình những
                tác phẩm tâm đắc nhé!
            </p>
            <a href="/" class="explore-btn">Khám phá ngay</a>
        </div>
    {:else}
        <div class="book-grid">
            {#each bookmarkedBooks as book (book.id)}
                <div class="book-item-wrapper">
                    <a href="/read/{book.id}" class="book-link">
                        <BookCard {book} />
                    </a>

                    <form
                        onsubmit={(e) => removeBookmark(book.id, e)}
                        class="remove-form"
                    >
                        <button
                            type="submit"
                            class="remove-btn"
                            title="Xóa khỏi thư viện"
                        >
                            <i class="bx bxs-heart"></i>
                        </button>
                    </form>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .library-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px 80px;
        min-height: 70vh;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 50px;
        gap: 20px;
    }

    .title-section h2 {
        font-size: 36px;
        font-weight: 800;
        margin-bottom: 8px;
    }

    .subtitle {
        color: var(--text-muted);
        font-size: 16px;
    }

    .filters {
        display: flex;
        gap: 12px;
    }

    .filters button {
        padding: 10px 24px;
        border-radius: 25px;
        background: white;
        font-size: 14px;
        font-weight: 600;
        border: 2px solid var(--accent-light);
        color: var(--text-muted);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .filters button.active {
        background: var(--text-main);
        color: white;
        border-color: var(--text-main);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 40px 30px;
    }

    .book-item-wrapper {
        position: relative;
        transition: transform 0.3s ease;
    }

    .book-item-wrapper:hover {
        transform: translateY(-5px);
    }

    .book-link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    .remove-form {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
    }

    .remove-btn {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .remove-btn:hover {
        transform: scale(1.1);
        background: #fff;
        color: #dc2626;
    }

    .empty-state {
        text-align: center;
        padding: 100px 20px;
        background: white;
        border-radius: 30px;
        border: 2px dashed var(--accent-light);
    }

    .empty-icon {
        font-size: 80px;
        color: var(--accent-light);
        margin-bottom: 20px;
    }

    .empty-state h3 {
        font-size: 24px;
        margin-bottom: 12px;
        color: var(--text-main);
    }

    .empty-state p {
        color: var(--text-muted);
        max-width: 400px;
        margin: 0 auto 30px;
        line-height: 1.6;
    }

    .explore-btn {
        display: inline-block;
        padding: 14px 32px;
        background: var(--primary-gradient);
        color: white;
        text-decoration: none;
        border-radius: 15px;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 10px 20px rgba(225, 91, 91, 0.2);
    }

    .explore-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 30px rgba(225, 91, 91, 0.3);
    }

    @media (max-width: 768px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
        }

        .title-section h2 {
            font-size: 28px;
        }

        .book-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 25px 15px;
        }
    }
</style>

