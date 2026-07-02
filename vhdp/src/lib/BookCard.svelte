<script>
    let { book } = $props();
    let displayCover = $derived(book.cover_url || book.cover);
    let readLink = $derived(
        (book.type === "truyện tranh" || book.type === "comic" || book.type === "manga") 
        ? `/read-comic/${book.id}` 
        : `/read/${book.id}`
    );
</script>

<a href={readLink} class="book-item">
    <div class="book-cover-wrapper">
        <div class="book-cover-container">
            {#if displayCover}
                <img src={displayCover} alt={book.title} class="book-cover" />
            {:else}
                <div class="book-cover-placeholder">
                    <div class="halftone-pattern"></div>
                    <span class="placeholder-icon">§</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="book-info">
        <h3 class="book-title">{book.title}</h3>
        <p class="book-author">{book.author}</p>
    </div>
</a>

<style>
    .book-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        padding: 16px;
        text-decoration: none;
        color: inherit;
        position: relative;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        border-radius: 0;
        transition: all 0.2s ease-out;
    }

    .book-item:hover {
        background: var(--newsprint-surface);
        box-shadow: var(--shadow-hard);
        transform: translate(-2px, -2px);
    }

    .book-cover-wrapper {
        position: relative;
        width: 100%;
        aspect-ratio: 2 / 3;
        overflow: hidden;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
    }

    .book-cover-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .book-cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: grayscale(100%);
        transition: all 0.3s ease-out;
    }

    .book-item:hover .book-cover {
        filter: grayscale(100%) sepia(50%);
        transform: scale(1.02);
    }

    .book-cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        background: var(--newsprint-surface);
    }

    .halftone-pattern {
        position: absolute;
        inset: 0;
        background: radial-gradient(var(--newsprint-ink) 1px, transparent 1px);
        background-size: 16px 16px;
        opacity: 0.1;
    }

    .placeholder-icon {
        position: relative;
        z-index: 1;
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        font-weight: 700;
        color: var(--newsprint-neutral-400);
    }

    .book-info {
        margin-top: 14px;
        width: 100%;
    }

    .book-title {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--newsprint-ink);
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.35;
    }

    .book-author {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 13px;
        color: var(--newsprint-neutral-500);
        line-height: 1.4;
    }
</style>
