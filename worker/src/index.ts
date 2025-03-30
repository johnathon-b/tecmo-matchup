import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

interface TeamData {
  name: string;
  offense: number; // overall offensive rating (0-100)
  defense: number; // overall defensive rating (0-100)
  run: number;     // run game rating (0-100)
  pass: number;    // passing game rating (0-100)
}

// A sample pool of all 28 teams with illustrative ratings.
const teams: TeamData[] = [
  { name: "49ers",       offense: 95, defense: 90, run: 85, pass: 95 },
  { name: "Giants",       offense: 90, defense: 95, run: 80, pass: 85 },
  { name: "Oilers",       offense: 100, defense: 70, run: 80, pass: 100 },
  { name: "Bills",        offense: 85, defense: 80, run: 80, pass: 90 },
  { name: "Eagles",       offense: 90, defense: 90, run: 85, pass: 90 },
  { name: "Raiders",      offense: 90, defense: 90, run: 100, pass: 70 },
  { name: "Chiefs",       offense: 85, defense: 85, run: 95, pass: 80 },
  { name: "Dolphins",     offense: 90, defense: 80, run: 70, pass: 95 },
  { name: "Vikings",      offense: 80, defense: 85, run: 85, pass: 80 },
  { name: "Bears",        offense: 75, defense: 100, run: 90, pass: 70 },
  { name: "Bengals",      offense: 80, defense: 70, run: 85, pass: 80 },
  { name: "Washington",   offense: 80, defense: 80, run: 80, pass: 80 },
  { name: "Steelers",     offense: 75, defense: 90, run: 80, pass: 70 },
  { name: "Rams",         offense: 90, defense: 70, run: 80, pass: 90 },
  { name: "Lions",        offense: 80, defense: 75, run: 100, pass: 70 },
  { name: "Broncos",      offense: 80, defense: 80, run: 75, pass: 80 },
  { name: "Saints",       offense: 80, defense: 80, run: 80, pass: 80 },
  { name: "Cowboys",      offense: 80, defense: 75, run: 80, pass: 80 },
  { name: "Chargers",     offense: 80, defense: 80, run: 80, pass: 80 },
  { name: "Buccaneers",   offense: 75, defense: 80, run: 70, pass: 75 },
  { name: "Falcons",      offense: 75, defense: 70, run: 80, pass: 70 },
  { name: "Packers",      offense: 70, defense: 65, run: 65, pass: 70 },
  { name: "Cardinals",    offense: 70, defense: 70, run: 70, pass: 70 },
  { name: "Jets",         offense: 70, defense: 70, run: 70, pass: 70 },
  { name: "Browns",       offense: 65, defense: 65, run: 65, pass: 65 },
  { name: "Seahawks",     offense: 70, defense: 70, run: 70, pass: 70 },
  { name: "Colts",        offense: 60, defense: 60, run: 60, pass: 60 },
  { name: "Patriots",     offense: 60, defense: 65, run: 60, pass: 60 },
];

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent): Promise<Response> {
  const request = event.request;
  const url = new URL(request.url);

  // If the path begins with /api, route to our API handler.
  if (url.pathname.startsWith("/api")) {
    return await handleApiRequest(request);
  }

  // Otherwise, serve the static assets from the Nuxt build.
  try {
    return await getAssetFromKV(event);
  } catch (e) {
    return new Response("Error fetching asset", { status: 404 });
  }
}

/**
 * Handles API requests.
 * Expects a POST with a JSON body:
 * { "opponent": "Packers", "bannedTeams": ["Giants", "Eagles"] }
 */
async function handleApiRequest(request: Request): Promise<Response> {
  // Handle OPTIONS preflight requests.
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the request is application/json.
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return new Response("Expected application/json", { status: 400 });
  }

  try {
    const body = await request.json();
    const opponentName = body.opponent;
    const bannedTeams: string[] = body.bannedTeams || [];

    if (!opponentName || typeof opponentName !== "string") {
      return new Response("Missing or invalid 'opponent' field", { status: 400 });
    }
    if (!Array.isArray(bannedTeams)) {
      return new Response("Invalid 'bannedTeams' field – must be an array", { status: 400 });
    }

    // Find the opponent team.
    const opponentTeam = teams.find(
      (team) => team.name.toLowerCase() === opponentName.toLowerCase()
    );
    if (!opponentTeam) {
      return new Response(`Opponent team "${opponentName}" not found`, { status: 404 });
    }

    // Use the opponent's overall rating as the baseline.
    const opponentOverall = (opponentTeam.offense + opponentTeam.defense) / 2;
    const ratingDelta = 10; // Define how much above the opponent rating qualifies as "close"

    // Filter candidate teams: exclude the opponent and banned teams.
    const candidateTeams = teams.filter((team) => {
      return (
        team.name.toLowerCase() !== opponentTeam.name.toLowerCase() &&
        !bannedTeams.some(
          (banned) => banned.toLowerCase() === team.name.toLowerCase()
        )
      );
    });

    // --- Best Available Calculation ---
    // Compute a matchup score for each candidate:
    // score = (candidate.offense - opponentTeam.defense) + (candidate.defense - opponentTeam.offense)
    const bestAvailableCandidates = candidateTeams.map((team) => {
      const score =
        (team.offense - opponentTeam.defense) +
        (team.defense - opponentTeam.offense);
      return { team: team.name, score };
    });
    bestAvailableCandidates.sort((a, b) => b.score - a.score);
    const bestAvailable = bestAvailableCandidates.slice(0, 3);

    // --- Close Matchups Calculation ---
    // Compute overall rating for each candidate.
    // overall = (offense + defense) / 2.
    const closeMatchCandidates = candidateTeams
      .map((team) => {
        const overall = (team.offense + team.defense) / 2;
        return { team: team.name, overall };
      })
      // Filter for teams that are just above the opponent's overall rating
      .filter((candidate) => candidate.overall > opponentOverall && candidate.overall <= opponentOverall + ratingDelta);
    // Sort candidates by overall rating (closest first).
    closeMatchCandidates.sort((a, b) => a.overall - b.overall);
    const closeMatchups = closeMatchCandidates.slice(0, 3);

    const responsePayload = {
      opponent: opponentTeam.name,
      bannedTeams,
      bestAvailable,
      closeMatchups,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response("Error processing request", { status: 400 });
  }
}