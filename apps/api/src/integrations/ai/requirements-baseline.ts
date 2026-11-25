/**
 * Danh mục yêu cầu chức năng đã chốt trong SRS (docs/02-scope-and-requirements.md) – TV2/BA sở hữu.
 * AI requirements-draft dùng danh mục này để:
 *   1. gợi ý LLM liên kết (relatedBaselineIds) thay vì viết lại yêu cầu đã có;
 *   2. backend tự phát hiện bản nháp có thể trùng yêu cầu đã chốt.
 *
 * `phrases` là các cụm từ đặc trưng, viết KHÔNG DẤU, chữ thường, cách nhau một khoảng trắng.
 * Khi sửa SRS phải cập nhật file này trong cùng commit (có test kiểm tra id không trùng).
 */
export type BaselineRequirement = {
  id: string;
  title: string;
  phrases: string[];
};

export const REQUIREMENTS_BASELINE: readonly BaselineRequirement[] = Object.freeze([
  {
    id: "FR-01",
    title: "Đăng ký tài khoản, đăng nhập và phân quyền hệ thống",
    phrases: ["dang nhap", "mat khau", "tai khoan", "phan quyen", "doi quyen"],
  },
  {
    id: "FR-02",
    title: "Tạo, cập nhật và quản lý vòng đời sự kiện",
    phrases: ["tao su kien", "cong bo su kien", "trang thai su kien", "huy su kien", "ban nhap"],
  },
  {
    id: "FR-03",
    title: "Quản lý lịch trình, phiên và diễn giả",
    phrases: ["quan ly lich trinh", "them phien", "sua phien", "dien gia", "san khau"],
  },
  {
    id: "FR-04",
    title: "Đăng ký tham dự, kiểm soát sức chứa và hủy đăng ký",
    phrases: ["dang ky tham du", "suc chua", "huy dang ky", "du cho"],
  },
  {
    id: "FR-05",
    title: "Phát hành và tra cứu vé QR duy nhất",
    phrases: ["ve qr", "ma qr", "phat hanh ve", "tra cuu ve", "ve cua toi"],
  },
  {
    id: "FR-06",
    title: "Check-in QR/NFC và chống dùng vé trùng",
    phrases: ["check in", "quet ve", "quet ma", "ve trung", "nfc"],
  },
  {
    id: "FR-07",
    title: "Dashboard thống kê sự kiện",
    phrases: ["dashboard", "thong ke", "bieu do", "ty le check in"],
  },
  {
    id: "FR-08",
    title: "Đánh giá sự kiện của người tham dự",
    phrases: ["danh gia su kien", "phan hoi", "cham diem", "nhan xet"],
  },
  {
    id: "FR-09",
    title: "Quản lý nhân sự, nhà cung cấp, nhà tài trợ, dự toán – thực chi",
    phrases: ["nhan su", "phan cong", "nha cung cap", "nha tai tro", "du toan", "thuc chi"],
  },
  {
    id: "FR-10",
    title: "AI tóm tắt tiến độ và rủi ro cho PM",
    phrases: ["tom tat tien do", "bao cao tien do", "rui ro du an"],
  },
  {
    id: "FR-11",
    title: "AI tạo bản nháp yêu cầu/use case cho BA rà soát",
    phrases: ["ban nhap yeu cau", "use case", "yeu cau chuc nang"],
  },
  {
    id: "FR-12",
    title: "AI gợi ý dự toán sơ bộ sự kiện",
    phrases: ["goi y du toan", "du toan so bo", "chi phi uoc tinh"],
  },
  {
    id: "FR-13",
    title: "AI phân tích log check-in, đánh dấu vé cần rà soát",
    phrases: ["phan tich check in", "quet lap", "gian lan", "bat thuong"],
  },
  {
    id: "FR-14",
    title: "AI tổng hợp chủ đề phản hồi sự kiện",
    phrases: ["tong hop phan hoi", "chu de phan hoi", "goi y cai thien"],
  },
  {
    id: "FR-15",
    title: "Ban tổ chức theo sự kiện (Chủ sự kiện, Đồng tổ chức, Nhân viên check-in)",
    phrases: ["ban to chuc", "dong to chuc", "chu su kien", "nhan vien check in", "thanh vien su kien"],
  },
  {
    id: "FR-16",
    title: "Nhật ký thao tác (audit log)",
    phrases: ["nhat ky thao tac", "audit log", "lich su thao tac"],
  },
  {
    id: "FR-17",
    title: "Thiết bị và cảm biến IoT tại sự kiện",
    phrases: ["thiet bi", "cam bien", "iot", "mat do khu vuc"],
  },
]);
