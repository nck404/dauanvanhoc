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
            <div class="loader-track">
                <div class="loader-fill"></div>
            </div>
            <p class="loader-label">Đang tải…</p>
        </div>
    </div>
{/if}

<style>
    .page-loader {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--newsprint-bg);
        transition: opacity 0.4s ease, visibility 0.4s ease;
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
        gap: 20px;
    }

    .loader-logo {
        display: flex;
        align-items: baseline;
        gap: 6px;
    }

    .logo-text {
        font-family: 'Playfair Display', serif;
        font-size: 36px;
        font-weight: 900;
        color: var(--newsprint-ink);
        letter-spacing: -0.03em;
    }

    .logo-dot {
        width: 10px;
        height: 10px;
        background: var(--newsprint-red);
        border-radius: 50%;
        animation: pulse-dot 1.2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.6); opacity: 0.5; }
    }

    .loader-track {
        width: 160px;
        height: 2px;
        background: var(--newsprint-divider);
        overflow: hidden;
        position: relative;
    }

    .loader-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 30%;
        background: var(--newsprint-ink);
        animation: loading-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes loading-slide {
        0% { transform: translateX(0); width: 30%; }
        50% { width: 60%; }
        100% { transform: translateX(600%); width: 30%; }
    }

    .loader-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3em;
        color: var(--newsprint-neutral-500);
        animation: fade-text 1.6s ease-in-out infinite;
    }

    @keyframes fade-text {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    @media (prefers-reduced-motion: reduce) {
        .logo-dot,
        .loader-fill,
        .loader-label {
            animation: none;
        }
        .loader-fill {
            width: 60%;
            transition: width 0.3s ease;
        }
    }
</style>
