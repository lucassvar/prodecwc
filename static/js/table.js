document.addEventListener('DOMContentLoaded', () => {
  fetch('static/data/scoring_data.json')
    .then(res => res.json())
    .then(data => {
      const users = ['tb', 'lv'];
      const nameMap = { tb: 'Tomás', lv: 'Lucas' };

      // compute sums for each user
      const stats = users.map(u => {
        const items = data.filter(d => d.user === u);
        const GP = items.reduce((sum, x) => sum + (x.goal_points || 0), 0);
        const RP = items.reduce((sum, x) => sum + (x.result_points || 0), 0);
        return { Usuario: nameMap[u], GP, RP, Ptos: GP + RP };
      });

      // sort: Ptos ↓, GP ↓, RP ↓, Usuario A→Z
      stats.sort((a, b) => {
        if (b.Ptos !== a.Ptos) return b.Ptos - a.Ptos;
        if (b.GP   !== a.GP)   return b.GP   - a.GP;
        if (b.RP   !== a.RP)   return b.RP   - a.RP;
        return a.Usuario.localeCompare(b.Usuario);
      });

      // render rows
      const tbody = document.querySelector('#score-table tbody');
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
    })
    .catch(err => console.error('Error loading data:', err));
});
