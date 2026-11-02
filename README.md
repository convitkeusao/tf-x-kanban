# Teamflow

Ứng dụng giao việc và theo dõi tiến độ nhóm. Ứng dụng sử dụng Supabase Auth để đăng nhập và Supabase Database để lưu hồ sơ thành viên, công việc và trạng thái. Khi chưa cấu hình Supabase, ứng dụng chạy với dữ liệu mẫu trên trình duyệt.

## Chạy ứng dụng

```bash
npm install
npm start
```

## Cấu hình Supabase

1. Tạo project Supabase.
2. Mở **Project Settings → API** và lấy **Project URL** cùng **publishable key**. Không dùng `service_role` key trong frontend.
3. Tạo file `.env` ở thư mục gốc từ mẫu `.env.example`, rồi điền:

   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Vào **SQL Editor**, chạy nội dung [supabase/schema.sql](./supabase/schema.sql) để tạo/cập nhật bảng, trigger tạo hồ sơ thành viên, nhóm, mã mời, báo cáo hoàn thành và chính sách RLS. Nếu đã có công việc Supabase cũ, script giữ lại và đưa chúng vào nhóm “Nhóm hiện tại”.
5. Trong **Authentication → URL Configuration**, đặt Site URL là `http://localhost:3010` (hoặc URL triển khai) và thêm URL đó vào Redirect URLs.
6. Đăng nhập vào ứng dụng. Mỗi tài khoản có thể tạo nhóm và trở thành trưởng nhóm, hoặc nhập mã mời để tham gia nhóm.
7. Khởi động lại ứng dụng sau khi chỉnh `.env`.

Để người khác tham gia, mở nhóm rồi chọn **Mã mời** và gửi mã cho họ. Họ cần có tài khoản Supabase trước, sau đó dùng **Tham gia nhóm**. Một tài khoản có thể tham gia nhiều nhóm và chuyển nhóm bằng bộ chọn.

## Quyền truy cập

- Người đã đăng nhập chỉ xem được các nhóm mình tham gia và dữ liệu trong các nhóm đó.
- Trưởng nhóm tạo nhóm có thể giao việc; quyền theo từng nhóm được kiểm tra bằng RLS trong database.
- Chỉ trưởng nhóm xem được danh sách công việc chung và nhật ký; thành viên chỉ xem được công việc được giao cho mình trong mục “Việc của tôi”.
- Chỉ trưởng nhóm được xóa nhóm; thao tác xóa sẽ xóa cả công việc, thành viên và nhật ký của nhóm sau khi xác nhận.
- Trưởng nhóm có thể xóa thành viên và chọn chuyển giao hoặc xóa công việc chưa hoàn thành; công việc đã hoàn thành được giữ lại. Thành viên có thể rời nhóm sau khi chuyển giao công việc chưa hoàn thành.
- Trưởng nhóm có thể xem ngày tham gia, email, vai trò và danh sách công việc của thành viên; việc chuyển quyền trưởng nhóm được ghi vào nhật ký và người chuyển quyền trở thành thành viên.
- Chỉ trưởng nhóm xem được nhật ký nhóm; hệ thống ghi ngày tạo nhóm, tạo công việc, hoàn thành và các lần đổi trạng thái. Các lần hoàn thành bị hủy được ghi là thay đổi trạng thái.
- Thành viên có thể cập nhật trạng thái công việc được giao cho mình.
- Khi hoàn thành công việc, thành viên phải nhập báo cáo chi tiết; báo cáo được lưu và hiển thị cho cả nhóm, và được xóa nếu công việc chuyển lại trạng thái chưa hoàn thành.
- Publishable key được phép dùng trong frontend vì mọi quyền dữ liệu được kiểm soát bằng RLS. Tuyệt đối không đưa `service_role` key vào mã frontend.

## Cấu trúc dữ liệu

- `profiles`: hồ sơ gắn với tài khoản Supabase Auth.
- `tasks`: công việc, người phụ trách, mức ưu tiên, hạn và trạng thái.
- `activity_logs`: nhật ký hoạt động; chỉ trưởng nhóm của nhóm tương ứng được đọc. Khi chạy schema lần đầu, ngày tạo nhóm và công việc cũ được lấy từ dữ liệu sẵn có; lịch sử đổi trạng thái chỉ được ghi từ thời điểm bật nhật ký.

Các bản ghi đang ở Appwrite không được tự động chuyển sang Supabase; cần nhập lại hoặc xuất/nhập dữ liệu riêng.

## Cấu trúc mã nguồn

- `src/features/tasks`: kiểu dữ liệu, API và thành phần giao diện công việc.
- `src/features/groups`: API và kiểu dữ liệu nhóm.
- `src/features/members`: API, kiểu dữ liệu và luồng quản lý thành viên.
- `src/features/activity`: API và kiểu dữ liệu nhật ký.
- `src/api`: khởi tạo Supabase, xác thực và tiện ích truy cập backend.
- `src/shared`: dữ liệu mẫu và tiện ích dùng chung.
- `src/pages`: trang điều phối các feature và stylesheet của trang.

## Kiểm tra build

```bash
npm run build
```
