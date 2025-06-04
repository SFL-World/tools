document.addEventListener('DOMContentLoaded', function() {
    // Load structure and initialize menu
    fetch('data/structure.json')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('docStructure', JSON.stringify(data));
            initializeMenu(data.sections);
            processHash();
        })
        .catch(error => {
            console.error('Error loading structure:', error);
            show404();
        });

    // Handle menu toggle for mobile
    document.querySelector('[data-bs-target="#sidebar"]').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('show');
    });

    // Handle hash changes
    window.addEventListener('hashchange', processHash);
});

// Update the menu toggle event listener
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('show');
    document.querySelector('.sidebar-overlay').classList.toggle('show');
});

// Close menu when clicking overlay
document.querySelector('.sidebar-overlay').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('show');
    this.classList.remove('show');
});

function initializeMenu(sections) {
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = '';

    sections.forEach(section => {
        const sectionItem = document.createElement('li');
        sectionItem.className = 'nav-item';

        const sectionLink = document.createElement('a');
        sectionLink.className = 'nav-link section-link';
        sectionLink.href = `#/${section.alias}/`;
        sectionLink.textContent = section.title;
        sectionLink.dataset.alias = section.alias;

        sectionItem.appendChild(sectionLink);

        if (section.items && section.items.length > 0) {
            const submenu = document.createElement('ul');
            submenu.className = 'nav flex-column ms-3 submenu';
            submenu.style.display = 'none';

            section.items.forEach(item => {
                const itemElement = document.createElement('li');
                itemElement.className = 'nav-item';

                const itemLink = document.createElement('a');
                itemLink.className = 'nav-link page-link';
                itemLink.href = `#/${section.alias}/${item.alias}/`;
                itemLink.textContent = item.title;
                itemLink.dataset.section = section.alias;
                itemLink.dataset.alias = item.alias;
                itemLink.dataset.content = item.content;
                itemLink.dataset.languages = JSON.stringify(item.languages || ['en']);

                itemElement.appendChild(itemLink);
                submenu.appendChild(itemElement);
            });

            sectionItem.appendChild(submenu);

            sectionLink.addEventListener('click', function(e) {
                e.preventDefault();
                const submenu = this.nextElementSibling;
                submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
            });
        }

        menuContainer.appendChild(sectionItem);
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('page-link') || e.target.classList.contains('section-link')) {
            e.preventDefault();
            window.location.hash = e.target.getAttribute('href');
        }
    });
}

function processHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        showHome();
        return;
    }

    const parts = hash.split('/').filter(part => part !== '');

    // Update breadcrumbs
    updateBreadcrumbs(parts);

    if (parts.length === 1) {
        // Section page (e.g. #/player-guides/)
        const sectionAlias = parts[0];
        const sectionLink = document.querySelector(`.section-link[data-alias="${sectionAlias}"]`);
        if (sectionLink) {
            // Show first page in section if exists
            const firstPageLink = sectionLink.nextElementSibling?.querySelector('.page-link');
            if (firstPageLink) {
                window.location.hash = firstPageLink.getAttribute('href');
                return;
            }
        }
        show404();
        return;
    }

    if (parts.length === 2 || parts.length === 3) {
        // Page with optional language (e.g. #/player-guides/faq/ or #/player-guides/faq/en/)
        const sectionAlias = parts[0];
        const pageAlias = parts[1];
        const lang = parts[2] || 'en';

        const pageLink = document.querySelector(`.page-link[data-section="${sectionAlias}"][data-alias="${pageAlias}"]`);
        if (pageLink) {
            const contentPath = pageLink.dataset.content.replace(/\.\w{2}(?=\.md$)/, `.${lang}`);
            loadPage(sectionAlias, pageAlias, contentPath, JSON.parse(pageLink.dataset.languages), lang);
            updateActivePage(pageLink);

            // Expand parent section
            const sectionLink = pageLink.closest('.submenu')?.previousElementSibling;
            if (sectionLink) {
                sectionLink.nextElementSibling.style.display = 'block';
            }
            return;
        }
    }

    show404();
}


function updateBreadcrumbs(parts) {
    const breadcrumbs = document.getElementById('breadcrumbs');
    breadcrumbs.innerHTML = '';

    if (parts.length === 0) return;

    // Section link
    const sectionItem = document.createElement('li');
    sectionItem.className = 'breadcrumb-item';

    const sectionLink = document.createElement('span');
    sectionLink.textContent = document.querySelector(`.section-link[data-alias="${parts[0]}"]`)?.textContent || parts[0];
    sectionItem.appendChild(sectionLink);
    breadcrumbs.appendChild(sectionItem);

    if (parts.length === 1) return;

    // Page link
    const pageItem = document.createElement('li');
    pageItem.className = 'breadcrumb-item active';
    pageItem.textContent = document.querySelector(`.page-link[data-alias="${parts[1]}"]`)?.textContent || parts[1];
    breadcrumbs.appendChild(pageItem);
}

function showHome() {
    fetch('content/index.md')
        .then(response => response.text())
        .then(content => {
            document.getElementById('content-area').innerHTML = marked.parse(content);
            document.getElementById('page-title').textContent = 'SFL Community Docs';
        })
        .catch(() => {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4>Page Not Found</h4>
                    <p>The requested page could not be loaded.</p>
                </div>
            `;
            document.getElementById('page-title').textContent = 'Error';
        });
}

function loadPage(sectionAlias, pageAlias, contentPath, languages, lang) {
    localStorage.setItem('preferredLang', lang);

    const pageLink = document.querySelector(`.page-link[data-section="${sectionAlias}"][data-alias="${pageAlias}"]`);
    if (pageLink) {
        document.getElementById('page-title').textContent = pageLink.textContent;
    }

    initializeLanguageMenu(sectionAlias, pageAlias, languages, lang);

    fetch(contentPath)
        .then(response => {
            if (!response.ok) throw new Error('Content not found');
            return response.text();
        })
        .then(content => {
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = contentPath.endsWith('.md') ?
                marked.parse(content) :
                content;
        })
        .catch(error => {
            console.error('Error loading page:', error);
            show404();
        });
}

function show404() {
    fetch('content/404.md')
        .then(response => response.text())
        .then(content => {
            document.getElementById('content-area').innerHTML = marked.parse(content);
            document.getElementById('page-title').textContent = 'Page Not Found';
        })
        .catch(() => {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4>Page Not Found</h4>
                    <p>The requested page could not be loaded.</p>
                </div>
            `;
            document.getElementById('page-title').textContent = 'Error';
        });
}

function updateActivePage(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

function initializeLanguageMenu(sectionAlias, pageAlias, languages, currentLang) {
    const languageDropdown = document.getElementById('language-dropdown');
    const languageMenu = document.getElementById('language-menu');

    if (languages.length <= 1) {
        languageDropdown.parentElement.style.display = 'none';
        return;
    }

    languageDropdown.parentElement.style.display = 'block';
    languageMenu.innerHTML = '';

    languages.forEach(lang => {
        const langItem = document.createElement('li');
        const langLink = document.createElement('a');
        langLink.className = 'dropdown-item';
        langLink.href = `#/${sectionAlias}/${pageAlias}/${lang}/`;
        langLink.textContent = getLanguageName(lang);
        langLink.dataset.lang = lang;
        langItem.appendChild(langLink);
        languageMenu.appendChild(langItem);
    });

    languageDropdown.textContent = getLanguageName(currentLang);
    const activeLink = languageMenu.querySelector(`[href="#/${sectionAlias}/${pageAlias}/${currentLang}/"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'ru': 'Русский',
        'es': 'Español',
        'id': 'Bahasa Indonesia',
        'zh': '中文'
    };
    return languages[code] || code;
}