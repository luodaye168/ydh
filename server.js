const express = require('express');
const path = require('path');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axios = wrapper(require('axios')); // ✅ 正确初始化

const app = express();
const port = 3000;
const jar = new CookieJar();
let isLoggedIn = false; // 登录状态标记
let isLoggingIn = false; // 登录锁
// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // 解析 JSON 请求体

app.post('/log-table-name', (req, res) => {
    const { tableName } = req.body;
    if (tableName) {
        console.log(`导出表格名称: ${tableName}`);
        res.status(200).send('表格名称已记录');
    } else {
        res.status(400).send('缺少表格名称');
    }
});

// 登录并管理会话
async function ensureLogin() {
    if (isLoggedIn) return;
    if (isLoggingIn) {
        // 如果正在登录，等待登录完成
        while (isLoggingIn) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 每 100ms 检查一次
        }
        return;
    }
    isLoggingIn = true; // 设置登录锁，防止重复登录
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
    } finally {
        isLoggingIn = false; // 释放登录锁
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
        // res.json(response.data);
        // 检查返回数据是否包含 session 过期的提示
        if (response.data.code === 302 && response.data.message === 'session is expired!') {
            console.log(`${type}接口会话过期，正在重新登录...`);
            isLoggedIn = false; // 标记登录状态为无效
            await ensureLogin(); // 重新登录
            // 重试请求
            const retryResponse = await axios.get(url, {
                params,
                jar,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (...)'
                }
            });
            res.json(retryResponse.data); // 返回重试后的数据
        } else {
            res.json(response.data); // 正常返回数据
        }
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
    const { warehouseId, manufacturer } = req.query;
    const targetUrl = 'https://corp.dinghuo123.com/v2/inventory/list';
    const params = {
        currentPage: 1,
        pageSize: 196,
        totalCount: 196,
        warehouseId: `[\"${warehouseId}\"]`, // 确保 warehouseId 格式正确
        t: Date.now() // 动态时间戳
    };
    // const warehouseName = warehouseMap[warehouseId] || '未知仓库';

    // console.log(`库存接口请求: ${warehouseName}, ${manufacturer || '全部厂家'}`);
    // console.log('库存接口目标 URL:', targetUrl);

    await handleProxyRequest(targetUrl, params, res, '库存');
});

// 仓库 ID 和部门 ID 的映射表
const departmentMap = {
    '4032050': '7370570', // 湛江仓
    '4030410': '7425486', // 贵港仓
    '4033070': '7370569'  // 玉林仓
};

// 订单统计代理端点
app.get('/proxy/orders', async (req, res) => {
    const { startDate, endDate, warehouseId, manufacturer } = req.query; // 获取 warehouseId 参数
    const DepartmentId = departmentMap[warehouseId];
    const params = {
        periodType: 'CUSTOM',
        beginDate: startDate,
        endDate: endDate,
        orderBy: 'quantity',
        // departmentId: '7370569', //7425486贵港仓 7370570湛江仓 7370569玉林仓
        departmentId: DepartmentId, // 动态设置 departmentId
        groupBy: 'PRODUCT',
        pageSize: 10,
        currentPage: 1,
        t: Date.now()
    };
    const targetUrl = 'https://corp.dinghuo123.com/v2/statistics-reports/region/products/pie-chart';
    const warehouseName = warehouseMap[warehouseId] || '未知仓库';

    // console.log('访问者 IP 地址:', req.ip);
    console.log(`订单统计接口请求: ${warehouseName}, ${manufacturer || '全部厂家'} ${startDate || '未指定'}, 结束日期: ${endDate || '未指定'}`);
    // console.log(`订单统计接口请求 - 开始日期: ${startDate || '未指定'}, 结束日期: ${endDate || '未指定'}`);
    // 打印params
    // console.log('订单统计接口参数:', params);
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