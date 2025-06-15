let scoring_data = [];

async function loadAndScoreData() {
  const predicsUrl = 'static/data/predics.csv';
  const resultsUrl = 'https://docs.google.com/spreadsheets/d/1sdJhYLpghwZHAM6aMu-gi7B2qobQVgcIT-vajno9aII/export?format=csv';

  const fetchCSV = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    const text = await res.text();
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: results => resolve(results.data)
      });
    });
  };

  try {
    const [predics, results] = await Promise.all([
      fetchCSV(predicsUrl),
      fetchCSV(resultsUrl)
    ]);

    const resultsMap = {};
    for (const r of results) {
      resultsMap[r.match_id] = r;
    }

    scoring_data = predics.map(p => {
      const res = resultsMap[p.match_id] || {};
      const hasResult = res.result && res.result.trim() !== '';

      const goalPoints =
        hasResult &&
        p.predicted_team1_score === res.team1_score &&
        p.predicted_team2_score === res.team2_score
          ? 3 : 0;

      const resultPoints =
        hasResult && p.predicted_result === res.result
          ? 1 : 0;

      return {
        ...p,
        team1_score: res.team1_score ?? null,
        team2_score: res.team2_score ?? null,
        result: res.result ?? '',
        goal_points: goalPoints,
        result_points: resultPoints
      };
    });

    renderTable(scoring_data); // <-- render once ready
    populateScoreTables(scoring_data);
  } catch (err) {
    console.error("Failed to load or process data:", err);
  }
}

function renderTable(data) {
  const users = ['tb', 'lv'];
  const nameMap = { tb: 'Tomás', lv: 'Lucas' };

  const stats = users.map(u => {
    const items = data.filter(d => d.user === u);
    const GP = items.reduce((sum, x) => sum + (x.goal_points || 0), 0);
    const RP = items.reduce((sum, x) => sum + (x.result_points || 0), 0);
    return { Usuario: nameMap[u], GP, RP, Ptos: GP + RP };
  });

  stats.sort((a, b) => {
    if (b.Ptos !== a.Ptos) return b.Ptos - a.Ptos;
    if (b.GP   !== a.GP)   return b.GP   - a.GP;
    if (b.RP   !== a.RP)   return b.RP   - a.RP;
    return a.Usuario.localeCompare(b.Usuario);
  });

  const tbody = document.querySelector('#score-table tbody');
  tbody.innerHTML = ''; // clear existing
  stats.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Pos">${i+1}</td>
      <td data-label="Usuario">${row.Usuario}</td>
      <td data-label="GP">${row.GP.toLocaleString()}</td>
      <td data-label="RP">${row.RP.toLocaleString()}</td>
      <td data-label="Ptos">${row.Ptos.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}


function populateScoreTables() {
  // 1. Get all unique match_ids in the data
  const matchIds = [...new Set(scoring_data.map(item => item.match_id))];

  matchIds.forEach(matchId => {
    // 2. Find the table for this match_id
    const table = document.getElementById(`rb-${matchId}`);
    if (!table) return;  // skip if table not present

    // 3. Pull any one entry to get date/time and team names
    const anyEntry = scoring_data.find(item => item.match_id === matchId);
    if (!anyEntry) return;

    // 4. Fill date + time
    const dtCell = table.querySelector('#match_date_time');
    if (dtCell) {
      dtCell.innerText = `${anyEntry.date}\n${anyEntry.time}`;
    }

    // 5. Fill team names
    const t1NameCell = table.querySelector('#t1_name');
    const t2NameCell = table.querySelector('#t2_name');
    if (t1NameCell) t1NameCell.innerText = anyEntry.team1_name;
    if (t2NameCell) t2NameCell.innerText = anyEntry.team2_name;

    // 6. Fill actual scores (use "-" if null)
    const res1Cell = table.querySelector('#res1');
    const res2Cell = table.querySelector('#res2');
    if (res1Cell) {
      res1Cell.innerText = anyEntry.team1_score != null 
        ? anyEntry.team1_score 
        : '-';
    }
    if (res2Cell) {
      res2Cell.innerText = anyEntry.team2_score != null 
        ? anyEntry.team2_score 
        : '-';
    }

    // 7. Helper to fill a user’s prediction and points
    function fillUser(userKey, prefix) {
      const userEntry = scoring_data.find(item =>
        item.match_id === matchId && item.user === userKey
      );
      if (!userEntry) return;

      const p1 = table.querySelector(`#${prefix}1`);
      const p2 = table.querySelector(`#${prefix}2`);
      const pts = table.querySelector(`#${prefix}_pt`);

      if (p1)  p1.innerText  = userEntry.predicted_team1_score;
      if (p2)  p2.innerText  = userEntry.predicted_team2_score;
      if (pts) pts.innerText = userEntry.goal_points + userEntry.result_points;
    }

    // 8. Fill Tomas (“tb”) and Lucas (“lv”)
    fillUser('tb', 'tb');
    fillUser('lv', 'lv');
  });
}




// Automatically trigger on load
document.addEventListener('DOMContentLoaded', loadAndScoreData);