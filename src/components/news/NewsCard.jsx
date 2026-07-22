import { useState } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { relativeTime } from '@/utils/format';

export default function NewsCard({ article }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = article.image && !imageFailed;

  return (
    <article className="glass-panel flex h-full flex-col overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden bg-midnight-2">
        {showImage ? (
          <img
            src={article.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Newspaper size={28} className="text-slate-600" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="truncate font-medium text-sky-300">{article.source}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="shrink-0">{relativeTime(article.publishedAt)}</span>
        </div>
        <h3 className="text-sm font-semibold leading-snug text-mist-50">{article.title}</h3>
        {article.description && (
          <p className="line-clamp-3 text-sm text-slate-400">{article.description}</p>
        )}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-sky-300 hover:text-sky-200"
        >
          Read more <ExternalLink size={13} />
        </a>
      </div>
    </article>
  );
}
