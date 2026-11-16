import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function HomePage() {
  return (
    <div className="page">
      <header>
        <span className="eyebrow">SMART EVENT</span>
        <h1>Quản lý sự kiện thông minh</h1>
        <p>Nền tảng quản lý sự kiện, đăng ký tham dự và check-in bằng vé QR.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/events">
            Xem sự kiện
          </Link>
          <Link className="button button-ghost" href="/login">
            Đăng nhập ban tổ chức
          </Link>
        </div>
      </header>
      <section className="cards" aria-label="Các chức năng chính">
        <article>
          <h2>Sự kiện</h2>
          <p>Tạo sự kiện, quản lý lịch trình và nguồn lực.</p>
        </article>
        <article>
          <h2>Đăng ký & vé QR</h2>
          <p>Theo dõi đăng ký và cấp vé cho người tham dự.</p>
        </article>
        <article>
          <h2>Check-in & dashboard</h2>
          <p>Ghi nhận tham dự và theo dõi số liệu sự kiện.</p>
        </article>
      </section>
      <footer>
        API: <code>{API_BASE_URL}</code>
      </footer>
    </div>
  );
}
