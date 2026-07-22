export function installEventHandlers(controller) {
  document.getElementById('setup-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const configs = [...document.querySelectorAll('[data-player-row]')].map((row) => ({
      name: row.querySelector('[data-player-name]').value.trim(), type: row.querySelector('[data-player-type]').value, difficulty: row.querySelector('[data-ai-level]').value,
    }));
    controller.startGame(configs);
  });
  document.getElementById('player-count').addEventListener('change', (event) => controller.renderNameFields(Number(event.target.value)));
  document.getElementById('player-name-fields').addEventListener('change', (event) => {
    if (!event.target.matches('[data-player-type]')) return;
    const row = event.target.closest('[data-player-row]'); const aiLevel = row.querySelector('[data-ai-level]'); aiLevel.disabled = event.target.value !== 'AI'; row.classList.toggle('is-ai', event.target.value === 'AI');
  });
  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, [data-command], [data-intent], [data-draft-action]');
    if (!target || target.disabled) return;
    if (target.dataset.intent) controller.selectIntent(target.dataset.intent);
    else if (target.dataset.gem) controller.selectGem(target.dataset.gem);
    else if (target.dataset.cardSource) controller.selectCard(target.dataset);
    else if (target.dataset.deckLevel) controller.reserveDeck(Number(target.dataset.deckLevel));
    else if (target.dataset.returnGem) controller.adjustReturn(target.dataset.returnGem, Number(target.dataset.returnDelta));
    else if (target.dataset.nobleId) controller.chooseNoble(target.dataset.nobleId);
    else if (target.dataset.draftAction) controller.chooseDraftAction(target.dataset.draftAction);
    else if (target.dataset.command) controller.runCommand(target.dataset.command);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') controller.runCommand('cancel-intent'); });
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const [file] = event.target.files; if (file) await controller.importFile(file); event.target.value = '';
  });
}
