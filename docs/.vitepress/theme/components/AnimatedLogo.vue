<script setup lang="ts"></script>

<template>
  <div class="logo-stage">
    <div class="glow" aria-hidden="true" />
    <svg
      class="device"
      viewBox="0 0 360 410"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="An action sheet sliding up from the bottom of a phone screen">
      <defs>
        <linearGradient id="rnasScreen" x1="100" y1="30" x2="260" y2="380"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#EC2B2B" />
          <stop offset="1" stop-color="#B93B68" />
        </linearGradient>
        <linearGradient id="rnasBtn" x1="116" y1="308" x2="244" y2="330"
          gradientUnits="userSpaceOnUse">
          <stop stop-color="#EC2B2B" />
          <stop offset="1" stop-color="#B93B68" />
        </linearGradient>
        <clipPath id="rnasScreenClip">
          <rect x="100" y="30" width="160" height="340" rx="30" />
        </clipPath>
      </defs>

      <!-- Phone / screen -->
      <g class="screen-group">
        <rect
          x="94" y="24" width="172" height="352" rx="34"
          fill="var(--rnas-frame, #0f0f12)"
          class="frame" />
        <g clip-path="url(#rnasScreenClip)">
          <rect x="100" y="30" width="160" height="340" fill="url(#rnasScreen)" />

          <!-- faint app content behind the sheet -->
          <rect x="118" y="52" width="70" height="9" rx="4.5" fill="#ffffff" opacity="0.9" />
          <rect x="118" y="70" width="40" height="7" rx="3.5" fill="#ffffff" opacity="0.5" />
          <rect x="118" y="96" width="124" height="46" rx="12" fill="#ffffff" opacity="0.14" />
          <rect x="118" y="152" width="124" height="46" rx="12" fill="#ffffff" opacity="0.1" />

          <!-- backdrop that dims as the sheet rises -->
          <rect class="backdrop" x="100" y="30" width="160" height="340" fill="#000000" opacity="0" />

          <!-- the action sheet -->
          <g class="sheet">
            <rect x="100" y="236" width="160" height="150" rx="26" fill="#ffffff" />
            <rect x="171" y="248" width="18" height="5" rx="2.5" fill="#D8D8DD" />
            <circle cx="122" cy="278" r="13" fill="#F0E4E8" />
            <rect x="144" y="270" width="66" height="7" rx="3.5" fill="#E7E7EC" />
            <rect x="144" y="284" width="96" height="7" rx="3.5" fill="#EFEFF3" />
            <rect x="116" y="312" width="128" height="20" rx="10" fill="url(#rnasBtn)" />
            <rect x="116" y="340" width="128" height="20" rx="10" fill="#EFEFF3" />
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.logo-stage {
  position: relative;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  animation: float 6s ease-in-out infinite;
}

.glow {
  position: absolute;
  inset: -10% -10% -10% -10%;
  z-index: -1;
  background: radial-gradient(
    closest-side,
    rgba(236, 43, 43, 0.45),
    rgba(185, 59, 104, 0.28) 55%,
    transparent 78%
  );
  filter: blur(28px);
  animation: pulse 6s ease-in-out infinite;
}

.device {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 30px 55px rgba(30, 10, 20, 0.35));
}

.dark .device {
  filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.6));
}

/* The action sheet: spring up, hold, slide back down — looping. */
.sheet {
  transform: translateY(160px);
  animation: sheet-cycle 5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.backdrop {
  animation: backdrop-cycle 5s ease-in-out infinite;
}

@keyframes sheet-cycle {
  0% { transform: translateY(160px); }
  14% { transform: translateY(-10px); }
  20% { transform: translateY(0); }
  70% { transform: translateY(0); }
  84% { transform: translateY(160px); }
  100% { transform: translateY(160px); }
}

@keyframes backdrop-cycle {
  0% { opacity: 0; }
  20% { opacity: 0.34; }
  70% { opacity: 0.34; }
  84% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .logo-stage,
  .glow,
  .sheet,
  .backdrop {
    animation: none;
  }
  .sheet {
    transform: translateY(0);
  }
  .backdrop {
    opacity: 0.34;
  }
}
</style>
