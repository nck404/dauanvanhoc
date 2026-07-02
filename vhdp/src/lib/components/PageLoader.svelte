<script>
    let { visible = $bindable(true) } = $props();
</script>

{#if visible}
    <div class="page-loader" class:fade-out={!visible}>
        <div class="loader-content">
            <div class="loader-logo">
                <span class="logo-text font-serif font-black text-3xl text-[#111111]">VHDP</span>
                <span class="logo-dot w-2 h-2 bg-[#CC0000] inline-block"></span>
            </div>
            <div class="loader-bar-track w-44 h-[2px] bg-neutral-200 overflow-hidden mt-4">
                <div class="loader-bar-fill h-full w-[30%] bg-[#111111]"></div>
            </div>
            <p class="loader-label font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-3">
                Đang tải…
            </p>
        </div>
    </div>
{/if}

<style>
    .page-loader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color);
        transition: opacity 0.35s ease, visibility 0.35s ease;
    }

    .page-loader.fade-out {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    .loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
    }

    .loader-logo {
        display: flex;
        align-items: baseline;
        gap: 6px;
    }

    .logo-dot {
        animation: pulse-dot 1s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.6; }
    }

    .loader-bar-fill {
        animation: loading-slide 1.2s ease-in-out infinite;
    }

    @keyframes loading-slide {
        0% { transform: translateX(0); width: 30%; }
        50% { width: 80%; }
        100% { transform: translateX(520%); width: 30%; }
    }
</style>
