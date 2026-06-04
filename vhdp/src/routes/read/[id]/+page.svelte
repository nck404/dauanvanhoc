<script>
    import { onMount, tick } from "svelte";
    import { browser } from "$app/environment";
    import { enhance } from "$app/forms";

    import { page } from "$app/state";
    import { apiFetch } from "$lib/api.js";

    let book = $state(null);
    let chapters = $state([]);
    let isBookmarked = $state(false);
    let loading = $state(true);

    let flipbookElement = $state();
    let measureElement = $state();
    let isLoaded = $state(false);

    let fontSize = $state(18);
    let lineHeight = $state(1.8);

    let paginatedContent = $state([]);
    let handleResizeFn;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (existing.dataset.loaded === "true") return resolve();
                existing.addEventListener("load", () => resolve(), {
                    once: true,
                });
                existing.addEventListener(
                    "error",
                    () => reject(new Error(`Failed to load ${src}`)),
                    { once: true },
                );
                return;
            }

            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.dataset.loaded = "false";
            s.addEventListener(
                "load",
                () => {
                    s.dataset.loaded = "true";
                    resolve();
                },
                { once: true },
            );
            s.addEventListener(
                "error",
                () => reject(new Error(`Failed to load ${src}`)),
                { once: true },
            );
            document.head.appendChild(s);
        });
    }

    async function ensureJQueryAndTurn() {
        if (typeof window === "undefined") return;

        await loadScript("/jquery.js");

        if (window.jQuery && !window.$) window.$ = window.jQuery;
        if (window.$ && !window.jQuery) window.jQuery = window.$;

        await loadScript("/turn.js");

        if (window.jQuery && !window.$) window.$ = window.jQuery;
        if (window.$ && !window.jQuery) window.jQuery = window.$;
    }

    async function paginate() {
        if (!browser || !chapters || chapters.length === 0) return;

        const PAGE_HEIGHT = 800;
        const PAGE_PADDING_Y = 60 * 2;
        const RESERVED_UI_Y = 90;
        const MAX_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_Y - RESERVED_UI_Y;
        let allPages = [];

        allPages.push({ type: "hard", title: book.title, sub: book.author });
        allPages.push({ type: "hard", title: "", sub: "" });

        let pageCounter = 1;

        for (const chapter of chapters) {
            const tempDiv = document.createElement("div");
            const hasHtml = /<[a-z][\s\S]*>/i.test(chapter.content);
            tempDiv.innerHTML = hasHtml 
                ? chapter.content 
                : chapter.content.split(/\n+/).map(p => `<p>${p.trim()}</p>`).join("");
            const nodes = Array.from(tempDiv.childNodes);

            let currentPageHTML = "";
            let isFirstSubPage = true;

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const nodeHTML =
                    node.nodeType === 3 ? node.textContent : node.outerHTML;

                measureElement.innerHTML = currentPageHTML + nodeHTML;

                if (
                    measureElement.offsetHeight > MAX_HEIGHT &&
                    currentPageHTML !== ""
                ) {
                    allPages.push({
                        type: "text",
                        title: isFirstSubPage
                            ? chapter.title ||
                              `Chương ${chapter.chapter_number}`
                            : "",
                        content: currentPageHTML,
                        pageNum: pageCounter++,
                    });
                    currentPageHTML = nodeHTML;
                    isFirstSubPage = false;
                } else {
                    currentPageHTML += nodeHTML;
                }
            }

            if (currentPageHTML.trim()) {
                allPages.push({
                    type: "text",
                    title: isFirstSubPage
                        ? chapter.title || `Chương ${chapter.chapter_number}`
                        : "",
                    content: currentPageHTML,
                    pageNum: pageCounter++,
                });
            }
        }

        allPages.push({ type: "hard", title: "", sub: "" });
        allPages.push({ type: "hard", title: "Hết", sub: "Cảm ơn bạn đã đọc" });

        paginatedContent = allPages;
        await tick();
        initBook();
    }

    function initBook() {
        if (!flipbookElement || paginatedContent.length === 0) return;

        const startInit = () => {
            if (
                typeof window.$ === "undefined" ||
                typeof window.$.fn.turn === "undefined"
            ) {
                setTimeout(startInit, 100);
                return;
            }

            try {
                if (window.$(flipbookElement).turn("is")) {
                    window.$(flipbookElement).turn("destroy");
                }

                const w = window.innerWidth;
                const h = window.innerHeight;
                let bookWidth = 1200;
                let bookHeight = 800;
                let displayMode = "double";

                if (w < 768) {
                    displayMode = "single";
                    bookWidth = Math.min(w - 20, 480);
                    bookHeight = bookWidth * 1.4;
                } else {
                    displayMode = "double";
                    bookWidth = Math.min(w - 80, 1100);
                    bookHeight = bookWidth * 0.66;
                    if (bookHeight > h - 140) {
                        bookHeight = h - 140;
                        bookWidth = bookHeight * 1.5;
                    }
                }

                window.$(flipbookElement).turn({
                    width: bookWidth,
                    height: bookHeight,
                    elevation: 50,
                    gradients: true,
                    autoCenter: true,
                    duration: 1000,
                    page: 1,
                    display: displayMode,
                    when: {
                        turning: function (event, page, view) {
                            const audio = new Audio("/page-flip.mp3");
                            audio.volume = 0.2;
                            audio.play().catch(() => {});
                        },
                    },
                });

                handleResizeFn = () => {
                    if (!window.$ || !flipbookElement || !window.$(flipbookElement).turn("is")) return;
                    const curW = window.innerWidth;
                    const curH = window.innerHeight;
                    let targetW = 1200;
                    let targetH = 800;
                    let targetDisplay = "double";

                    if (curW < 768) {
                        targetDisplay = "single";
                        targetW = Math.min(curW - 20, 480);
                        targetH = targetW * 1.4;
                    } else {
                        targetDisplay = "double";
                        targetW = Math.min(curW - 80, 1100);
                        targetH = targetW * 0.66;
                        if (targetH > curH - 140) {
                            targetH = curH - 140;
                            targetW = targetH * 1.5;
                        }
                    }

                    window.$(flipbookElement).turn("display", targetDisplay);
                    window.$(flipbookElement).turn("size", targetW, targetH);
                };

                window.addEventListener("resize", handleResizeFn);

                window.addEventListener("keydown", (e) => {
                    if (e.keyCode === 37)
                        window.$(flipbookElement).turn("previous");
                    if (e.keyCode === 39)
                        window.$(flipbookElement).turn("next");
                });

                setTimeout(() => {
                    window.dispatchEvent(new Event("resize"));
                    isLoaded = true;
                }, 150);
            } catch (e) {
                console.error("Turn.js init error:", e);
            }
        };

        startInit();
    }

    async function toggleBookmark(e) {
        if (e) e.preventDefault();
        try {
            const res = await apiFetch(`/api/books/${page.params.id}/toggle-bookmark`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                isBookmarked = result.isBookmarked;
            }
        } catch (err) {
            console.error(err);
        }
    }

    onMount(async () => {
        if (browser) {
            await ensureJQueryAndTurn();
            document.body.classList.add("paper-theme");
            const bookId = page.params.id;
            try {
                const res = await apiFetch(`/api/books/${bookId}`);
                if (res.ok) {
                    const result = await res.json();
                    book = result.book;
                    chapters = result.chapters || [];
                    isBookmarked = result.isBookmarked;
                    setTimeout(paginate, 500);
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading = false;
            }

            return () => {
                document.body.classList.remove("paper-theme");
                if (handleResizeFn) {
                    window.removeEventListener("resize", handleResizeFn);
                }
                if (
                    window.$ &&
                    flipbookElement &&
                    window.$(flipbookElement).turn("is")
                ) {
                    window.$(flipbookElement).turn("destroy");
                }
            };
        }
    });
</script>

<svelte:head>
    <title>{book ? book.title : "Đang tải"} - Đọc truyện</title>
</svelte:head>

<div
    bind:this={measureElement}
    class="measure-layer"
    style="--fz: {fontSize}px; --lh: {lineHeight};"
></div>

<div class="reader-container">
    <a href="/library" class="floating-btn back" title="Quay lại">
        <i class="bx bx-left-arrow-alt"></i>
    </a>

    <button
        onclick={toggleBookmark}
        class="floating-btn bookmark"
        class:active={isBookmarked}
        title={isBookmarked ? "Xóa khỏi thư viện" : "Thêm vào thư viện"}
    >
        <i class="bx {isBookmarked ? 'bxs-heart' : 'bx-heart'}"></i>
    </button>

    <div class="workspace">
        <div class="flipbook-viewport" class:ready={isLoaded}>
            <div bind:this={flipbookElement} class="flipbook">
                {#each paginatedContent as page}
                    <div class="page {page.type === 'hard' ? 'hard' : ''}">
                        {#if page.type === "hard"}
                            <div class="hard-content">
                                {#if page.title}
                                    <div class="book-cover-design">
                                        {#if book?.cover_url && page.title !== "Hết"}
                                            <img
                                                src={book.cover_url}
                                                alt="Cover"
                                                class="cover-image-bg"
                                            />
                                        {/if}
                                        <h1>{page.title}</h1>
                                        <h3>{page.sub}</h3>
                                        <div class="ornament">❧</div>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div class="page-inner">
                                <article
                                    class="content-body"
                                    style="--fz: {fontSize}px; --lh: {lineHeight};"
                                >
                                    {#if page.title}
                                        <h2 class="chapter-header">
                                            {page.title}
                                        </h2>
                                    {/if}
                                    <div class="text-content">
                                        {@html page.content}
                                    </div>
                                </article>
                                <div class="page-number">
                                    - {page.pageNum} -
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        {#if !isLoaded}
            <div class="loading-overlay">
                <div class="loader"></div>
                <p>Đang dàn trang sách...</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .reader-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: transparent;
        position: relative;
        font-family: 'Space Grotesk', sans-serif;
    }

    .measure-layer {
        position: absolute;
        visibility: hidden;
        width: 480px;
        line-height: var(--lh);
        font-size: var(--fz);
        font-family: 'Playfair Display', serif;
        white-space: normal;
        word-wrap: break-word;
        padding: 0;
        margin: 0;
        pointer-events: none;
        z-index: -1000;
    }

    .floating-btn {
        position: fixed;
        width: 48px;
        height: 48px;
        background: var(--bone, #f7f1de);
        border: 1px solid var(--line, rgba(21, 20, 15, 0.16));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        color: var(--ink, #15140f);
        box-shadow: 0 10px 25px -10px rgba(21, 20, 15, 0.15);
        z-index: 1000;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .floating-btn.back {
        top: 24px;
        left: 40px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #475569;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .floating-btn.back:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #1e293b;
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .floating-btn.bookmark {
        top: 24px;
        right: 40px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #ef4444;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    .floating-btn.bookmark:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #ef4444;
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.15);
    }

    .floating-btn.bookmark.active {
        background: #ef4444;
        border-color: #ef4444;
        color: #ffffff;
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
    }
    
    .floating-btn.bookmark.active:hover {
        background: #dc2626;
        border-color: #dc2626;
        color: #ffffff;
    }

    .workspace {
        flex: 1;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        perspective: 2000px;
        padding-top: 40px;
    }

    .flipbook-viewport {
        display: flex;
        align-items: center;
        justify-content: center;
        width: auto;
        height: auto;
        opacity: 0;
        transition: opacity 0.6s ease;
    }

    .flipbook-viewport.ready {
        opacity: 1;
    }

    .flipbook .page {
        background-color: #faf6eb;
        box-shadow: 0 0 25px rgba(21, 20, 15, 0.1);
    }

    .flipbook .hard {
        background: #2a2620;
        color: var(--paper, #efe7d2);
        box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);
    }

    .hard-content {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .book-cover-design {
        text-align: center;
        padding: 40px;
        border: 1px solid rgba(239, 231, 210, 0.15);
        margin: 20px;
        height: calc(100% - 40px);
        width: calc(100% - 40px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        background: #1e1b18;
    }

    .cover-image-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.18;
        z-index: 0;
    }

    .book-cover-design h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 800;
        font-size: 32px;
        z-index: 1;
        margin-bottom: 15px;
        color: var(--paper, #efe7d2);
    }

    .book-cover-design h3 {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 18px;
        z-index: 1;
        color: var(--coral, #ed6f5c);
    }

    .ornament {
        font-size: 28px;
        margin-top: 24px;
        color: var(--coral, #ed6f5c);
        z-index: 1;
    }

    .page-inner {
        padding: 60px;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #faf6eb;
        box-sizing: border-box;
        position: relative;
    }

    .flipbook .page:nth-child(odd) .page-inner::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to right, transparent, rgba(21, 20, 15, 0.05));
        pointer-events: none;
    }

    .flipbook .page:nth-child(even) .page-inner::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to left, transparent, rgba(21, 20, 15, 0.05));
        pointer-events: none;
    }

    .chapter-header {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 22px;
        text-align: center;
        margin-bottom: 24px;
        color: var(--ink, #15140f);
    }

    .text-content {
        font-family: 'Playfair Display', serif;
        text-align: justify;
        line-height: var(--lh);
        font-size: var(--fz);
        color: var(--ink-soft, #2a2620);
        word-wrap: break-word;
    }

    :global(.text-content p) {
        margin-bottom: 1em;
        text-indent: 1.5em;
    }

    .measure-layer :global(p) {
        margin-bottom: 1em;
        text-indent: 1.5em;
    }

    :global(.text-content img) {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 10px auto;
        border-radius: 4px;
    }

    .page-number {
        margin-top: auto;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--ink-faint, #8b8676);
        padding-top: 10px;
    }

    .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: transparent;
        z-index: 100;
    }

    .loader {
        width: 40px;
        height: 40px;
        border: 4px solid var(--accent-light, #f7f1de);
        border-top-color: var(--coral, #ed6f5c);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
