# 🚀 Laravel 12.x + Botble CMS (MySQL) 与前端 API 数据流对接文档

本文件定义了前端采用的 Firestore 数据结构与 Laravel 12.x (基于 Botble CMS 架构) 后端物理数据库表及 API 的映射设计规范，用以承接去 Demo 化后的物理系统。

---

## 一、 商品体系对接设计 (/api/v1/products)

### 1. 前端产品数据结构 (Product Object)
```typescript
interface Product {
  id: string;        // 对应 Botble商品 ID
  name: string;      // 商品名称
  price: number;     // 销售单价
  stock: number;     // 剩余物理库存
  image: string;     // 主图 Emoji 或 媒体 URL
  category: string;  // 所属分类名称
  desc: string;      // 简短描述/SPU卖点
  sales: number;     // 虚拟/真实历史销量
  rating: string;    // 好评度百分比
  specs?: {
    sizes?: string[]; // 尺码/主规格集合
    labels?: string;  // 辅规格文本
  };
}
```

### 2. Botble/Laravel 数据库物理映射 (MySQL Tables)
*   **主表 `ec_products` (Botble E-Commerce 商品主表)**:
    *   `id` (BigInt PK) $\to$ 映射 `Product.id`
    *   `name` (Varchar) $\to$ 映射 `Product.name`
    *   `price` (Decimal(15,2)) $\to$ 映射 `Product.price`
    *   `quantity` (Int) $\to$ 映射 `Product.stock` (库存)
    *   `image` (Varchar) $\to$ 映射 `Product.image` (Botble 存储在 `media` 的路径，前端传入 URL)
    *   `description` (Text) $\to$ 映射 `Product.desc`
    *   `status` (Varchar) $\to$ 统一设定为 `'published'`
*   **关联表 `ec_product_categories` (商品分类表)** 与 `ec_product_category_product` (多对多关联表):
    *   前端 `Product.category` 名称关联检索 `ec_product_categories.name` 的 ID，向 `ec_product_category_product` 写入关联。
*   **属性表 `ec_product_variations` (Botble 多规格支持)**:
    *   前端 `Product.specs.sizes` 遍历插入对应的 `ec_product_attributes` 与变体绑定表。

### 3. Laravel API 核心控制器逻辑 (ProductsController.php)
```php
public function index(): JsonResponse
{
    $products = \Botble\Ecommerce\Models\Product::with('categories')
        ->where('status', 'published')
        ->get()
        ->map(function ($prod) {
            return [
                'id' => (string)$prod->id,
                'name' => $prod->name,
                'price' => (float)$prod->price,
                'stock' => (int)$prod->quantity,
                'image' => $prod->image ?: '📦',
                'category' => $prod->categories->first()->name ?? '未分类',
                'desc' => strip_tags($prod->description),
                'sales' => (int)$prod->views, // Botble默认为查看量或客制销量字段
                'rating' => '98%',
                'specs' => [
                    'sizes' => ['标准款'],
                    'labels' => '常规'
                ]
            ];
        });

    return response()->json([
        'success' => true,
        'data' => $products
    ]);
}
```

---

## 二、 订单体系对接设计 (/api/v1/orders)

### 1. 前端订单数据结构 (Order Object)
```typescript
interface Order {
  id: string;               // 订单自增物理单号 (如: ORD-20260602-1204)
  time: string;             // 订单创建时钟 (08:30:15)
  location: string;         // 送餐地址/桌号 (配送: 望京SOHO / 扫描桌台: Table #08)
  desc: string;             // 商品描述合集 (如: 冰美式 x 1, 生椰拿铁 x 2)
  price: number;            // 实付总金额
  status: 'pending'|'dispatched'; // [待接单审核] | [已接单制作/发货配送]
  type: 'takeout'|'dine_in'; // 配送订单(取货) 或 堂食桌台扫码
  customerName: string;     // 客户姓名
  phone: string;            // 客户手机号
  tracking: string;         // 货运单号/配送单号 (如: 顺丰特快、美团外卖)
}
```

### 2. Botble/Laravel 数据库物理映射 (MySQL Tables)
*   **总表 `ec_orders` (Botble 订单主表)**:
    *   `id` (BigInt PK)
    *   `code` (Varchar) $\to$ 映射 `Order.id` (以系统单号标识)
    *   `amount` (Decimal(15,2)) $\to$ 映射 `Order.price`
    *   `status` (Varchar) $\to$ `'pending'` 映射 `pending`，`'completed'` 映射 `dispatched`。
    *   `shipping_method` (Varchar) $\to$ 映射 `Order.type` (`'takeout'` 映射 `'delivery'`, `'dine_in'` 映射 `'dine_in'`)
    *   `created_at` (Datetime) $\to$ 拆分或保存为 `Order.time`
*   **收货地址表 `ec_order_addresses` (物流详情表)**:
    *   `order_id` (BigInt FK)
    *   `name` (Varchar) $\to$ 映射 `Order.customerName`
    *   `phone` (Varchar) $\to$ 映射 `Order.phone`
    *   `address` (Varchar) $\to$ 映射 `Order.location`
*   **物流跟踪表 `ec_order_histories` & 物流单段**:
    *   `tracking_id` $\to$ 保存顺丰/美团返回的 `Order.tracking`。

### 3. Laravel API 核心控制器逻辑 (OrdersController.php)
```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'id' => 'required|string',
        'price' => 'required|numeric',
        'customerName' => 'required|string',
        'phone' => 'required|string',
        'location' => 'required|string',
        'desc' => 'required|string',
        'type' => 'required|string',
    ]);

    \DB::beginTransaction();
    try {
        // 1. 创建 Botble 标准订单
        $order = new \Botble\Ecommerce\Models\Order();
        $order->code = $validated['id'];
        $order->amount = $validated['price'];
        $order->sub_total = $validated['price'];
        $order->status = 'pending'; // 待审核/审核模式
        $order->shipping_method = $validated['type'] === 'takeout' ? 'delivery' : 'dine_in';
        $order->save();

        // 2. 插入物流地址映射
        $address = new \Botble\Ecommerce\Models\OrderAddress();
        $address->order_id = $order->id;
        $address->name = $validated['customerName'];
        $address->phone = $validated['phone'];
        $address->address = $validated['location'];
        $address->save();

        // 3. 关联记录审计日志 (对接智能成员联动)
        \DB::table('catering_ai_audit_trails')->insert([
            'session_id' => $validated['id'],
            'active_role' => 'Sarah', // 运营经理
            'user_prompt' => '用户线上自助下单',
            'ai_response_markdown' => "检测到新订单 [{$validated['id']}]，金额 ¥{$validated['price']}，包含: {$validated['desc']}。正在指派人工/智能会审生产。",
            'executed_action_type' => 'RECEIVE_ORDER',
            'item_name_param' => $validated['desc'],
            'item_price_param' => $validated['price'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::commit();
        return response()->json([
            'success' => true,
            'message' => '订单写入 Botble 成功！',
            'order_id' => $order->id
        ], 201);

    } catch (\Exception $e) {
        \DB::rollBack();
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}
```

---

## 三、 经营大盘数据体系 (/api/v1/metrics)

### 1. 前端经营大盘结构 (Operating Metrics)
```typescript
interface OperatingMetrics {
  sales: number;   // 累积今日营业额
  orders: number;  // 累积完成单数
}
```

### 2. Botble/Laravel 数据库物理映射 (MySQL Tables)
*   **汇总查询 (MySQL Raw Queries)**:
    *   在 Laravel 后端，不建议使用硬编码的单字段保存，而是通过直接汇算 `ec_orders` 数据库表：
    ```sql
    -- 今日销售总额 (sales)
    SELECT COALESCE(SUM(amount), 0) as sales FROM ec_orders WHERE DATE(created_at) = CURDATE() AND status != 'canceled';
    
    -- 今日订单总数 (orders)
    SELECT COUNT(id) as orders FROM ec_orders WHERE DATE(created_at) = CURDATE();
    ```

---

## 四、 “人工会商审核 + AI 自动执行” 双模式联动机制

前端数字员工控制面板与 API 端点设计已完成了真实的审批流解耦。其运作逻辑在 Laravel 后端表现为：

```
                    ┌────────────────────────┐
                    │  智能会商下达创意指令   │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Gemini API        │
                    │   生成商品/营销提案    │
                    └───────────┬────────────┘
                                │
                    [ACTION: ADD_PRODUCT | ...]
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Laravel 数据中盘     │
                    │ 暂存草稿 (待核准发布)  │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
         【手动更改/编辑/批准】     【一键直接上架】
         人工模式 (Human Control)    AI模式 (Auto Driver)
                    │                        │
                    └───────────┬────────────┘
                                ▼
                    ┌────────────────────────┐
                    │      实时写入主库      │
                    │   更新 ec_products     │
                    └────────────────────────┘
```

1.  **AI 决策隔离控制（防乱改机制）**：
    *   AI 生产新品、毛利及营销文案时，其生成物在提交时为 **“待发布草稿状态”**。
    *   提供 **人工直接介入控制**：商家可以选择在 UI 界面对 AI 生成的标题、售价进行手动修改后再行一键发布。
2.  **事件日志审计流水线**：
    *   每一次 AI 提交商品发布或订单接收，都会在系统的 `catering_ai_audit_trails` 写入真实的事务记录。这与 Botble CMS 下的智能员工行为日志完美咬合。
