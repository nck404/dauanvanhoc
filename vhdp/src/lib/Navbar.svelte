<script>
    import { page } from "$app/state";

    let { user, activeTime = "", totalSaved = 0 } = $props();

    let isReadPage = $derived(page.url.pathname.startsWith("/read") || page.url.pathname.startsWith("/read-comic"));
    let isNavExpanded = $state(false);

    $effect(() => {
        let p = page.url.pathname;
        isNavExpanded = false;
    });
</script>

{#if isReadPage && !isNavExpanded}
    <button class="nav-pill-indicator" onclick={() => isNavExpanded = true}>
        <div class="pill-line"></div>
    </button>
{/if}

<nav class="masthead" class:is-read-mode={isReadPage && !isNavExpanded}>
    <div class="masthead-inner">
        {#if isReadPage && isNavExpanded}
            <button class="nav-close-btn" onclick={() => isNavExpanded = false}>
                <i class="bx bx-x"></i>
            </button>
        {/if}
        <div class="masthead-top">
            <div class="edition-meta">
                <span class="meta-item">Vol. 01</span>
                <span class="meta-divider">|</span>
                <span class="meta-item">MMXXVI</span>
                <span class="meta-divider">|</span>
                <span class="meta-item">Lâm Đồng</span>
            </div>
            
            <a href="/" class="masthead-logo">
                <span class="logo-text font-serif">Văn Học Địa Phương</span>
            </a>
            
            <div class="user-section">
                {#if user}
                    <span class="user-greeting font-mono">{user.username}</span>
                {:else}
                    <a href="/login" class="login-link font-mono">
                        Đăng nhập
                    </a>
                {/if}
            </div>
        </div>

        <div class="masthead-rule"></div>

        <div class="masthead-nav">
            <div class="nav-links">
                <a href="/" class="nav-link font-mono {page.url.pathname === '/' ? 'active' : ''}">
                    Trang chủ
                </a>
                <a href="/truyen-chu" class="nav-link font-mono {page.url.pathname.startsWith('/truyen-chu') ? 'active' : ''}">
                    Truyện chữ
                </a>
                <a href="/truyen-tranh" class="nav-link font-mono {page.url.pathname.startsWith('/truyen-tranh') ? 'active' : ''}">
                    Truyện tranh
                </a>
                <a href="/audio" class="nav-link font-mono {page.url.pathname.startsWith('/audio') ? 'active' : ''}">
                    Audio
                </a>
                <a href="/video" class="nav-link font-mono {page.url.pathname.startsWith('/video') ? 'active' : ''}">
                    Video
                </a>
                <a href="/map" class="nav-link font-mono {page.url.pathname.startsWith('/map') ? 'active' : ''}">
                    Bản đồ
                </a>
                <a href="/forum" class="nav-link font-mono {page.url.pathname.startsWith('/forum') ? 'active' : ''}">
                    Diễn đàn
                </a>
                <a href="/library" class="nav-link font-mono {page.url.pathname.startsWith('/library') ? 'active' : ''}">
                    Tủ sách
                </a>
                {#if user?.role === 'admin'}
                    <a href="/admin" class="nav-link font-mono {page.url.pathname.startsWith('/admin') ? 'active' : ''}">
                        Admin
                    </a>
                {/if}
            </div>
            
            <div class="nav-search-btn-wrap">
                <button type="button" class="nav-search-btn" onclick={() => window.dispatchEvent(new CustomEvent('open-search'))} aria-label="Tìm kiếm">
                    <i class="bx bx-search"></i>
                </button>
            </div>
            
            <div class="stats-meta">
                {#if activeTime}
                    <div class="stat-item">
                        <span class="stat-value font-mono">{activeTime}</span>
                        <span class="stat-label font-mono">Hoạt động</span>
                    </div>
                {/if}
                {#if totalSaved > 0}
                    <div class="stat-item">
                        <span class="stat-value font-mono">{totalSaved}</span>
                        <span class="stat-label font-mono">Tác phẩm</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</nav>

<style>
    .masthead {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2000;
        background: var(--newsprint-bg);
        border-bottom: 4px solid var(--newsprint-ink);
        box-shadow: 0 2px 0 0 rgba(17, 17, 17, 0.05);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .masthead.is-read-mode {
        transform: translateY(-100%);
        pointer-events: none;
        opacity: 0;
    }

    .nav-pill-indicator {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 140px;
        height: 32px;
        background: rgba(15, 15, 15, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s;
    }

    .nav-pill-indicator:hover {
        background: rgba(25, 25, 25, 0.95);
        transform: translateX(-50%) scale(1.05);
    }

    .pill-line {
        width: 40px;
        height: 4px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 2px;
        transition: background 0.2s;
    }

    .nav-pill-indicator:hover .pill-line {
        background: rgba(255, 255, 255, 0.8);
    }

    .nav-close-btn {
        position: absolute;
        top: 14px;
        right: 24px;
        background: transparent;
        border: none;
        color: var(--newsprint-ink);
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 50%;
        transition: background 0.2s;
        z-index: 50;
    }

    .nav-close-btn:hover {
        background: rgba(0,0,0,0.05);
    }

    .masthead-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
    }

    .masthead-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
    }

    .edition-meta {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .meta-item {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--newsprint-neutral-500);
    }

    .meta-divider {
        color: var(--newsprint-neutral-400);
        font-size: 10px;
    }

    .masthead-logo {
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .logo-text {
        font-size: 24px;
        font-weight: 900;
        color: var(--newsprint-ink);
        letter-spacing: -0.02em;
        position: relative;
        padding-bottom: 4px;
    }

    .logo-text::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, 
            var(--newsprint-red) 0%, 
            var(--newsprint-red) 33%, 
            var(--newsprint-ink) 33%, 
            var(--newsprint-ink) 66%, 
            var(--newsprint-red) 66%, 
            var(--newsprint-red) 100%
        );
    }

    .user-section {
        display: flex;
        align-items: center;
    }

    .user-greeting {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--newsprint-ink);
    }

    .login-link {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--newsprint-ink);
        text-decoration: none;
        transition: color 0.2s ease-out;
    }

    .login-link:hover {
        color: var(--newsprint-red);
    }

    .masthead-rule {
        height: 2px;
        background: var(--newsprint-ink);
        margin: 0;
    }

    .masthead-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 10px 0;
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 28px;
        overflow-x: auto;
        flex: 1;
        scrollbar-width: none;
        -ms-overflow-style: none;
        -webkit-overflow-scrolling: touch;
    }
    .nav-links::-webkit-scrollbar {
        display: none;
    }

    .nav-link {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--newsprint-neutral-600);
        text-decoration: none;
        transition: all 0.2s ease-out;
        white-space: nowrap;
        position: relative;
        padding: 6px 0;
    }

    .nav-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--newsprint-red);
        transition: width 0.2s ease-out;
    }

    .nav-link:hover {
        color: var(--newsprint-ink);
    }

    .nav-link:hover::after {
        width: 100%;
    }

    .nav-link.active {
        color: var(--newsprint-ink);
        font-weight: 700;
    }

    .nav-link.active::after {
        width: 100%;
    }

    .stats-meta {
        display: flex;
        align-items: center;
        gap: 20px;
        padding-left: 20px;
        border-left: 2px solid var(--newsprint-ink);
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
    }

    .stat-value {
        font-size: 13px;
        font-weight: 700;
        color: var(--newsprint-red);
        letter-spacing: 0.05em;
    }

    .stat-label {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--newsprint-neutral-500);
    }

    .stats-meta {
        display: flex;
        align-items: center;
        gap: 20px;
        padding-left: 20px;
        border-left: 2px solid var(--newsprint-ink);
    }

    .nav-search-btn-wrap {
        display: inline-flex;
        align-items: center;
    }

    .nav-search-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
        cursor: pointer;
        transition: all 0.2s ease-out;
        font-size: 18px;
    }

    .nav-search-btn:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    @media (max-width: 1024px) {
        .nav-search-btn-wrap {
            display: none;
        }

        .stats-meta {
            display: none;
        }
    }

    @media (max-width: 768px) {
        .nav-pill-indicator {
            display: none;
        }

        .masthead-top {
            flex-direction: column;
            gap: 12px;
            align-items: center;
            padding: 12px 0;
        }

        .masthead-logo {
            order: -1;
        }

        .logo-text {
            font-size: 20px;
        }

        .nav-links {
            gap: 16px;
        }

        .edition-meta {
            display: none;
        }
    }
</style>
