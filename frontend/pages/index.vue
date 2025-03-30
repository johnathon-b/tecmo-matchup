<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#app'

// Get the runtime config
const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

// List of teams with division information. Adjust divisions as needed.
const teamData = [
  { name: "49ers", division: "NFC West" },
  { name: "Giants", division: "NFC East" },
  { name: "Oilers", division: "AFC Central" },
  { name: "Bills", division: "AFC East" },
  { name: "Eagles", division: "NFC East" },
  { name: "Raiders", division: "AFC West" },
  { name: "Chiefs", division: "AFC West" },
  { name: "Dolphins", division: "AFC East" },
  { name: "Vikings", division: "NFC Central" },
  { name: "Bears", division: "NFC Central" },
  { name: "Bengals", division: "AFC Central" },
  { name: "Washington", division: "NFC East" },
  { name: "Steelers", division: "AFC Central" },
  { name: "Rams", division: "NFC West" },
  { name: "Lions", division: "NFC Central" },
  { name: "Broncos", division: "AFC West" },
  { name: "Saints", division: "NFC West" },
  { name: "Cowboys", division: "NFC East" },
  { name: "Chargers", division: "NFC West" },
  { name: "Buccaneers", division: "NFC West" },
  { name: "Falcons", division: "NFC West" },
  { name: "Packers", division: "NFC Central" },
  { name: "Cardinals", division: "NFC West" },
  { name: "Jets", division: "AFC East" },
  { name: "Browns", division: "AFC Central" },
  { name: "Seahawks", division: "NFC West" },
  { name: "Colts", division: "AFC West" },
  { name: "Patriots", division: "AFC East" }
];

// Order of divisions
const divisionOrder = ["AFC East", "AFC Central", "AFC West", "NFC East", "NFC Central", "NFC West"];

// Group teams by division
const teamsByDivision = computed(() => {
  const groups: Record<string, Array<{ name: string, division: string }>> = {};
  teamData.forEach(team => {
    if (!groups[team.division]) groups[team.division] = [];
    groups[team.division].push(team);
  });
  return groups;
});

// Selected opponent team (single selection)
const opponentTeam = ref("");
// For banned teams (multiple selection)
// The 49ers are banned from the tournament and are auto selected.
const bannedTeams = ref<string[]>(["49ers"]);

// API results
const bestAvailable = ref<any[]>([]);
const closeMatchups = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref("");

// Accordion state for Used Teams and Opponent Selection sections
const showUsedTeamsAccordion = ref(false);
const showOpponentAccordion = ref(false);

// API URL (adjust as needed)
// const apiUrl = "http://localhost:8787";

// Toggle a team in the bannedTeams array
function toggleBannedTeam(teamName: string) {
  // Do not allow toggling the 49ers as they are banned
  if (teamName === "49ers") return;
  
  const idx = bannedTeams.value.indexOf(teamName);
  if (idx === -1) {
    bannedTeams.value.push(teamName);
  } else {
    bannedTeams.value.splice(idx, 1);
  }
}

// Toggle opponent selection: Only one can be selected.
function selectOpponent(teamName: string) {
  opponentTeam.value = teamName;
  // Automatically close the opponent accordion after selection
  showOpponentAccordion.value = false;
}

// Compute the dynamic helmet class (e.g., "Bills" -> "helmet-bills")
function getHelmetClass(teamName: string) {
  return "helmet-" + teamName.toLowerCase();
}

async function submitForm() {
  errorMessage.value = "";
  if (!opponentTeam.value) {
    errorMessage.value = "Please select an Opponent Team.";
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opponent: opponentTeam.value,
        bannedTeams: bannedTeams.value
      })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    bestAvailable.value = data.bestAvailable;
    closeMatchups.value = data.closeMatchups;
  } catch (error: any) {
    errorMessage.value = error.message || "Error processing request.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-black text-white p-4 font-retro">
    <header class="text-center py-4">
      <h1 class="text-4xl md:text-5xl font-bold mb-2 text-yellow-400 drop-shadow">
        Tecmo Super Bowl Matchup Picker
      </h1>
      <p class="text-lg md:text-xl">
        Select used teams and an opponent team to see your recommendations
      </p>
    </header>

    <main class="max-w-3xl mx-auto bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
      <!-- Accordion for Used Teams -->
      <div class="mb-6">
        <button
          @click="showUsedTeamsAccordion = !showUsedTeamsAccordion"
          class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center justify-between"
        >
          <span>Used Teams</span>
          <span v-if="showUsedTeamsAccordion">▲</span>
          <span v-else>▼</span>
        </button>
        <transition name="fade">
          <div v-if="showUsedTeamsAccordion" class="mt-3 space-y-4">
            <div v-for="division in divisionOrder" :key="division">
              <h3 class="text-lg font-semibold mb-2">{{ division }}</h3>
              <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                  v-for="team in teamsByDivision[division]"
                  :key="team.name"
                  class="flex flex-col items-center justify-center p-2 rounded border border-gray-600 transition-colors"
                  :class="{
                    'bg-blue-600 opacity-50 cursor-not-allowed': team.name === '49ers',
                    'bg-blue-600': bannedTeams.includes(team.name) && team.name !== '49ers',
                    'bg-gray-800': !bannedTeams.includes(team.name) && team.name !== '49ers'
                  }"
                  @click="toggleBannedTeam(team.name)"
                >
                  <div class="helmet" :class="getHelmetClass(team.name)"></div>
                  <span class="mt-1 text-xs">{{ team.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Opponent Team Selection using helmet buttons in an accordion -->
      <div class="mb-6">
        <button
          @click="showOpponentAccordion = !showOpponentAccordion"
          class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center justify-between"
        >
          <span>Select Opponent Team</span>
          <span v-if="showOpponentAccordion">▲</span>
          <span v-else>▼</span>
        </button>
        <transition name="fade">
          <div v-if="showOpponentAccordion" class="mt-3 space-y-4">
            <div v-for="division in divisionOrder" :key="division">
              <h3 class="text-lg font-semibold mb-2">{{ division }}</h3>
              <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                  v-for="team in teamsByDivision[division]"
                  :key="team.name"
                  class="flex flex-col items-center justify-center p-2 rounded border border-gray-600 transition-colors"
                  :class="{
                    'bg-yellow-600': opponentTeam === team.name,
                    'bg-gray-800': opponentTeam !== team.name
                  }"
                  @click="selectOpponent(team.name)"
                >
                  <div class="helmet" :class="getHelmetClass(team.name)"></div>
                  <span class="mt-1 text-xs">{{ team.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Submit Button and Error Message -->
      <form @submit.prevent="submitForm" class="space-y-6">
        <div v-if="errorMessage" class="text-red-400 font-semibold text-sm md:text-base">
          {{ errorMessage }}
        </div>
        <div class="text-center">
          <button
            type="submit"
            class="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-xl font-semibold text-black"
            :disabled="loading"
          >
            <span v-if="!loading">Get Recommendations</span>
            <span v-else>Loading...</span>
          </button>
        </div>
      </form>

      <!-- Results -->
      <div v-if="bestAvailable.length || closeMatchups.length" class="mt-8">
        <h2 class="text-2xl md:text-3xl font-bold mb-4 text-yellow-400">Matchups</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Best Available Section -->
          <div>
            <h3 class="text-xl md:text-2xl font-semibold border-b pb-2">Best Available</h3>
            <ul class="mt-4 space-y-2">
              <li
                v-for="item in bestAvailable"
                :key="item.team"
                class="flex justify-between bg-gray-700 p-2 rounded text-sm md:text-base"
              >
                <span>{{ item.team }}</span>
                <span class="text-xs md:text-sm">Score: {{ item.score }}</span>
              </li>
            </ul>
          </div>
          <!-- Close Matchups Section -->
          <div>
            <h3 class="text-xl md:text-2xl font-semibold border-b pb-2">Close Matchups</h3>
            <ul class="mt-4 space-y-2">
              <li
                v-for="item in closeMatchups"
                :key="item.team"
                class="flex justify-between bg-gray-700 p-2 rounded text-sm md:text-base"
              >
                <span>{{ item.team }}</span>
                <span class="text-xs md:text-sm">Overall: {{ item.overall }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <footer class="text-center mt-8">
      <p class="text-sm">Made with ❤️</p>
      <p class="text-sm">From The Plaza Tavern</p>
    </footer>
  </div>
</template>

<style scoped>
.font-retro {
  font-family: 'Press Start 2P', cursive;
}

/* Helmet base style using the single sprite */
.helmet {
  background-image: url('/images/helmets.png');
  background-repeat: no-repeat;
  width: 60px;
  height: 60px;
}

/* Adjust the following classes according to your sprite's coordinates. The below values are examples and may need tweaking. */

.helmet-49ers {
  background-position: -0px 0;
}

.helmet-giants {
  background-position: -928px 0;
}

.helmet-oilers {
  background-position: -1114px 0;
}

.helmet-bills {
  background-position: -186px 0;
}

.helmet-eagles {
  background-position: -806px 0;
}

.helmet-raiders {
  background-position: -1300px 0;
}

.helmet-chiefs {
  background-position: -560px 0;
}

.helmet-dolphins {
  background-position: -743px 0;
}

.helmet-vikings {
  background-position: -1672px 0;
}

.helmet-bears {
  background-position: -60px 0;
}

.helmet-bengals {
  background-position: -122px 0;
}

.helmet-washington {
  background-position: -1424px 0;
}

.helmet-steelers {
  background-position: -1610px 0;
}

.helmet-rams {
  background-position: -1362px 0;
}

.helmet-lions {
  background-position: -1052px 0;
}

.helmet-broncos {
  background-position: -246px 0;
}

.helmet-saints {
  background-position: -1486px 0;
}

.helmet-cowboys {
  background-position: -682px 0;
}

.helmet-chargers {
  background-position: -495px 0;
}

.helmet-buccaneers {
  background-position: -371px 0;
}

.helmet-falcons {
  background-position: -866px 0;
}

.helmet-packers {
  background-position: -1176px 0;
}

.helmet-cardinals {
  background-position: -432px 0;
}

.helmet-jets {
  background-position: -990px 0;
}

.helmet-browns {
  background-position: -308px 0;
}

.helmet-seahawks {
  background-position: -1548px 0;
}

.helmet-colts {
  background-position: -620px 0;
}

.helmet-patriots {
  background-position: -1238px 0;
}

/* Fade transition for accordion */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>