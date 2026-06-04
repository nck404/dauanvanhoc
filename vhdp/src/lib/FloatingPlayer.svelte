<script>
    let isPlaying = $state(false);
    let showPlayer = $state(false);

    function togglePlay() {
        isPlaying = !isPlaying;
    }
</script>

<div class="floating-player-container {showPlayer ? 'active' : ''}">
    {#if showPlayer}
        <div class="compact-player">
            <div class="track-info">
                <div class="visualizer">
                    <div class="bar {isPlaying ? 'anim' : ''}"></div>
                    <div class="bar {isPlaying ? 'anim' : ''}"></div>
                    <div class="bar {isPlaying ? 'anim' : ''}"></div>
                </div>
                <div class="text">
                    <span class="title">Lofi Study Beats</span>
                    <span class="artist">Aesthetic Vibes</span>
                </div>
            </div>
            <div class="mini-controls">
                <button
                    onclick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                </button>
                <button
                    onclick={() => (showPlayer = false)}
                    aria-label="Close player"
                >
                    <i class="bx bx-x"></i>
                </button>
            </div>
        </div>
    {:else}
        <button
            class="player-trigger"
            onclick={() => (showPlayer = true)}
            aria-label="Open mini player"
        >
            <div class="dot {isPlaying ? 'pulse' : ''}"></div>
            <i class="bx bxs-music"></i>
        </button>
    {/if}
</div>

<style>
    .floating-player-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 999;
    }

    .player-trigger {
        width: 60px;
        height: 60px;
        background: var(--text-main);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        position: relative;
    }

    .dot {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 8px;
        height: 8px;
        background: var(--accent-dark);
        border-radius: 50%;
    }

    .dot.pulse {
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(2.5);
            opacity: 0;
        }
    }

    .compact-player {
        background: white;
        padding: 12px 20px;
        border-radius: 40px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: var(--shadow);
        border: 1px solid var(--accent-light);
        animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes slideIn {
        from {
            transform: translateX(50px) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
    }

    .track-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .visualizer {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 16px;
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

    .bar:nth-child(2) {
        animation-delay: 0.2s;
    }
    .bar:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes bounce {
        from {
            height: 4px;
        }
        to {
            height: 16px;
        }
    }

    .text {
        display: flex;
        flex-direction: column;
    }

    .title {
        font-size: 13px;
        font-weight: 600;
    }

    .artist {
        font-size: 11px;
        color: var(--text-muted);
    }

    .mini-controls {
        display: flex;
        gap: 4px;
        border-left: 1px solid var(--accent-light);
        padding-left: 12px;
    }

    .mini-controls button {
        font-size: 20px;
        color: var(--text-main);
    }

    .mini-controls button:hover {
        color: var(--accent-dark);
    }
</style>

