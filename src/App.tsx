import { LoginPage } from "./auth/LoginPage";
import { SignedIn } from "./auth/SignedIn";
import { useSession } from "./auth/useSession";
import { Home } from "./pages/Home";

function App() {
  const session = useSession();

  switch (session.status) {
    case "loading":
      return <FullPage>Načítám…</FullPage>;

    case "misconfigured":
      return (
        <FullPage>
          <span className="text-red-700">{session.message}</span>
        </FullPage>
      );

    case "signed-out":
      return <LoginPage />;

    case "signed-in":
      return (
        <SignedIn email={session.session.user.email}>
          <Home />
        </SignedIn>
      );
  }
}

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-lg">{children}</div>
    </div>
  );
}

export default App;
