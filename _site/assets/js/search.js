console.log('Search script is running!');

document.addEventListener('DOMContentLoaded', async function () {
    let searchData = [];
    try {
        const response = await fetch('/assets/js/search_index.json');
        if (!response.ok) throw new Error('Failed to fetch JSON');
        searchData = await response.json();
    } catch (error) {
        console.error('Error loading search data:', error);
        return;
    }

    const searchIndex = lunr(function () {
        this.ref('url');
        this.field('title');
        this.field('content');

        searchData.forEach((doc) => {
            this.add(doc);
        });
    });

    const searchInput = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');

    function performSearch() {
        const query = searchInput.value.trim();
        searchResults.innerHTML = '';

        if (!query) {
            searchResults.innerHTML = '<p>Please enter a search term.</p>';
            return;
        }

        const results = searchIndex.search(query);

        if (results.length > 0) {
            results.forEach(result => {
                const doc = searchData.find(p => p.url === result.ref);
                const resultItem = document.createElement('div');
                resultItem.innerHTML = `<a href="${doc.url}"><strong>${doc.title}</strong></a>`;
                searchResults.appendChild(resultItem);
            });
        } else {
            searchResults.innerHTML = '<p>No results found.</p>';
        }
    }

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') performSearch();
        });
    }
});
