<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";

    import { apiFetch } from "$lib/api.js";

    let truyenChu = $state([]);
    let truyenTranh = $state([]);
    let audios = $state([]);
    let videos = $state([]);

    let loaded = $state(false);

    let categories = [
        { name: "Truyện tranh", icon: "bx-book-content", url: "/truyen-tranh" },
        { name: "Truyện chữ", icon: "bx-book-open", url: "/truyen-chu" },
        { name: "Video", icon: "bx-video", url: "/video" },
        { name: "Audio", icon: "bx-headphone", url: "/audio" },
    ];

    let searchQuery = $state("");

    let filteredTruyenChu = $derived(
        truyenChu.filter(
            (book) =>
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    let filteredTruyenTranh = $derived(
        truyenTranh.filter(
            (book) =>
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    let rotationY = $state(0);
    let rotationX = $state(-10);
    let isDragging = $state(false);
    let startX = 0;
    let startY = 0;
    let startRotationY = 0;
    let startRotationX = 0;

    function handleMouseDown(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startRotationY = rotationY;
        startRotationX = rotationX;
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        rotationY = startRotationY + deltaX * 0.35;
        rotationX = startRotationX - deltaY * 0.35;
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleTouchStart(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startRotationY = rotationY;
        startRotationX = rotationX;
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        rotationY = startRotationY + deltaX * 0.35;
        rotationX = startRotationX - deltaY * 0.35;
    }

    onMount(async () => {
        document.body.classList.add("paper-theme");
        try {
            const res = await apiFetch("/api/homepage");
            if (res.ok) {
                const data = await res.json();
                truyenChu = data.truyenChu || [];
                truyenTranh = data.truyenTranh || [];
                audios = data.audios || [];
                videos = data.videos || [];
            }
        } catch (e) {
            console.error(e);
        }
        let frameId;
        const spin = () => {
            if (!isDragging) {
                rotationY += 0.15;
                rotationX = -10 + Math.sin(Date.now() * 0.0006) * 5;
            }
            frameId = requestAnimationFrame(spin);
        };
        frameId = requestAnimationFrame(spin);
        const t = setTimeout(() => { loaded = true; }, 420);
        return () => {
            clearTimeout(t);
            cancelAnimationFrame(frameId);
            document.body.classList.remove("paper-theme");
        };
    });

    const SKELETON_COUNT = 8;
</script>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Thư Viện Địa Phương</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="topbar">
    <div class="container">
        <div class="topbar-inner">
            <span><b>Ấn bản đặc biệt</b> · Số 01</span>
            <span class="mid">Dấu ấn văn học · Gìn giữ tinh hoa đất nước</span>
            <span class="right">
                <span class="pulse"></span>
                <span>Hệ thống trực tuyến</span>
            </span>
        </div>
    </div>
</div>

<div class="page-container">
    <header class="hero-section">
        <div class="hero-grid">
            <div class="hero-copy">
                <span class="label">Thư viện số hóa</span>
                <h1>
                    Hành trình tìm về <em>dấu ấn</em> của <em>văn học</em><span
                        class="dot">.</span
                    >
                </h1>
                <p class="lead">
                    Khám phá hàng ngàn câu chuyện, tài liệu văn học địa phương
                    đặc sắc, được số hóa và lưu trữ nguyên bản.
                </p>

                <div class="search-bar">
                    <i class="bx bx-search"></i>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                        bind:value={searchQuery}
                    />
                </div>

                <div class="category-list">
                    {#each categories as cat}
                        <a href={cat.url} class="category-comic-btn">
                            <i class="bx {cat.icon}"></i>
                            <span>{cat.name}</span>
                        </a>
                    {/each}
                </div>
            </div>

            <div class="hero-art">
                <span class="corner tl"></span>
                <span class="corner tr"></span>
                <span class="corner bl"></span>
                <span class="corner br"></span>

                <div 
                    class="dome-viewport"
                    role="presentation"
                    onmousedown={handleMouseDown}
                    onmousemove={handleMouseMove}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseUp}
                    ontouchstart={handleTouchStart}
                    ontouchmove={handleTouchMove}
                    ontouchend={handleMouseUp}
                >
                    <div class="floating-icon" style="--duration: 8s; --x: 35px; --y: -45px; --r: 20deg; top: 12%; left: 8%; color: var(--coral);"><i class="bx bx-music"></i></div>
                    <div class="floating-icon" style="--duration: 11s; --x: -45px; --y: 35px; --r: -25deg; top: 15%; right: 12%; color: #14b8a6;"><i class="bx bx-video"></i></div>
                    <div class="floating-icon" style="--duration: 9s; --x: 30px; --y: 55px; --r: 15deg; bottom: 12%; left: 10%; color: #eab308;"><i class="bx bx-book-open"></i></div>

                    <div class="floating-particle" style="--duration: 5s; --x: 80px; --y: -90px; --r: 360deg; top: 30%; left: 25%; color: #ff007f;">+</div>
                    <div class="floating-particle" style="--duration: 7s; --x: -90px; --y: 80px; --r: -360deg; top: 40%; right: 25%; color: #00e5ff;">+</div>
                    <div class="floating-particle" style="--duration: 6s; --x: 60px; --y: 70px; --r: 180deg; bottom: 35%; left: 30%; color: #ffeb3b;">+</div>
                    <div class="floating-particle" style="--duration: 8s; --x: -70px; --y: -60px; --r: -180deg; bottom: 40%; right: 30%; color: #e91e63;">+</div>

                    <div class="floating-particle letter" style="--duration: 9s; --x: -80px; --y: -50px; --r: 270deg; top: 10%; left: 40%; color: #9c27b0;">V</div>
                    <div class="floating-particle letter" style="--duration: 10s; --x: 70px; --y: -80px; --r: -270deg; top: 12%; right: 40%; color: #ff9800;">H</div>
                    <div class="floating-particle letter" style="--duration: 8s; --x: -60px; --y: 60px; --r: 180deg; bottom: 15%; left: 45%; color: #3f51b5;">D</div>
                    <div class="floating-particle letter" style="--duration: 11s; --x: 50px; --y: 90px; --r: -180deg; bottom: 18%; right: 45%; color: #4caf50;">P</div>
                    <div class="floating-particle letter" style="--duration: 7s; --x: 90px; --y: -30px; --r: 360deg; top: 50%; left: 45%; color: #ff5722;">A</div>

                    <div class="dome-container" style="transform: rotateX({rotationX}deg) rotateY({rotationY}deg);">
                        <div class="dome-card row-top" style="--i: 0;">
                            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80" alt="Tấm Cám" />
                            <div class="dome-card-title">Tấm Cám</div>
                        </div>
                        <div class="dome-card row-top" style="--i: 1;">
                            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80" alt="Sơn Tinh" />
                            <div class="dome-card-title">Sơn Tinh</div>
                        </div>
                        <div class="dome-card row-top" style="--i: 2;">
                            <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80" alt="Thánh Gióng" />
                            <div class="dome-card-title">Thánh Gióng</div>
                        </div>
                        <div class="dome-card row-top" style="--i: 3;">
                            <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&auto=format&fit=crop&q=80" alt="Thạch Sanh" />
                            <div class="dome-card-title">Thạch Sanh</div>
                        </div>

                        <div class="dome-card row-middle" style="--i: 0;">
                            <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80" alt="Thánh Gióng" />
                            <div class="dome-card-title">Thánh Gióng</div>
                        </div>
                        <div class="dome-card row-middle" style="--i: 1;">
                            <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&auto=format&fit=crop&q=80" alt="Thạch Sanh" />
                            <div class="dome-card-title">Thạch Sanh</div>
                        </div>
                        <div class="dome-card row-middle" style="--i: 2;">
                            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80" alt="Tấm Cám" />
                            <div class="dome-card-title">Tấm Cám</div>
                        </div>
                        <div class="dome-card row-middle" style="--i: 3;">
                            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80" alt="Sơn Tinh" />
                            <div class="dome-card-title">Sơn Tinh</div>
                        </div>

                        <div class="dome-card row-bottom" style="--i: 0;">
                            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80" alt="Tấm Cám" />
                            <div class="dome-card-title">Tấm Cám</div>
                        </div>
                        <div class="dome-card row-bottom" style="--i: 1;">
                            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80" alt="Sơn Tinh" />
                            <div class="dome-card-title">Sơn Tinh</div>
                        </div>
                        <div class="dome-card row-bottom" style="--i: 2;">
                            <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80" alt="Thánh Gióng" />
                            <div class="dome-card-title">Thánh Gióng</div>
                        </div>
                        <div class="dome-card row-bottom" style="--i: 3;">
                            <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&auto=format&fit=crop&q=80" alt="Thạch Sanh" />
                            <div class="dome-card-title">Thạch Sanh</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div class="wire-ticker">
        <div class="ticker-inner">
            <span
                >VĂN HỌC DÂN GIAN — TIỂU THUYẾT LỊCH SỬ — THƠ CA CỔ ĐIỂN — DANH
                TÁC VIỆT NAM — LƯU GIỮ TINH HOA VĂN HÓA ĐẤT NƯỚC — &nbsp;</span
            >
            <span
                >VĂN HỌC DÂN GIAN — TIỂU THUYẾT LỊCH SỬ — THƠ CA CỔ ĐIỂN — DANH
                TÁC VIỆT NAM — LƯU GIỮ TINH HOA VĂN HÓA ĐẤT NƯỚC — &nbsp;</span
            >
        </div>
    </div>

    <section class="content-section">
        <div class="sec-rule">
            <span class="roman">I.</span>
            <span>Truyện Chữ</span>
            <a href="/truyen-chu" class="view-all-link">
                <span>Xem tất cả</span>
                <span class="dot-mark">•</span>
            </a>
        </div>

        <div class="book-grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <SkeletonCard type="book" class="reveal reveal-delay-{i % 5 + 1}" />
                {/each}
            {:else if filteredTruyenChu.length === 0}
                <div class="empty-state-home">Chưa có truyện chữ nổi bật</div>
            {:else}
                {#each filteredTruyenChu as book, i}
                    <div class="reveal reveal-delay-{i % 5 + 1}">
                        <BookCard {book} />
                    </div>
                {/each}
            {/if}
        </div>
    </section>

    <section class="content-section">
        <div class="sec-rule">
            <span class="roman">II.</span>
            <span>Truyện Tranh</span>
            <a href="/truyen-tranh" class="view-all-link">
                <span>Xem tất cả</span>
                <span class="dot-mark">•</span>
            </a>
        </div>

        <div class="book-grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <SkeletonCard type="book" class="reveal reveal-delay-{i % 5 + 1}" />
                {/each}
            {:else if filteredTruyenTranh.length === 0}
                <div class="empty-state-home">Chưa có truyện tranh nổi bật</div>
            {:else}
                {#each filteredTruyenTranh as book, i}
                    <div class="reveal reveal-delay-{i % 5 + 1}">
                        <BookCard {book} />
                    </div>
                {/each}
            {/if}
        </div>
    </section>

    <section class="content-section">
        <div class="sec-rule">
            <span class="roman">III.</span>
            <span>Audio Sách</span>
            <a href="/audio" class="view-all-link">
                <span>Xem tất cả</span>
                <span class="dot-mark">•</span>
            </a>
        </div>

        <div class="media-grid format-audio">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <div class="reveal reveal-delay-{i % 5 + 1}">
                        <SkeletonCard type="audio" />
                    </div>
                {/each}
            {:else if audios.length === 0}
                <div class="empty-state-home">Chưa có audio nổi bật</div>
            {:else}
                {#each audios as audio, i}
                    <a href="/audio/{audio.id}" class="comic-card media-card audio-list-card reveal reveal-delay-{i % 5 + 1}">
                    <div class="cover-box">
                        {#if audio.cover}
                            <img src={audio.cover} alt="Cover" />
                        {:else}
                            <div class="placeholder">
                                <i class="bx bxs-music"></i>
                            </div>
                        {/if}
                        <div class="play-overlay">
                            <i class="bx bx-play"></i>
                        </div>
                    </div>
                    <div class="info">
                        <span class="index-tag">Audio</span>
                        <h3>{audio.title}</h3>
                        <p>{audio.author}</p>
                    </div>
                </a>
                {/each}
            {/if}
        </div>
    </section>

    <section class="content-section">
        <div class="sec-rule">
            <span class="roman">IV.</span>
            <span>Video Tư Liệu</span>
            <a href="/video" class="view-all-link">
                <span>Xem tất cả</span>
                <span class="dot-mark">•</span>
            </a>
        </div>

        <div class="media-grid format-video">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <div class="reveal reveal-delay-{i % 5 + 1}">
                        <SkeletonCard type="video" />
                    </div>
                {/each}
            {:else if videos.length === 0}
                <div class="empty-state-home">Chưa có video nổi bật</div>
            {:else}
                {#each videos as video, i}
                    <a href="/video/{video.id}" class="comic-card media-card video-list-card reveal reveal-delay-{i % 5 + 1}">
                    <div class="cover-box">
                        {#if video.cover}
                            <img src={video.cover} alt="Cover" />
                        {:else}
                            <div class="placeholder">
                                <i class="bx bx-video"></i>
                            </div>
                        {/if}
                        <div class="play-overlay">
                            <i class="bx bx-play"></i>
                        </div>
                    </div>
                    <div class="info">
                        <span class="index-tag">Video</span>
                        <h3>{video.title}</h3>
                        <p>{video.author}</p>
                    </div>
                </a>
                {/each}
            {/if}
        </div>
    </section>
</div>

<style>
    .topbar {
        border-bottom: 1px solid var(--line);
        padding: 12px 0;
        background: transparent;
        position: relative;
        z-index: 10;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 40px;
    }

    .topbar-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        font-family: "Space Grotesk", sans-serif;
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-faint);
    }

    .topbar-inner b {
        color: var(--ink);
        font-weight: 700;
    }

    .topbar-inner .mid {
        display: inline-flex;
    }

    .topbar-inner .right {
        display: inline-flex;
        align-items: center;
    }

    .topbar-inner .pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--coral);
        display: inline-block;
        margin-right: 8px;
        animation: pulse 2.4s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.35;
        }
    }

    .side-rail {
        position: fixed;
        top: 0;
        bottom: 0;
        width: 44px;
        z-index: 99;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .side-rail.right {
        right: 0;
        border-left: 1px solid var(--line-faint);
    }
    .side-rail.left {
        left: 0;
        border-right: 1px solid var(--line-faint);
    }

    .side-rail .rail-text {
        font-family: "Space Grotesk", sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        color: var(--ink-faint);
        writing-mode: vertical-rl;
        white-space: nowrap;
    }

    .side-rail.right .rail-text {
        transform: rotate(180deg);
    }
    .side-rail.left .rail-text {
        transform: none;
    }

    .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 40px 120px;
        position: relative;
    }

    .hero-section {
        padding: 40px 0 80px;
        border-bottom: 1px solid var(--line);
    }

    .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        gap: 60px;
        align-items: center;
    }

    .hero-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .hero-copy .label {
        font-family: "Space Grotesk", sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--coral);
        margin-bottom: 24px;
        display: inline-flex;
        align-items: center;
        gap: 12px;
    }

    .hero-copy .label::before {
        content: "";
        width: 18px;
        height: 1px;
        background: var(--coral);
        display: inline-block;
    }

    .hero-copy h1 {
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: clamp(38px, 4.5vw, 64px);
        line-height: 1.1;
        margin-bottom: 24px;
        letter-spacing: -0.025em;
        color: var(--ink);
    }

    .hero-copy h1 em {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: var(--coral);
    }

    .hero-copy h1 .dot {
        color: var(--coral);
    }

    .hero-copy .lead {
        font-family: "Space Grotesk", sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: var(--ink-soft);
        max-width: 44ch;
        margin-bottom: 32px;
    }

    .search-bar {
        width: 100%;
        max-width: 500px;
        background: var(--bone);
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 10px 30px -15px rgba(21, 20, 15, 0.1);
        margin-bottom: 32px;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    .search-bar:focus-within {
        border-color: var(--coral);
        box-shadow: 0 15px 40px -12px rgba(237, 111, 92, 0.15);
    }

    .search-bar i {
        font-size: 20px;
        color: var(--ink-mute);
    }

    .search-bar input {
        border: none;
        outline: none;
        background: transparent;
        font-family: inherit;
        font-size: 15px;
        color: var(--ink);
        flex: 1;
    }

    .search-bar input::placeholder {
        color: var(--ink-faint);
    }

    .category-list {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .category-comic-btn {
        gap: 6px;
        font-size: 11px;
        padding: 7px 16px;
        border-radius: 4px;
    }

    .category-comic-btn i {
        font-size: 15px;
    }

    .hero-art {
        position: relative;
        padding: 40px;
        width: 100%;
        height: 320px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-art .corner {
        position: absolute;
        width: 18px;
        height: 18px;
        border-color: var(--ink-faint);
        border-style: solid;
        border-width: 0;
    }

    .hero-art .corner.tl {
        top: 0;
        left: 0;
        border-top-width: 1px;
        border-left-width: 1px;
    }
    .hero-art .corner.tr {
        top: 0;
        right: 0;
        border-top-width: 1px;
        border-right-width: 1px;
    }
    .hero-art .corner.bl {
        bottom: 0;
        left: 0;
        border-bottom-width: 1px;
        border-left-width: 1px;
    }
    .hero-art .corner.br {
        bottom: 0;
        right: 0;
        border-bottom-width: 1px;
        border-right-width: 1px;
    }

    .dome-viewport {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
        perspective: 1200px;
        cursor: grab;
        user-select: none;
    }

    .dome-viewport:active {
        cursor: grabbing;
    }

    .floating-icon {
        position: absolute;
        font-size: clamp(18px, 2.2vw, 26px);
        opacity: 0.65;
        pointer-events: none;
        animation: floatAround var(--duration) ease-in-out infinite alternate;
        z-index: 1;
        text-shadow: 0 0 10px currentColor, 0 0 20px rgba(255, 255, 255, 0.2);
    }

    .floating-particle {
        position: absolute;
        font-size: clamp(14px, 1.8vw, 22px);
        font-weight: 700;
        opacity: 0.65;
        pointer-events: none;
        animation: floatAround var(--duration) ease-in-out infinite alternate;
        z-index: 1;
        text-shadow: 0 0 10px currentColor;
    }

    .floating-particle.letter {
        font-family: "Space Grotesk", sans-serif;
    }

    @keyframes floatAround {
        0% {
            transform: translate(0, 0) rotate(0deg);
        }
        100% {
            transform: translate(var(--x), var(--y)) rotate(var(--r));
        }
    }

    .dome-container {
        position: relative;
        width: 72px;
        height: 108px;
        transform-style: preserve-3d;
        transition: transform 0.1s ease-out;
    }

    .dome-card {
        position: absolute;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        backface-visibility: visible;
    }

    .dome-card.row-top {
        transform: translateY(-55px) rotateY(calc(var(--i) * 90deg)) translateZ(135px) rotateX(-15deg);
    }

    .dome-card.row-middle {
        transform: translateY(0px) rotateY(calc(var(--i) * 90deg + 45deg)) translateZ(150px);
    }

    .dome-card.row-bottom {
        transform: translateY(55px) rotateY(calc(var(--i) * 90deg)) translateZ(135px) rotateX(15deg);
    }

    .dome-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
        border: 3px solid var(--paper-warm);
        outline: 1px solid var(--line);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
        filter: grayscale(15%) brightness(0.95);
        transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .dome-card:hover {
        z-index: 10;
    }

    .dome-card:hover img {
        transform: scale(1.18) translateY(-5px);
        filter: grayscale(0%) brightness(1.05);
        border-color: var(--coral);
        box-shadow: 0 15px 35px rgba(237, 111, 92, 0.3);
    }

    .dome-card-title {
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        font-family: "Space Grotesk", sans-serif;
        font-size: 8px;
        font-weight: 700;
        color: var(--ink);
        background: var(--bone);
        border: 1px solid var(--line);
        padding: 3px 8px;
        border-radius: 20px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .dome-card:hover .dome-card-title {
        opacity: 1;
        transform: translateX(-50%) translateY(-3px);
    }

    .wire-ticker {
        overflow: hidden;
        white-space: nowrap;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        padding: 14px 0;
        margin: 40px 0;
        background: var(--paper-warm);
        display: flex;
    }

    .ticker-inner {
        display: inline-flex;
        animation: marquee 25s linear infinite;
        gap: 0;
    }

    .ticker-inner span {
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.25em;
        color: var(--ink-mute);
        text-transform: uppercase;
        white-space: nowrap;
    }

    @keyframes marquee {
        0% {
            transform: translate3d(0, 0, 0);
        }
        100% {
            transform: translate3d(-50%, 0, 0);
        }
    }

    .sec-rule {
        border-top: 1px solid var(--line);
        padding-top: 18px;
        margin: 40px 0 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: "Space Grotesk", sans-serif;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-faint);
        font-weight: 700;
    }

    .sec-rule .roman {
        font-family: "Playfair Display", serif;
        font-style: italic;
        color: var(--coral);
        font-size: 16px;
        text-transform: none;
        letter-spacing: 0;
    }

    .view-all-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--ink-faint);
        transition: color 0.2s;
        text-decoration: none;
    }

    .view-all-link:hover {
        color: var(--coral);
    }

    .view-all-link .dot-mark {
        color: var(--coral);
    }

    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 20px;
        padding: 20px 0;
    }

    .media-grid {
        display: grid;
        gap: 24px;
        padding: 20px 0;
    }

    .format-audio {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }

    .format-video {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .media-card {
        position: relative;
        display: flex;
        flex-direction: column;
        text-decoration: none;
        background: var(--bone);
    }



    .media-card .cover-box {
        position: relative;
        background: var(--paper-warm);
        overflow: hidden;
        aspect-ratio: 1;
    }

    .format-video .media-card .cover-box {
        aspect-ratio: 16 / 9;
    }

    .media-card .cover-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .media-card:hover .cover-box img {
        transform: scale(1.05);
    }

    .media-card .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: var(--ink-faint);
    }

    .media-card .play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(21, 20, 15, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s;
    }

    .media-card:hover .play-overlay {
        opacity: 1;
    }

    .media-card .play-overlay i {
        font-size: 48px;
        color: #fff;
    }

    .media-card .info {
        padding: 20px;
    }

    .media-card .info .index-tag {
        font-family: "JetBrains Mono", monospace;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--coral);
        display: block;
        margin-bottom: 8px;
    }

    .media-card .info h3 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .media-card .info p {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-size: 13px;
        color: var(--ink-mute);
    }

    @media (max-width: 1280px) {
        .side-rail {
            display: none;
        }
    }

    @media (max-width: 880px) {
        .hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
        }

        .page-container {
            padding: 40px 24px;
        }
    }
</style>

