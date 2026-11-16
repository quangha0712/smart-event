/** Khung tạm cho trang đã có route + phân quyền nhưng chưa làm nội dung. */
export function PagePlaceholder({ eyebrow, title, description, feature }: {
  eyebrow: string;
  title: string;
  description: string;
  /** Thư mục feature sẽ chứa giao diện, ví dụ "check-in". */
  feature: string;
}) {
  return (
    <section className="page-section">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="page-title">{title}</h1>
      <p className="muted">{description}</p>
      <div className="placeholder">
        Đang phát triển – giao diện đặt tại <code>apps/web/src/features/{feature}/</code>.
      </div>
    </section>
  );
}
