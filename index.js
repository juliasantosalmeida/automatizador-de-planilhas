// Atualiza o aviso visual conforme o modo selecionado
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const notice = document.getElementById('filterNotice');
    if (e.target.value === "3") {
      notice.innerHTML = "<strong>Filtro Ativo:</strong> Carregará apenas arquivos que começam com 'Branch information'.";
      notice.style.color = "#d93025";
    } else {
      notice.innerText = "Modo atual: Processando todos os arquivos selecionados.";
      notice.style.color = "#666";
    }
  });
});

document.getElementById('fileInput').addEventListener('change', handleFiles);

async function handleFiles(e) {
  const files = e.target.files;
  if (!files.length) return;

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const tableBody = document.getElementById('tableBody');
  const tableHeader = document.getElementById('tableHeader');
  const tableFooter = document.getElementById('tableFooter');
  const fileCounter = document.getElementById('fileCounter');

  tableBody.innerHTML = '';
  tableFooter.innerHTML = '';
  tableHeader.innerHTML = '<th>Arquivo</th>';
  document.getElementById('resultsArea').style.display = 'block';
  document.getElementById('errorMessage').style.display = 'none';

  let processados = 0;
  let colunasCriadas = false;
  let listaChaves = [];
  let acumuladorMedias = {};

  for (let file of files) {
    // --- FILTRO CONDICIONAL ---
    // Se estiver no modo 3, aplica o filtro de nome. Nos outros modos, ignora o filtro.
    if (mode === "3" && !file.name.toLowerCase().startsWith("branch information")) {
      continue;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        type: 'array'
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) continue;

      let resultado;
      if (mode === "1") {
        const colunasDesejadas = ['Area', 'Perim.', 'Circ.', 'Solidity'];
        resultado = processarMaior(json, 'Area', colunasDesejadas);
      } else if (mode === "2") {
        const colBranch = json[0].hasOwnProperty('# Branches') ? '# Branches' : 'Branches';
        const colJunction = json[0].hasOwnProperty('# Junctions') ? '# Junctions' : 'Junctions';
        const colunasDesejadas = [colBranch, colJunction];
        resultado = processarMaior(json, colBranch, colunasDesejadas);
      } else if (mode === "3") {
        resultado = processarSomaColunaB(json);
      }

      if (!colunasCriadas) {
        listaChaves = Object.keys(resultado);
        listaChaves.forEach(key => {
          const th = document.createElement('th');
          th.innerText = key;
          tableHeader.appendChild(th);
          acumuladorMedias[key] = 0;
        });
        colunasCriadas = true;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `<td><b>${file.name}</b></td>`;

      listaChaves.forEach(key => {
        const val = resultado[key];
        const numVal = parseNumeric(val);
        acumuladorMedias[key] += numVal;

        const td = document.createElement('td');
        td.innerText = typeof numVal === 'number' ? numVal.toFixed(3) : val;
        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
      processados++;
      fileCounter.innerText = `Arquivos processados: ${processados}`;

    } catch (err) {
      console.error(err);
      showError("Erro em " + file.name + ". Verifique se o arquivo possui as colunas necessárias.");
    }
  }

  // Médias para qualquer um dos modos
  if (processados > 0) {
    const trMedia = document.createElement('tr');
    trMedia.className = 'row-media';
    trMedia.innerHTML = `<td>MÉDIA GERAL</td>`;

    listaChaves.forEach(key => {
      const media = acumuladorMedias[key] / processados;
      const td = document.createElement('td');
      td.innerText = media.toFixed(3);
      trMedia.appendChild(td);
    });
    tableFooter.appendChild(trMedia);
  } else {
    showError("Nenhum arquivo válido encontrado para o modo selecionado.");
  }

  document.getElementById('fileInput').value = '';
}

function parseNumeric(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/\s/g, '').replace(',', '.')) || 0;
}

function processarMaior(dados, colunaAlvo, filtrarColunas = null) {
  if (!dados[0].hasOwnProperty(colunaAlvo)) {
    throw new Error(`Coluna ${colunaAlvo} não encontrada`);
  }
  const linhaMaior = dados.reduce((prev, curr) =>
    (parseNumeric(curr[colunaAlvo]) > parseNumeric(prev[colunaAlvo])) ? curr : prev
  );
  if (!filtrarColunas) return linhaMaior;
  let filtrado = {};
  filtrarColunas.forEach(col => {
    filtrado[col] = linhaMaior.hasOwnProperty(col) ? linhaMaior[col] : 0;
  });
  return filtrado;
}

function processarSomaColunaB(dados) {
  const chaves = Object.keys(dados[0]);
  const chaveColunaB = chaves[1];
  if (!chaveColunaB) throw new Error("Coluna B não encontrada.");

  const somaTotal = dados.reduce((acc, curr) => acc + parseNumeric(curr[chaveColunaB]), 0);

  let resultado = {};
  resultado[`Soma Total (Col B)`] = somaTotal;
  return resultado;
}

function showError(m) {
  const e = document.getElementById('errorMessage');
  e.innerText = m;
  e.style.display = 'block';
}

/* Love Modal Logic */
document.addEventListener('DOMContentLoaded', () => {
  const heartBtn = document.getElementById('heartBtn');
  const modal = document.getElementById('loveModal');
  const closeBtn = document.getElementById('closeModal');
  const sliderWrapper = document.getElementById('sliderWrapper');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Modal controls
  heartBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Slider controls
  let currentSlide = 0;

  function updateSlider() {
    sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  });

  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
  });

  // Pet Easter Egg Logic
  const petBtn = document.getElementById('petBtn');
  const petOverlay = document.getElementById('petOverlay');

  if (petBtn && petOverlay) {
    petBtn.addEventListener('click', () => {
      if (petOverlay.classList.contains('active')) return;

      petOverlay.classList.add('active');

      // Remove after animation (match CSS 4s)
      setTimeout(() => {
        petOverlay.classList.remove('active');
      }, 4000);
    });
  }
});