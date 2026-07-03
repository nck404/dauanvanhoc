<script>
    import { page } from "$app/state";

    let showCorners = $derived(
        !page.url.pathname.startsWith("/read/") &&
        !page.url.pathname.startsWith("/read-comic/") &&
        !(page.url.pathname.startsWith("/audio/") && page.url.pathname !== "/audio") &&
        !(page.url.pathname.startsWith("/video/") && page.url.pathname !== "/video") &&
        page.url.pathname !== "/login" &&
        page.url.pathname !== "/register"
    );
</script>

{#if showCorners}
    <div class="royal-corner top-left">
        <svg viewBox="0 0 32 32">
            <path d="M 0,32 L 0,0 L 32,0" stroke="var(--newsprint-ink)" stroke-width="2" fill="none" />
            <path d="M 5,22 L 5,5 L 22,5" stroke="var(--newsprint-ink)" stroke-width="1" fill="none" />
            <rect x="8" y="8" width="4" height="4" fill="var(--newsprint-red)" />
        </svg>
    </div>
    <div class="royal-corner top-right">
        <svg viewBox="0 0 32 32">
            <path d="M 0,0 L 32,0 L 32,32" stroke="var(--newsprint-ink)" stroke-width="2" fill="none" />
            <path d="M 10,5 L 27,5 L 27,22" stroke="var(--newsprint-ink)" stroke-width="1" fill="none" />
            <rect x="20" y="8" width="4" height="4" fill="var(--newsprint-red)" />
        </svg>
    </div>
    <div class="royal-corner bottom-left">
        <svg viewBox="0 0 32 32">
            <path d="M 0,0 L 0,32 L 32,32" stroke="var(--newsprint-ink)" stroke-width="2" fill="none" />
            <path d="M 5,10 L 5,27 L 22,27" stroke="var(--newsprint-ink)" stroke-width="1" fill="none" />
            <rect x="8" y="20" width="4" height="4" fill="var(--newsprint-red)" />
        </svg>
    </div>
    <div class="royal-corner bottom-right">
        <svg viewBox="0 0 32 32">
            <path d="M 32,0 L 32,32 L 0,32" stroke="var(--newsprint-ink)" stroke-width="2" fill="none" />
            <path d="M 27,10 L 27,27 L 10,27" stroke="var(--newsprint-ink)" stroke-width="1" fill="none" />
            <rect x="20" y="20" width="4" height="4" fill="var(--newsprint-red)" />
        </svg>
    </div>
    <div class="royal-bottom-ornament">
        ✧ ✧ ✧ ✧
    </div>
{/if}

<style>
    .royal-corner {
        position: fixed;
        width: 32px;
        height: 32px;
        z-index: 9999;
        pointer-events: none;
    }
    .royal-bottom-ornament {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        font-size: 14px;
        color: var(--newsprint-neutral-400);
        letter-spacing: 0.3em;
        pointer-events: none;
        white-space: nowrap;
    }
    .top-left {
        top: 24px;
        left: 20px;
    }
    .top-right {
        top: 24px;
        right: 20px;
    }
    .bottom-left {
        bottom: 24px;
        left: 20px;
    }
    .bottom-right {
        bottom: 24px;
        right: 20px;
    }
    @media (max-width: 1024px) {
        .royal-corner, .royal-bottom-ornament {
            display: none;
        }
    }
</style>
