// Variáveis globais
let currentPage = 'dashboard';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let sidebarClosed = localStorage.getItem('sidebarClosed') === 'true';
let questionsChart, accuracyChart;
let currentEditingTask = null;
let selectedColor = '#4caf50';
let currentAddCardColumn = null;

// Dados simulados para os gráficos
const chartData = {
    monthly: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        questionsData: {
            todas: [45, 52, 48, 61, 55, 67, 73, 69, 78, 82, 85, 90],
            matematica: [15, 18, 16, 20, 18, 22, 25, 23, 26, 28, 30, 32],
            portugues: [12, 14, 13, 16, 15, 18, 20, 19, 21, 23, 24, 26],
            historia: [8, 9, 8, 11, 10, 12, 13, 12, 14, 15, 16, 17],
            geografia: [6, 7, 7, 8, 8, 9, 10, 10, 11, 11, 12, 12],
            ciencias: [4, 4, 4, 6, 4, 6, 5, 5, 6, 5, 3, 3]
        },
        accuracyData: {
            todas: [72, 75, 78, 80, 82, 85, 87, 89, 91, 88, 90, 92],
            matematica: [68, 70, 73, 75, 78, 80, 82, 85, 87, 84, 86, 88],
            portugues: [75, 78, 80, 82, 85, 87, 89, 91, 93, 90, 92, 94],
            historia: [70, 72, 75, 78, 80, 83, 85, 87, 89, 86, 88, 90],
            geografia: [74, 76, 79, 81, 84, 86, 88, 90, 92, 89, 91, 93],
            ciencias: [69, 71, 74, 76, 79, 82, 84, 86, 88, 85, 87, 89]
        }
    }
};

// Dados dos cadernos
let notebooks = [
    {
        id: 1,
        name: 'Matemática Básica',
        questions: 150,
        correct: 90,
        incorrect: 38,
        unanswered: 22,
        created: '15/01/2024',
        starred: true
    },
    {
        id: 2,
        name: 'Português Avançado',
        questions: 200,
        correct: 90,
        incorrect: 70,
        unanswered: 40,
        created: '10/01/2024',
        starred: false
    },
    {
        id: 3,
        name: 'História do Brasil',
        questions: 100,
        correct: 70,
        incorrect: 20,
        unanswered: 10,
        created: '05/01/2024',
        starred: true
    }
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeCharts();
    setupDragAndDrop();
    loadUserPreferences();
});

function initializeApp() {
    // Aplicar modo escuro se necessário
    if (isDarkMode) {
        document.body.classList.add('dark');
    }
    
    // Aplicar estado da sidebar
    if (sidebarClosed) {
        document.querySelector('.sidebar').classList.add('close');
    }
    
    // Mostrar página inicial
    showPage('dashboard');
}

function setupEventListeners() {
    // Toggle sidebar
    document.querySelector('.toggle').addEventListener('click', toggleSidebar);
    
    // Navegação
    document.querySelectorAll('.nav-link a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.closest('.nav-link').dataset.page;
            if (page) {
                navigateTo(page);
            }
        });
    });
    
    // Filtros dos gráficos
    document.getElementById('questionsMateria')?.addEventListener('change', updateCharts);
    document.getElementById('accuracyMateria')?.addEventListener('change', updateCharts);
    
    // Novo filtro de data unificado
    document.getElementById('questionsDateRange')?.addEventListener('click', function() {
        openDatePicker('questions');
    });
    document.getElementById('accuracyDateRange')?.addEventListener('click', function() {
        openDatePicker('accuracy');
    });
    
    // Fechar modal do perfil ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('profileModal');
        const perfil = document.querySelector('.perfil');
        if (!perfil.contains(e.target) && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
        
        // Fechar date picker ao clicar fora
        const questionsDatePicker = document.getElementById('questionsDatePicker');
        const accuracyDatePicker = document.getElementById('accuracyDatePicker');
        const questionsContainer = document.querySelector('#questionsDateRange')?.closest('.date-range-container');
        const accuracyContainer = document.querySelector('#accuracyDateRange')?.closest('.date-range-container');
        
        if (questionsDatePicker && questionsContainer && !questionsContainer.contains(e.target)) {
            questionsDatePicker.style.display = 'none';
        }
        if (accuracyDatePicker && accuracyContainer && !accuracyContainer.contains(e.target)) {
            accuracyDatePicker.style.display = 'none';
        }
    });
    
    // Busca
    document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchQuestions();
        }
    });
    
    // Chat
    document.getElementById('chatInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Context menu para tarefas
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.tarefa-card')) {
            e.preventDefault();
            showContextMenu(e, e.target.closest('.tarefa-card'));
        }
    });
    
    // Fechar context menu
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu-contexto')) {
            hideContextMenu();
        }
    });

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('addCardModal');
        if (e.target === modal) {
            closeAddCardModal();
        }
    });

    // Enter no input do modal
    document.getElementById('cardTitle')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCard();
        }
    });
}

function loadUserPreferences() {
    // Carregar preferências salvas
    const savedTimeView = localStorage.getItem('isMonthlyView');
    if (savedTimeView !== null) {
        isMonthlyView = savedTimeView === 'true';
    }
}

// Navegação
function navigateTo(page) {
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Mostrar página
    showPage(page);
    
    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'search': 'Buscar Questões',
        'chat': 'Chat IA'
    };
    document.getElementById('page-title').textContent = titles[page] || 'EduPlatform';
    
    currentPage = page;
}

function showPage(pageId) {
    // Esconder todas as páginas
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar página selecionada
    document.getElementById(`${pageId}-page`).classList.add('active');
}

// Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('close');
    sidebarClosed = sidebar.classList.contains('close');
    localStorage.setItem('sidebarClosed', sidebarClosed);
}

// Modo escuro
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    isDarkMode = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDarkMode);
    
    // Atualizar gráficos se necessário
    if (questionsChart && accuracyChart) {
        updateChartsTheme();
    }
}

// Modal do perfil
function toggleProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function logout() {
    alert('Função de logout seria implementada aqui');
    toggleProfileModal();
}

function editProfile() {
    alert('Função de editar perfil seria implementada aqui');
    toggleProfileModal();
}

function settings() {
    alert('Função de configurações seria implementada aqui');
    toggleProfileModal();
}

// Gráficos
function initializeCharts() {
    const ctx1 = document.getElementById('questionsChart');
    const ctx2 = document.getElementById('accuracyChart');
    
    if (!ctx1 || !ctx2) return;
    
    // Gráfico de questões resolvidas
    questionsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: chartData.monthly.labels,
            datasets: [{
                label: 'Questões Resolvidas',
                data: chartData.monthly.questionsData.todas,
                borderColor: '#00a82d',
                backgroundColor: 'rgba(0, 168, 45, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00a82d',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                }
            }
        }
    });
    
    // Gráfico de taxa de acertos
    accuracyChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Acertos', 'Erros'],
            datasets: [{
                data: [85, 15],
                backgroundColor: ['#00a82d', '#f44336'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#6c757d',
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateCharts() {
    if (!questionsChart || !accuracyChart) return;
    
    // Obter matérias selecionadas
    const questionsMateria = document.getElementById('questionsMateria')?.value || 'todas';
    const accuracyMateria = document.getElementById('accuracyMateria')?.value || 'todas';
    
    // Obter datas selecionadas (para futuras implementações de filtro por data)
    const questionsDateStart = document.getElementById('questionsDateStart')?.value;
    const questionsDateEnd = document.getElementById('questionsDateEnd')?.value;
    const accuracyDateStart = document.getElementById('accuracyDateStart')?.value;
    const accuracyDateEnd = document.getElementById('accuracyDateEnd')?.value;
    
    // Atualizar gráfico de questões
    questionsChart.data.datasets[0].data = chartData.monthly.questionsData[questionsMateria];
    questionsChart.update();
    
    // Atualizar gráfico de acertos
    const avgAccuracy = chartData.monthly.accuracyData[accuracyMateria][chartData.monthly.accuracyData[accuracyMateria].length - 1];
    accuracyChart.data.datasets[0].data = [avgAccuracy, 100 - avgAccuracy];
    accuracyChart.update();
}

function updateChartsTheme() {
    const textColor = isDarkMode ? '#e0e0e0' : '#6c757d';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Atualizar cores dos gráficos
    questionsChart.options.scales.y.ticks.color = textColor;
    questionsChart.options.scales.x.ticks.color = textColor;
    questionsChart.options.scales.y.grid.color = gridColor;
    questionsChart.options.scales.x.grid.color = gridColor;
    
    accuracyChart.options.plugins.legend.labels.color = textColor;
    
    questionsChart.update();
    accuracyChart.update();
}

// Sistema Trello
function setupDragAndDrop() {
    const tarefas = document.querySelectorAll('.tarefa-card');
    const colunas = document.querySelectorAll('.dia-coluna');
    
    tarefas.forEach(tarefa => {
        tarefa.addEventListener('dragstart', handleDragStart);
        tarefa.addEventListener('dragend', handleDragEnd);
    });
    
    colunas.forEach(coluna => {
        coluna.addEventListener('dragover', handleDragOver);
        coluna.addEventListener('drop', handleDrop);
        coluna.addEventListener('dragenter', handleDragEnter);
        coluna.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.querySelector('.tarefa-text').textContent);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('dia-coluna')) {
        e.target.style.backgroundColor = 'rgba(0, 168, 45, 0.1)';
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('dia-coluna')) {
        e.target.style.backgroundColor = '';
    }
}

function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const coluna = e.target.closest('.dia-coluna');
    
    if (coluna) {
        coluna.style.backgroundColor = '';
        
        // Criar nova tarefa
        const novaTarefa = document.createElement('div');
        novaTarefa.className = 'tarefa-card';
        novaTarefa.draggable = true;
        novaTarefa.innerHTML = `
            <div class="tarefa-content">
                <span class="tarefa-text">${data}</span>
                <div class="tarefa-check">
                    <i class='bx bx-check'></i>
                </div>
            </div>
        `;
        
        // Adicionar eventos
        novaTarefa.addEventListener('dragstart', handleDragStart);
        novaTarefa.addEventListener('dragend', handleDragEnd);
        
        // Inserir antes do botão adicionar
        const addButton = coluna.querySelector('.add-card-btn');
        coluna.insertBefore(novaTarefa, addButton);
    }
}

// Modal Adicionar Cartão
function showAddCardModal(dia) {
    currentAddCardColumn = dia;
    const modal = document.getElementById('addCardModal');
    const input = document.getElementById('cardTitle');
    modal.style.display = 'flex';
    input.focus();
}

function closeAddCardModal() {
    const modal = document.getElementById('addCardModal');
    const input = document.getElementById('cardTitle');
    modal.style.display = 'none';
    input.value = '';
    currentAddCardColumn = null;
}

function addCard() {
    const input = document.getElementById('cardTitle');
    const title = input.value.trim();
    
    if (!title || !currentAddCardColumn) return;
    
    const coluna = document.querySelector(`[data-dia="${currentAddCardColumn}"]`);
    if (!coluna) return;
    
    // Criar nova tarefa
    const novaTarefa = document.createElement('div');
    novaTarefa.className = 'tarefa-card';
    novaTarefa.draggable = true;
    novaTarefa.innerHTML = `
        <div class="tarefa-content">
            <span class="tarefa-text">${title}</span>
            <div class="tarefa-check">
                <i class='bx bx-check'></i>
            </div>
        </div>
    `;
    
    // Adicionar eventos
    novaTarefa.addEventListener('dragstart', handleDragStart);
    novaTarefa.addEventListener('dragend', handleDragEnd);
    
    // Inserir antes do botão adicionar
    const addButton = coluna.querySelector('.add-card-btn');
    coluna.insertBefore(novaTarefa, addButton);
    
    closeAddCardModal();
}

// Context Menu
function showContextMenu(e, element) {
    const menu = document.getElementById('menuContexto');
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    currentEditingTask = element;
}

function hideContextMenu() {
    document.getElementById('menuContexto').style.display = 'none';
    currentEditingTask = null;
}

function editarTarefa() {
    if (currentEditingTask) {
        const modal = document.getElementById('modalNota');
        const textarea = document.getElementById('textoNota');
        textarea.value = currentEditingTask.querySelector('.tarefa-text').textContent;
        modal.style.display = 'flex';
    }
    hideContextMenu();
}

function mudarCor() {
    const paleta = document.getElementById('paletaCores');
    paleta.style.display = 'flex';
    paleta.style.left = document.getElementById('menuContexto').style.left;
    paleta.style.top = document.getElementById('menuContexto').style.top;
    hideContextMenu();
}

function excluirTarefa() {
    if (currentEditingTask && confirm('Deseja excluir esta tarefa?')) {
        currentEditingTask.remove();
    }
    hideContextMenu();
}

function aplicarCor() {
    if (currentEditingTask && selectedColor) {
        currentEditingTask.style.backgroundColor = selectedColor;
    }
    document.getElementById('paletaCores').style.display = 'none';
}

// Modal de nota
function salvarNota() {
    const texto = document.getElementById('textoNota').value;
    if (currentEditingTask && texto.trim()) {
        currentEditingTask.querySelector('.tarefa-text').textContent = texto;
    }
    fecharModalNota();
}

function fecharModalNota() {
    document.getElementById('modalNota').style.display = 'none';
    document.getElementById('textoNota').value = '';
}

// Seleção de cor
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.opcao-cor').forEach(cor => {
        cor.addEventListener('click', function() {
            selectedColor = this.dataset.cor;
            document.querySelectorAll('.opcao-cor').forEach(c => c.style.border = '2px solid var(--border-color)');
            this.style.border = '3px solid var(--primary-color)';
        });
    });
});

// Cadernos
function createNotebook() {
    const name = prompt('Nome do novo caderno:');
    if (name && name.trim()) {
        const newNotebook = {
            id: Date.now(),
            name: name.trim(),
            questions: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            created: new Date().toLocaleDateString('pt-BR'),
            starred: false
        };
        notebooks.push(newNotebook);
        renderNotebooks();
    }
}

function toggleStar(button) {
    const card = button.closest('.notebook-card');
    const notebookId = parseInt(card.dataset.id);
    const notebook = notebooks.find(n => n.id === notebookId);
    
    if (notebook) {
        notebook.starred = !notebook.starred;
        button.textContent = notebook.starred ? '⭐' : '☆';
        renderNotebooks();
    }
}

function renameNotebook(button) {
    const card = button.closest('.notebook-card');
    const notebookId = parseInt(card.dataset.id);
    const notebook = notebooks.find(n => n.id === notebookId);
    
    if (notebook) {
        const newName = prompt('Novo nome:', notebook.name);
        if (newName && newName.trim()) {
            notebook.name = newName.trim();
            renderNotebooks();
        }
    }
}

function deleteNotebook(button) {
    const card = button.closest('.notebook-card');
    const notebookId = parseInt(card.dataset.id);
    
    if (confirm('Deseja excluir este caderno?')) {
        notebooks = notebooks.filter(n => n.id !== notebookId);
        renderNotebooks();
    }
}

function renderNotebooks() {
    const container = document.querySelector('.notebooks-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    notebooks.forEach(notebook => {
        const correctPercent = notebook.questions > 0 ? Math.round((notebook.correct / notebook.questions) * 100) : 0;
        const incorrectPercent = notebook.questions > 0 ? Math.round((notebook.incorrect / notebook.questions) * 100) : 0;
        const unansweredPercent = notebook.questions > 0 ? Math.round((notebook.unanswered / notebook.questions) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'notebook-card';
        card.dataset.id = notebook.id;
        card.innerHTML = `
            <div class="notebook-header">
                <h4>${notebook.name}</h4>
                <div class="notebook-actions">
                    <button onclick="toggleStar(this)" title="Favoritar">${notebook.starred ? '⭐' : '☆'}</button>
                    <button onclick="renameNotebook(this)" title="Renomear">✏️</button>
                    <button onclick="deleteNotebook(this)" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="notebook-stats">
                <p>${notebook.questions} questões • Criado em ${notebook.created}</p>
                <div class="progress-bar-container">
                    <div class="progress-bar-correct" style="width: ${correctPercent}%;"></div>
                    <div class="progress-bar-incorrect" style="width: ${incorrectPercent}%;"></div>
                    <div class="progress-bar-unanswered" style="width: ${unansweredPercent}%;"></div>
                </div>
                <p><span style="color: #4CAF50;">${correctPercent}% corretas</span> • <span style="color: #f44336;">${incorrectPercent}% incorretas</span> • <span style="color: #999;">${unansweredPercent}% não feitas</span></p>
            </div>
            <button class="view-notebook-btn">VER CADERNO</button>
        `;
        
        container.appendChild(card);
    });
}

// Busca
function searchQuestions() {
    const query = document.getElementById('searchInput').value;
    const results = document.querySelector('.search-results');
    
    if (query.trim()) {
        results.innerHTML = `<p>Buscando por: "${query}"...</p><p>Esta funcionalidade seria implementada para buscar questões no banco de dados.</p>`;
    } else {
        results.innerHTML = '<p>Digite algo para buscar questões...</p>';
    }
}

// Chat
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatBox = document.getElementById('chatBox');
    
    // Adicionar mensagem do usuário
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = message;
    chatBox.appendChild(userMessage);
    
    // Limpar input
    input.value = '';
    
    // Simular resposta da IA
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        botMessage.textContent = 'Esta é uma resposta simulada da IA. Em uma implementação real, aqui seria integrada uma IA de estudos.';
        chatBox.appendChild(botMessage);
        
        // Scroll para baixo
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
    
    // Scroll para baixo
    chatBox.scrollTop = chatBox.scrollHeight;
}



// Funções para o novo filtro de data unificado
function openDatePicker(chartType) {
    const picker = document.getElementById(`${chartType}DatePicker`);
    if (picker) {
        picker.style.display = 'block';
    }
}

function closeDatePicker(chartType) {
    const picker = document.getElementById(`${chartType}DatePicker`);
    if (picker) {
        picker.style.display = 'none';
    }
}

function applyDateRange(chartType) {
    const startDate = document.getElementById(`${chartType}StartDate`).value;
    const endDate = document.getElementById(`${chartType}EndDate`).value;
    const rangeInput = document.getElementById(`${chartType}DateRange`);
    
    if (startDate && endDate) {
        // Converter para formato brasileiro
        const startFormatted = formatDateToBR(startDate);
        const endFormatted = formatDateToBR(endDate);
        rangeInput.value = `${startFormatted} - ${endFormatted}`;
    } else if (startDate) {
        const startFormatted = formatDateToBR(startDate);
        rangeInput.value = startFormatted;
    } else {
        rangeInput.value = '';
    }
    
    closeDatePicker(chartType);
    updateCharts();
}

function formatDateToBR(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getDateRangeFromInput(chartType) {
    const rangeValue = document.getElementById(`${chartType}DateRange`).value;
    if (!rangeValue) return null;
    
    if (rangeValue.includes(' - ')) {
        const [start, end] = rangeValue.split(' - ');
        return {
            start: parseBRDate(start),
            end: parseBRDate(end)
        };
    } else {
        const date = parseBRDate(rangeValue);
        return {
            start: date,
            end: date
        };
    }
}

function parseBRDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

// Atualizar a função updateCharts para usar o novo filtro
function updateChartsWithDateFilter() {
    if (!questionsChart || !accuracyChart) return;
    
    // Obter matérias selecionadas
    const questionsMateria = document.getElementById('questionsMateria')?.value || 'todas';
    const accuracyMateria = document.getElementById('accuracyMateria')?.value || 'todas';
    
    // Obter períodos de data selecionados
    const questionsDateRange = getDateRangeFromInput('questions');
    const accuracyDateRange = getDateRangeFromInput('accuracy');
    
    // Atualizar gráfico de questões
    questionsChart.data.datasets[0].data = chartData.monthly.questionsData[questionsMateria];
    questionsChart.update();
    
    // Atualizar gráfico de acertos
    const avgAccuracy = chartData.monthly.accuracyData[accuracyMateria][chartData.monthly.accuracyData[accuracyMateria].length - 1];
    accuracyChart.data.datasets[0].data = [avgAccuracy, 100 - avgAccuracy];
    accuracyChart.update();
}

// Substituir a função updateCharts original
function updateCharts() {
    updateChartsWithDateFilter();
}

