const result = document.getElementById('result');
const frame = document.getElementById('game-frame');
const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    await wait();
    doc.getElementById('setup-form').requestSubmit();
    await wait();
    const overflow = doc.documentElement.scrollWidth > doc.documentElement.clientWidth + 1;
    const cards = doc.querySelectorAll('.development-card').length;
    const tokens = doc.querySelectorAll('.token-stack').length;
    const playerCards = doc.querySelectorAll('.player-status-card');
    const slots = doc.querySelectorAll('.player-development-slot');
    const currentLanes = doc.querySelectorAll('.current-player-lane');
    const gemIcons = [...doc.querySelectorAll('img.gem-icon')];
    const marketCard = doc.querySelector('.development-card');
    const nobleCard = doc.querySelector('.noble-card');
    const playerSidebar = doc.querySelector('.player-sidebar');
    const regions = ['market', 'token-pool', 'nobles', 'player-panel', 'action-log'].every((id) => doc.getElementById(id));
    const allGemIconsUseAssets = gemIcons.length > 0 && gemIcons.every((image) => image.getAttribute('src')?.includes('/src/boardgame_gems_nogold_assets/assets/gems/'));
    const marketRect = marketCard.getBoundingClientRect();
    const nobleRect = nobleCard.getBoundingClientRect();
    const shouldFixSidebar = doc.documentElement.clientWidth > 1120;
    const sidebarPositionCorrect = shouldFixSidebar
      ? getComputedStyle(playerSidebar).position === 'fixed'
      : getComputedStyle(playerSidebar).position !== 'fixed';
    const cardUsesSolidColor = getComputedStyle(marketCard).backgroundImage === 'none';
    const marketIsPokerProportioned = marketRect.height > marketRect.width * 1.2 && marketRect.height < marketRect.width * 1.55;
    const nobleIsCompact = nobleRect.height > nobleRect.width * 1.1 && nobleRect.height < nobleRect.width * 1.4;

    if (overflow) throw new Error(`Horizontal overflow: ${doc.documentElement.scrollWidth}/${doc.documentElement.clientWidth}`);
    if (cards !== 12 || tokens !== 6 || !regions || playerCards.length !== 3 || slots.length !== 15 || currentLanes.length !== 6 || !allGemIconsUseAssets || !sidebarPositionCorrect || !cardUsesSolidColor || !marketIsPokerProportioned || !nobleIsCompact) {
      throw new Error(`Incomplete desk: cards ${cards}, tokens ${tokens}, players ${playerCards.length}, slots ${slots.length}, current lanes ${currentLanes.length}, fixed ${sidebarPositionCorrect}, solid ${cardUsesSolidColor}, market ${Math.round(marketRect.width)}x${Math.round(marketRect.height)}, noble ${Math.round(nobleRect.width)}x${Math.round(nobleRect.height)}`);
    }
    result.hidden = false;
    result.textContent = `PASS: ${doc.documentElement.clientWidth}px board layout`;
    document.title = 'PASS';
  } catch (error) {
    result.hidden = false;
    result.textContent = `FAIL: ${error.message}`;
    document.title = 'FAIL';
  }
}, { once: true });
