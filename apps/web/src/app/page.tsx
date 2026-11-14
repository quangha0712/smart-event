const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default function HomePage() {
  return (
    <main className="page">
      <header><span className="eyebrow">SMART EVENT</span><h1>Quản lý sự kiện thông minh</h1>
        <p>Nền tảng quản lý sự kiện, đăng ký tham dự và check-in bằng vé QR.</p></header>
      <section className="cards" aria-label="Các chức năng chính">
        <article><h2>Sự kiện</h2><p>Tạo sự kiện, quản lý lịch trình và nguồn lực.</p></article>
        <article><h2>Đăng ký & vé QR</h2><p>Theo dõi đăng ký và cấp vé cho người tham dự.</p></article>
        <article><h2>Check-in & dashboard</h2><p>Ghi nhận tham dự và theo dõi số liệu sự kiện.</p></article>
      </section>
      <footer>API: <code>{apiUrl}</code></footer>
    </main>
  );
}
