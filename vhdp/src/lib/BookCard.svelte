<script>
    let { book } = $props();
    let displayCover = $derived(book.cover_url || book.cover);
</script>

<div class="book-item comic-card">
    <div class="book-top-meta">
        <span class="book-rating">★ {book.rating}</span>
        <span class="book-chapters-count">{book.chapters} chương</span>
    </div>

    <div class="book-cover-wrapper">
        <div class="book-spine"></div>

        <div class="book-internal-pages">
            <a href="/read/{book.id}" class="comic-btn comic-btn--red comic-btn--sm read-btn">Đọc</a>
            <div class="page-text-sim">
                <span></span><span></span><span></span>
            </div>
        </div>

        <div class="book-cover-container">
            {#if displayCover}
                <img src={displayCover} alt={book.title} class="book-cover" />
            {:else}
                <div class="book-cover-placeholder">
                    <i class="bx bx-book"></i>
                </div>
            {/if}
            <div class="book-reflection"></div>
        </div>
    </div>

    <div class="book-info">
        <h3 class="book-title">{book.title}</h3>
        <p class="book-author">{book.author}</p>
    </div>

    <a href="/read/{book.id}" class="arrow-mark">
        <svg viewBox="0 0 24 24">
            <path d="M5 19L19 5M19 5H8M19 5v11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </a>
</div>

<style>
    .book-item {
        padding: 28px 24px 32px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        min-height: 440px;
    }

    .book-top-meta {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: var(--ink-faint, #8b8676);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 24px;
    }

    .book-rating {
        color: var(--coral, #ed6f5c);
        font-weight: 700;
    }

    .book-cover-wrapper {
        position: relative;
        width: 140px;
        height: 200px;
        box-shadow:
            5px 5px 12px rgba(21, 20, 15, 0.15),
            1px 1px 2px rgba(255, 255, 255, 0.3) inset;
        border-radius: 4px 8px 8px 4px;
        background: #fdfdfd;
        perspective: 1500px;
    }

    .book-cover-wrapper::after {
        content: "";
        position: absolute;
        top: 2px;
        bottom: 2px;
        right: -8px;
        width: 10px;
        background: #fdfdfd;
        background-image:
            linear-gradient(to right, rgba(21, 20, 15, 0.08), transparent 2px),
            repeating-linear-gradient(
                to bottom,
                #fff 0px,
                #fff 1px,
                #f0f0f0 2px
            );
        box-shadow: 2px 2px 6px rgba(21, 20, 15, 0.1);
        border-radius: 0 3px 3px 0;
        z-index: 1;
    }

    .book-spine {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 12px;
        background: rgba(21, 20, 15, 0.2);
        z-index: 10;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 1px 0 5px rgba(21, 20, 15, 0.25);
        pointer-events: none;
    }

    .book-internal-pages {
        position: absolute;
        inset: 0;
        background: #fdfdfd;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
        border-radius: 4px 8px 8px 4px;
        padding-left: 12px;
    }

    .page-text-sim {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        width: 60px;
    }

    .page-text-sim span {
        height: 3px;
        background: rgba(21, 20, 15, 0.05);
        border-radius: 1.5px;
    }

    .book-cover-container {
        position: absolute;
        inset: 0;
        z-index: 5;
        transform-origin: left center;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
        border-radius: 4px 8px 8px 4px;
        overflow: hidden;
    }

    .book-item:hover .book-cover-container {
        transform: rotateY(-110deg);
    }

    .book-cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .book-cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
        color: #ccc;
        font-size: 36px;
    }

    .book-reflection {
        position: absolute;
        top: 0;
        left: 8px;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            105deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.03) 20%,
            transparent 50%
        );
        pointer-events: none;
    }

    .read-btn {
        text-decoration: none;
        display: inline-block;
        box-shadow: 3px 3px 0px #1a1515;
    }

    .read-btn:hover {
        background: #d73a2c !important;
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(1px, 1px);
    }

    .book-info {
        margin-top: 24px;
        text-align: center;
        width: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .book-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        font-weight: 800;
        color: var(--ink, #15140f);
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.35;
        letter-spacing: -0.01em;
    }

    .book-author {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 13px;
        color: var(--ink-mute, #5a5448);
    }

    .arrow-mark {
        position: absolute;
        right: 20px;
        bottom: 20px;
        width: 28px;
        height: 28px;
        border: 1px solid rgba(21, 20, 15, 0.16);
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ink, #15140f);
        transition: all 0.2s ease;
        background: transparent;
    }

    .book-item:hover .arrow-mark {
        background: var(--coral, #ed6f5c);
        border-color: var(--coral, #ed6f5c);
        color: white;
    }

    .arrow-mark svg {
        width: 12px;
        height: 12px;
    }
</style>

