'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NewsCard } from '@/components/news-card';
import { fetchNewsAction } from './actions';
import type { NewsArticle } from '@/services/news';
import { AlertCircle, CalendarIcon, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  query: z.string().min(1, { message: 'Search query is required.' }),
  searchType: z.enum(['latest', 'byDate']),
  date: z.string().optional(), // YYYY-MM-DD format
});

type FormData = z.infer<typeof formSchema>;

const initialState = {
  articles: null,
  error: null,
  timestamp: 0, // Ensure timestamp is always present
};

export default function HomePage() {
  const [formState, dispatchFormAction, isActionPending] = useActionState(fetchNewsAction, initialState);
  // const [isSubmitting, setIsSubmitting] = React.useState(false); // Replaced by isActionPending from useActionState
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      searchType: 'latest',
      date: undefined,
    },
  });

  const searchType = watch('searchType');
  const selectedDate = watch('date');

  React.useEffect(() => {
    if (formState?.error) {
      toast({
        variant: "destructive",
        title: "Error fetching news",
        description: formState.error,
      });
    }
    // setIsSubmitting(false); // No longer needed, isActionPending handles this
  }, [formState, toast]);

  const onSubmit = (data: FormData) => { // Can be non-async
    // isActionPending from useActionState will handle the submitting state
    const formDataObj = new FormData();
    formDataObj.append('query', data.query);
    formDataObj.append('searchType', data.searchType);
    if (data.searchType === 'byDate' && data.date) {
      formDataObj.append('date', data.date);
    } else if (data.searchType === 'byDate' && !data.date) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a date for date-based search.",
      });
      return;
    }
    
    React.startTransition(() => {
      dispatchFormAction(formDataObj);
    });
  };

  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="query" className="text-base">Search News</Label>
            <Controller
              name="query"
              control={control}
              render={({ field }) => (
                <Input
                  id="query"
                  placeholder="Enter keywords (e.g., 'AI development', 'climate change')"
                  {...field}
                  className="mt-1 text-base"
                />
              )}
            />
            {errors.query && <p className="text-sm text-destructive mt-1">{errors.query.message}</p>}
          </div>

          <Controller
            name="searchType"
            control={control}
            render={({ field }) => (
              <Tabs
                value={field.value}
                onValueChange={(value) => field.onChange(value as 'latest' | 'byDate')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 md:w-1/2">
                  <TabsTrigger value="latest">Latest News</TabsTrigger>
                  <TabsTrigger value="byDate">News by Date</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />

          {searchType === 'byDate' && (
            <div>
              <Label htmlFor="date" className="text-base">Select Date</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1 text-base"
                        id="date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(new Date(selectedDate), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={(day) => field.onChange(day ? format(day, 'yyyy-MM-dd') : undefined)}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full md:w-auto text-base" disabled={isActionPending}>
            {isActionPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Fetch News
          </Button>
        </form>
      </section>

      <section>
        {isActionPending && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Fetching news...</p>
          </div>
        )}

        {!isActionPending && formState?.error && (
           <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formState.error}</AlertDescription>
          </Alert>
        )}

        {!isActionPending && formState?.articles && formState.articles.length === 0 && (
          <div className="text-center py-10">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No news articles found for your query.</p>
            <p className="text-sm text-muted-foreground">Try different keywords or adjust the date.</p>
          </div>
        )}

        {!isActionPending && formState?.articles && formState.articles.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Results ({formState.articles.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {formState.articles.map((article: NewsArticle) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
