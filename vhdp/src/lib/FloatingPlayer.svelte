<script>
    let isPlaying = $state(false);
    let showPlayer = $state(false);

    function togglePlay() {
        isPlaying = !isPlaying;
    }
</script>

<div class="floating-player-container {showPlayer ? 'active' : ''}">
    {#if showPlayer}
        <div class="compact-player newsprint-card flex items-center gap-4 p-3">
            <div class="track-info flex items-center gap-3">
                <div class="visualizer flex items-end gap-[2px] h-4">
                    <div class="bar w-[3px] bg-[#111111] {isPlaying ? 'anim' : ''}" style="height: 6px;"></div>
                    <div class="bar w-[3px] bg-[#111111] {isPlaying ? 'anim' : ''}" style="height: 6px;"></div>
                    <div class="bar w-[3px] bg-[#111111] {isPlaying ? 'anim' : ''}" style="height: 6px;"></div>
                </div>
                <div class="text flex flex-col">
                    <span class="title font-sans text-xs font-semibold text-[#111111]">Lofi Study Beats</span>
                    <span class="artist font-serif italic text-[10px] text-neutral-500">Aesthetic Vibes</span>
                </div>
            </div>
            <div class="mini-controls flex gap-1 border-l border-neutral-200 pl-3">
                <button
                    onclick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    class="text-[#111111] hover:text-[#CC0000] transition-colors duration-200"
                >
                    <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'} text-lg"></i>
                </button>
                <button
                    onclick={() => (showPlayer = false)}
                    aria-label="Close player"
                    class="text-[#111111] hover:text-[#CC0000] transition-colors duration-200"
                >
                    <i class="bx bx-x text-lg"></i>
                </button>
            </div>
        </div>
    {:else}
        <button
            class="player-trigger w-14 h-14 border border-[#111111] bg-[#F9F9F7] flex items-center justify-center text-xl shadow-[4px_4px_0px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
            onclick={() => (showPlayer = true)}
            aria-label="Open mini player"
        >
            <div class="dot absolute top-2 right-2 w-2 h-2 bg-[#CC0000] {isPlaying ? 'pulse' : ''}"></div>
            <i class="bx bxs-music text-[#111111]"></i>
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

    .dot {
        position: absolute;
    }

    .dot.pulse {
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
    }

    .compact-player {
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
        from { height: 4px; }
        to { height: 14px; }
    }
</style>
