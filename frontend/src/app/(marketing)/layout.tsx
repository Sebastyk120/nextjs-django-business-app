import LandingShell from "./LandingShell";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <LandingShell>
            {children}
        </LandingShell>
    )
}
