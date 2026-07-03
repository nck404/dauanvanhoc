<script>
    import { onMount, tick } from "svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { apiFetch } from "$lib/api.js";

    let book = $state(null);
    let chapters = $state([]);
    let isBookmarked = $state(false);
    let loading = $state(true);

    let flipbookElement = $state();
    let measureElement = $state();
    let isLoaded = $state(false);

    let showTutorial = $state(false);
    let tutorialStep = $state(1);

    let fontSize = $state(18);
    let lineHeight = $state(1.8);

    let paginatedContent = $state([]);
    let currentPage = $state(1);
    let totalPages = $state(1);
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
        
        // Wait for measureElement to be bound
        if (!measureElement) {
            await tick();
            if (!measureElement) {
                console.warn('measureElement not available, skipping pagination');
                return;
            }
        }

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
            
            const rawNodes = Array.from(tempDiv.childNodes);
            const nodes = [];

            for (const rNode of rawNodes) {
                if (rNode.nodeType === 1 && rNode.tagName.toLowerCase() === "p") {
                    const text = rNode.innerHTML;
                    if (text.length > 350) {
                        const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
                        let currentChunk = "";
                        for (const sentence of sentences) {
                            if ((currentChunk + sentence).length > 300) {
                                if (currentChunk.trim()) {
                                    const pNode = document.createElement("p");
                                    pNode.innerHTML = currentChunk.trim();
                                    nodes.push(pNode);
                                }
                                currentChunk = sentence;
                            } else {
                                currentChunk += sentence;
                            }
                        }
                        if (currentChunk.trim()) {
                            const pNode = document.createElement("p");
                            pNode.innerHTML = currentChunk.trim();
                            nodes.push(pNode);
                        }
                    } else {
                        nodes.push(rNode);
                    }
                } else if (rNode.nodeType === 3) {
                    const text = rNode.textContent;
                    if (text.trim().length > 350) {
                        const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
                        let currentChunk = "";
                        for (const sentence of sentences) {
                            if ((currentChunk + sentence).length > 300) {
                                if (currentChunk.trim()) {
                                    const pNode = document.createElement("p");
                                    pNode.textContent = currentChunk.trim();
                                    nodes.push(pNode);
                                }
                                currentChunk = sentence;
                            } else {
                                currentChunk += sentence;
                            }
                        }
                        if (currentChunk.trim()) {
                            const pNode = document.createElement("p");
                            pNode.textContent = currentChunk.trim();
                            nodes.push(pNode);
                        }
                    } else if (text.trim()) {
                        nodes.push(rNode);
                    }
                } else {
                    nodes.push(rNode);
                }
            }

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
        totalPages = allPages.length;
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

                const savedPage = browser && book ? (parseInt(localStorage.getItem(`vhdp_progress_book_${book.id}`)) || 1) : 1;
                currentPage = savedPage;

                const w = window.innerWidth;
                let displayMode = w < 768 ? "single" : "double";
                let bookWidth = displayMode === "single" ? 600 : 1200;
                let bookHeight = 800;

                window.$(flipbookElement).turn({
                    width: bookWidth,
                    height: bookHeight,
                    elevation: 50,
                    gradients: true,
                    autoCenter: true,
                    duration: 1000,
                    page: savedPage,
                    display: displayMode
                });

                window.$(flipbookElement).bind("turned", function(event, page, view) {
                    currentPage = page;
                    if (browser && book) {
                        localStorage.setItem(`vhdp_progress_book_${book.id}`, page);
                    }
                });

                // Add robust click handlers for turning pages in case CSS scaling breaks hitboxes
                const viewport = flipbookElement.parentElement;
                if (viewport) {
                    viewport.addEventListener("click", (e) => {
                        // Don't turn if clicking on a link
                        if (e.target.closest('a') || e.target.closest('button')) return;
                        
                        const rect = viewport.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        
                        // Left 40% turns back, right 40% turns forward, middle 20% does nothing
                        if (clickX < rect.width * 0.4) {
                            window.$(flipbookElement).turn("previous");
                        } else if (clickX > rect.width * 0.6) {
                            window.$(flipbookElement).turn("next");
                        }
                    });
                }

                handleResizeFn = () => {
                    if (!window.$ || !flipbookElement || !window.$(flipbookElement).turn("is")) return;
                    
                    const curW = window.innerWidth;
                    const curH = window.innerHeight;
                    
                    let targetDisplay = curW < 768 ? "single" : "double";
                    if (window.$(flipbookElement).turn("display") !== targetDisplay) {
                        window.$(flipbookElement).turn("display", targetDisplay);
                        window.$(flipbookElement).turn("size", targetDisplay === "single" ? 600 : 1200, 800);
                    }

                    const bookW = targetDisplay === "single" ? 600 : 1200;
                    const bookH = 800;
                    
                    const availW = curW - (curW < 768 ? 20 : 40);
                    const availH = curH - 80;
                    
                    const scaleW = availW / bookW;
                    const scaleH = availH / bookH;
                    let scale = Math.min(scaleW, scaleH);
                    
                    // Allow scaling up on large screens for full screen experience, cap at 1.5x
                    if (scale > 1.5) scale = 1.5;

                    const viewport = flipbookElement.parentElement;
                    if (viewport) {
                        // Fallback to transform for maximum compatibility
                        viewport.style.transform = `scale(${scale})`;
                        viewport.style.transformOrigin = "center top";
                        viewport.style.zoom = 'normal'; // Reset zoom
                    }
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

        // Check tutorial
        if (!localStorage.getItem('vhdp_reader_tutorial_shown')) {
            showTutorial = true;
        }
    }

    let toastMessage = $state("");
    let toastTimeout;

    function showToast(msg) {
        toastMessage = msg;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastMessage = "";
        }, 3000);
    }

    async function toggleBookmark(e) {
        if (e) e.preventDefault();
        
        // Optimistic UI Update
        const previousState = isBookmarked;
        isBookmarked = !isBookmarked;
        
        if (isBookmarked) {
            showToast("Đã thêm vào Thư viện");
        } else {
            showToast("Đã xóa khỏi Thư viện");
        }

        try {
            const res = await apiFetch(`/api/books/${page.params.id}/toggle-bookmark`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                if (isBookmarked !== result.isBookmarked) {
                    isBookmarked = result.isBookmarked;
                }
            } else {
                isBookmarked = previousState;
                showToast("Lỗi: Không thể cập nhật");
            }
        } catch (err) {
            console.error(err);
            isBookmarked = previousState;
            showToast("Lỗi: Không thể kết nối");
        }
    }

    onMount(() => {
        if (browser) {
            const bookId = page.params.id;
            
            const loadData = async () => {
                try {
                    const res = await apiFetch(`/api/books/${bookId}`);
                    if (res.ok) {
                        const result = await res.json();
                        book = result.book;
                        chapters = result.chapters || [];
                        isBookmarked = result.isBookmarked;

                        await ensureJQueryAndTurn();
                        document.body.classList.add("paper-theme");
                        setTimeout(paginate, 500);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    loading = false;
                }
            };
            
            loadData();

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

{#if loading}
    <div class="loader-cover">
        <div class="spinner"></div>
    </div>
{:else if book}

        <div bind:this={measureElement} class="measure-layer" style="--fz: {fontSize}px; --lh: {lineHeight};"></div>

        <div class="reader-container">
            <div class="progress-bar-top" style="width: {(currentPage / totalPages) * 100}%"></div>

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

            <div class="reader-footer-bar">
                <button class="nav-btn" onclick={() => window.$(flipbookElement).turn("previous")} disabled={currentPage <= 1}>
                    <i class="bx bx-chevron-left"></i>
                </button>
                <div class="progress-info">
                    <span class="progress-text">Trang {currentPage} / {totalPages}</span>
                    <input 
                        type="range" 
                        min="1" 
                        max={totalPages} 
                        value={currentPage} 
                        oninput={(e) => window.$(flipbookElement).turn("page", parseInt(e.target.value))} 
                        class="page-slider"
                    />
                </div>
                <button class="nav-btn" onclick={() => window.$(flipbookElement).turn("next")} disabled={currentPage >= totalPages}>
                    <i class="bx bx-chevron-right"></i>
                </button>
            </div>
        </div>

        {#if showTutorial}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="tutorial-overlay" onclick={() => {
                if (tutorialStep === 1) {
                    tutorialStep = 2;
                } else {
                    showTutorial = false;
                    localStorage.setItem('vhdp_reader_tutorial_shown', 'true');
                }
            }}>
                {#if tutorialStep === 1}
                    <div class="tutorial-spotlight right">
                        <div class="click-zone right-zone"></div>
                        <div class="tutorial-text">
                            <i class="bx bx-pointer bx-tada"></i>
                            <h2>Trang Tiếp</h2>
                            <p>Nhấp vào <b>vùng bên phải</b> để lật trang</p>
                            <span class="skip-text">Nhấp để tiếp tục</span>
                        </div>
                    </div>
                {:else if tutorialStep === 2}
                    <div class="tutorial-spotlight left">
                        <div class="click-zone left-zone"></div>
                        <div class="tutorial-text">
                            <i class="bx bx-pointer bx-tada"></i>
                            <h2>Trang Trước</h2>
                            <p>Nhấp vào <b>vùng bên trái</b> để lùi lại</p>
                            <span class="skip-text">Nhấp để đóng</span>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

{/if}

{#if toastMessage}
    <div class="newsprint-toast">
        {toastMessage}
    </div>
{/if}

<style>
    .newsprint-toast {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        background: #111;
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: toast-fade-in 0.3s ease forwards;
        pointer-events: none;
        border: 2px solid #333;
    }

    @keyframes toast-fade-in {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        cursor: pointer;
        font-family: 'Space Grotesk', sans-serif;
    }

    .tutorial-spotlight {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 10, 0.85);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.4s ease-out;
    }

    .click-zone {
        position: absolute;
        top: 20px;
        bottom: 20px;
        border: 2px dashed #ed6f5c;
        background: rgba(237, 111, 92, 0.1);
        animation: pulse-zone 2s infinite ease-in-out;
        pointer-events: none;
    }

    .click-zone.right-zone {
        right: 20px;
        width: calc(40% - 20px);
    }

    .click-zone.left-zone {
        left: 20px;
        width: calc(40% - 20px);
    }

    @keyframes pulse-zone {
        0%, 100% { background: rgba(237, 111, 92, 0.05); }
        50% { background: rgba(237, 111, 92, 0.15); }
    }

    .tutorial-text {
        color: #f0f0f0;
        text-align: center;
        position: absolute;
        font-family: 'Space Grotesk', sans-serif;
        background: #111;
        padding: 24px 32px;
        border: 1px solid #333;
        box-shadow: 6px 6px 0px #ed6f5c;
        z-index: 2;
    }

    .tutorial-spotlight.right .tutorial-text {
        right: 45%;
    }

    .tutorial-spotlight.left .tutorial-text {
        left: 45%;
    }

    .tutorial-text i {
        font-size: 36px;
        color: #ed6f5c;
        margin-bottom: 8px;
        display: block;
    }

    .tutorial-text h2 {
        font-family: 'Playfair Display', serif;
        font-size: 24px;
        margin: 0 0 8px 0;
        color: #fff;
    }

    .tutorial-text p {
        margin: 0;
        font-size: 15px;
        color: #aaa;
    }

    .tutorial-text b {
        color: #ed6f5c;
        font-weight: 600;
    }

    .skip-text {
        display: block;
        margin-top: 20px;
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .loader-cover {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        background: #0f0e0c;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.05);
        border-top-color: #e15b5b;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .comic-reader-viewport {
        min-height: 100vh;
        background: #080808;
        color: #e2e8f0;
        display: flex;
        flex-direction: column;
        font-family: 'Space Grotesk', sans-serif;
    }

    .comic-header-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: rgba(14, 14, 14, 0.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 1000;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .comic-back-link {
        font-size: 24px;
        color: #a0aec0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        transition: background 0.2s, color 0.2s;
    }

    .comic-back-link:hover {
        background: #1a1a1a;
        color: #ffffff;
    }

    .comic-title-meta h1 {
        font-size: 15px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        line-height: 1.2;
    }

    .comic-title-meta p {
        font-size: 11px;
        color: #718096;
        margin: 0;
    }

    .chapter-selector-dropdown {
        background: #1a1a1a;
        color: #ffffff;
        border: 1px solid #2d3748;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .control-toggle-btn {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #1a1a1a;
        border: 1px solid #2d3748;
        color: #a0aec0;
        font-size: 18px;
        transition: all 0.2s;
    }

    .control-toggle-btn:hover {
        background: #2d3748;
        color: #ffffff;
    }

    .control-toggle-btn.active {
        background: #e15b5b;
        border-color: #e15b5b;
        color: #ffffff;
    }

    .view-mode-selector, .width-selector {
        background: #1a1a1a;
        color: #ffffff;
        border: 1px solid #2d3748;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        outline: none;
        cursor: pointer;
    }

    .comic-content-area {
        margin: 84px auto 80px;
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        padding: 0 16px;
    }

    .width-narrow { max-width: 680px; }
    .width-medium { max-width: 900px; }
    .width-wide { max-width: 1200px; }
    .width-full { max-width: 100%; padding: 0; }

    .scroll-comic-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .comic-page-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: 2px;
        background: #000000;
    }

    .comic-single-image {
        max-width: 100%;
        height: auto;
        display: block;
    }

    .page-comic-container {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        background: #000000;
        border-radius: 8px;
        overflow: hidden;
    }

    .single-image-viewport {
        max-width: 100%;
        display: flex;
        justify-content: center;
    }

    .page-nav-overlay-btn {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 15%;
        background: rgba(0, 0, 0, 0);
        color: rgba(255, 255, 255, 0.15);
        font-size: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        z-index: 10;
    }

    .page-nav-overlay-btn:hover {
        background: rgba(0, 0, 0, 0.4);
        color: rgba(255, 255, 255, 0.8);
    }

    .page-nav-overlay-btn.prev { left: 0; }
    .page-nav-overlay-btn.next { right: 0; }

    .page-comic-counter {
        margin-top: 16px;
        font-size: 14px;
        color: #718096;
    }

    .no-images-fallback {
        text-align: center;
        padding: 60px 20px;
        color: #a0aec0;
    }

    .raw-content-box {
        margin-top: 20px;
        text-align: left;
        background: #111111;
        padding: 24px;
        border-radius: 8px;
        max-width: 800px;
        line-height: 1.8;
        font-family: initial;
    }

    .comic-navigation-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: rgba(14, 14, 14, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 40px;
        z-index: 1000;
    }

    .nav-ch-btn {
        background: #1a1a1a;
        color: #ffffff;
        border: 1px solid #2d3748;
        padding: 8px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .nav-ch-btn:hover:not(:disabled) {
        background: #2d3748;
    }

    .nav-ch-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .nav-ch-indicator {
        font-size: 14px;
        color: #a0aec0;
    }

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
        width: 480px; /* 600px total page width - 120px horizontal padding */
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
    }
    
    .floating-btn.back:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #1e293b;
        transform: translateY(-2px) scale(1.05);
    }

    .floating-btn.bookmark {
        top: 24px;
        right: 40px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #ef4444;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .floating-btn.bookmark:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        transform: translateY(-2px) scale(1.05);
    }

    .floating-btn.bookmark.active {
        background: #ef4444;
        border-color: #ef4444;
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

    @media (max-width: 768px) {
        .comic-header-bar {
            padding: 0 10px;
            gap: 6px;
        }
        .comic-title-meta {
            display: none;
        }
        .width-selector {
            display: none;
        }
        .comic-navigation-footer {
            padding: 0 16px;
        }
        .floating-btn.back {
            left: 16px;
            top: 16px;
        }
        .floating-btn.bookmark {
            right: 16px;
            top: 16px;
        }
    }

    .progress-bar-top {
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: var(--coral, #ed6f5c);
        z-index: 1001;
        transition: width 0.3s ease;
    }

    .reader-footer-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 16px;
        background: var(--bone, #f7f1de);
        border: 2px solid var(--ink, #15140f);
        padding: 8px 16px;
        box-shadow: 4px 4px 0px var(--ink, #15140f);
        z-index: 1000;
    }

    .nav-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--ink, #15140f);
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        transition: background 0.2s;
    }

    .nav-btn:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    .nav-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .progress-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .progress-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        color: var(--ink, #15140f);
        white-space: nowrap;
    }

    .page-slider {
        width: 150px;
        accent-color: var(--coral, #ed6f5c);
        cursor: pointer;
    }
</style>
