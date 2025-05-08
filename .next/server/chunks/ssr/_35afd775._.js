module.exports = {

"[project]/src/services/news.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Represents a news article.
 */ __turbopack_context__.s({
    "getLatestNews": (()=>getLatestNews),
    "getNewsByDate": (()=>getNewsByDate)
});
// IMPORTANT: Storing API keys directly in code is not secure for production applications.
// It's better to use environment variables (e.g., process.env.SERPAPI_API_KEY).
// This key is provided as per user request for this specific update.
const SERPAPI_API_KEY = 'd2961169abd3c9d30d3b10a8c72ae6ae1ec2da5cac2e6ccbe310032a232e1d8b';
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';
// Basic date parser for SerpApi's date strings
// This is a simplified parser. For robust parsing, a library like date-fns would be better.
function parseSerpApiDate(dateString) {
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
function transformSerpApiArticle(apiArticle) {
    let sourceName;
    if (typeof apiArticle.source === 'string') {
        sourceName = apiArticle.source;
    } else if (apiArticle.source && typeof apiArticle.source === 'object' && apiArticle.source.name) {
        sourceName = apiArticle.source.name;
    } else {
        // If source is an object but doesn't have a name, try to find a string representation
        // This is a fallback, ideal case is source.name being present
        if (typeof apiArticle.source === 'object' && apiArticle.source !== null) {
            const sourceAsString = Object.values(apiArticle.source).find((val)=>typeof val === 'string');
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
        id: apiArticle.link + (apiArticle.position || Math.random().toString()),
        source: sourceName,
        headline: apiArticle.title,
        link: apiArticle.link,
        published_datetime: parseSerpApiDate(apiArticle.date),
        snippet: apiArticle.snippet
    };
}
async function getLatestNews(query, num = 10) {
    console.log(`Fetching latest news from SerpApi for query: "${query}", num: ${num}, country: India`);
    const params = new URLSearchParams({
        api_key: SERPAPI_API_KEY,
        engine: 'google_news',
        q: query,
        num: num.toString(),
        gl: "in"
    });
    try {
        const response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json().catch(()=>({
                    message: response.statusText
                }));
            throw new Error(`SerpApi request failed: ${response.status} ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`SerpApi returned an error: ${data.error}`);
        }
        if (!data.news_results || data.news_results.length === 0) {
            return [];
        }
        const articles = data.news_results.map(transformSerpApiArticle).filter((article)=>article !== null);
        // Sort articles by published_datetime in descending order (newest first)
        articles.sort((a, b)=>{
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
 */ function formatDateForSerpApiTbs(isoDate) {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
        throw new Error('Invalid date format for formatDateForSerpApiTbs. Expected YYYY-MM-DD.');
    }
    return `${month}/${day}/${year}`;
}
async function getNewsByDate(date, query, num = 10) {
    console.log(`Fetching news from SerpApi for date: ${date}, query: "${query}", num: ${num}, country: India`);
    let formattedDateForApi;
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
        tbs: `cdr:1,cd_min:${formattedDateForApi},cd_max:${formattedDateForApi}`,
        gl: "in"
    });
    try {
        const response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json().catch(()=>({
                    message: response.statusText
                }));
            throw new Error(`SerpApi request failed: ${response.status} ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`SerpApi returned an error: ${data.error}`);
        }
        if (!data.news_results || data.news_results.length === 0) {
            return [];
        }
        const articles = data.news_results.map(transformSerpApiArticle).filter((article)=>article !== null);
        // For "byDate" search, SerpApi usually returns articles for that specific day.
        // Sorting them again by date might be redundant unless further refinement within the day is needed.
        // If precise intra-day sorting is crucial, it can be added here similar to getLatestNews.
        // For now, we rely on SerpApi's ordering for the specified date.
        articles.sort((a, b)=>{
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
}}),
"[project]/src/app/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ {"6050b4b67dc96413163206664c6a216aed50a8432d":"fetchNewsAction"} */ __turbopack_context__.s({
    "fetchNewsAction": (()=>fetchNewsAction)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$news$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/news.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ fetchNewsAction(prevState, formData) {
    const query = formData.get('query');
    const searchType = formData.get('searchType');
    const date = formData.get('date'); // Expected YYYY-MM-DD
    if (!query || query.trim() === "") {
        return {
            articles: null,
            error: "Search query cannot be empty."
        };
    }
    try {
        let articles;
        if (searchType === 'byDate') {
            if (!date) {
                return {
                    articles: null,
                    error: 'Date is required for date-based search.'
                };
            }
            // Validate date format (basic check, YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return {
                    articles: null,
                    error: 'Invalid date format. Please use YYYY-MM-DD.'
                };
            }
            articles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$news$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNewsByDate"])(date, query);
        } else {
            articles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$news$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLatestNews"])(query);
        }
        return {
            articles,
            error: null,
            timestamp: Date.now()
        };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred.';
        return {
            articles: null,
            error: `Failed to fetch news: ${error}`,
            timestamp: Date.now()
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    fetchNewsAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(fetchNewsAction, "6050b4b67dc96413163206664c6a216aed50a8432d", null);
}}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
}}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "6050b4b67dc96413163206664c6a216aed50a8432d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchNewsAction"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/app/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "6050b4b67dc96413163206664c6a216aed50a8432d": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6050b4b67dc96413163206664c6a216aed50a8432d"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$app$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/src/app/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/app/page.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/page.tsx <module evaluation>", "default");
}}),
"[project]/src/app/page.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/page.tsx", "default");
}}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/page.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/app/page.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=_35afd775._.js.map