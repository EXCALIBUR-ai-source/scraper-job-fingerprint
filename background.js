chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-job") return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "SAVE_JOB" });
});
