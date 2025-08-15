// Pandemic-ish: tiny demo with 4 cities, 1 disease, basic rules.

const cities = {
  ATL: { name: "Atlanta*", x: 20, y: 70, color: "blue", links: ["CHI","MAD"], cubes: 0, station: true },
  CHI: { name: "Chicago", x: 28, y: 55, color: "blue", links: ["ATL","PAR"], cubes: 0 },
  PAR: { name: "Paris",   x: 62, y: 50, color: "blue", links: ["CHI","MAD"], cubes: 0 },
  MAD: { name: "Madrid",  x: 58, y: 62, color: "blue", links: ["ATL","PAR"], cubes: 0 },
  SAN: { name: "San Diego",  x: 40, y: 62, color: "blue", links: ["CHI","ATL"], cubes: 0 }
};
// positions are in viewport %

const MAX_CUBES_PER_CITY = 3;
const LOSS_OUTBREAKS_MAX = 7;
const INFECTIONS_PER_TURN = 2; // fixed for demo
const HAND_TO_CURE = 3;

const state = {
  selected: null,
  pawnAt: "ATL",
  actionsLeft: 4,
  outbreaks: 0,
  cured: false,
  infectionDeck: shuffle(Object.keys(cities).flatMap(id => [id,id,id,id,id])), // weighted a bit
  playerDeck: shuffle(Object.keys(cities).flatMap(id => [id,id,id,id])), // super tiny
  hand: [],
  phase: "action", // action -> draw -> infect
};

const el = {
  board: document.getElementById("board"),
  actionsLeft: document.getElementById("actionsLeft"),
  outbreaks: document.getElementById("outbreaks"),
  infectionRate: document.getElementById("infectionRate"),
  cured: document.getElementById("cured"),
  status: document.getElementById("status"),
  hand: document.getElementById("hand"),
  btnMove: document.getElementById("btnMove"),
  btnTreat: document.getElementById("btnTreat"),
  btnCure: document.getElementById("btnCure"),
  btnEnd: document.getElementById("btnEnd"),
};

init();

function init() {
  drawBoard();
  dealInitial();
  bindUI();
  render();
  log("Your turn. Select a city to interact.");
}

function dealInitial() {
  // seed infections
  for (let i=0; i<3; i++) infect(drawInfection());
  // starting hand
  for (let i=0; i<2; i++) drawPlayerCard();
}

function bindUI() {
  el.btnMove.onclick = () => tryMove();
  el.btnTreat.onclick = () => tryTreat();
  el.btnCure.onclick = () => tryCure();
  el.btnEnd.onclick = () => endTurn();
}

function drawBoard() {
  // links (as angled divs)
  for (const [id, c] of Object.entries(cities)) {
    for (const nid of c.links) {
      if (id > nid) continue; // avoid dup
      linkBetween(id, nid);
    }
  }
  // cities
  for (const [id, c] of Object.entries(cities)) {
    const node = document.createElement("div");
    node.className = "city";
    node.style.left = c.x + "%";
    node.style.top  = c.y + "%";
    node.dataset.id = id;
    node.innerHTML = `
      <div class="name">${c.name}${c.station ? " 🧪" : ""}</div>
      <div class="cubes">Cubes: <span>0</span></div>
    `;
    node.addEventListener("click", () => selectCity(id));
    el.board.appendChild(node);
  }
  // pawn
  const pawn = document.createElement("div");
  pawn.className = "pawn";
  pawn.id = "pawn";
  el.board.appendChild(pawn);
}

function linkBetween(a, b) {
  const A = cities[a], B = cities[b];
  const x1 = A.x, y1 = A.y, x2 = B.x, y2 = B.y;
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const link = document.createElement("div");
  link.className = "link";
  link.style.left = x1 + "%";
  link.style.top  = y1 + "%";
  link.style.width = dist + "%";
  link.style.transform = `rotate(${angle}deg)`;
  el.board.appendChild(link);
}

function selectCity(id) {
  state.selected = id;
  for (const node of document.querySelectorAll(".city")) node.classList.remove("selected");
  document.querySelector(`.city[data-id="${id}"]`).classList.add("selected");
  render();
}

function tryMove() {
  const from = state.pawnAt;
  const to = state.selected;
  if (!to) return;
  if (!cities[from].links.includes(to)) { log("Not connected, bud."); return; }
  spendAction(() => { state.pawnAt = to; log(`Moved to ${cities[to].name}.`); });
}

function tryTreat() {
  const id = state.pawnAt;
  if (cities[id].cubes <= 0) { log("Nothing to treat here."); return; }
  spendAction(() => {
    cities[id].cubes--;
    log(`Treated 1 cube in ${cities[id].name}.`);
  });
}

function tryCure() {
  const id = state.pawnAt;
  const here = cities[id];
  if (!here.station) { log("You must be at a research station (Atlanta*)."); return; }
  if (state.cured) { log("Already cured, chill."); return; }
  // all cards are "blue" in this demo; need 3
  if (state.hand.length < HAND_TO_CURE) { log(`Need ${HAND_TO_CURE} blue cards.`); return; }
  spendAction(() => {
    state.hand.splice(0, HAND_TO_CURE);
    state.cured = true;
    log("Disease cured! Now just mop up the board to win.");
  });
}

function endTurn() {
  if (state.actionsLeft > 0) {
    log(`You still have ${state.actionsLeft} actions. You sure?`);
    // allow ending anyway:
  }
  state.phase = "draw";
  // Draw 2 player cards
  drawPlayerCard(); drawPlayerCard();
  // Infect cities
  state.phase = "infect";
  for (let i=0; i<INFECTIONS_PER_TURN; i++) infect(drawInfection());
  // Check win/lose
  if (checkLoss()) { gameOver(false); return; }
  if (state.cured && totalCubes() === 0) { gameOver(true); return; }
  // Next turn
  state.phase = "action";
  state.actionsLeft = 4;
  log("New turn.");
  render();
}

function spendAction(fn) {
  if (state.phase !== "action") return;
  if (state.actionsLeft <= 0) { log("No actions left."); return; }
  fn();
  state.actionsLeft--;
  render();
}

function drawPlayerCard() {
  if (state.playerDeck.length === 0) { gameOver(false, "Player deck empty."); return; }
  const card = state.playerDeck.pop();
  state.hand.push(card);
}

function drawInfection() {
  if (state.infectionDeck.length === 0) {
    // reshuffle simple: rebuild from all cities
    state.infectionDeck = shuffle(Object.keys(cities).flatMap(id => [id,id,id,id,id]));
  }
  return state.infectionDeck.pop();
}

function infect(cityId) {
  const c = cities[cityId];
  if (c.cubes < MAX_CUBES_PER_CITY) {
    c.cubes++;
  } else {
    // outbreak
    state.outbreaks++;
    for (const nbr of c.links) {
      const n = cities[nbr];
      if (n.cubes < MAX_CUBES_PER_CITY) n.cubes++;
    }
    log(`Outbreak in ${c.name}!`);
  }
}

function checkLoss() {
  if (state.outbreaks >= LOSS_OUTBREAKS_MAX) return true;
  return false;
}

function gameOver(win, reason="") {
  const msg = win ? "YOU WIN 🎉 – cured & cleaned." : `YOU LOSE 💀 ${reason || "(too many outbreaks / deck empty)"}`;
  log(msg);
  disableAll();
}

function disableAll() {
  for (const b of [el.btnMove, el.btnTreat, el.btnCure, el.btnEnd]) b.disabled = true;
}

function totalCubes() {
  return Object.values(cities).reduce((s,c)=>s+c.cubes,0);
}

function render() {
  // pawn
  const pawn = document.getElementById("pawn");
  const p = cities[state.pawnAt];
  pawn.style.left = p.x + "%";
  pawn.style.top  = p.y - 7 + "%";

  // cubes + selection
  for (const [id, c] of Object.entries(cities)) {
    const node = document.querySelector(`.city[data-id="${id}"]`);
    node.querySelector(".cubes span").textContent = c.cubes;
  }

  // buttons
  const canAct = state.phase === "action";
  el.btnMove.disabled  = !canAct || !state.selected || !cities[state.pawnAt].links.includes(state.selected);
  el.btnTreat.disabled = !canAct || cities[state.pawnAt].cubes === 0;
  el.btnCure.disabled  = !canAct || !cities[state.pawnAt].station || state.cured || state.hand.length < HAND_TO_CURE;
  el.btnEnd.disabled   = !canAct;

  // counters
  el.actionsLeft.textContent = state.actionsLeft;
  el.outbreaks.textContent = state.outbreaks;
  el.infectionRate.textContent = INFECTIONS_PER_TURN;
  el.cured.textContent = state.cured ? "Yes" : "No";

  // hand
  el.hand.innerHTML = "";
  state.hand.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = city(card).name;
    el.hand.appendChild(div);
  });
}

function city(id) { return cities[id]; }

function log(msg) {
  el.status.textContent = msg;
}

function shuffle(arr) {
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
