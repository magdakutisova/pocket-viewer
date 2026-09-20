import type { Recipe } from '../domain';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    return (
        <div className='border p-4 rounded-xl shadow-sm mb-3'>
            <a href={recipe.url} target='_blank' rel='noopener noreferrer' className='text-lg font-semibold text-blue-600 hover:underline'>
                {recipe.name}
            </a>
            <p className='text-sm text-gray-700 mt-1'>Uloženo: {recipe.savedAt.toLocaleDateString('cs-CZ')}</p>
            <div className='text-xs text-gray-500 mt-2'>
                {recipe.categories.join(' · ')}
            </div>
        </div>
    );
}
