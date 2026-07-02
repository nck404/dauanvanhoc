<script>
    import { page } from "$app/state";

    let { user, activeTime = "", totalSaved = 0 } = $props();
</script>

<nav class="masthead">
    <div class="masthead-inner">
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
        z-index: 40;
        background: var(--newsprint-bg);
        border-bottom: 4px solid var(--newsprint-ink);
        box-shadow: 0 2px 0 0 rgba(17, 17, 17, 0.05);
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

    @media (max-width: 1024px) {
        .stats-meta {
            display: none;
        }
    }

    @media (max-width: 768px) {
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
