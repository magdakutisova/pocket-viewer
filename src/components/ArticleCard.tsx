import type { Article } from '../types';

export function ArticleCard({ article }: { article: Article }) {
    return (
        <div className='border p-4 rounded-xl shadow-sm mb-3'>
            <a href={article.url} target='_blank' rel='noopener noreferrer' className='text-lg font-semibold text-blue-600 hover:underline'>
                {article.title}
            </a>
            <p className='text-sm text-gray-700 mt-1'>Added on: {new Date(parseInt(article.timeAdded) * 1000).toLocaleDateString()}</p>
            <div className='text-xs text-gray-500 mt-2'>
                {article.tags.join(', ')}
            </div>
        </div>
    );
}