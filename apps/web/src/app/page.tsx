import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home">
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="hero-kicker">Dành cho người tổ chức và người tham dự</p>
          <h1 id="home-title">Tổ chức sự kiện.<br />Kết nối mọi người.</h1>
          <p className="hero-description">
            Từ chuẩn bị, đăng ký đến đón tiếp, Smart Event giúp bạn theo dõi các công việc của một sự kiện tại một nơi.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/events">Xem sự kiện</Link>
            <Link className="button button-ghost" href="/login">Đăng nhập</Link>
          </div>
        </div>
        <aside className="journey" aria-labelledby="journey-title">
          <p className="journey-label">Một sự kiện trên Smart Event</p>
          <h2 id="journey-title">Từ kế hoạch<br />đến ngày gặp mặt.</h2>
          <ol className="journey-steps">
            <li><span>Chuẩn bị</span><p>Sắp xếp sự kiện, lịch trình và nguồn lực.</p></li>
            <li><span>Đăng ký</span><p>Người tham dự đăng ký và nhận vé QR.</p></li>
            <li><span>Đón tiếp</span><p>Check-in và theo dõi thông tin tham dự.</p></li>
          </ol>
          <p className="journey-note">Một số chức năng đang được phát triển.</p>
        </aside>
      </section>
      <section className="home-features" aria-labelledby="features-title">
        <div className="section-heading">
          <h2 id="features-title">Mỗi vai trò, một trải nghiệm rõ ràng.</h2>
          <p>Cùng làm việc với thông tin cần thiết cho sự kiện của bạn.</p>
        </div>
        <div className="home-roles">
          <article>
            <h3>Người tham dự</h3>
            <p>Tìm sự kiện, đăng ký tham dự và sử dụng vé QR khi check-in.</p>
          </article>
          <article>
            <h3>Ban tổ chức</h3>
            <p>Chuẩn bị sự kiện, quản lý nguồn lực và theo dõi hoạt động đón tiếp.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
