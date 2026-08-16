/** Avatar catalog for Gesture Arena */
const AVATAR_CATALOG = [
  { id: "warrior", emoji: "🥷", name: "Shadow Warrior", color: "#6366f1" },
  { id: "champion", emoji: "🦸", name: "Arena Champion", color: "#8b5cf6" },
  { id: "ninja", emoji: "🥋", name: "Gesture Ninja", color: "#ec4899" },
  { id: "robot", emoji: "🤖", name: "Cyber Fighter", color: "#06b6d4" },
  { id: "wizard", emoji: "🧙", name: "Spell Caster", color: "#a855f7" },
  { id: "alien", emoji: "👽", name: "Cosmic Rival", color: "#22c55e" },
  { id: "dragon", emoji: "🐉", name: "Dragon Lord", color: "#f97316" },
  { id: "queen", emoji: "👸", name: "Arena Queen", color: "#f43f5e" },
  { id: "knight", emoji: "🛡️", name: "Iron Knight", color: "#64748b" },
  { id: "phoenix", emoji: "🔥", name: "Phoenix Striker", color: "#eab308" },
  { id: "wolf", emoji: "🐺", name: "Alpha Wolf", color: "#94a3b8" },
  { id: "star", emoji: "⭐", name: "Rising Star", color: "#38bdf8" },
];

const DEFAULT_AVATAR_ID = "champion";
const AVATAR_STORAGE_KEY = "gesture_avatar_id";

function getAvatarById(id) {
  return AVATAR_CATALOG.find((a) => a.id === id) || AVATAR_CATALOG[1];
}

function getStoredAvatarId() {
  return localStorage.getItem(AVATAR_STORAGE_KEY) || DEFAULT_AVATAR_ID;
}

function setStoredAvatarId(id) {
  localStorage.setItem(AVATAR_STORAGE_KEY, id);
}

function hasChosenAvatar() {
  return (
    localStorage.getItem(AVATAR_STORAGE_KEY) !== null ||
    localStorage.getItem("gesture_onboarded") === "1"
  );
}

function avatarIdForProfile(profile) {
  const dbAvatarId = profile?.avatar_id || profile?.avatar_url;
  if (dbAvatarId && getAvatarById(dbAvatarId)) {
    return dbAvatarId;
  }
  return avatarIdFromUsername(profile?.username || "Player");
}

function avatarIdFromUsername(username) {
  if (!username) return DEFAULT_AVATAR_ID;
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_CATALOG.length;
  return AVATAR_CATALOG[index].id;
}

function renderAvatarMarkup(id, sizeClass = "avatar-md") {
  const avatar = getAvatarById(id);
  return `<span class="game-avatar ${sizeClass}" style="--avatar-color:${avatar.color}" title="${avatar.name}">${avatar.emoji}</span>`;
}

function renderAvatarGrid(selectedId, onSelect) {
  const grid = document.getElementById("avatar-grid");
  if (!grid) return;
  grid.innerHTML = AVATAR_CATALOG.map((avatar) => {
    const selected = avatar.id === selectedId ? " selected" : "";
    return `
      <button type="button" class="avatar-option${selected}" data-avatar-id="${avatar.id}" aria-label="${avatar.name}">
        <span class="game-avatar avatar-lg" style="--avatar-color:${avatar.color}">${avatar.emoji}</span>
        <span class="avatar-option-name">${avatar.name}</span>
      </button>`;
  }).join("");

  grid.querySelectorAll(".avatar-option").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(btn.dataset.avatarId));
  });
}
