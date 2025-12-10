// Espera todo o HTML carregar antes de executar qualquer lógica
document.addEventListener('DOMContentLoaded', () => {

    // --- VERIFICAÇÃO DE PÁGINA ---
    // Verifica se estamos na página de login (existe o elemento login-box?)
    const isLoginPage = document.getElementById('login-box') !== null;

    // Verifica se estamos na página de dashboard (existe o investments-grid?)
    const isDashboardPage = document.getElementById('investments-grid') !== null;
    
    // --- SISTEMA DE SESSÃO E BANCO DE DADOS ---
    // Recupera o usuário logado (fica guardado no localStorage)
    const sessionUser = JSON.parse(localStorage.getItem('investSession'));
    
    // Recupera todos os usuários cadastrados no sistema
    const usersDB = JSON.parse(localStorage.getItem('investUsersDB')) || [];

    // Recupera todos os investimentos salvos
    let investments = JSON.parse(localStorage.getItem('investmentsData')) || [];

    // =================================================================
    // 🔒 1. SEGURANÇA (AUTH GUARD)
    // =================================================================

    // Se a pessoa tentar entrar no dashboard sem estar logada → redireciona para login
    if (isDashboardPage && !sessionUser) {
        alert("Acesso negado! Faça login primeiro.");
        window.location.href = 'login.html';
        return; // Impede que o código continue
    }

    // Se tentar acessar o login já estando logado → manda para dashboard
    if (isLoginPage && sessionUser) {
        window.location.href = 'index.html';
        return;
    }

    // =================================================================
    // 🔑 2. LÓGICA DE LOGIN E CADASTRO (login.html)
    // =================================================================

    // Lógica só roda se estiver na tela de login
    if (isLoginPage) {

        const loginBox = document.getElementById('login-box');
        const registerBox = document.getElementById('register-box');

        // Alterna da tela de login → tela de cadastro
        document.getElementById('link-to-register').addEventListener('click', (e) => {
            e.preventDefault(); // impede que o link recarregue a página
            loginBox.classList.add('hidden');
            registerBox.classList.remove('hidden');
        });

        // Alterna da tela de cadastro → tela de login
        document.getElementById('link-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });

        // --- PROCESSAR CADASTRO REAL ---
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault(); // evita recarregar a página
            
            // Pega dados digitados
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-pass').value;
            const confirm = document.getElementById('reg-pass-confirm').value;

            // Verifica se senha = confirmar senha
            if (pass !== confirm) {
                alert("As senhas não coincidem!");
                return;
            }

            // Verifica se o e-mail já existe no banco
            const userExists = usersDB.find(u => u.email === email);
            if (userExists) {
                alert("Erro: Este e-mail já está cadastrado.");
                return;
            }

            // Adiciona novo usuário ao array
            usersDB.push({ name: name, email: email, password: pass });

            // Salva no localStorage
            localStorage.setItem('investUsersDB', JSON.stringify(usersDB));

            alert("Cadastro realizado com sucesso! Faça login.");

            // Volta para o login
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');

            // Limpa formulário
            document.getElementById('register-form').reset();
        });

        // --- PROCESSAR LOGIN REAL ---
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;

            // Procura um usuário que tenha o e-mail e senha certos
            const validUser = usersDB.find(u => u.email === email && u.password === pass);

            if (validUser) {
                // Criar sessão do usuário
                localStorage.setItem('investSession', JSON.stringify({
                    name: validUser.name,
                    email: validUser.email
                }));

                // Vai para o dashboard
                window.location.href = 'index.html';

            } else {
                alert("E-mail ou senha incorretos! Verifique ou cadastre-se.");
            }
        });
    }

    // =================================================================
    // 📈 3. LÓGICA DO DASHBOARD (index.html)
    // =================================================================

    if (isDashboardPage) {

        // Mostra o nome do usuário logado no topo da página
        document.getElementById('user-display-name').textContent = sessionUser.name;

        // Botão de logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            if(confirm("Deseja sair do sistema?")) {
                localStorage.removeItem('investSession'); // remove sessão
                window.location.href = 'login.html';
            }
        });

        // --- CRUD DE INVESTIMENTOS ---
        const grid = document.getElementById('investments-grid');
        const modal = document.getElementById('modal-overlay');
        const form = document.getElementById('investment-form');

        // Função que formata números como dinheiro
        const formatMoney = (val) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
            .format(val);

        // Formata datas para padrão brasileiro
        const formatDate = (date) =>
            new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        // Salva investimentos no localStorage
        const saveInvestments = () =>
            localStorage.setItem('investmentsData', JSON.stringify(investments));

        // Renderiza todos os cartões de investimentos na tela
        function renderCards() {

            grid.innerHTML = ''; // limpa tela

            if (investments.length === 0) {
                // Mensagem quando não existe nenhum investimento
                grid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1; color:#888;">Nenhum investimento cadastrado.</p>';
                return;
            }

            investments.forEach(inv => {

                // Calcula lucro estimado
                const profit = inv.amount * (inv.returnRate / 100);

                // Cria o card
                const card = document.createElement('div');
                card.className = 'card';
                
                // Define cor da borda baseado no tipo
                let borderCol = '#667eea';
                if(inv.type === 'Ações') borderCol = '#ef4444';
                if(inv.type === 'Renda Fixa') borderCol = '#10b981';
                
                card.style.borderTopColor = borderCol;

                // Conteúdo HTML do card
                card.innerHTML = `
                    <div class="card-header">
                        <span class="card-title">${inv.name}</span>
                        <span class="card-badge">${inv.type}</span>
                    </div>

                    <div class="card-content">
                        <div class="card-row"><span class="card-label">Valor:</span> <span class="card-value val-money">${formatMoney(inv.amount)}</span></div>
                        <div class="card-row"><span class="card-label">Retorno:</span> <span class="card-value">${inv.returnRate}%</span></div>
                        <div class="card-row"><span class="card-label">Lucro Est.:</span> <span class="card-value val-profit">+ ${formatMoney(profit)}</span></div>
                        <div class="card-row"><span class="card-label">Vencimento:</span> <span class="card-value">${formatDate(inv.expDate)}</span></div>
                    </div>

                    <div class="card-actions">
                        <button class="btn-sm btn-edit" onclick="editInv(${inv.id})">Editar</button>
                        <button class="btn-sm btn-del" onclick="deleteInv(${inv.id})">Excluir</button>
                    </div>
                `;

                grid.appendChild(card);
            });
        }

        // Abrir modal
        document.getElementById('btn-open-modal').addEventListener('click', () => {
            form.reset(); // limpa formulário
            document.getElementById('inv-id').value = ''; // indica novo cadastro
            document.getElementById('modal-title').textContent = 'Novo Aporte';
            modal.classList.remove('hidden'); // mostra modal
        });

        // Fecha modal
        const closeModal = () => modal.classList.add('hidden');
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel').addEventListener('click', closeModal);

        // Submeter formulário (criar ou editar investimento)
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Pega ID (se existir → edição, se não → novo)
            const id = document.getElementById('inv-id').value;

            // Cria objeto com os dados do formulário
            const data = {
                id: id ? parseInt(id) : Date.now(), // se não tiver id gera um novo
                name: document.getElementById('inv-name').value,
                type: document.getElementById('inv-type').value,
                amount: parseFloat(document.getElementById('inv-amount').value),
                date: document.getElementById('inv-date').value,
                returnRate: parseFloat(document.getElementById('inv-return').value),
                expDate: document.getElementById('inv-expected-date').value,
                notes: document.getElementById('inv-notes').value
            };

            // EDITAR
            if(id) {
                const index = investments.findIndex(i => i.id == id);
                investments[index] = data;

            // NOVO
            } else {
                investments.push(data);
            }

            // Salva no localStorage
            saveInvestments();

            // Atualiza tela
            renderCards();

            // Fecha modal
            closeModal();
        });

        // Função global para deletar (precisa ser global por causa do onclick="")
        window.deleteInv = (id) => {
            if(confirm('Excluir investimento?')) {
                investments = investments.filter(i => i.id !== id);
                saveInvestments();
                renderCards();
            }
        };

        // Função global para editar investimento
        window.editInv = (id) => {
            const item = investments.find(i => i.id === id);

            if(item) {
                // Preenche inputs com os dados existentes
                document.getElementById('inv-id').value = item.id;
                document.getElementById('inv-name').value = item.name;
                document.getElementById('inv-type').value = item.type;
                document.getElementById('inv-amount').value = item.amount;
                document.getElementById('inv-date').value = item.date;
                document.getElementById('inv-return').value = item.returnRate;
                document.getElementById('inv-expected-date').value = item.expDate;
                document.getElementById('inv-notes').value = item.notes;

                // Muda título
                document.getElementById('modal-title').textContent = 'Editar Investimento';

                // Abre modal
                modal.classList.remove('hidden');
            }
        };

        // Renderiza os cards ao entrar na página
        renderCards();
    }
});
