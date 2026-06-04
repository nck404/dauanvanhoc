<script>
    import { page } from "$app/state";
    import { onDestroy } from "svelte";
    
    let { user } = $props();
    
    // States
    let isExpanded = $state(false);
    let expansionMode = $state('music'); // 'music' or 'user'
    
    // Music Player States
    let isPlaying = $state(false);
    let currentTime = $state(0);
    let duration = $state(0);
    let audio;
    let currentTrack = $state({
        title: "Sore Spot",
        artist: "Cafuné",
        cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop",
        url: "/Cafuné - Sore Spot (Official Audio) - CAFUNÉ.mp3",
    });

    // Click logic
    let clickCount = 0;
    let clickTimer = null;

    function handleIslandClick(e) {
        // If clicking a link inside, don't trigger expansion logic
        if (e.target.closest('a') || e.target.closest('button')) return;

        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            openMusic();
        }
    }

    function openMusic() {
        expansionMode = 'music';
        isExpanded = true;
    }

    function openUser() {
        expansionMode = 'user';
        isExpanded = true;
    }

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    function togglePlay(e) {
        if (e) e.stopPropagation();
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

    const bars = Array.from({ length: 30 });

    onDestroy(() => {
        clearTimeout(clickTimer);
    });
</script>

<audio
    bind:this={audio}
    src={currentTrack.url}
    ontimeupdate={() => currentTime = audio.currentTime}
    onloadedmetadata={() => duration = audio.duration}
    onended={() => isPlaying = false}
></audio>

<nav class="dynamic-island-container">
    <div
        class="dynamic-island {isExpanded ? 'expanded' : ''} mode-{expansionMode}"
        onclick={isExpanded ? toggleExpand : handleIslandClick}
        onkeydown={(e) => e.key === "Enter" && toggleExpand()}
        role="button"
        tabindex="0"
    >
        <div class="island-content">
            {#if !isExpanded}
                <div class="compact-view">
                    <div class="nav-links-compact">
                        <a href="/" class="nav-item {page.url.pathname === '/' ? 'active' : ''}">
                            <i class="bx bxs-home-heart"></i>
                        </a>
                        <a href="/library" class="nav-item {page.url.pathname.startsWith('/library') ? 'active' : ''}">
                            <i class="bx bxs-book-open"></i>
                        </a>
                        <a href="/audio" class="nav-item {page.url.pathname.startsWith('/audio') ? 'active' : ''}">
                            <i class="bx bxs-headphone"></i>
                        </a>
                        <a href="/video" class="nav-item {page.url.pathname.startsWith('/video') ? 'active' : ''}">
                            <i class="bx bxs-movie-play"></i>
                        </a>
                        <a href="/map" class="nav-item {page.url.pathname.startsWith('/map') ? 'active' : ''}">
                            <i class="bx bxs-map-alt"></i>
                        </a>
                        {#if user?.role === 'admin'}
                            <a href="/admin" class="nav-item {page.url.pathname.startsWith('/admin') ? 'active' : ''}">
                                <i class="bx bxs-dashboard"></i>
                            </a>
                        {/if}
                    </div>

                    <div class="music-mini-visualizer" aria-hidden="true">
                        <div class="bar {isPlaying ? 'anim' : ''}"></div>
                        <div class="bar {isPlaying ? 'anim' : ''}"></div>
                        <div class="bar {isPlaying ? 'anim' : ''}"></div>
                    </div>

                    <div class="profile-section" onclick={(e) => { e.stopPropagation(); openUser(); }}>
                        {#if user}
                            <span class="user-name">{user.username}</span>
                            <div class="avatar">{user.username[0].toUpperCase()}</div>
                        {:else}
                            <a href="/login" class="login-link">Login</a>
                        {/if}
                    </div>
                </div>
            {:else}
                {#if expansionMode === 'music'}
                    <div class="expanded-view music-view">
                        <img src={currentTrack.cover} alt="cover" class="track-cover-full" />
                        <div class="player-details">
                            <div class="details-top">
                                <div class="track-info">
                                    <span class="title">{currentTrack.title}</span>
                                    <span class="artist">{currentTrack.artist}</span>
                                </div>
                                <div class="controls">
                                    <button class="skip-btn"><i class="bx bx-skip-previous"></i></button>
                                    <button class="play-btn" onclick={togglePlay}>
                                        <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                                    </button>
                                    <button class="skip-btn"><i class="bx bx-skip-next"></i></button>
                                </div>
                            </div>
                            <div class="details-bottom">
                                <div class="waveform-mini">
                                    {#each bars as _, i}
                                        <div 
                                            class="wave-bar {isPlaying ? 'anim' : ''}" 
                                            style:height="{8 + Math.random() * 12}px"
                                            style:animation-delay="{i * 0.05}s"
                                            style:opacity={progress > (i / bars.length) * 100 ? 1 : 0.2}
                                        ></div>
                                    {/each}
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style:width="{progress}%"></div>
                                </div>
                                <div class="time-info">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="expanded-view user-view">
                        <div class="user-details">
                            <div class="user-info-expanded">
                                <div class="avatar-large">{user?.username ? user.username[0].toUpperCase() : '?'}</div>
                                <div class="text-info">
                                    <p class="welcome">Chào mừng trở lại,</p>
                                    <p class="username">
                                        {user?.username || 'Khách'} 
                                        <span class="role-tag">{user?.role}</span>
                                    </p>
                                </div>
                            </div>
                            <div class="action-buttons">
                                {#if user?.role === 'admin'}
                                    <a href="/admin" class="action-btn admin-shortcut" onclick={(e) => e.stopPropagation()}>
                                        <i class="bx bxs-dashboard"></i>
                                        <span>Quản trị</span>
                                    </a>
                                {/if}
                                <a href="/settings" class="action-btn" onclick={(e) => e.stopPropagation()}>
                                    <i class="bx bx-cog"></i>
                                    <span>Cài đặt</span>
                                </a>
                                <a href="/logout" class="logout-btn" onclick={(e) => e.stopPropagation()}>
                                    <i class="bx bx-log-out"></i>
                                    <span>Đăng xuất</span>
                                </a>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</nav>

<style>
    .dynamic-island-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
    }

    .dynamic-island {
        background: #1a1515;
        color: white;
        border-radius: 40px;
        height: 48px;
        min-width: 360px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        user-select: none;
    }

    .dynamic-island.expanded.mode-music {
        height: 110px;
        width: 420px;
        border-radius: 28px;
    }

    .dynamic-island.expanded.mode-user {
        height: 180px;
        width: 320px;
        border-radius: 32px;
    }

    .island-content {
        width: 100%;
        height: 100%;
    }

    .compact-view {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 16px;
        gap: 12px;
    }

    .nav-links-compact {
        display: flex;
        gap: 16px;
    }

    .nav-item {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.5);
    }

    .nav-item.active {
        color: var(--accent-dark);
    }

    .music-mini-visualizer {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 14px;
    }

    .bar {
        width: 3px;
        height: 6px;
        background: var(--accent-dark);
        border-radius: 1px;
    }

    .bar.anim {
        animation: bounce 0.6s infinite alternate;
    }

    @keyframes bounce {
        from { height: 4px; }
        to { height: 14px; }
    }

    .profile-section {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 8px;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-name {
        font-size: 13px;
        font-weight: 600;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .avatar {
        width: 26px;
        height: 26px;
        background: var(--primary-gradient);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        color: #1a1515;
    }

    /* Music View */
    .expanded-view {
        display: flex;
        width: 100%;
        height: 100%;
        animation: fadeIn 0.4s ease;
    }

    .music-view .track-cover-full {
        width: 110px;
        height: 110px;
        object-fit: cover;
    }

    .player-details {
        flex: 1;
        padding: 12px 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
    }

    .details-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .track-info .title { font-weight: 700; font-size: 14px; display: block; }
    .track-info .artist { font-size: 11px; opacity: 0.5; }

    .controls { display: flex; gap: 8px; align-items: center; }
    .play-btn i { font-size: 32px; color: white; }
    .skip-btn i { font-size: 20px; opacity: 0.8; }

    .details-bottom { display: flex; flex-direction: column; gap: 4px; }
    .waveform-mini { display: flex; align-items: center; gap: 2px; height: 15px; }
    .wave-bar { flex: 1; background: var(--accent-dark); border-radius: 1px; }
    .wave-bar.anim { animation: waveBounce 0.8s infinite alternate ease-in-out; }
    
    @keyframes waveBounce {
        from { transform: scaleY(0.6); }
        to { transform: scaleY(1.4); }
    }

    .progress-bar { width: 100%; height: 3px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent-dark); }
    .time-info { display: flex; justify-content: space-between; font-size: 10px; opacity: 0.5; }

    /* User View */
    .user-view { padding: 24px; }
    .user-details { display: flex; flex-direction: column; gap: 24px; width: 100%; }
    .user-info-expanded { display: flex; align-items: center; gap: 16px; }
    .avatar-large { width: 56px; height: 56px; background: var(--primary-gradient); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #1a1515; }
    .text-info { text-align: left; }
    .welcome { font-size: 12px; opacity: 0.5; }
    .username { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .role-tag { font-size: 10px; text-transform: uppercase; background: var(--accent-dark); color: white; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }
    .action-buttons { display: flex; gap: 12px; }
    .action-btn, .logout-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 600; color: white; background: rgba(255, 255, 255, 0.05); }
    .admin-shortcut i { color: var(--accent-mid); }
    .logout-btn { background: rgba(225, 91, 91, 0.1); color: #E15B5B; }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
</style>

