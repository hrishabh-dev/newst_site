/**
 * Represents a news article.
 */
export interface NewsArticle {
  id: string; // Unique ID for keying in lists
  source: string;
  headline: string;
  link: string;
  published_datetime: string; // ISO date string (e.g., "2024-07-29T10:00:00Z")
  snippet?: string; // Optional snippet
}

// IMPORTANT: Storing API keys directly in code is not secure for production applications.
// It's better to use environment variables (e.g., process.env.SERPAPI_API_KEY).
// This key is provided as per user request for this specific update.
const SERPAPI_API_KEY = 'd2961169abd3c9d30d3b10a8c72ae6ae1ec2da5cac2e6ccbe310032a232e1d8b';
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

interface SerpApiNewsResultSource {
  name: string;
  icon?: string;
  authors?: unknown[];
}

interface SerpApiNewsResult {
  position: number;
  link: string;
  title: string;
  source: string | SerpApiNewsResultSource; // Source can be a string or an object
  date?: string; // e.g., "1 hour ago", "Jul 30, 2024"
  snippet?: string;
  // other fields may exist but are not used
}

interface SerpApiResponse {
  search_parameters: {
    q: string;
    engine: string;
  };
  search_information: {
    // ...
  };
  news_results?: SerpApiNewsResult[];
  error?: string;
}

// Basic date parser for SerpApi's date strings
// This is a simplified parser. For robust parsing, a library like date-fns would be better.
function parseSerpApiDate(dateString?: string): string {
  if (!dateString) {
    return new Date().toISOString(); // Fallback to now
  }

  // Try direct parsing for absolute dates like "Jul 30, 2024"
  let parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  // Handle relative dates like "X hours ago", "X days ago"
  const now = new Date();
  const matchMinutes = dateString.match(/(\d+)\s+minute(s)?\s+ago/i);
  if (matchMinutes && matchMinutes[1]) {
    const minutes = parseInt(matchMinutes[1], 10);
    if (!isNaN(minutes)) {
      now.setMinutes(now.getMinutes() - minutes);
      return now.toISOString();
    }
  }

  const matchHours = dateString.match(/(\d+)\s+hour(s)?\s+ago/i);
  if (matchHours && matchHours[1]) {
    const hours = parseInt(matchHours[1], 10);
    if (!isNaN(hours)) {
      now.setHours(now.getHours() - hours);
      return now.toISOString();
    }
  }

  const matchDays = dateString.match(/(\d+)\s+day(s)?\s+ago/i);
  if (matchDays && matchDays[1]) {
    const days = parseInt(matchDays[1], 10);
    if (!isNaN(days)) {
      now.setDate(now.getDate() - days);
      return now.toISOString();
    }
  }
  
  if (dateString.toLowerCase() === 'yesterday') {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }

  // Fallback if specific parsing fails
  // Attempt to parse other common date string formats if necessary or default
  // For now, if not relative and not directly parsable, default to current time
  // This could be improved by trying more specific formats with date-fns if `dateString` has known patterns.
  console.warn(`Could not parse date string: "${dateString}". Falling back to current date.`);
  return new Date().toISOString();
}


function transformSerpApiArticle(apiArticle: SerpApiNewsResult): NewsArticle | null {
  let sourceName: string;
  if (typeof apiArticle.source === 'string') {
    sourceName = apiArticle.source;
  } else if (apiArticle.source && typeof apiArticle.source === 'object' && apiArticle.source.name) {
    sourceName = apiArticle.source.name;
  } else {
    // If source is an object but doesn't have a name, try to find a string representation
    // This is a fallback, ideal case is source.name being present
    if (typeof apiArticle.source === 'object' && apiArticle.source !== null) {
        const sourceAsString = Object.values(apiArticle.source).find(val => typeof val === 'string');
        if (sourceAsString) {
            sourceName = sourceAsString;
        } else {
            console.warn('Skipping article due to unparsable source object:', apiArticle);
            return null; 
        }
    } else {
        console.warn('Skipping article due to missing or invalid source:', apiArticle);
        return null; // Invalid or missing source
    }
  }
  
  if (!apiArticle.link || !apiArticle.title) {
    console.warn('Skipping article due to missing link or title:', apiArticle);
    return null; // Essential fields missing
  }

  return {
    id: apiArticle.link + (apiArticle.position || Math.random().toString()), // Ensure unique ID, append position or random
    source: sourceName,
    headline: apiArticle.title,
    link: apiArticle.link,
    published_datetime: parseSerpApiDate(apiArticle.date),
    snippet: apiArticle.snippet,
  };
}

/**
 * Asynchronously retrieves the latest news articles based on a query using SerpApi,
 * sorted by publication date in descending order.
 * @param query The search query.
 * @param num The number of articles to return.
 * @returns A promise that resolves to an array of NewsArticle objects.
 */
export async function getLatestNews(query: string, num: number = 10): Promise<NewsArticle[]> {
  console.log(`Fetching latest news from SerpApi for query: "${query}", num: ${num}, country: India`);

  const params = new URLSearchParams({
    api_key: SERPAPI_API_KEY,
    engine: 'google_news', // More specific engine for news
    q: query,
    num: num.toString(),
    gl: "in", // Country set to India
    // hl: "en", // Language (e.g., English) - consider making this configurable
  });

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`SerpApi request failed: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpApi returned an error: ${data.error}`);
    }

    if (!data.news_results || data.news_results.length === 0) {
      return [];
    }

    const articles = data.news_results
      .map(transformSerpApiArticle)
      .filter((article): article is NewsArticle => article !== null);

    // Sort articles by published_datetime in descending order (newest first)
    articles.sort((a, b) => {
      return new Date(b.published_datetime).getTime() - new Date(a.published_datetime).getTime();
    });
    
    return articles;

  } catch (error) {
    console.error('Error fetching latest news from SerpApi:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch latest news: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching latest news.');
  }
}

/**
 * Formats a YYYY-MM-DD date string to MM/DD/YYYY for SerpApi.
 * @param isoDate The date string in YYYY-MM-DD format.
 * @returns The date string in MM/DD/YYYY format.
 */
function formatDateForSerpApiTbs(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
    throw new Error('Invalid date format for formatDateForSerpApiTbs. Expected YYYY-MM-DD.');
  }
  return `${month}/${day}/${year}`;
}

/**
 * Asynchronously retrieves news articles for a specific date and query using SerpApi.
 * The articles are generally returned by relevance for that day by the API.
 * @param date The date for which to retrieve news articles (YYYY-MM-DD format).
 * @param query The search query.
 * @param num The number of articles to return.
 * @returns A promise that resolves to an array of NewsArticle objects.
 */
export async function getNewsByDate(date: string, query: string, num: number = 10): Promise<NewsArticle[]> {
  console.log(`Fetching news from SerpApi for date: ${date}, query: "${query}", num: ${num}, country: India`);

  let formattedDateForApi: string;
  try {
    formattedDateForApi = formatDateForSerpApiTbs(date);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Invalid date format provided.';
    console.error('Invalid date format provided to getNewsByDate:', date, errorMessage);
    throw new Error('Invalid date format. Please use YYYY-MM-DD.');
  }

  const params = new URLSearchParams({
    api_key: SERPAPI_API_KEY,
    engine: 'google_news',
    q: query,
    num: num.toString(),
    tbs: `cdr:1,cd_min:${formattedDateForApi},cd_max:${formattedDateForApi}`, // Date range for the specific day
    gl: "in", // Country set to India
    // hl: "en",
  });

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`SerpApi request failed: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpApi returned an error: ${data.error}`);
    }
    
    if (!data.news_results || data.news_results.length === 0) {
      return [];
    }

    const articles = data.news_results
      .map(transformSerpApiArticle)
      .filter((article): article is NewsArticle => article !== null);
    
    // For "byDate" search, SerpApi usually returns articles for that specific day.
    // Sorting them again by date might be redundant unless further refinement within the day is needed.
    // If precise intra-day sorting is crucial, it can be added here similar to getLatestNews.
    // For now, we rely on SerpApi's ordering for the specified date.
    articles.sort((a, b) => {
      return new Date(b.published_datetime).getTime() - new Date(a.published_datetime).getTime();
    });

    return articles;

  } catch (error) {
    console.error('Error fetching news by date from SerpApi:', error);
     if (error instanceof Error) {
        throw new Error(`Failed to fetch news by date: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching news by date.');
  }
}

