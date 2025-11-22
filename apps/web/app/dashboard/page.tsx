import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="bg-white dark:bg-dark-card p-8 rounded-lg border-2 border-black dark:border-gray-500 shadow-hand dark:shadow-hand-dark transition-colors">
                <h1 className="font-hand text-4xl mb-4 dark:text-white">Welcome to the Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6 font-sans">You are successfully logged in!</p>
                <Link href="/signin" className="font-hand text-lg text-primary hover:underline">Log out</Link>
            </div>
        </div>
    );
}