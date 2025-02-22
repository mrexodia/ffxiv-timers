<script>
  import { onMount } from "svelte";

  export let now = new Date();
  export let eorzeaHours = 0;
  export let eorzeaMinutes = 0;

  function updateTime() {
    // Update time when the seconds change
    const next = new Date();
    if (
      next.getSeconds() === now.getSeconds() &&
      eorzeaHours !== 0 &&
      eorzeaMinutes !== 0
    ) {
      return;
    }
    now = next;

    // https://github.com/violarulan/EorzeaTimeConvert/blob/5010d8e993b3754b35872d7b9b26cdee070403fc/convert.go#L29
    const EORZEA_TIME_CONSTANT = 3600.0 / 175.0;

    const epochSeconds = Math.floor(now.getTime() / 1000);
    const eorzeaSeconds = Math.floor(epochSeconds * EORZEA_TIME_CONSTANT);

    eorzeaHours = Math.floor(eorzeaSeconds / 3600) % 24;
    eorzeaMinutes = Math.floor((eorzeaSeconds % 3600) / 60);

    // TODO: reorder and trigger schedule
  }

  setInterval(updateTime, 250);
  onMount(updateTime);

  function pad02(n) {
    return n.toString().padStart(2, "0");
  }

  function formatTime(hours, minutes) {
    return `${pad02(hours)}:${pad02(minutes)}`;
  }

  // https://ffxiv.consolegameswiki.com/wiki/GATEs
  // https://www.xenoveritas.org/static/ffxiv/timer.html
  const schedule = [
    {
      hour: -1,
      minute: 0,
      type: "GATE",
      description: "Cliffhanger, Air Force One, Leap of Faith", // (The Falling City of Nym)
    },
    {
      hour: -1,
      minute: 20,
      type: "GATE",
      description: "Any Way the Wind Blows, The Slice is Right, Leap of Faith", // (The Fall of Belah'dia)
    },
    {
      hour: -1,
      minute: 40,
      type: "GATE",
      description: "The Slice is Right, Air Force One, Leap of Faith", // (Sylphstep)
    },
    {
      hour: 15,
      minute: 0,
      type: "Gold Saucer",
      description: "Mini Cactpot Daily Reset",
    },
    {
      hour: 15,
      minute: 0,
      type: "Daily Reset",
      description: "Allied Society Quests, Duty Roulette, Frontline",
    },
    {
      hour: 20,
      minute: 0,
      type: "Grand Company",
      description: "Mission Allowance Reset",
    },
    {
      hour: 22,
      minute: 0,
      type: "Ocean Fishing",
      description: "Ocean Fishing Voyage",
    },
  ];

  function getIcon(type) {
    switch (type) {
      case "GATE":
        return "/GATE.png";
      case "Gold Saucer":
        return "/GoldSaucer.png";
      case "Grand Company":
        return "/GrandCompany.png";
      case "Daily Reset":
        return "/DailyReset.png";
      default:
        return null;
    }
  }

  function getCard(scheduleItem) {
    let card = { ...scheduleItem, icon: getIcon(scheduleItem.type) };
    if (card.hour == -1) {
      card.hour = now.getHours();
      console.log(`minute: ${now.getMinutes()}, ${card.minute}`);
      if (now.getMinutes() > card.minute + 8) {
        card.hour += 1;
      }
    } else {
      const utcDiff = now.getHours() - now.getUTCHours();
      console.log;
      card.hour += utcDiff;
    }
    return card;
  }

  function cardKey(card) {
    // TODO: include the daily reset
    return card.hour * 60 + card.minute + 8;
  }

  function reorder(cards) {
    cards.sort((a, b) => cardKey(a) - cardKey(b));
    return cards;
  }
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

  {#each reorder(schedule.map(getCard)) as card}
    <div class="card">
      <div class="type">
        {#if getIcon(card.type)}
          <img src={getIcon(card.type)} alt={card.type} />
        {/if}
        {card.type}
      </div>
      <p class="time">{formatTime(card.hour, card.minute)}</p>
      <p class="description">{card.description}</p>
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

  .type {
    display: flex;
    align-items: center;
    gap: 0.2em;
    min-height: 32px;
  }

  .type img {
    height: 32px;
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
