<script>
  import { onMount } from "svelte";

  export let now = new Date();
  export let eorzeaHours = 0;
  export let eorzeaMinutes = 0;

  function updateTime() {
    now = new Date();

    // https://github.com/violarulan/EorzeaTimeConvert/blob/5010d8e993b3754b35872d7b9b26cdee070403fc/convert.go#L29
    const EORZEA_TIME_CONSTANT = 3600.0 / 175.0;

    const epochSeconds = Math.floor(now.getTime() / 1000);
    const eorzeaSeconds = Math.floor(epochSeconds * EORZEA_TIME_CONSTANT);

    eorzeaHours = Math.floor(eorzeaSeconds / 3600) % 24;
    eorzeaMinutes = Math.floor((eorzeaSeconds % 3600) / 60);
  }

  setInterval(updateTime, 250);
  onMount(updateTime);

  function pad02(n) {
    return n.toString().padStart(2, "0");
  }

  function formatTime(hours, minutes) {
    return `${pad02(hours)}:${pad02(minutes)}`;
  }

  const timeCards = [
    {
      time: "9:00 AM",
      description: "Morning team standup meeting",
    },
    {
      time: "11:30 AM",
      description: "Client presentation for new project",
    },
    {
      time: "2:15 PM",
      description: "Design review session",
    },
    {
      time: "4:00 PM",
      description: "Weekly progress update",
    },
  ];
</script>

<main>
  <header>
    <div class="time-container">
      <div class="time-block">
        <span class="label">Local Time</span>
        <span class="time">{formatTime(now.getHours(), now.getMinutes())}</span>
      </div>
      <div class="time-block">
        <span class="label">Server Time</span>
        <span class="time"
          >{formatTime(now.getUTCHours(), now.getUTCMinutes())}</span
        >
      </div>
      <div class="time-block">
        <span class="label">Eorzea Time</span>
        <span class="time">{formatTime(eorzeaHours, eorzeaMinutes)}</span>
      </div>
    </div>
  </header>

  {#each timeCards as card}
    <div class="card">
      <p class="time">{card.time}</p>
      <p class="description">{card.description} {eorzeaHours}</p>
    </div>
  {/each}
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    background: white;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .time-container {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
  }

  .time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .time {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  @media (prefers-color-scheme: dark) {
    header {
      background: #242424;
    }

    .label {
      color: #999;
    }

    .time {
      color: #fff;
    }
  }
</style>
