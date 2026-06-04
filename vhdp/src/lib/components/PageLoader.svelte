<script>
    let { visible = $bindable(true) } = $props();
</script>

{#if visible}
    <div class="page-loader" class:fade-out={!visible}>
        <div class="loader-content">
            <div class="loader-logo">
                <span class="logo-text">VHDP</span>
                <span class="logo-dot"></span>
            </div>
            <div class="loader-bar-track">
                <div class="loader-bar-fill"></div>
            </div>
            <p class="loader-label">Đang tải…</p>
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
        background: var(--bg-color, #fff);
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
        gap: 4px;
    }

    .logo-text {
        font-family: "Space Grotesk", sans-serif;
        font-weight: 900;
        font-size: 28px;
        color: var(--ink, #1a1515);
        letter-spacing: -0.02em;
    }

    .logo-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--coral, #e15b5b);
        display: inline-block;
        animation: pulse-dot 1s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.6; }
    }

    .loader-bar-track {
        width: 180px;
        height: 4px;
        border-radius: 999px;
        background: var(--line, rgba(0,0,0,0.1));
        overflow: hidden;
    }

    .loader-bar-fill {
        height: 100%;
        width: 30%;
        border-radius: inherit;
        background: var(--coral, #e15b5b);
        animation: loading-slide 1.2s ease-in-out infinite;
    }

    @keyframes loading-slide {
        0% { transform: translateX(0); width: 30%; }
        50% { width: 80%; }
        100% { transform: translateX(520%); width: 30%; }
    }

    .loader-label {
        font-family: "Space Grotesk", sans-serif;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--ink-faint, #8a7373);
    }
</style>

