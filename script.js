(() => {
  'use strict';

  const state = {
    A: { name: '', lines: [] },
    B: { name: '', lines: [] },
    result: [],
    removed: 0
  };

  const $ = id => document.getElementById(id);

  /* Affichage */
  function setPreview(el, lines) {
    if (!lines || lines.length === 0) {
      el.innerHTML = '<span class="empty">Aucune ligne.</span>';
      return;
    }
    const MAX = 400;
    const shown = lines.slice(0, MAX);
    el.textContent = shown.join('\n') +
      (lines.length > MAX ? `\n… (${lines.length - MAX} lignes supplémentaires)` : '');
  }

  function updateUI(key) {
    const isA = key === 'A';
    const info    = $(isA ? 'infoA' : 'infoB');
    const name    = $(isA ? 'nameA' : 'nameB');
    const linesEl = $(isA ? 'linesA' : 'linesB');
    const preview = $(isA ? 'previewA' : 'previewB');
    const badge   = $(isA ? 'countA' : 'countB');

    if (state[key].lines.length) {
      info.classList.add('show');
      name.textContent = state[key].name;
      name.title = state[key].name;
      linesEl.textContent = state[key].lines.length + ' lignes';
      badge.textContent = state[key].lines.length;
      badge.classList.add('active');
      setPreview(preview, state[key].lines);
    } else {
      info.classList.remove('show');
      name.textContent = '';
      linesEl.textContent = '';
      badge.textContent = '0';
      badge.classList.remove('active');
      preview.innerHTML = '<span class="empty">Aucun fichier chargé.</span>';
    }
    updateButtons();
  }

  function updateButtons() {
    const hasA = state.A.lines.length > 0;
    const hasB = state.B.lines.length > 0;
    $('runBtn').disabled   = !(hasA && hasB);
    $('resetBtn').disabled = !(hasA || hasB);
  }

  function clearResult() {
    $('resultCard').classList.remove('show');
    state.result = [];
    state.removed = 0;
  }

  /* Parsing */
  function parseTxt(text) {
    return text.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
  }

  function detectDelimiter(text) {
    const firstLine = (text.split(/\r?\n/).find(l => l.trim() !== '') || '');
    const c = (firstLine.match(/,/g) || []).length;
    const s = (firstLine.match(/;/g) || []).length;
    const t = (firstLine.match(/\t/g) || []).length;
    if (s > c && s >= t) return ';';
    if (t > c && t > s)  return '\t';
    return ',';
  }

  function parseCsv(text) {
    const delim = detectDelimiter(text);
    const rows = [];
    let row = [], field = '', inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch === '\r') { /* ignore */ }
        else field += ch;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }

    return rowsToLines(rows);
  }

  function rowsToLines(rows) {
    const out = [];
    for (const r of rows) {
      const cells = r.map(c => c == null ? '' : String(c).trim());
      const nonEmpty = cells.filter(c => c !== '');
      if (nonEmpty.length === 0) continue;
      out.push(nonEmpty.length === 1 ? nonEmpty[0] : nonEmpty.join(' → '));
    }
    return out;
  }

  /* Lecture de fichier compatible partout (Safari inclus) */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Lecture impossible'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function readFile(file) {
  const name = (file.name || '').toLowerCase();
  const text = await readFileAsText(file);
  if (name.endsWith('.csv')) return parseCsv(text);
  if (name.endsWith('.txt') || name === '') return parseTxt(text);
  return parseTxt(text);
}

  /* Gestion fichiers */
  async function handleFile(file, key) {
    try {
      const lines = await readFile(file);
      if (lines.length === 0) {
        alert('Le fichier ne contient aucune ligne exploitable.');
        return;
      }
      state[key].name  = file.name;
      state[key].lines = lines;
      updateUI(key);
      clearResult();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  }

  function setupDrop(dropId, inputId, key) {
    const drop  = $(dropId);
    const input = $(inputId);

    // Le <label> ouvre nativement l'input — plus besoin de JS pour le clic.
    input.addEventListener('change', async () => {
      if (input.files && input.files.length) {
        await handleFile(input.files[0], key);
      }
      // Réinitialise pour pouvoir re-choisir le même fichier
      input.value = '';
    });

    ['dragenter','dragover'].forEach(ev =>
      drop.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add('drag');
      })
    );
    ['dragleave','drop'].forEach(ev =>
      drop.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === 'dragleave' && drop.contains(e.relatedTarget)) return;
        drop.classList.remove('drag');
      })
    );
    drop.addEventListener('drop', async e => {
      const dt = e.dataTransfer;
      if (!dt) return;
      const f = (dt.files && dt.files[0]) || null;
      if (f) await handleFile(f, key);
    });
  }

  /* Traitement (case sensitive, 1 pour 1) */
  function run() {
    const counter = new Map();
    for (const line of state.B.lines) {
      counter.set(line, (counter.get(line) || 0) + 1);
    }

    const result = [];
    let removed = 0;

    for (const line of state.A.lines) {
      const c = counter.get(line) || 0;
      if (c > 0) {
        counter.set(line, c - 1);
        removed++;
      } else {
        result.push(line);
      }
    }

    state.result  = result;
    state.removed = removed;

    $('statInit').textContent    = state.A.lines.length;
    $('statRemoved').textContent = removed;
    $('statKept').textContent    = result.length;

    setPreview($('previewResult'), result);
    $('resultCard').classList.add('show');
    $('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function download() {
    const blob = new Blob([state.result.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    const base = state.A.name ? state.A.name.replace(/\.[^.]+$/, '') : 'Liste_A';
    a.download = base + '_modifiee.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetAll() {
    state.A = { name: '', lines: [] };
    state.B = { name: '', lines: [] };
    clearResult();
    updateUI('A');
    updateUI('B');
  }

  /* Init */
  setupDrop('dropA', 'fileA', 'A');
  setupDrop('dropB', 'fileB', 'B');

  $('runBtn').addEventListener('click', run);
  $('resetBtn').addEventListener('click', resetAll);
  $('downloadBtn').addEventListener('click', download);

  $('clearA').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  state.A = { name: '', lines: [] };
  $('fileA').value = '';
  updateUI('A');
  clearResult();
});
$('clearB').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  state.B = { name: '', lines: [] };
  $('fileB').value = '';
  updateUI('B');
  clearResult();
});

  updateUI('A');
  updateUI('B');
})();