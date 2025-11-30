# Flyway Migrations

Thư mục này chứa các file migration SQL cho database schema.

## Quy tắc đặt tên file migration

File migration phải tuân theo format: `V{version}__{description}.sql`

Ví dụ:
- `V1__Initial_schema.sql`
- `V2__Add_user_table.sql`
- `V3__Update_teacher_status.sql`

**Lưu ý quan trọng:**
- Version phải là số nguyên dương, tăng dần
- Tên file phải có 2 dấu gạch dưới `__` giữa version và description
- Description nên mô tả ngắn gọn nội dung migration

## Cách tạo migration mới

1. Tạo file mới trong thư mục này với version tiếp theo
2. Viết SQL migration trong file đó
3. Khi ứng dụng khởi động, Flyway sẽ tự động chạy migration mới

## Validation

- Flyway sẽ validate migrations khi ứng dụng khởi động
- Nếu có lỗi (như version trùng, file không đúng format), ứng dụng sẽ không khởi động được
- Hibernate sẽ validate schema để đảm bảo entities khớp với database

## Rollback

Flyway không hỗ trợ rollback tự động. Để rollback, bạn cần tạo migration mới để revert thay đổi.

