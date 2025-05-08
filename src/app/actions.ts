'use server';

import { getLatestNews, getNewsByDate, type NewsArticle } from '@/services/news';

interface FetchNewsState {
  articles: NewsArticle[] | null;
  error: string | null;
  timestamp?: number; // To help trigger re-renders if content is the same
}

export async function fetchNewsAction(
  prevState: FetchNewsState | null, // Not directly used by server action logic but useful for useFormState
  formData: FormData
): Promise<FetchNewsState> {
  const query = formData.get('query') as string;
  const searchType = formData.get('searchType') as 'latest' | 'byDate';
  const date = formData.get('date') as string | null; // Expected YYYY-MM-DD

  if (!query || query.trim() === "") {
    return { articles: null, error: "Search query cannot be empty." };
  }

  try {
    let articles: NewsArticle[];
    if (searchType === 'byDate') {
      if (!date) {
        return { articles: null, error: 'Date is required for date-based search.' };
      }
      // Validate date format (basic check, YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { articles: null, error: 'Invalid date format. Please use YYYY-MM-DD.' };
      }
      articles = await getNewsByDate(date, query);
    } else {
      articles = await getLatestNews(query);
    }
    return { articles, error: null, timestamp: Date.now() };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { articles: null, error: `Failed to fetch news: ${error}`, timestamp: Date.now() };
  }
}
