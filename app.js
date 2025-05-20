document.getElementById('convert').addEventListener('click', async () => {
  const tidalLink = document.getElementById('tidal-link').value.trim();
  const resultDiv = document.getElementById('result');
  
  if (!tidalLink) {
    resultDiv.textContent = "Please enter a Tidal link.";
    return;
  }

  // Extract Tidal ID (track or album)
  const tidalId = extractTidalId(tidalLink);
  if (!tidalId) {
    resultDiv.textContent = "Invalid Tidal link. Try a track or album link.";
    return;
  }

  resultDiv.textContent = "Converting...";

  try {
    // Step 1: Get track/album info from Tidal (via unofficial API)
    const tidalData = await fetchTidalData(tidalId);
    
    // Step 2: Search Spotify for the same track/album
    const spotifyLink = await searchSpotify(tidalData);
    
    resultDiv.innerHTML = `
      <strong>Spotify Link:</strong><br>
      <a href="${spotifyLink}" target="_blank">${spotifyLink}</a>
    `;
  } catch (error) {
    resultDiv.textContent = `Error: ${error.message}`;
  }
});

// Helper: Extract Tidal ID from URL
function extractTidalId(url) {
  const match = url.match(/tidal\.com\/browse\/(track|album)\/(\d+)/);
  return match ? match[2] : null;
}

// Fetch Tidal track/album data (using unofficial API)
async function fetchTidalData(tidalId) {
  // Note: Tidal doesn't have a public API, so we use a proxy/workaround
  const response = await fetch(`https://api.tidal.com/v1/tracks/${tidalId}?countryCode=US`, {
    headers: {
      // Tidal's unofficial API requires no auth for basic data
      'Origin': 'https://listen.tidal.com'
    }
  });
  
  if (!response.ok) throw new Error("Couldn't fetch Tidal data.");
  const data = await response.json();
  
  return {
    title: data.title,
    artist: data.artist.name,
    album: data.album?.title,
    isrc: data.isrc // International Standard Recording Code (for Spotify lookup)
  };
}

// Search Spotify using track metadata
async function searchSpotify(tidalData) {
  // Use Spotify's API to search by ISRC (most reliable) or title/artist
  const query = tidalData.isrc 
    ? `isrc:${tidalData.isrc}` 
    : `track:${tidalData.title} artist:${tidalData.artist}`;
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_SPOTIFY_ACCESS_TOKEN'
      }
    }
  );
  
  if (!response.ok) throw new Error("Spotify API error.");
  const data = await response.json();
  
  if (data.tracks.items.length === 0) {
    throw new Error("No matching track found on Spotify.");
  }
  
  return data.tracks.items[0].external_urls.spotify;
}