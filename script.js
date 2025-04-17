document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration & IDs ---
    const apiKey = '48ca8b97';
    const apiUrlBase = 'https://www.omdbapi.com/';
    const heroMovieIDs = ["tt10872600", "tt1160419", "tt9419884", "tt1877830", "tt7286456", "tt1375666"];
    const trendingMovieIDs = ["tt9419884", "tt10872600", "tt1160419", "tt7286456", "tt1877830"];
    const popularMovieIDs = ["tt0111161", "tt0068646", "tt0468569", "tt0109830", "tt0137523", "tt1375666", "tt0110912", "tt0088763", "tt0120737", "tt0108052"];
    const moodMap = { /* ... moodMap ... */ };

    // --- DOM Elements ---
    const modalOverlay = document.getElementById('movieDetailModal');
    if (!modalOverlay) {
        console.error("CRITICAL: Modal overlay element (#movieDetailModal) not found!");
        // Cannot proceed without the modal structure
        return;
    }
    // ... other elements ...
    const heroCarouselWrapper = document.getElementById('heroCarouselWrapper');
    const searchInput = document.getElementById('searchInput');
    const searchResultsSection = document.getElementById('searchResultsSection');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    const searchLoading = document.getElementById('searchLoadingIndicator');
    const searchError = document.getElementById('searchErrorIndicator');
    const trendingGrid = document.getElementById('trendingGrid');
    const trendingLoading = document.getElementById('trendingLoadingIndicator');
    const trendingError = document.getElementById('trendingErrorIndicator');
    const popularGrid = document.getElementById('popularGrid');
    const popularLoading = document.getElementById('popularLoadingIndicator');
    const popularError = document.getElementById('popularErrorIndicator');
    const moodDropdown = document.getElementById('moodDropdown');
    const moodSection = document.getElementById('moodSection');
    const moodGrid = document.getElementById('moodGrid');
    const moodResultsTitle = document.getElementById('moodResultsTitle');
    const moodLoading = document.getElementById('moodLoadingIndicator');
    const moodError = document.getElementById('moodErrorIndicator');
    const modalContent = modalOverlay.querySelector('.modal-content');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalPosterImg = document.getElementById('modalPosterImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPlotText = document.getElementById('modalPlotText');
    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    const modalLoadingIndicator = document.getElementById('modalLoading');
    const modalErrorIndicator = document.getElementById('modalError');


    // --- Helper Function to Create Movie Card ---
    function createMovieCard(movie) {
        const title = movie.Title && movie.Title !== 'N/A' ? movie.Title : 'Title Unavailable';
        const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://via.placeholder.com/200x300/1f1f1f/888888?text=No+Poster';
        const year = movie.Year && movie.Year !== 'N/A' ? movie.Year : '';
        const imdbID = movie.imdbID;
        const rating = (movie.imdbRating && movie.imdbRating !== 'N/A') ? movie.imdbRating : '';

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img src="${posterUrl}" alt="${title} Poster" loading="lazy">
            <div class="movie-card-content">
                <h3>${title}</h3>
                <p>${year}</p>
                ${rating ? `<div class="rating">⭐ ${rating}</div>` : '<div class="rating"></div>'}
            </div>
        `;

        if (imdbID) {
            movieCard.dataset.imdbId = imdbID;
            movieCard.style.cursor = 'pointer';
            movieCard.addEventListener('click', function() {
                const clickedId = this.dataset.imdbId;
                // console.log(`[DEBUG] Event Listener Fired - ID: ${clickedId}`);
                handleMovieCardClick(clickedId);
            });
        }
        return movieCard;
    }

    // --- Helper Function to Fetch Single Movie Details by ID ---
    async function fetchMovieDetails(id) {
         const url = `${apiUrlBase}?apikey=${apiKey}&i=${id}&plot=full`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Network Error: ${response.statusText}`);
            const data = await response.json();
            if (data.Response === "True") {
                return data;
            } else {
                throw new Error(data.Error || `OMDb API Error for ID ${id}`);
            }
        } catch (error) {
             console.error(`Fetch error for ID ${id}:`, error);
             throw error;
        }
    }

    // --- Function to Populate Modal Content ---
    function populateModal(movieData) {
        // Ensure modal elements are selected correctly
        const mPoster = document.getElementById('modalPosterImg');
        const mTitle = document.getElementById('modalTitle');
        const mYear = document.getElementById('modalYear');
        const mRated = document.getElementById('modalRated');
        const mRuntime = document.getElementById('modalRuntime');
        const mGenre = document.getElementById('modalGenreText');
        const mPlot = document.getElementById('modalPlotText');
        const mDirector = document.getElementById('modalDirector');
        const mWriter = document.getElementById('modalWriter');
        const mActors = document.getElementById('modalActors');
        const mRating = document.getElementById('modalRating');
        const mBoxOffice = document.getElementById('modalBoxOffice');
        const mDownloadBtn = document.getElementById('modalDownloadBtn');

        if(mPoster) {
            mPoster.src = (movieData.Poster && movieData.Poster !== 'N/A') ? movieData.Poster : 'https://via.placeholder.com/300x450/1f1f1f/888888?text=No+Poster';
            mPoster.alt = `${movieData.Title || 'Movie'} Poster`;
        }
        if(mTitle) mTitle.textContent = movieData.Title || 'N/A';
        if(mYear) mYear.textContent = movieData.Year || 'N/A';
        if(mRated) mRated.textContent = movieData.Rated || 'N/A';
        if(mRuntime) mRuntime.textContent = movieData.Runtime || 'N/A';
        if(mGenre) mGenre.textContent = movieData.Genre || 'N/A';
        if(mPlot) mPlot.textContent = movieData.Plot || 'N/A';
        if(mDirector) mDirector.textContent = movieData.Director || 'N/A';
        if(mWriter) mWriter.textContent = movieData.Writer || 'N/A';
        if(mActors) mActors.textContent = movieData.Actors || 'N/A';
        if(mRating) mRating.textContent = movieData.imdbRating && movieData.imdbRating !== 'N/A' ? `⭐ ${movieData.imdbRating}/10` : 'N/A';
        if(mBoxOffice) mBoxOffice.textContent = movieData.BoxOffice || 'N/A';
        if(mDownloadBtn) mDownloadBtn.dataset.imdbId = movieData.imdbID;
    }

     // --- Function to Handle Movie Card Click (FORCE VISIBILITY TEST) ---
     async function handleMovieCardClick(imdbID) {
        console.log("[TEST] handleMovieCardClick called with ID:", imdbID);

        if (!modalOverlay || !modalLoadingIndicator || !modalErrorIndicator || !modalTitle || !modalPlotText) {
            console.error("[TEST] One or more essential modal elements missing!");
            return;
        }
        if (!imdbID) {
             console.error("[TEST] handleMovieCardClick called without imdbID!");
             return;
        }

        // Reset state
        modalLoadingIndicator.style.display = 'block';
        modalErrorIndicator.style.display = 'none';
        modalTitle.textContent = 'Loading...';
        modalPlotText.textContent = '';
        // Ensure previous errors are cleared
        modalErrorIndicator.textContent = '';

        // ***** FORCE VISIBILITY USING INLINE STYLES *****
        console.log("[TEST] Forcing modal visibility with inline styles...");
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        modalOverlay.style.display = 'flex'; // Use flex as per original CSS
        modalOverlay.style.zIndex = '9999'; // Force high z-index
        console.log("[TEST] Inline styles applied. Check screen and Elements tab.");
        // ***** END FORCE VISIBILITY TEST *****

        // Remove the class method for now
        // modalOverlay.classList.add('open');

        try {
            const movieDetails = await fetchMovieDetails(imdbID);
            populateModal(movieDetails); // Populate *after* making it visible
        } catch (error) {
            console.error("[TEST] Error fetching/populating modal:", error);
            modalErrorIndicator.textContent = `Could not load details: ${error.message}`;
            modalErrorIndicator.style.display = 'block';
        } finally {
            modalLoadingIndicator.style.display = 'none';
        }
    }

     // --- Function to Close Modal (FORCE HIDE TEST) ---
     function closeModal() {
        if (!modalOverlay) return;
        // Force hide using inline styles
        console.log("[TEST] Forcing modal hide with inline styles...");
        modalOverlay.style.opacity = '0';
        modalOverlay.style.visibility = 'hidden';
        // Optionally reset display after transition time, or rely on opacity/visibility
         setTimeout(() => {
            if (modalOverlay.style.opacity === '0') { // Check if it's still hidden
                 modalOverlay.style.display = 'none';
            }
         }, 400); // Match approx transition time from CSS

        // Remove the class method for now
        // modalOverlay.classList.remove('open');
     }


    // --- Function to Populate Hero Carousel ---
    async function populateHeroCarousel(movieIDs) {
         // ... (Keep existing Swiper population logic) ...
         if (!heroCarouselWrapper) return;
        heroCarouselWrapper.innerHTML = ''; // Clear placeholder

        let slidesHTML = '';
        let swiperInstance = null;

        try {
            const moviePromises = movieIDs.map(id => fetchMovieDetails(id));
            const movieResults = await Promise.all(moviePromises);
            const validMovies = movieResults.filter(movie => movie !== null);

            if (validMovies.length === 0) {
                 heroCarouselWrapper.innerHTML = `<div class="swiper-slide hero-slide" style="background-color: #222;"><div class="hero-overlay"></div><div class="container hero-content"><h1>Welcome</h1><p>No featured movies available.</p></div></div>`;
            } else {
                 validMovies.forEach(movie => {
                    const title = movie.Title || 'Featured Movie';
                    let bgImage = 'none';
                    let bgColor = '#252525';
                    if (movie.Poster && movie.Poster !== 'N/A' && movie.Poster.startsWith('http')) {
                        bgImage = `url('${movie.Poster}')`;
                        bgColor = 'transparent';
                    }
                    const plotText = movie.Plot || 'Discover this exciting movie!';
                    const displayPlot = plotText.length > 150 ? plotText.substring(0, 150) + '...' : plotText;

                    slidesHTML += `
                        <div class="swiper-slide hero-slide" style="background-image: ${bgImage}; background-color: ${bgColor};">
                            <div class="hero-overlay"></div>
                             <div class="container hero-content">
                                <h1>${title}</h1>
                                <p>${displayPlot}</p>
                            </div>
                        </div>
                    `;
                });
                 heroCarouselWrapper.innerHTML = slidesHTML; // Add slides to DOM
            }

             // Initialize Swiper AFTER slides are potentially added
             swiperInstance = new Swiper('.hero-swiper', {
                loop: validMovies.length > 1, // Only loop if more than 1 slide
                autoplay: { delay: 5500, disableOnInteraction: false },
                effect: 'fade',
                fadeEffect: { crossFade: true },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                observer: true,
                observeParents: true,
             });

        } catch (error) {
             console.error("Error populating hero carousel:", error);
             heroCarouselWrapper.innerHTML = `<div class="swiper-slide hero-slide" style="background-color: #333;"><div class="hero-overlay"></div><div class="container hero-content"><h1>Error</h1><p>Could not load featured movies.</p></div></div>`;
        }
    }

    // --- Function to Fetch and Display Predefined Lists ---
    async function displayPredefinedList(idArray, gridElement, loadingElement, errorElement, titleElement = null, listTitle = "") {
       // ... (Keep existing logic - relies on createMovieCard) ...
         if (!gridElement || !loadingElement || !errorElement) {
            console.error("displayPredefinedList: Missing required elements for list:", listTitle || "Unknown");
            return;
        }
          if (!idArray || idArray.length === 0) {
             if (titleElement) titleElement.textContent = listTitle;
             gridElement.innerHTML = '';
             loadingElement.style.display = 'none';
             errorElement.textContent = 'No movies defined for this category.';
             errorElement.style.display = 'block';
            return;
        }

        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        gridElement.innerHTML = '';
        if (titleElement && listTitle) {
            titleElement.textContent = listTitle;
        }

        try {
            const moviePromises = idArray.map(id => fetchMovieDetails(id));
            const movieResults = await Promise.all(moviePromises);
            const validMovies = movieResults.filter(movie => movie !== null);

            if (validMovies.length > 0) {
                validMovies.forEach(movie => {
                    const card = createMovieCard(movie); // Adds listener
                    gridElement.appendChild(card);
                });
                 errorElement.style.display = 'none';
            } else {
                errorElement.textContent = `No valid movie data could be fetched for ${listTitle || 'this list'}.`;
                errorElement.style.display = 'block';
            }

        } catch (error) {
            console.error(`Error displaying list "${listTitle || 'Unknown'}":`, error);
            errorElement.textContent = `Could not load movies. ${error.message}`;
            errorElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

     // --- Function to Perform Search ---
    async function searchMovies(query) {
       // ... (Keep existing logic - relies on createMovieCard) ...
        if (!searchResultsSection || !searchLoading || !searchError || !searchResultsGrid || !searchResultsTitle) {
             console.error("Search function cannot run: Missing search DOM elements.");
             return;
        }
        searchResultsSection.style.display = 'block';
        searchLoading.style.display = 'block';
        searchError.style.display = 'none';
        searchResultsGrid.innerHTML = '';
        searchResultsTitle.textContent = `Searching for "${query}"...`;

        const url = `${apiUrlBase}?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=movie`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok`);
            const data = await response.json();

            searchResultsTitle.textContent = `Results for "${query}"`;

            if (data.Response === "True") {
                 if (data.Search && data.Search.length > 0) {
                    const detailPromises = data.Search.map(movie => fetchMovieDetails(movie.imdbID));
                    const detailedMovies = await Promise.all(detailPromises);
                    const validDetailedMovies = detailedMovies.filter(m => m !== null);

                    if (validDetailedMovies.length > 0) {
                         validDetailedMovies.forEach(movie => {
                            const card = createMovieCard(movie); // Adds listener
                            searchResultsGrid.appendChild(card);
                        });
                    } else { // Fallback
                        data.Search.forEach(movie => {
                            const card = createMovieCard(movie); // Adds listener
                            searchResultsGrid.appendChild(card);
                        });
                         searchError.textContent = "Found matches, but couldn't load full details.";
                         searchError.style.display = 'block';
                    }
                 } else {
                     searchError.textContent = `No movies found matching "${query}".`;
                     searchError.style.display = 'block';
                 }
            } else {
                searchError.textContent = data.Error || "Could not find movies.";
                searchError.style.display = 'block';
            }
        } catch (error) {
            console.error('Search fetch error:', error);
            searchResultsTitle.textContent = 'Search Results';
            searchError.textContent = `Search failed. ${error.message}. Please try again.`;
            searchError.style.display = 'block';
        } finally {
            searchLoading.style.display = 'none';
        }
    }

    // --- Event Listeners ---

    // Mood Dropdown Listener
     if (moodDropdown) {
         moodDropdown.addEventListener('change', (event) => {
            // ... (rest of mood logic) ...
              if (!moodSection || !moodGrid || !moodLoading || !moodError || !moodResultsTitle) {
                console.error("Cannot handle mood change: Missing mood DOM elements.");
                return;
            }
            const selectedMood = event.target.value;
            const selectedMoodText = event.target.options[event.target.selectedIndex].text;

            if (selectedMood && moodMap[selectedMood]) {
                moodSection.style.display = 'block';
                const moodTitle = `${selectedMoodText} Movies`;
                displayPredefinedList(
                    moodMap[selectedMood],
                    moodGrid,
                    moodLoading,
                    moodError,
                    moodResultsTitle,
                    moodTitle
                );
            } else {
                moodSection.style.display = 'none';
                moodGrid.innerHTML = '';
            }
        });
    }


    // Debounce Search Input Listener
    let debounceTimer;
     if (searchInput) {
         searchInput.addEventListener('input', (event) => {
            // ... (rest of search logic) ...
              const searchTerm = event.target.value.trim();
            clearTimeout(debounceTimer);

            if (searchTerm) {
                debounceTimer = setTimeout(() => {
                    searchMovies(searchTerm);
                }, 500);
            } else {
                 if (searchResultsGrid) searchResultsGrid.innerHTML = '';
                 if (searchLoading) searchLoading.style.display = 'none';
                 if (searchError) searchError.style.display = 'none';
                 if (searchResultsSection) searchResultsSection.style.display = 'none';
            }
        });
     }


    // Modal Close Listeners
     if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
     if (modalOverlay) {
         modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
     }


    // Download Button Listener
     if (modalDownloadBtn) {
         modalDownloadBtn.addEventListener('click', (event) => {
            const imdbID = event.target.dataset.imdbId;
            const movieTitle = modalTitle ? modalTitle.textContent : 'this movie';
            alert(`Download feature for "${movieTitle}" is not available.\nThis website provides movie information only.`);
        });
     }


    // --- Initial Page Load ---
    function init() {
        if (heroCarouselWrapper) populateHeroCarousel(heroMovieIDs);
        if (trendingGrid && trendingLoading && trendingError) {
             displayPredefinedList(trendingMovieIDs, trendingGrid, trendingLoading, trendingError);
        }
        if (popularGrid && popularLoading && popularError) {
             displayPredefinedList(popularMovieIDs, popularGrid, popularLoading, popularError);
        }
    }

    init();

}); // End DOMContentLoaded