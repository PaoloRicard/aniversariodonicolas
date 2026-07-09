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
  runTransaction,
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
  selectedGiftId: null,
  pawClicks: []
};

const giftList = document.querySelector("#giftList");
const adminList = document.querySelector("#adminList");
const emptyState = document.querySelector("#emptyState");
const setupNotice = document.querySelector("#setupNotice");
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const toast = document.querySelector("#toast");

const reserveModal = document.querySelector("#reserveModal");
const reserveForm = document.querySelector("#reserveForm");
const reserveGiftName = document.querySelector("#reserveGiftName");
const guestName = document.querySelector("#guestName");
const guestPhone = document.querySelector("#guestPhone");

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

const formatPhone = (value) => value.replace(/\D/g, "");

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
  reserveForm.reset();
  passwordForm.reset();
  state.selectedGiftId = null;
};

const openAdminPanel = () => {
  adminPanel.classList.add("open");
  panelScrim.classList.remove("hidden");
};

const closeAdminPanel = () => {
  adminPanel.classList.remove("open");
  panelScrim.classList.add("hidden");
};

const updateProgress = () => {
  const total = state.gifts.length;
  const reserved = state.gifts.filter((gift) => gift.reservado).length;
  const percent = total ? Math.round((reserved / total) * 100) : 0;

  progressText.textContent = `${reserved} de ${total} presentes reservados`;
  progressFill.style.width = `${percent}%`;
};

const renderGifts = () => {
  giftList.innerHTML = "";
  state.gifts.forEach((gift, index) => {
    const safeName = escapeHtml(gift.nome);
    const card = document.createElement("article");
    card.className = `gift-card ${gift.reservado ? "reserved" : ""}`;
    card.style.animationDelay = `${Math.min(index * 45, 500)}ms`;

    card.innerHTML = `
      <div class="gift-icon">${getGiftIcon(gift.nome, index)}</div>
      <div class="gift-content">
        <h2>${safeName}</h2>
        <span class="reserved-seal">🦖 Reservado</span>
      </div>
      <button class="reserve-button" type="button" ${gift.reservado ? "disabled" : ""}>
        <span class="check-dot">${gift.reservado ? "✓" : ""}</span>
        ${gift.reservado ? "Reservado" : "Reservar"}
      </button>
    `;

    card.querySelector(".reserve-button").addEventListener("click", () => {
      if (gift.reservado) return;
      state.selectedGiftId = gift.id;
      reserveGiftName.textContent = gift.nome;
      openModal(reserveModal);
      guestName.focus();
    });

    giftList.appendChild(card);
  });

  emptyState.classList.toggle("hidden", state.gifts.length !== 0);
  updateProgress();
};

const renderAdminList = () => {
  adminList.innerHTML = "";
  state.gifts.forEach((gift, index) => {
    const safeName = escapeHtml(gift.nome);
    const safeReservedBy = escapeHtml(gift.reservadoPor || "");
    const safePhone = escapeHtml(gift.telefone || "");
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
      <div class="guest-info ${gift.reservadoPor ? "" : "hidden"}">
        <span>Reservado por: <strong>${safeReservedBy}</strong></span>
        <span>WhatsApp: <strong>${safePhone}</strong></span>
      </div>
      <div class="admin-actions">
        <button type="button" data-action="save">Salvar</button>
        <button type="button" data-action="toggle">${gift.reservado ? "Desmarcar" : "Marcar reservado"}</button>
        <button type="button" data-action="delete" class="danger">Excluir</button>
      </div>
    `;

    const input = item.querySelector(".admin-name-input");
    item.querySelector('[data-action="save"]').addEventListener("click", () => updateGiftName(gift.id, input.value));
    item.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleGiftReservation(gift));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteGift(gift.id, gift.nome));
    adminList.appendChild(item);
  });
};

const reserveGift = async ({ giftId, name, phone }) => {
  const giftRef = doc(db, "presentes", giftId);

  await runTransaction(db, async (transaction) => {
    const giftSnapshot = await transaction.get(giftRef);
    if (!giftSnapshot.exists()) throw new Error("Este presente não existe mais.");
    if (giftSnapshot.data().reservado) throw new Error("Este presente acabou de ser reservado por outra pessoa.");

    transaction.update(giftRef, {
      reservado: true,
      reservadoPor: name.trim(),
      telefone: formatPhone(phone),
      dataReserva: new Date().toISOString(),
      atualizadoEm: serverTimestamp()
    });
  });
};

const addGift = async (name) => {
  await addDoc(collection(db, "presentes"), {
    nome: name.trim(),
    reservado: false,
    reservadoPor: "",
    telefone: "",
    dataReserva: "",
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

const toggleGiftReservation = async (gift) => {
  const reserved = !gift.reservado;
  await updateDoc(doc(db, "presentes", gift.id), {
    reservado: reserved,
    reservadoPor: reserved ? gift.reservadoPor || "Administrador" : "",
    telefone: reserved ? gift.telefone || "" : "",
    dataReserva: reserved ? gift.dataReserva || new Date().toISOString() : "",
    atualizadoEm: serverTimestamp()
  });
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

reserveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = reserveForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    await reserveGift({
      giftId: state.selectedGiftId,
      name: guestName.value,
      phone: guestPhone.value
    });
    closeModals();
    showToast("🦕 Você reservou este presente!<br>Obrigado ❤️", true);
  } catch (error) {
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
  }
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
