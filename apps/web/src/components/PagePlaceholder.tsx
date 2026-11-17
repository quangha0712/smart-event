/** Khung tạm cho trang đã có route + phân quyền nhưng chưa làm nội dung. */
export function PagePlaceholder({ title, description }: {
  title: string;
  description: string;
}) {
  return (
    <section className="page-section">
      <h1 className="page-title">{title}</h1>
      <p className="muted">{description}</p>
      <div className="placeholder">Chức năng này đang được phát triển.</div>
    </section>
  );
}
