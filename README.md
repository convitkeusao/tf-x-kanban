# Teamflow

Ứng dụng giao việc và theo dõi tiến độ nhóm. Ứng dụng sử dụng Supabase Auth để đăng nhập và Supabase Database để lưu hồ sơ thành viên, công việc và trạng thái. Khi chưa cấu hình Supabase, ứng dụng chạy với dữ liệu mẫu trên trình duyệt.

## Chạy ứng dụng

```bash
npm install
npm start
```

Vite sẽ chạy máy chủ phát triển tại `http://localhost:5173`. Dùng `npm run build` để tạo bản triển khai trong thư mục `build/`.

## Giao diện

Ứng dụng dùng Mantine làm thư viện giao diện chính. `MantineProvider` và theme dùng chung nằm tại `src/app/providers.tsx`; theme đặt góc bo mặc định bằng 0. CSS riêng chỉ dành cho bố cục đặc thù.

## Cấu hình Supabase

1. Tạo project Supabase.
2. Mở **Project Settings → API** và lấy **Project URL** cùng **publishable key**. Không dùng `service_role` key trong frontend.
3. Tạo file `.env` ở thư mục gốc từ mẫu `.env.example`, rồi điền:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Vào **SQL Editor**, chạy nội dung [supabase/schema.sql](./supabase/schema.sql) để tạo/cập nhật bảng, trigger tạo hồ sơ thành viên, nhóm, mã mời, báo cáo hoàn thành và chính sách RLS. Nếu đã có công việc Supabase cũ, script giữ lại và đưa chúng vào nhóm “Nhóm hiện tại”.
5. Trong **Authentication → Providers**, bật nhà cung cấp **Email**. Trong **Authentication → URL Configuration**, đặt Site URL là URL triển khai (ví dụ `https://congviecnhom2030.onrender.com`) và thêm cả URL triển khai lẫn URL phát triển (`http://localhost:5173`) vào Redirect URLs.
6. Người dùng có thể đăng ký bằng email và mật khẩu ngay trên màn hình đăng nhập. Nếu bật xác minh email trong cài đặt Email của Supabase, họ cần mở liên kết được gửi đến hộp thư trước khi đăng nhập; nếu tắt xác minh, tài khoản sẽ được đăng nhập ngay sau khi tạo.
7. Khởi động lại ứng dụng sau khi chỉnh `.env`.

Để người khác tham gia, mở nhóm rồi chọn **Mã mời** và gửi mã cho họ. Họ có thể tự đăng ký tài khoản bằng email trên ứng dụng, xác minh email nếu được yêu cầu, rồi chọn **Tham gia nhóm**. Một tài khoản có thể tham gia nhiều nhóm và chuyển nhóm bằng bộ chọn.

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

- `src/features/tasks`: trang tại `pages`, hook tại `hooks`, thành phần giao diện tại `components`, API và kiểu dữ liệu công việc.
- `src/features/groups`: API và kiểu dữ liệu nhóm.
- `src/features/members`: API, kiểu dữ liệu và luồng quản lý thành viên.
- `src/features/activity`: API và kiểu dữ liệu nhật ký.
- `src/features/auth`: giao diện xác thực và hook phiên đăng nhập.
- `src/features/landing`: màn hình giới thiệu.
- `src/api`: khởi tạo Supabase, xác thực và tiện ích truy cập backend.
- `src/shared`: dữ liệu mẫu và tiện ích dùng chung.
- `src/app`: cấu hình dùng chung cấp ứng dụng.

## Kiểm tra build

```bash
npm run build
```
