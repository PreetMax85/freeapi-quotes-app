const CONFIG = {
    API_BASE_URL: 'https://api.freeapi.app/api/v1/public/quotes',
    LIMIT: 20
};

const state = {
    quotes: [],
    filteredQuotes: [],
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
    searchQuery: '',
    quoteOfTheDay: null
};

// DOM Elements
const quotesList = document.getElementById('quotes-list');
const qotdContainer = document.getElementById('qotd-container');
const qotdContent = document.getElementById('qotd-content');
const searchInput = document.getElementById('search-input');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreButton = document.getElementById('load-more-button');
const errorContainer = document.getElementById('error-container');
const retryButton = document.getElementById('retry-button');
const quoteTemplate = document.getElementById('quote-template');
const skeletonTemplate = document.getElementById('skeleton-template');

// Functions
async function fetchQuotes(page = 1, isLoadMore = false) {
    state.isLoading = true;
    state.error = null;
    
    if (!isLoadMore) {
        renderSkeletons();
        loadMoreContainer.classList.add('hidden');
    } else {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = 'Loading...';
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}?page=${page}&limit=${CONFIG.LIMIT}`);
        if (!response.ok) throw new Error('Failed to fetch quotes');
        
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data.data)) {
            throw new Error('Invalid data format received');
        }
        const newQuotes = json.data.data;
        state.totalPages = json.data.totalPages || 1;

        if (isLoadMore) {
            state.quotes = [...state.quotes, ...newQuotes];
        } else {
            state.quotes = newQuotes;
            // Set Quote of the Day if not set
            if (!state.quoteOfTheDay && state.quotes.length > 0) {
                state.quoteOfTheDay = state.quotes[Math.floor(Math.random() * state.quotes.length)];
            }
        }

        applyFilter();
    } catch (err) {
        console.error('Fetch error:', err);
        state.error = err.message;
        showError();
    } finally {
        state.isLoading = false;
        loadMoreButton.disabled = false;
        loadMoreButton.textContent = 'Load More';
    }
}

function applyFilter() {
    const query = state.searchQuery.toLowerCase();
    state.filteredQuotes = state.quotes.filter(q => 
        q.content.toLowerCase().includes(query) || 
        q.author.toLowerCase().includes(query)
    );
    render();
}

function renderSkeletons() {
    quotesList.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const clone = skeletonTemplate.content.cloneNode(true);
        quotesList.appendChild(clone);
    }
}

function createQuoteCard(quote, isQotd = false) {
    const clone = quoteTemplate.content.cloneNode(true);
    const card = clone.querySelector('.quote-card');
    const textEl = clone.querySelector('.quote-text');
    const authorEl = clone.querySelector('.author-name');
    const tagsContainer = clone.querySelector('.tags-container');
    const copyBtn = clone.querySelector('.copy-button');

    if (isQotd) {
        card.classList.add('bg-stone-50', 'border-stone-400'); // Subtle highlight for QOTD
        card.classList.remove('bg-white', 'border-l-[#222]');
        textEl.classList.add('md:text-3xl'); // Larger for QOTD
    }

    textEl.textContent = quote.content;
    authorEl.textContent = quote.author;

    if (Array.isArray(quote.tags)) {
        quote.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 font-medium uppercase tracking-wider';
            span.textContent = tag;
            tagsContainer.appendChild(span);
        });
    }

    copyBtn.addEventListener('click', async () => {
        try {
            const textToCopy = `"${quote.content}" — ${quote.author}`;
            await navigator.clipboard.writeText(textToCopy);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('text-black', 'border-black');
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('text-black', 'border-black');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    });

    return clone;
}

function render() {
    // Render QOTD
    if (state.quoteOfTheDay) {
        qotdContainer.classList.remove('hidden');
        qotdContent.innerHTML = '';
        qotdContent.appendChild(createQuoteCard(state.quoteOfTheDay, true));
    }

    // Render List
    quotesList.innerHTML = '';
    if (state.filteredQuotes.length === 0 && !state.isLoading) {
        quotesList.innerHTML = '<p class="text-center text-gray-400 py-12">No quotes found matching your search.</p>';
    } else {
        state.filteredQuotes.forEach(quote => {
            quotesList.appendChild(createQuoteCard(quote));
        });
    }

    // Load More visibility
    if (state.page < state.totalPages && state.searchQuery === '') {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }

    errorContainer.classList.add('hidden');
}

function showError() {
    quotesList.innerHTML = '';
    errorContainer.classList.remove('hidden');
    loadMoreContainer.classList.add('hidden');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyFilter();
});

loadMoreButton.addEventListener('click', () => {
    state.page++;
    fetchQuotes(state.page, true);
});

retryButton.addEventListener('click', () => {
    fetchQuotes(state.page);
});

// Init
fetchQuotes();
