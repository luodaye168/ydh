const express = require('express');
const path = require('path');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axios = wrapper(require('axios')); // ✅ 正确初始化

const app = express();
const port = 3000;
const jar = new CookieJar();
let isLoggedIn = false; // 登录状态标记

// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')));

// 登录并管理会话
async function ensureLogin() {
    if (isLoggedIn) return;

    try {
        const loginUrl = 'https://sso.dinghuo123.com/login';
        const response = await axios.post(loginUrl, new URLSearchParams({
            username: '18676246146',
            password: '246146'
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            jar,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });

        isLoggedIn = true; // 标记已登录
        console.log('登录成功，Cookie:', jar.getCookieStringSync(loginUrl));
    } catch (error) {
        console.error('登录失败:', error);
        throw error;
    }
}

// 统一代理处理器
async function handleProxyRequest(url, params, res, type) {
    try {
        await ensureLogin(); // 确保已登录
        const response = await axios.get(url, {
            params,
            jar, // ✅ 自动携带 Cookie
            headers: {
                'User-Agent': 'Mozilla/5.0 (...)' // 模拟浏览器
            }
        });
        res.json(response.data);
    } catch (error) {
        handleProxyError(error, res, type);
    }
}

// 仓库 ID 和名称的映射表
const warehouseMap = {
    '4032050': '湛江仓',
    '4030410': '贵港仓',
    '4033070': '玉林仓'
};

// 库存代理端点
app.get('/proxy/stock', async (req, res) => {
    const { warehouseId, manufacturer  } = req.query;
    const targetUrl = 'https://corp.dinghuo123.com/v2/inventory/list';
    const params = {
        currentPage: 1,
        pageSize: 196,
        totalCount: 196,
        warehouseId: `[\"${warehouseId}\"]`, // 确保 warehouseId 格式正确
        t: Date.now() // 动态时间戳
    };
    const warehouseName = warehouseMap[warehouseId] || '未知仓库';

    // console.log('访问者 IP 地址:', req.ip);
    console.log(`库存接口请求: ${warehouseName}, ${manufacturer || '全部厂家'}`);
    console.log('库存接口目标 URL:', targetUrl);

    await handleProxyRequest(targetUrl, params, res, '库存');
});
// 订单统计代理端点
app.get('/proxy/orders', async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = {
        periodType: 'CUSTOM',
        beginDate: startDate,
        endDate: endDate,
        orderBy: 'quantity',
        departmentId: '7370569',
        groupBy: 'PRODUCT',
        pageSize: 10,
        currentPage: 1,
        t: Date.now()
    };
    const targetUrl = 'https://corp.dinghuo123.com/v2/statistics-reports/region/products/pie-chart';
    await handleProxyRequest(targetUrl, params, res, '订单统计');
});

// 统一错误处理
function handleProxyError(error, res, type) {
    console.error(`${type}代理错误:`, error);
    const status = error.response?.status || 500;
    res.status(status).json({
        error: `${type}请求失败`,
        details: error.message
    });
}

app.listen(port, () => console.log(`服务已启动：http://localhost:${port}`));