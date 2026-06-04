<div class="paper-wash"></div>
<div class="grid-background"></div>
<div class="stars-background"></div>
<div class="vignette"></div>

<style>
    .paper-wash {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -4;
        background-image:
            radial-gradient(
                1200px 800px at 12% -10%,
                rgba(255, 255, 255, 0.9),
                transparent 60%
            ),
            radial-gradient(
                900px 600px at 88% 8%,
                rgba(225, 91, 91, 0.08),
                transparent 55%
            ),
            radial-gradient(
                700px 520px at 70% 75%,
                rgba(26, 21, 21, 0.05),
                transparent 60%
            ),
            linear-gradient(180deg, var(--bg-wash) 0%, var(--bg-wash-deep) 100%);
    }

    .grid-background {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -3;
        background-image: var(--grid-pattern);
        background-size: 56px 56px;
        opacity: 0.45;
    }

    .stars-background {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -2;
        background-image:
            radial-gradient(
                2px 2px at 10% 15%,
                rgba(225, 91, 91, 0.65),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 20% 8%,
                rgba(225, 91, 91, 0.55),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 30% 25%,
                rgba(225, 91, 91, 0.6),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 45% 12%,
                rgba(225, 91, 91, 0.5),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 60% 18%,
                rgba(225, 91, 91, 0.55),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 75% 10%,
                rgba(225, 91, 91, 0.6),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 85% 22%,
                rgba(225, 91, 91, 0.55),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 15% 50%,
                rgba(225, 91, 91, 0.45),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 35% 60%,
                rgba(225, 91, 91, 0.55),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 70% 45%,
                rgba(225, 91, 91, 0.5),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 90% 65%,
                rgba(225, 91, 91, 0.6),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 25% 80%,
                rgba(225, 91, 91, 0.55),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                1.5px 1.5px at 55% 75%,
                rgba(225, 91, 91, 0.5),
                rgba(225, 91, 91, 0)
            ),
            radial-gradient(
                2px 2px at 80% 85%,
                rgba(225, 91, 91, 0.6),
                rgba(225, 91, 91, 0)
            );
        background-size: 100% 100%;
        background-position: 0 0;
        background-repeat: no-repeat;
        animation: float-stars 12s ease-in-out infinite;
        opacity: 0.7;
    }

    .vignette {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -1;
        background: radial-gradient(
            120% 120% at 50% 35%,
            rgba(0, 0, 0, 0) 45%,
            rgba(0, 0, 0, 0.08) 100%
        );
        opacity: 0.55;
    }

    @keyframes float-stars {
        0%,
        100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.6;
        }
        25% {
            transform: translateY(-20px) translateX(15px);
            opacity: 0.8;
        }
        50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.4;
        }
        75% {
            transform: translateY(-20px) translateX(20px);
            opacity: 0.7;
        }
    }
</style>

