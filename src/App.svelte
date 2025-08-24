<script>
  import { onMount } from "svelte";

  export let now = new Date();
  export let eorzeaHours = 0;
  export let eorzeaMinutes = 0;

  function updateTime() {
    // Update time when the seconds change
    const next = new Date();
    if (next.getSeconds() === now.getSeconds()) {
      return;
    }
    now = next;

    updateEorzeaTime();
  }

  function updateEorzeaTime() {
    // https://github.com/violarulan/EorzeaTimeConvert/blob/5010d8e993b3754b35872d7b9b26cdee070403fc/convert.go#L29
    const EORZEA_TIME_CONSTANT = 3600.0 / 175.0;

    const epochSeconds = Math.floor(now.getTime() / 1000);
    const eorzeaSeconds = Math.floor(epochSeconds * EORZEA_TIME_CONSTANT);

    eorzeaHours = Math.floor(eorzeaSeconds / 3600) % 24;
    eorzeaMinutes = Math.floor((eorzeaSeconds % 3600) / 60);
  }

  setInterval(updateTime, 250);
  onMount(() => {
    updateTime();
    updateEorzeaTime(); // Initialize Eorzea time immediately
  });

  function normalizeHour(hour) {
    return ((hour % 24) + 24) % 24; // Handles negative and >23 hours
  }

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
      description: "Mission Allowance Reset, Rowena Daily Reset",
    },
    // Ocean Fishing departs every 2 hours starting from 00:00 UTC
    ...Array.from({ length: 12 }, (_, i) => ({
      hour: i * 2,
      minute: 0,
      type: "Ocean Fishing",
      description: "Ocean Fishing Voyage",
    })),
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
      case "Ocean Fishing":
        return "/OceanFishing.png";
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
        card.hour = normalizeHour(card.hour + 1);
      }
    } else {
      const utcDiff = now.getHours() - now.getUTCHours();
      card.hour = normalizeHour(card.hour + utcDiff);
    }
    return card;
  }

  function getTimeUntilEvent(card) {
    const eventTime = new Date(now);
    eventTime.setHours(card.hour, card.minute, 0, 0);

    // If event time has passed today, it's tomorrow
    if (eventTime <= now) {
      eventTime.setDate(eventTime.getDate() + 1);
    }

    return eventTime.getTime() - now.getTime();
  }

  function formatTimeRemaining(milliseconds, isActive = false) {
    if (isActive) {
      // For active events, show remaining time in grace period
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m${pad02(seconds)}s left`;
    } else {
      // For upcoming events, show time until event
      const totalMinutes = Math.floor(milliseconds / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
  }

  function getNextEventPerType(cards) {
    const eventsByType = new Map();

    for (const card of cards) {
      const timeUntil = getTimeUntilEvent(card);
      const key = card.type;

      // Check for grace periods
      const eventTime = new Date(now);
      eventTime.setHours(card.hour, card.minute, 0, 0);
      const timeSinceEvent = now.getTime() - eventTime.getTime();

      // GATE events have 8-minute grace period
      if (card.type === "GATE") {
        if (timeSinceEvent >= 0 && timeSinceEvent <= 8 * 60 * 1000) {
          const timeLeft = 8 * 60 * 1000 - timeSinceEvent;
          eventsByType.set(key, {
            ...card,
            timeUntil: timeLeft,
            isActive: true,
          });
          continue;
        }
      }

      // Ocean Fishing has 15-minute grace period
      if (card.type === "Ocean Fishing") {
        if (timeSinceEvent >= 0 && timeSinceEvent <= 15 * 60 * 1000) {
          const timeLeft = 15 * 60 * 1000 - timeSinceEvent;
          eventsByType.set(key, {
            ...card,
            timeUntil: timeLeft,
            isActive: true,
          });
          continue;
        }
      }

      if (
        !eventsByType.has(key) ||
        timeUntil < eventsByType.get(key).timeUntil
      ) {
        eventsByType.set(key, { ...card, timeUntil, isActive: false });
      }
    }

    return Array.from(eventsByType.values());
  }

  function reorder(cards) {
    const allCards = cards.map(getCard);
    const nextEvents = getNextEventPerType(allCards);

    // Sort by time until event (soonest first)
    nextEvents.sort((a, b) => a.timeUntil - b.timeUntil);

    return nextEvents;
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

  {#each reorder(schedule) as card}
    <div class="card" class:active={card.isActive}>
      <div class="type">
        {#if getIcon(card.type)}
          <img src={getIcon(card.type)} alt={card.type} />
        {/if}
        {card.type}
      </div>
      <div class="time-info">
        <p class="time">{formatTime(card.hour, card.minute)}</p>
        <p class="countdown">
          {#if card.isActive}
            Open ({formatTimeRemaining(card.timeUntil, true)})
          {:else}
            in {formatTimeRemaining(card.timeUntil)}
          {/if}
        </p>
      </div>
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

  .card {
    background: white;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid transparent;
    transition: all 0.2s ease;
  }

  .card.active {
    border-left-color: #22c55e;
    background: #f0fdf4;
  }

  .type {
    display: flex;
    align-items: center;
    gap: 0.2em;
    min-height: 32px;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .type img {
    height: 32px;
  }

  .time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
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

  .countdown {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
    margin: 0;
  }

  .description {
    color: #666;
    margin: 0;
    font-size: 0.875rem;
  }

  @media (prefers-color-scheme: dark) {
    header {
      background: #242424;
    }

    .card {
      background: #242424;
    }

    .card.active {
      background: #0f1f0f;
      border-left-color: #22c55e;
    }

    .label {
      color: #999;
    }

    .time {
      color: #fff;
    }

    .countdown {
      color: #999;
    }

    .description {
      color: #999;
    }
  }
</style>
