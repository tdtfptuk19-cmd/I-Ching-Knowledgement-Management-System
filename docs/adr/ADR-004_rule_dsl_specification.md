# ADR-004: Đặc Tả Ngôn Ngữ Miền Riêng (Rule DSL) & Trình Thực Thi An Toàn
**Dự án:** KinhDich_KB (KMS301 — Nhóm 5, Lớp IS1906)  
**Ngày:** 20/10/2026  
**Trạng thái:** ACCEPTED

---

## 1. Ngữ cảnh (Context)
Bảng `inference_rules` trong CSDL lưu trữ biểu thức điều kiện trong cột `condition_expression` dạng chuỗi `NVARCHAR(MAX)` kèm ràng buộc `CHECK (ISJSON(condition_expression) = 1)`. 

Để hiện thực hóa lý thuyết **Knowledge Codification** (Chuyển đổi tri thức ẩn thành luật quy tắc dạng IF-THEN trong Production System) của môn KMS301, Tầng 2 cần:
1. Một cú pháp biểu diễn quy tắc logic tường minh, có phiên bản (`dsl_version: 1`).
2. Tuyệt đối **không sử dụng `eval()` hoặc `exec()`** của Python nhằm ngăn ngừa lỗ hổng thực thi mã từ xa (RCE).
3. Whitelist nghiêm ngặt các trường ngữ cảnh và toán tử so sánh.
4. Giới hạn độ sâu phân tích cây cú pháp (Abstract Syntax Tree) để chống tấn công từ chối dịch vụ (ReDoS / Stack Overflow do đệ quy vô hạn).
5. Cơ chế giải quyết xung đột luật (Conflict Resolution) dựa trên `priority`.

## 2. Quyết định (Decision)

### 2.1 Cấu trúc Biểu thức DSL (DSL Syntax)
Biểu thức logic hỗ trợ 2 dạng nút:
1. **Nút Điều kiện Cơ sở (Predicate Node)**:
   ```json
   {
     "field": "relation_type",
     "op": "eq",
     "value": "SINH_NHAP"
   }
   ```
2. **Nút Hợp nhất Logic (Composite Node)**:
   ```json
   {
     "all": [ ... ],   // Toán tử AND
     "any": [ ... ],   // Toán tử OR
     "not": { ... }    // Toán tử NOT
   }
   ```

Toàn bộ biểu thức được bọc trong cấu trúc chuẩn:
```json
{
  "dsl_version": 1,
  "condition": {
    "all": [
      { "field": "the_element", "op": "eq", "value": "KIM" },
      { "field": "dung_element", "op": "eq", "value": "THO" }
    ]
  }
}
```

### 2.2 Danh sách Whitelist nghiêm ngặt

| Nhóm | Danh sách giá trị hợp lệ |
|---|---|
| **Các trường ngữ cảnh (`field`)** | `the_element`, `dung_element`, `relation_type`, `polarity_weight`, `moving_line`, `dung_side`, `initial_hexagram_id`, `transformed_hexagram_id`, `nuclear_hexagram_id`, `upper_trigram`, `lower_trigram`, `topic`, `upper_nuclear_trigram`, `lower_nuclear_trigram`, `transformed_dung_element` |
| **Các toán tử (`op`)** | `eq` ($=$), `ne` ($\ne$), `in` ($\in$), `not_in` ($\notin$), `gte` ($\ge$), `lte` ($\le$), `gt` ($>$), `lt` ($<$) |
| **Giới hạn độ sâu lồng nhau** | Tối đa 3 tầng lồng (`max_depth = 3`) |

### 2.3 Template Kết luận An toàn (`conclusion_template`)
- Sử dụng cú pháp thay thế chuỗi an toàn của Python: `string.Template` hoặc `str.format_map()` với một dictionary trắng.
- Chỉ chấp nhận các placeholder thuộc context: `{the_element}`, `{dung_element}`, `{relation_label}`, `{initial_name}`, `{transformed_name}`, `{nuclear_name}`, `{topic}`.
- Không thực thi mã hay truy cập thuộc tính ngầm (`__class__`, `__globals__`).

### 2.4 Cơ chế Giải quyết Xung đột (Conflict Resolution)
- Mọi luật thoả mãn điều kiện đều được bộ suy luận ghi nhận vào mảng `rules_fired[]` kèm giải trình chi tiết (Traceability: lý do khớp từng trường).
- Sắp xếp các luật kích hoạt theo thứ tự ưu tiên: `ORDER BY priority DESC, rule_id ASC`.
- Luật có `priority` cao nhất được chỉ định làm **Kết luận trọng tâm (Primary Conclusion)**. Các luật khác bổ sung góc nhìn chi tiết.
