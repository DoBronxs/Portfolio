// Менеджер портфолио
class PortfolioManager {
    constructor() {
        this.projects = [];
        this.isAdmin = false;
        this.currentEditId = null;
        this.init();
    }

    init() {
        console.log('🚀 Инициализация PortfolioManager...');
        
        // Загрузка данных
        this.loadData();
        
        // Настройка событий
        this.setupEventListeners();
        
        // Обновление интерфейса
        this.updateUI();
        
        console.log('✅ PortfolioManager инициализирован');
    }

    setupEventListeners() {
        // Тема
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Админ режим
        document.getElementById('adminToggle').addEventListener('click', () => this.toggleAdminMode());
        
        // Добавить проект
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            if (!this.isAdmin) {
                this.showToast('Включите режим администратора', 'warning');
                return;
            }
            this.openProjectModal();
        });
        
        // Сохранить проект
        document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());
        
        // Поиск
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchProjects(e.target.value));
        
        // Фильтрация
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterProjects(e.target.value));
        
        // Экспорт
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        
        // Очистить все
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());
        
        // Форма контактов
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendContactMessage();
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Ctrl + S - сохранить
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showToast('Данные сохранены', 'success');
            }
            
            // Ctrl + A - добавить проект (в режиме админа)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && this.isAdmin) {
                e.preventDefault();
                this.openProjectModal();
            }
        });
    }

    // ==================== ДАННЫЕ ====================

    loadData() {
        try {
            const data = localStorage.getItem('portfolio_projects');
            this.projects = data ? JSON.parse(data) : [];
            this.updateStats();
            this.renderProjects();
            this.updateTechCloud();
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.projects = [];
        }
    }

    saveData() {
        try {
            localStorage.setItem('portfolio_projects', JSON.stringify(this.projects));
            this.updateStats();
        } catch (error) {
            console.error('❌ Ошибка сохранения данных:', error);
            this.showToast('Ошибка сохранения данных', 'error');
        }
    }

    // ==================== ПРОЕКТЫ ====================

    openProjectModal(project = null) {
        this.currentEditId = project ? project.id : null;
        
        const modal = new bootstrap.Modal(document.getElementById('projectModal'));
        const form = document.getElementById('projectForm');
        
        if (project) {
            // Заполняем форму для редактирования
            document.getElementById('projectTitle').value = project.title;
            document.getElementById('projectCategory').value = project.category || 'web';
            document.getElementById('projectDescription').value = project.description;
            document.getElementById('projectTechnologies').value = project.technologies ? project.technologies.join(', ') : '';
            document.getElementById('projectGithub').value = project.github || '';
            document.getElementById('projectDemo').value = project.demo || '';
            document.getElementById('projectStatus').value = project.status || 'completed';
            
            document.querySelector('#projectModal .modal-title').textContent = 'Редактировать проект';
        } else {
            // Сбрасываем форму для нового проекта
            form.reset();
            document.querySelector('#projectModal .modal-title').textContent = 'Добавить проект';
        }
        
        modal.show();
    }

    saveProject() {
        const title = document.getElementById('projectTitle').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        
        if (!title || !description) {
            this.showToast('Заполните обязательные поля', 'warning');
            return;
        }

        const project = {
            id: this.currentEditId || Date.now(),
            title: title,
            description: description,
            category: document.getElementById('projectCategory').value,
            technologies: document.getElementById('projectTechnologies').value
                .split(',')
                .map(t => t.trim())
                .filter(t => t),
            github: document.getElementById('projectGithub').value.trim(),
            demo: document.getElementById('projectDemo').value.trim(),
            status: document.getElementById('projectStatus').value,
            date: new Date().toISOString(),
            createdAt: this.currentEditId 
                ? this.projects.find(p => p.id === this.currentEditId)?.createdAt || new Date().toISOString()
                : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditId) {
            // Обновление проекта
            const index = this.projects.findIndex(p => p.id === this.currentEditId);
            if (index !== -1) {
                this.projects[index] = project;
                this.showToast('Проект обновлен', 'success');
            }
        } else {
            // Добавление нового проекта
            this.projects.unshift(project);
            this.showToast('Проект добавлен', 'success');
        }

        this.saveData();
        this.renderProjects();
        this.updateTechCloud();
        
        // Закрываем модальное окно
        bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
        this.currentEditId = null;
    }

    renderProjects(filteredProjects = null) {
        const container = document.getElementById('projectsGrid');
        const projectsToRender = filteredProjects || this.projects;
        
        if (projectsToRender.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <h4>Проектов пока нет</h4>
                    <p class="text-muted">Добавьте первый проект</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projectsToRender.map(project => {
            const date = new Date(project.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const statusBadge = {
                'completed': 'success',
                'in-progress': 'warning',
                'planned': 'info'
            }[project.status] || 'secondary';
            
            const categoryIcon = {
                'web': 'fas fa-globe',
                'mobile': 'fas fa-mobile-alt',
                'desktop': 'fas fa-desktop',
                'iot': 'fas fa-microchip',
                'tools': 'fas fa-tools'
            }[project.category] || 'fas fa-code';
            
            return `
                <div class="col-md-6 col-lg-4 fade-in">
                    <div class="project-card h-100">
                        <div class="project-image">
                            <i class="${categoryIcon}"></i>
                        </div>
                        <div class="p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="mb-0">${project.title}</h5>
                                <span class="badge bg-${statusBadge}">${project.status === 'in-progress' ? 'В работе' : 
                                    project.status === 'completed' ? 'Завершен' : 'Планируется'}</span>
                            </div>
                            <p class="text-muted small mb-3">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                            
                            ${project.technologies && project.technologies.length > 0 ? `
                                <div class="mb-3">
                                    ${project.technologies.slice(0, 3).map(tech => `
                                        <span class="badge bg-light text-dark me-1 mb-1">${tech}</span>
                                    `).join('')}
                                    ${project.technologies.length > 3 ? `<span class="badge bg-secondary">+${project.technologies.length - 3}</span>` : ''}
                                </div>
                            ` : ''}
                            
                            <div class="d-flex justify-content-between align-items-center mt-auto">
                                <small class="text-muted">${date}</small>
                                <div>
                                    ${project.github ? `
                                        <a href="${project.github}" target="_blank" class="btn btn-sm btn-outline-primary me-1" title="GitHub">
                                            <i class="fab fa-github"></i>
                                        </a>
                                    ` : ''}
                                    ${project.demo ? `
                                        <a href="${project.demo}" target="_blank" class="btn btn-sm btn-outline-primary me-1" title="Демо">
                                            <i class="fas fa-external-link-alt"></i>
                                        </a>
                                    ` : ''}
                                    ${this.isAdmin ? `
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="portfolio.editProject(${project.id})" title="Редактировать">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="portfolio.deleteProject(${project.id})" title="Удалить">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchProjects(query) {
        if (!query.trim()) {
            this.renderProjects();
            return;
        }
        
        const filtered = this.projects.filter(project => 
            project.title.toLowerCase().includes(query.toLowerCase()) ||
            project.description.toLowerCase().includes(query.toLowerCase()) ||
            (project.technologies && project.technologies.some(tech => 
                tech.toLowerCase().includes(query.toLowerCase())
            ))
        );
        
        this.renderProjects(filtered);
    }

    filterProjects(category) {
        if (!category) {
            this.renderProjects();
            return;
        }
        
        const filtered = this.projects.filter(project => project.category === category);
        this.renderProjects(filtered);
    }

    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            this.openProjectModal(project);
        }
    }

    deleteProject(id) {
        if (!confirm('Удалить этот проект?')) return;
        
        this.projects = this.projects.filter(p => p.id !== id);
        this.saveData();
        this.renderProjects();
        this.updateTechCloud();
        this.showToast('Проект удален', 'success');
    }

    // ==================== ТЕХНОЛОГИИ ====================

    updateTechCloud() {
        const container = document.getElementById('techCloud');
        
        // Собираем частоту технологий
        const techFrequency = {};
        this.projects.forEach(project => {
            if (project.technologies) {
                project.technologies.forEach(tech => {
                    techFrequency[tech] = (techFrequency[tech] || 0) + 1;
                });
            }
        });
        
        // Сортируем по частоте
        const sortedTech = Object.entries(techFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        if (sortedTech.length === 0) {
            container.innerHTML = '<span class="text-muted">Технологии не добавлены</span>';
            return;
        }
        
        const maxFreq = Math.max(...sortedTech.map(t => t[1]));
        
        container.innerHTML = sortedTech.map(([tech, freq]) => {
            const size = 0.8 + (freq / maxFreq) * 1.2;
            return `<span class="badge bg-light text-dark" style="font-size: ${size}rem">${tech}</span>`;
        }).join('');
    }

    // ==================== СТАТИСТИКА ====================

    updateStats() {
        // Общее количество проектов
        document.getElementById('totalProjects').textContent = this.projects.length;
        document.getElementById('projectsCount').textContent = this.projects.length;
        
        // Количество уникальных технологий
        const techSet = new Set();
        this.projects.forEach(project => {
            if (project.technologies) {
                project.technologies.forEach(tech => techSet.add(tech));
            }
        });
        document.getElementById('totalTech').textContent = techSet.size;
        document.getElementById('techCount').textContent = techSet.size;
        
        // Активные проекты
        const activeProjects = this.projects.filter(p => p.status === 'in-progress').length;
        document.getElementById('activeProjects').textContent = activeProjects;
    }

    updateUI() {
        // Текущий год
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Тема
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        this.updateThemeIcon(theme);
    }

    // ==================== ТЕМА ====================

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // ==================== АДМИН РЕЖИМ ====================

    toggleAdminMode() {
        this.isAdmin = !this.isAdmin;
        const button = document.getElementById('adminToggle');
        
        if (this.isAdmin) {
            button.classList.remove('btn-primary');
            button.classList.add('btn-danger');
            button.innerHTML = '<i class="fas fa-user-shield"></i> Админ';
            this.showToast('Режим администратора включен', 'success');
        } else {
            button.classList.remove('btn-danger');
            button.classList.add('btn-primary');
            button.innerHTML = '<i class="fas fa-user-cog"></i> Админ';
            this.showToast('Режим администратора выключен', 'info');
        }
        
        this.renderProjects();
    }

    // ==================== ЭКСПОРТ/ИМПОРТ ====================

    exportData() {
        const data = {
            projects: this.projects,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Данные экспортированы', 'success');
    }

    clearAllData() {
        if (!confirm('ВНИМАНИЕ! Это удалит все проекты. Продолжить?')) return;
        
        this.projects = [];
        this.saveData();
        this.renderProjects();
        this.updateTechCloud();
        this.showToast('Все данные очищены', 'success');
    }

    // ==================== УТИЛИТЫ ====================

    sendContactMessage() {
        this.showToast('Сообщение отправлено!', 'success');
        document.getElementById('contactForm').reset();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        const icon = type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-circle' : 
                     type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        // Удаляем после скрытия
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Инициализация приложения
const portfolio = new PortfolioManager();
window.portfolio = portfolio;

// Добавляем стили для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease;
    }
    
    .project-card {
        transition: all 0.3s ease !important;
    }
    
    .project-card:hover {
        transform: translateY(-5px) !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
        border-color: var(--color-red) !important;
    }
`;
document.head.appendChild(style);

// Показываем приветственное сообщение
window.addEventListener('load', () => {
    setTimeout(() => {
        portfolio.showToast('Добро пожаловать! Нажмите на "Админ" для управления проектами', 'info');
    }, 1000);
});