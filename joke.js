// State management
let currentJoke = null;
let jokeCount = 0;
let selectedCategory = 'any';
let favorites = JSON.parse(localStorage.getItem('favoriteJokes')) || [];

// API Configuration
const API_URL = 'https://v2.jokeapi.dev/joke/';

// DOM Elements
const jokeBox = document.getElementById('jokeBox');
const errorBox = document.getElementById('errorBox');
const counterEl = document.getElementById('counter');
const favoriteList = document.getElementById('favoriteList');
const categoryBtns = document.querySelectorAll('.category-btn');
const newJokeBtn = document.getElementById('newJokeBtn');
const favoriteBtn = document.getElementById('favoriteBtn');

// Update counter display
function updateCounter() {
    counterEl.textContent = jokeCount;
}

// Category selection
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.category;
        getNewJoke();
    });
});

// Get joke from API
async function getNewJoke() {
    showLoading();
    clearError();

    try {
        // Map category names to API format
        const categoryMap = {
            'any': 'Any',
            'general': 'General',
            'programming': 'Programming',
            'knock-knock': 'Knock-Knock'
        };

        const category = categoryMap[selectedCategory] || 'Any';
        const url = `${API_URL}${category}?type=single,twopart`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.message || 'Failed to fetch joke');
        }

        currentJoke = data;
        jokeCount++;
        updateCounter();
        displayJoke(data);

    } catch (error) {
        console.error('Error:', error);
        showError(`Oops! ${error.message}. Please try again.`);
        jokeBox.innerHTML = '<div class="joke-content">😔 Unable to load joke. Please try again!</div>';
    }
}

// Display joke
function displayJoke(joke) {
    let jokeHTML;

    if (joke.type === 'single') {
        jokeHTML = `<div class="joke-content single-joke">${escapeHtml(joke.joke)}</div>`;
    } else if (joke.type === 'twopart') {
        jokeHTML = `
            <div class="joke-content">
                <div class="joke-setup">${escapeHtml(joke.setup)}</div>
                <div class="joke-punchline">${escapeHtml(joke.delivery)}</div>
            </div>
        `;
    }

    jokeBox.innerHTML = jokeHTML;
    updateFavoriteButton();
}

// Show loading state
function showLoading() {
    jokeBox.innerHTML = '<div class="loading"></div>';
    newJokeBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
    newJokeBtn.disabled = false;
}

// Show error message
function showError(message) {
    errorBox.innerHTML = `<div class="error">${message}</div>`;
}

// Clear error message
function clearError() {
    errorBox.innerHTML = '';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Convert joke object to string
function jokeToString(joke) {
    if (joke.type === 'single') {
        return joke.joke;
    } else if (joke.type === 'twopart') {
        return `${joke.setup}\n${joke.delivery}`;
    }
    return '';
}

// Add to favorites
function addToFavorites() {
    if (!currentJoke) {
        showError('Please load a joke first!');
        return;
    }

    const jokeString = jokeToString(currentJoke);
    const isFavorited = favorites.some(fav => fav.joke === jokeString);

    if (isFavorited) {
        favorites = favorites.filter(fav => fav.joke !== jokeString);
        showError('❌ Removed from favorites');
    } else {
        favorites.push({
            joke: jokeString,
            category: currentJoke.category,
            timestamp: new Date().toLocaleString()
        });
        showError('✅ Added to favorites!');
    }

    localStorage.setItem('favoriteJokes', JSON.stringify(favorites));
    updateFavoriteButton();
    displayFavorites();
}

// Update favorite button state
function updateFavoriteButton() {
    if (!currentJoke) return;

    const jokeString = jokeToString(currentJoke);
    const isFavorited = favorites.some(fav => fav.joke === jokeString);

    if (isFavorited) {
        favoriteBtn.style.background = '#ff6b6b';
        favoriteBtn.style.color = 'white';
    } else {
        favoriteBtn.style.background = 'white';
        favoriteBtn.style.color = '#667eea';
        favoriteBtn.style.border = '2px solid #667eea';
    }
}

// Display favorites
function displayFavorites() {
    if (favorites.length === 0) {
        favoriteList.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">No favorites yet</div>';
        return;
    }

    favoriteList.innerHTML = favorites.map((fav, idx) => `
        <div class="favorite-item">
            <span>${fav.joke.substring(0, 50)}...</span>
            <button class="btn-secondary" onclick="removeFavorite(${idx})">✕</button>
        </div>
    `).join('');
}

// Remove favorite
function removeFavorite(idx) {
    favorites.splice(idx, 1);
    localStorage.setItem('favoriteJokes', JSON.stringify(favorites));
    displayFavorites();
    updateFavoriteButton();
}

// Share joke
function shareJoke() {
    if (!currentJoke) {
        showError('Please load a joke first!');
        return;
    }

    const jokeText = jokeToString(currentJoke);

    if (navigator.share) {
        navigator.share({
            title: '😂 Check out this joke!',
            text: jokeText
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(jokeText).then(() => {
            showError('✅ Joke copied to clipboard!');
        }).catch(err => {
            showError('Unable to share. Please try again.');
            console.error('Error copying to clipboard:', err);
        });
    }
}

// Load initial joke on page load
document.addEventListener('DOMContentLoaded', () => {
    displayFavorites();
    updateCounter();
    getNewJoke();
});

// Keyboard shortcut for new joke (spacebar)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        getNewJoke();
    }
});
