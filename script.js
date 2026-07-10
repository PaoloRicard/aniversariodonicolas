import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  hasFirebaseConfig,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "./firebase.js";

const giftIcons = ["🧸", "🚼", "🍼", "👕", "🧦", "🛁", "🦖", "📚", "🧩", "🛏️", "🧴", "🎁"];
const adminPassword = "nicolas2026";
const suggestedGifts = [
  "Fraldas M",
  "Fraldas G",
  "Fraldas XG",
  "Lenços umedecidos",
  "Kit banho",
  "Toalha com capuz",
  "Sabonete líquido infantil",
  "Shampoo infantil",
  "Hidratante infantil",
  "Pomada para assaduras",
  "Mamadeira",
  "Copo de transição",
  "Prato infantil",
  "Talheres infantis",
  "Babadores",
  "Body infantil",
  "Pijama infantil",
  "Conjunto de roupa",
  "Meias antiderrapantes",
  "Livro infantil",
  "Brinquedo educativo"
];

const state = {
  gifts: [],
  isAdmin: false,
  pawClicks: []
};

const giftList = document.querySelector("#giftList");
const adminList = document.querySelector("#adminList");
const emptyState = document.querySelector("#emptyState");
const setupNotice = document.querySelector("#setupNotice");
const toast = document.querySelector("#toast");

const passwordModal = document.querySelector("#passwordModal");
const passwordForm = document.querySelector("#passwordForm");
const adminPasswordInput = document.querySelector("#adminPassword");

const adminFloat = document.querySelector("#adminFloat");
const adminPanel = document.querySelector("#adminPanel");
const panelScrim = document.querySelector("#panelScrim");
const addGiftForm = document.querySelector("#addGiftForm");
const newGiftName = document.querySelector("#newGiftName");
const seedGiftsButton = document.querySelector("#seedGiftsButton");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);

const getGiftIcon = (name, index) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("fralda")) return "🚼";
  if (lowerName.includes("banho") || lowerName.includes("toalha")) return "🛁";
  if (lowerName.includes("mamadeira") || lowerName.includes("copo")) return "🍼";
  if (lowerName.includes("roup") || lowerName.includes("body")) return "👕";
  if (lowerName.includes("livro")) return "📚";
  if (lowerName.includes("brinquedo")) return "🧸";
  return giftIcons[index % giftIcons.length];
};

const showToast = (message, allowHtml = false) => {
  if (allowHtml) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
};

const openModal = (modal) => {
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
};

const closeModals = () => {
  document.querySelectorAll(".modal-backdrop").forEach((modal) => modal.classList.add("hidden"));
  document.body.classList.remove("modal-open");
  passwordForm.reset();
};

const openAdminPanel = () => {
  adminPanel.classList.add("open");
  panelScrim.classList.remove("hidden");
};

const closeAdminPanel = () => {
  adminPanel.classList.remove("open");
  panelScrim.classList.add("hidden");
};

const renderGifts = () => {
  giftList.innerHTML = "";
  state.gifts.forEach((gift, index) => {
    const safeName = escapeHtml(gift.nome);
    const card = document.createElement("article");
    card.className = "gift-card";
    card.style.animationDelay = `${Math.min(index * 45, 500)}ms`;

    card.innerHTML = `
      <div class="gift-icon">${getGiftIcon(gift.nome, index)}</div>
      <div class="gift-content">
        <h2>${safeName}</h2>
      </div>
    `;

    giftList.appendChild(card);
  });

  emptyState.classList.toggle("hidden", state.gifts.length !== 0);
};

const renderAdminList = () => {
  adminList.innerHTML = "";
  state.gifts.forEach((gift, index) => {
    const safeName = escapeHtml(gift.nome);
    const item = document.createElement("article");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="admin-item-top">
        <span>${getGiftIcon(gift.nome, index)}</span>
        <strong>${safeName}</strong>
      </div>
      <label>
        Nome do presente
        <input class="admin-name-input" type="text" value="${safeName}" />
      </label>
      <div class="admin-actions">
        <button type="button" data-action="save">Salvar</button>
        <button type="button" data-action="delete" class="danger">Excluir</button>
      </div>
    `;

    const input = item.querySelector(".admin-name-input");
    item.querySelector('[data-action="save"]').addEventListener("click", () => updateGiftName(gift.id, input.value));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteGift(gift.id, gift.nome));
    adminList.appendChild(item);
  });
};

const addGift = async (name) => {
  await addDoc(collection(db, "presentes"), {
    nome: name.trim(),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
};

const updateGiftName = async (giftId, name) => {
  if (!name.trim()) return showToast("Informe um nome para o presente.");
  await updateDoc(doc(db, "presentes", giftId), {
    nome: name.trim(),
    atualizadoEm: serverTimestamp()
  });
  showToast("🦖 Presente atualizado.");
};

const deleteGift = async (giftId, giftName) => {
  const confirmed = window.confirm(`Excluir "${giftName}" da lista?`);
  if (!confirmed) return;
  await deleteDoc(doc(db, "presentes", giftId));
  showToast("Presente excluído.");
};

const subscribeToGifts = () => {
  const giftsQuery = query(collection(db, "presentes"), orderBy("nome"));
  onSnapshot(giftsQuery, (snapshot) => {
    state.gifts = snapshot.docs.map((giftDoc) => ({
      id: giftDoc.id,
      ...giftDoc.data()
    }));
    renderGifts();
    if (state.isAdmin) renderAdminList();
  }, () => {
    showToast("Não foi possível carregar a lista. Confira a configuração do Firebase.");
  });
};

document.querySelector("#secretPaw").addEventListener("click", () => {
  const now = Date.now();
  state.pawClicks = [...state.pawClicks.filter((time) => now - time < 1800), now];
  if (state.pawClicks.length >= 2) {
    state.pawClicks = [];
    openModal(passwordModal);
    adminPasswordInput.focus();
  }
});

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (adminPasswordInput.value !== adminPassword) {
    showToast("Senha incorreta.");
    return;
  }

  state.isAdmin = true;
  adminFloat.classList.remove("hidden");
  renderAdminList();
  closeModals();
  showToast("🦖 Modo administrador ativado.");
});

addGiftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addGift(newGiftName.value);
  addGiftForm.reset();
  showToast("🎁 Presente adicionado.");
});

seedGiftsButton.addEventListener("click", async () => {
  const existingNames = new Set(state.gifts.map((gift) => gift.nome.toLowerCase().trim()));
  const giftsToCreate = suggestedGifts.filter((name) => !existingNames.has(name.toLowerCase()));

  if (!giftsToCreate.length) {
    showToast("A lista sugerida já foi adicionada.");
    return;
  }

  seedGiftsButton.disabled = true;
  try {
    await Promise.all(giftsToCreate.map((name) => addGift(name)));
    showToast("🦖 Lista sugerida adicionada.");
  } finally {
    seedGiftsButton.disabled = false;
  }
});

adminFloat.addEventListener("click", openAdminPanel);
document.querySelector("#closeAdmin").addEventListener("click", closeAdminPanel);
panelScrim.addEventListener("click", closeAdminPanel);
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
document.querySelectorAll(".modal-backdrop").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModals();
  });
});

if (hasFirebaseConfig) {
  subscribeToGifts();
} else {
  setupNotice.classList.remove("hidden");
  renderGifts();
}
