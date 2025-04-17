document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration & IDs ---
    const apiKey = '48ca8b97'; // Replace with your actual OMDb API key if needed
    const apiUrlBase = 'https://www.omdbapi.com/';
    const heroMovieIDs = ["tt10872600", "tt1160419", "tt9419884", "tt1877830", "tt7286456", "tt1375666"];
    const trendingMovieIDs = ["tt9419884", "tt10872600", "tt1160419", "tt7286456", "tt1877830"];
    const popularMovieIDs = ["tt0111161", "tt0068646", "tt0468569", "tt0109830", "tt0137523", "tt1375666", "tt0110912", "tt0088763", "tt0120737", "tt0108052"];

    // --- *** CORRECTED moodMap *** ---
    // Keys now EXACTLY match the 'value' attributes in the HTML dropdown options
    const moodMap = {
        "happy": ["tt0109830", "tt1016150", "tt0414387"], // Example IDs for Uplifting / Happy
        "sad": ["tt0120737", "tt0108052", "tt0317248"], // Example IDs for Emotional / Sad
        "thrilling": ["tt1375666", "tt0482571", "tt0468569"], // Example IDs for Exciting / Thrilling
        "thought-provoking": ["tt0816692", "tt5052448", "tt0133093"], // Example IDs for Thought-Provoking (key uses quotes due to hyphen)
        "comedy": ["tt0110912", "tt0367594", "tt1280558"], // Example IDs for Funny / Comedy
        "scary": ["tt0081505", "tt1179933", "tt0078748"]  // Example IDs for Scary / Horror
        // Note: Removed the duplicate inner declaration and extra closing brace.
        // Added entries for all dropdown options. You can change the IMDb IDs.
    };
    // --- *** END CORRECTION *** ---


    // --- DOM Elements ---
    const modalOverlay = document.getElementById('movieDetailModal');
    if (!modalOverlay) {
        console.error("CRITICAL: Modal overlay element (#movieDetailModal) not found!");
        return; // Stop if modal is missing
    }
    // Ensure other elements are selected correctly (assuming IDs in HTML are correct)
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
    // Added missing selections for populateModal based on usage there
    const modalYear = document.getElementById('modalYear');
    const modalRated = document.getElementById('modalRated');
    const modalRuntime = document.getElementById('modalRuntime');
    const modalGenreText = document.getElementById('modalGenreText');
    const modalPlotText = document.getElementById('modalPlotText');
    const modalDirector = document.getElementById('modalDirector');
    const modalWriter = document.getElementById('modalWriter');
    const modalActors = document.getElementById('modalActors');
    const modalRating = document.getElementById('modalRating');
    const modalBoxOffice = document.getElementById('modalBoxOffice');
    // --- End DOM Elements ---

    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    const modalLoadingIndicator = document.getElementById('modalLoading');
    const modalErrorIndicator = document.getElementById('modalError');


    // --- Helper Function to Create Movie Card ---
    function createMovieCard(movie) {
        const title = movie.Title && movie.Title !== 'N/A' ? movie.Title : 'Title Unavailable';
        const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://via.placeholder.com/200x300/1f1f1f/888888?text=No+Poster';
        const year = movie.Year && movie.Year !== 'N/A' ? movie.Year : '';
        const imdbID = movie.imdbID;
        // Use imdbRating for the card rating display
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
            movieCard.dataset.imdbId = imdbID; // Store ID for click handling
            movieCard.style.cursor = 'pointer';
            movieCard.addEventListener('click', function() {
                const clickedId = this.dataset.imdbId;
                 // console.log(`Movie Card Clicked - ID: ${clickedId}`); // Keep for debugging if needed
                handleMovieCardClick(clickedId);
            });
        } else {
             console.warn("Movie card created without imdbID:", movie); // Warn if ID missing
        }
        return movieCard;
    }

    // --- Helper Function to Fetch Single Movie Details by ID ---
    async function fetchMovieDetails(id) {
         // Basic check for valid ID format (optional but good practice)
         if (!id || !id.startsWith('tt')) {
            console.error(`Invalid IMDb ID format for fetch: ${id}`);
            return null; // Return null instead of throwing here, let caller handle
         }
         const url = `${apiUrlBase}?apikey=${apiKey}&i=${id}&plot=full`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`API Network Error for ID ${id}: ${response.status} ${response.statusText}`);
                 // Don't throw here, return null so Promise.all doesn't reject entirely on one failure
                 return null;
            }
            const data = await response.json();
            if (data.Response === "True") {
                return data; // Success
            } else {
                console.warn(`OMDb API Error for ID ${id}: ${data.Error}`);
                return null; // Return null on API error (e.g., movie not found)
            }
        } catch (error) {
             console.error(`Fetch error for ID ${id}:`, error);
             // Don't throw, return null
             return null;
        }
    }

    // --- Function to Populate Modal Content ---
    function populateModal(movieData) {
        // Check if movieData is actually provided
        if (!movieData) {
            console.error("populateModal called with null/undefined movieData");
            if (modalTitle) modalTitle.textContent = 'Error';
            if (modalPlotText) modalPlotText.textContent = 'Could not load movie details.';
            return;
        }

        // Use the variables defined earlier to access elements
        if (modalPosterImg) {
            modalPosterImg.src = (movieData.Poster && movieData.Poster !== 'N/A') ? movieData.Poster : 'https://via.placeholder.com/300x450/1f1f1f/888888?text=No+Poster';
            modalPosterImg.alt = `${movieData.Title || 'Movie'} Poster`;
        }
        if(modalTitle) modalTitle.textContent = movieData.Title || 'N/A';
        if(modalYear) modalYear.textContent = movieData.Year || 'N/A';
        if(modalRated) modalRated.textContent = movieData.Rated || 'N/A';
        if(modalRuntime) modalRuntime.textContent = movieData.Runtime || 'N/A';
        if(modalGenreText) modalGenreText.textContent = movieData.Genre || 'N/A'; // Updated ID target
        if(modalPlotText) modalPlotText.textContent = movieData.Plot || 'N/A';
        if(modalDirector) modalDirector.textContent = movieData.Director || 'N/A';
        if(modalWriter) modalWriter.textContent = movieData.Writer || 'N/A';
        if(modalActors) modalActors.textContent = movieData.Actors || 'N/A';
        if(modalRating) modalRating.textContent = movieData.imdbRating && movieData.imdbRating !== 'N/A' ? `⭐ ${movieData.imdbRating}/10` : 'N/A';
        if(modalBoxOffice) modalBoxOffice.textContent = movieData.BoxOffice || 'N/A';

        // Ensure download button exists before setting data attribute
        if(modalDownloadBtn) {
             modalDownloadBtn.dataset.imdbId = movieData.imdbID || ''; // Set ID or empty string
        }
    }

    // --- Function to Handle Movie Card Click ---
    async function handleMovieCardClick(imdbID) {
       // console.log("handleMovieCardClick called with ID:", imdbID);

        if (!modalOverlay || !modalLoadingIndicator || !modalErrorIndicator || !modalTitle || !modalPlotText) {
            console.error("Cannot open modal: One or more essential modal elements missing!");
            return;
        }
        if (!imdbID) {
             console.error("handleMovieCardClick called without imdbID!");
             return;
        }

        // Reset modal state BEFORE making it visible
        modalLoadingIndicator.style.display = 'block';
        modalErrorIndicator.style.display = 'none';
        modalErrorIndicator.textContent = ''; // Clear previous errors
        // Clear previous content placeholders
        populateModal({}); // Pass empty object to clear fields to 'N/A' or defaults

        // Make modal visible (using inline styles as per user's code)
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        modalOverlay.style.display = 'flex'; // Use flex for centering as per CSS
        modalOverlay.style.zIndex = '1000'; // Ensure it's above other content

        try {
            const movieDetails = await fetchMovieDetails(imdbID);
            if (movieDetails) { // Check if fetch returned data
                populateModal(movieDetails);
            } else {
                 // Handle case where fetch returned null (API error, not found, network error)
                throw new Error(`Details not found or fetch failed for ID ${imdbID}`);
            }
        } catch (error) {
            console.error("Error fetching/populating modal:", error);
            populateModal({}); // Clear fields again on error
            if(modalTitle) modalTitle.textContent = 'Error Loading Details';
            modalErrorIndicator.textContent = `Could not load details. ${error.message}`;
            modalErrorIndicator.style.display = 'block';
        } finally {
            // Hide loading indicator regardless of success or failure
            modalLoadingIndicator.style.display = 'none';
        }
    }

     // --- Function to Close Modal ---
     function closeModal() {
        if (!modalOverlay) return;
        // Hide modal using inline styles
        modalOverlay.style.opacity = '0';
        modalOverlay.style.visibility = 'hidden';
        // Use setTimeout to set display:none after transition ends (approx 300ms from CSS)
         setTimeout(() => {
            // Check if it's still meant to be hidden before setting display none
            if (modalOverlay.style.opacity === '0') {
                 modalOverlay.style.display = 'none';
            }
         }, 300); // Match transition time in CSS
     }


    // --- Function to Populate Hero Carousel ---
    async function populateHeroCarousel(movieIDs) {
         if (!heroCarouselWrapper) {
             console.error("Hero carousel wrapper not found.");
             return;
         }
        heroCarouselWrapper.innerHTML = ''; // Clear placeholder

        let slidesHTML = '';
        let swiperInstance = null;

        try {
            // Fetch all movies in parallel, wait for all promises to settle
            const moviePromises = movieIDs.map(id => fetchMovieDetails(id));
            const movieResults = await Promise.all(moviePromises);
            // Filter out null results (from fetch errors or API errors)
            const validMovies = movieResults.filter(movie => movie !== null);

            if (validMovies.length === 0) {
                 // Display a message if no valid movies were fetched
                 heroCarouselWrapper.innerHTML = `<div class="swiper-slide hero-slide" style="background-color: #222;"><div class="hero-overlay"></div><div class="container hero-content"><h1>Welcome</h1><p>No featured movies could be loaded at this time.</p></div></div>`;
            } else {
                 validMovies.forEach(movie => {
                    const title = movie.Title || 'Featured Movie';
                    let bgImage = 'none';
                    let bgColor = '#252525'; // Dark background if no poster
                    // Use poster only if valid and not 'N/A'
                    if (movie.Poster && movie.Poster !== 'N/A' && movie.Poster.startsWith('http')) {
                        bgImage = `url('${movie.Poster}')`;
                        bgColor = 'transparent'; // Let image show through
                    }
                    const plotText = movie.Plot || 'Discover this exciting movie!';
                    // Shorten plot for display in carousel
                    const displayPlot = plotText.length > 150 ? plotText.substring(0, 150) + '...' : plotText;

                    slidesHTML += `
                        <div class="swiper-slide hero-slide" style="background-image: ${bgImage}; background-color: ${bgColor};">
                            <div class="hero-overlay"></div>
                             <div class="container hero-content">
                                <h1>${title}</h1>
                                <p>${displayPlot}</p>
                                <!-- Optional: Add a button/link to open modal -->
                                <!-- <button class="hero-details-btn" data-imdb-id="${movie.imdbID}">View Details</button> -->
                            </div>
                        </div>
                    `;
                });
                 heroCarouselWrapper.innerHTML = slidesHTML; // Add generated slides
            }

             // Initialize Swiper AFTER slides are added to the DOM
             if (validMovies.length > 0 && typeof Swiper !== 'undefined') {
                swiperInstance = new Swiper('.hero-swiper', {
                    loop: validMovies.length > 1, // Loop only if more than one slide
                    autoplay: { delay: 5500, disableOnInteraction: false },
                    effect: 'fade',
                    fadeEffect: { crossFade: true },
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                    // Add observer options to help Swiper re-initialize if content changes later
                    observer: true,
                    observeParents: true,
                    observeSlideChildren: true,
                });
             } else if (typeof Swiper === 'undefined') {
                 console.error("Swiper library is not loaded. Carousel will not function.");
             }

        } catch (error) {
             // Catch any unexpected errors during the process
             console.error("Error populating hero carousel:", error);
             heroCarouselWrapper.innerHTML = `<div class="swiper-slide hero-slide" style="background-color: #333;"><div class="hero-overlay"></div><div class="container hero-content"><h1>Error</h1><p>Could not load featured movies due to an unexpected error.</p></div></div>`;
        }
    }

    // --- Function to Fetch and Display Predefined Lists (Trending, Popular, Mood) ---
    async function displayPredefinedList(idArray, gridElement, loadingElement, errorElement, titleElement = null, listTitle = "") {
         // Check for essential elements
         if (!gridElement || !loadingElement || !errorElement) {
            console.error("displayPredefinedList: Missing required DOM elements for list:", listTitle || "Unknown");
            return;
        }
        // Check if ID array is valid
          if (!idArray || !Array.isArray(idArray)) {
             console.error("displayPredefinedList: Invalid or missing idArray for:", listTitle || "Unknown");
             gridElement.innerHTML = '';
             loadingElement.style.display = 'none';
             errorElement.textContent = 'Configuration error: Movie list definition is invalid.';
             errorElement.style.display = 'block';
            return;
        }

        // Set initial state
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        errorElement.textContent = '';
        gridElement.innerHTML = ''; // Clear previous content
        if (titleElement && listTitle) {
            titleElement.textContent = listTitle; // Update section title if provided
        }

         // Handle empty ID list specifically
         if (idArray.length === 0) {
             loadingElement.style.display = 'none';
             errorElement.textContent = `No movies are currently defined for the "${listTitle || 'this'}" category.`;
             errorElement.style.display = 'block';
             return;
         }


        try {
            // Fetch details for all IDs in parallel
            const moviePromises = idArray.map(id => fetchMovieDetails(id));
            const movieResults = await Promise.all(moviePromises);
            // Filter out null results (fetch errors, API errors, movie not found)
            const validMovies = movieResults.filter(movie => movie !== null);

            if (validMovies.length > 0) {
                // Create and append cards for valid movies
                validMovies.forEach(movie => {
                    const card = createMovieCard(movie); // createMovieCard adds the click listener
                    if (card) { // Ensure card creation was successful
                         gridElement.appendChild(card);
                    }
                });
                 errorElement.style.display = 'none'; // Hide error if we got some movies
            } else {
                // Show error if NO valid movies were found after fetching
                errorElement.textContent = `Could not load movie data for ${listTitle || 'this list'}. Check API key or movie IDs.`;
                errorElement.style.display = 'block';
            }

        } catch (error) {
            // Catch unexpected errors during the Promise.all or card creation loop
            console.error(`Unexpected error displaying list "${listTitle || 'Unknown'}":`, error);
            errorElement.textContent = `Could not load movies due to an unexpected error. ${error.message}`;
            errorElement.style.display = 'block';
        } finally {
            // Always hide loading indicator
            loadingElement.style.display = 'none';
        }
    }

     // --- Function to Perform Search ---
    async function searchMovies(query) {
        // Check required elements
        if (!searchResultsSection || !searchLoading || !searchError || !searchResultsGrid || !searchResultsTitle) {
             console.error("Search function cannot run: Missing search result DOM elements.");
             return;
        }

        // Set loading state
        searchResultsSection.style.display = 'block'; // Show the whole section
        searchLoading.style.display = 'block';
        searchError.style.display = 'none';
        searchError.textContent = '';
        searchResultsGrid.innerHTML = ''; // Clear previous results
        searchResultsTitle.textContent = `Searching for "${query}"...`;

        const url = `${apiUrlBase}?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=movie`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            // Update title after search completes
            searchResultsTitle.textContent = `Results for "${query}"`;

            if (data.Response === "True") {
                 if (data.Search && data.Search.length > 0) {
                    // Attempt to fetch full details for better cards (optional but good UX)
                    const detailPromises = data.Search.map(movie => fetchMovieDetails(movie.imdbID));
                    const detailedMovies = await Promise.all(detailPromises);

                    // Use detailed info if available, otherwise fallback to basic search result
                    data.Search.forEach((basicMovie, index) => {
                         const movieData = detailedMovies[index] || basicMovie; // Prioritize detailed data
                         const card = createMovieCard(movieData); // Uses detailed data if available
                         if (card) {
                             searchResultsGrid.appendChild(card);
                         }
                    });

                    // Optionally show a message if details couldn't be loaded for some
                    if (detailedMovies.some(m => m === null) && detailedMovies.some(m => m !== null)) {
                         searchError.textContent = "Note: Some movie details could not be fully loaded.";
                         searchError.style.display = 'block';
                    }

                 } else {
                     // API responded True, but Search array was empty or missing
                     searchError.textContent = `No movies found matching "${query}". Try a different search term.`;
                     searchError.style.display = 'block';
                 }
            } else {
                // API responded False, use the error message from API
                 // Handle specific common errors
                let userMessage = data.Error || "Could not complete search.";
                if (data.Error === "Movie not found!") {
                    userMessage = `No movies found matching "${query}". Try a different search term.`;
                } else if (data.Error === "Too many results.") {
                    userMessage = `Too many results for "${query}". Please be more specific.`;
                }
                searchError.textContent = userMessage;
                searchError.style.display = 'block';
            }
        } catch (error) {
            // Catch fetch errors or other unexpected issues
            console.error('Search error:', error);
            searchResultsTitle.textContent = 'Search Results'; // Reset title on error
            searchError.textContent = `Search failed. ${error.message}. Please check connection or try again.`;
            searchError.style.display = 'block';
        } finally {
            // Always hide loading indicator
            searchLoading.style.display = 'none';
        }
    }

    // --- Event Listeners ---

    // Mood Dropdown Listener
     if (moodDropdown) {
         moodDropdown.addEventListener('change', (event) => {
              // Check needed elements exist
              if (!moodSection || !moodGrid || !moodLoading || !moodError || !moodResultsTitle) {
                console.error("Cannot handle mood change: Missing mood section DOM elements.");
                return;
            }
            const selectedMoodValue = event.target.value; // e.g., "happy", "sad"
            const selectedMoodText = event.target.options[event.target.selectedIndex].text; // e.g., "Uplifting / Happy"

            // Check if a valid mood (not the default "-- Select --") is chosen
            // AND if that mood exists as a key in our corrected moodMap
            if (selectedMoodValue && moodMap[selectedMoodValue]) {
                moodSection.style.display = 'block'; // Show the mood results section
                const moodTitle = `${selectedMoodText} Movies`; // Use the display text for the title
                // Call the function to display the list using the IDs from moodMap
                displayPredefinedList(
                    moodMap[selectedMoodValue], // Get the array of IDs for the selected mood
                    moodGrid,                  // Where to put the movie cards
                    moodLoading,               // Loading indicator element
                    moodError,                 // Error indicator element
                    moodResultsTitle,          // Element for the section title
                    moodTitle                  // The text for the section title
                );
            } else {
                // If "-- Select --" or an unknown value is chosen, hide the section
                moodSection.style.display = 'none';
                moodGrid.innerHTML = ''; // Clear any previous mood results
            }
        });
    } else {
         console.warn("Mood dropdown element (#moodDropdown) not found.");
    }


    // Debounce Search Input Listener
    let debounceTimer;
     if (searchInput) {
         searchInput.addEventListener('input', (event) => {
              const searchTerm = event.target.value.trim();
            clearTimeout(debounceTimer); // Clear previous timer on new input

            if (searchTerm.length > 2) { // Only search if term is reasonably long (e.g., > 2 chars)
                // Set a new timer to run the search after 500ms of inactivity
                debounceTimer = setTimeout(() => {
                    searchMovies(searchTerm);
                }, 500); // 500ms delay
            } else {
                 // If search term is short or empty, clear results and hide section
                 if (searchResultsGrid) searchResultsGrid.innerHTML = '';
                 if (searchLoading) searchLoading.style.display = 'none';
                 if (searchError) searchError.style.display = 'none';
                 // Hide the whole section only if search term is completely empty
                 if (searchTerm.length === 0 && searchResultsSection) {
                     searchResultsSection.style.display = 'none';
                 } else if (searchResultsTitle) {
                      // If term is short but not empty, maybe show message? Or just clear grid.
                      searchResultsTitle.textContent = 'Search Results'; // Reset title
                 }
            }
        });
     } else {
         console.warn("Search input element (#searchInput) not found.");
     }


    // Modal Close Listeners
     if (modalCloseBtn) {
         modalCloseBtn.addEventListener('click', closeModal);
     } else {
         console.warn("Modal close button (#modalCloseBtn) not found.");
     }

     if (modalOverlay) {
         // Close modal if user clicks on the overlay background, but not the content inside
         modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) { // Check if the click was directly on the overlay
                closeModal();
            }
        });
     }
     // Also close modal on Escape key press
     document.addEventListener('keydown', (event) => {
         if (event.key === 'Escape' && modalOverlay && modalOverlay.style.visibility === 'visible') {
             closeModal();
         }
     });


    // Download Button Listener (Placeholder)
     if (modalDownloadBtn) {
         modalDownloadBtn.addEventListener('click', (event) => {
            const imdbID = event.target.dataset.imdbId;
            const movieTitle = modalTitle ? modalTitle.textContent : 'this movie';
            // Replace with actual download logic if available, otherwise keep alert
            alert(`Download feature for "${movieTitle}" (ID: ${imdbID || 'N/A'}) is currently unavailable.\nThis website provides movie information only.`);
        });
     } else {
          console.warn("Modal download button (#modalDownloadBtn) not found.");
     }


    // --- Initial Page Load Function ---
    function init() {
        // Populate hero carousel first
        if (heroCarouselWrapper) {
             populateHeroCarousel(heroMovieIDs);
        } else {
             console.error("Cannot initialize: Hero carousel wrapper not found.");
        }

        // Populate trending list
        if (trendingGrid && trendingLoading && trendingError) {
             displayPredefinedList(trendingMovieIDs, trendingGrid, trendingLoading, trendingError, null, "Top Trending"); // Pass title text
        } else {
             console.warn("Cannot initialize trending section: Missing elements.");
        }

        // Populate popular list
        if (popularGrid && popularLoading && popularError) {
             displayPredefinedList(popularMovieIDs, popularGrid, popularLoading, popularError, null, "Popular Picks"); // Pass title text
        } else {
             console.warn("Cannot initialize popular section: Missing elements.");
        }

         // Ensure search/mood sections are hidden initially (redundant if HTML has style="display:none", but safe)
         if(searchResultsSection) searchResultsSection.style.display = 'none';
         if(moodSection) moodSection.style.display = 'none';
    }

    // --- Run Initialization ---
    init();

}); // End DOMContentLoaded