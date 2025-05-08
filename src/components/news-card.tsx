import type { NewsArticle } from '@/services/news';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const formattedDate = article.published_datetime 
    ? format(parseISO(article.published_datetime), 'PPP p') 
    : 'Date not available';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{article.headline}</CardTitle>
        <CardDescription>{article.source}</CardDescription>
      </CardHeader>
      {article.snippet && (
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">{article.snippet}</p>
        </CardContent>
      )}
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            Read More
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
