import './globals.css';

export const metadata = {
    title: 'vscodehub.com - Domain For Sale',
    description: 'Domain For Sale - vscodehub.com',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
