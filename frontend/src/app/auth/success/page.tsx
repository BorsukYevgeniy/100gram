import Link from "next/link";

export default function GoogleAuthSuccess() {
  return (
    <main className="verify-page">
      <section className="verify-card">
        <Link className="brand" href="/">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        <div className="verify-icon" aria-hidden="true">
          ✓
        </div>
        <div className="eyebrow">GOOGLE AUTHENTICATION</div>
        <h1>Ви увійшли</h1>
        <p>Авторизацію через Google успішно завершено.</p>
        <Link className="button button-primary full-width verify-link" href="/">
          До акаунта <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
