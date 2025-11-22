"use client"
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps){
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="font-hand text-lg text-gray-800 dark:text-gray-200 ml-1 transition-colors">
                {label}
            </label>
            <input
                className={`px-5 py-3.5 p-2 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-sans focus:outline-none focus:border-primary focus:shadow-hand dark:focus:shadow-hand-dark transition-all duration-200 ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'} ${className}`}
                {...props}
            />
            {error && <span className="text-red-500 dark:text-red-400 text-sm font-hand ml-1">{error}</span>}
        </div>
    );
};